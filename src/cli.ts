import 'dotenv/config';
import { Command } from 'commander';
import { fetchIssues } from './github.ts';
import { createEmbeddings } from './embeddings.ts';
import { upsertVectors } from './chroma.ts';

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

program.parse();
