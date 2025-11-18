import type { Issue } from './github.ts';

export function buildFewShotPrompt(
  similarExamples: { document: string; metadata?: any }[],
  newIssue: Issue,
  availableLabels: string[]
) {
  const exampleText = similarExamples
    .map((ex, i) => {
      const md = ex.metadata || {};
      const title = md.title || 'Unknown title';
      const body = ex.document || '';
      const labels = md.labels || [];
      return `### Example ${
        i + 1
      }\nTitle: ${title}\nBody: ${body}\nLabels: ${JSON.stringify(labels)}`;
    })
    .join('\n\n');

  // Safe label list line
  const labelLine = `Available labels: ${JSON.stringify(availableLabels)}`;

  const prompt = `
You are an assistant that assigns labels to GitHub issues based only on the title and body. Use examples to infer how maintainers label issues.

${labelLine}

### Examples:
${exampleText}

### Classify this new issue:
Title: ${newIssue.title}
Body: ${newIssue.body}

Return exactly a JSON object with a key "labels" containing an array of labels chosen from the available list.
Example output:
{"labels": ["bug","frontend"]}

If no label applies, return {"labels": []}
  `.trim();

  return prompt;
}
