import 'dotenv/config';
import { Command } from 'commander';
import { fetchIssue, fetchIssues, fetchLabels } from './github.ts';
import { createEmbeddings } from './embeddings.ts';
import { querySimilar, upsertVectors } from './chroma.ts';
import { classifyWithLLM } from './classifier.ts';

const program = new Command();

program
  .name('gh-issue-labeling-assistant')
  .description('Tiny RAG pipeline: index issues, then query with LLM');

program
  .command('build-index')
  .option('--owner <owner>', 'repo owner', process.env.REPO_OWNER)
  .option('--repo <repo>', 'repo name', process.env.REPO_NAME)
  .option('--limit <n>', 'how many issues to fetch', '50')
  .action(async (opts) => {
    const owner = opts.owner;
    const repo = opts.repo;
    const limit = Number(opts.limit || 50);
    if (!owner || !repo) {
      console.error('owner and repo required');
      process.exit(1);
    }

    console.info(`Fetching up to ${limit} issues from ${owner}/${repo}...`);
    const issues = await fetchIssues({
      owner,
      repo,
      limit,
    });
    console.info(`Fetched ${issues.length} issues. Creating embeddings...`);

    // Build texts for embeddings (title + body)
    const docs = issues.map((i) => `${i.title}\n\n${i.body}`);
    const embeddings = await createEmbeddings(docs, 10);
    console.info(`Created ${embeddings.length} embeddings.`);

    const items = issues.map((issue, idx) => ({
      id: `${issue.id}`,
      embedding: embeddings[idx],
      metadata: {
        title: issue.title,
        // Stringify labels to avoid Chroma metadata schema rejections
        labels: JSON.stringify(
          Array.isArray(issue.labels)
            ? issue.labels.map((l: any) =>
                l && typeof l === 'object' ? l.name || String(l) : String(l)
              )
            : []
        ),
      },
      document: docs[idx],
    }));

    console.log(`Upserting into Chroma...`);
    await upsertVectors(items);
    console.log('Index built.');
  });

program
  .command('suggest')
  .option('--owner <owner>', 'repo owner', process.env.REPO_OWNER)
  .option('--repo <repo>', 'repo name', process.env.REPO_NAME)
  .option('--issue <num>', 'issue number to classify')
  .option('--topk <k>', 'how many similar examples to retrieve', '5')
  .action(async (opts) => {
    const owner = opts.owner;
    const repo = opts.repo;
    const issueNumber = Number(opts.issue);
    const topk = Number(opts.topk);

    if (!owner || !repo || !issueNumber) {
      console.error('owner, repo and --issue required');
      process.exit(1);
    }

    const issue = await fetchIssue({ owner, repo, issueNumber });

    if (!issue) {
      console.error(`Failed to fetch issue ${issueNumber}`);
      process.exit(1);
    }

    // Build embedding for the new issue
    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const combined = `${issue.title}\n\n${issue.body}`;
    const embedResp = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
      input: [combined],
    });
    const queryEmbedding = embedResp.data[0].embedding;
    const chromaResp = await querySimilar(queryEmbedding, topk);

    const results = chromaResp.results?.[0] ?? chromaResp;
    const similar: { document: string; metadata?: any }[] = [];

    if (results?.documents) {
      for (let i = 0; i < results.documents.length; i++) {
        similar.push({
          document: results.documents[i],
          metadata: results.metadatas?.[i] ?? {},
        });
      }
    } else {
      console.warn('Chroma returned unexpected format', chromaResp);
    }

    console.log(`Found ${similar.length} similar examples. Passing to LLM...`);
    console.log('Similar examples:', JSON.stringify(similar, null, 2));

    const allLabelsJson = await fetchLabels({ owner, repo });
    const canonicalLabels = Array.isArray(allLabelsJson)
      ? allLabelsJson.map((l) => l.name)
      : [];

    console.log('Canonical labels for LLM:', canonicalLabels);

    const predicted = await classifyWithLLM(similar, issue, canonicalLabels);

    // Normalize predicted labels to match canonicalLabels casing
    const normalized = Array.isArray(predicted)
      ? predicted.map((lab) => {
          const match = canonicalLabels.find(
            (al) => al.toLowerCase() === String(lab).toLowerCase()
          );
          return match || lab;
        })
      : predicted;

    console.log('Predicted labels:', normalized);
  });

program.parse();
