import { Octokit } from 'octokit';
import { normalizeText } from './util.ts';

const octokit = new Octokit({
  auth: process.env.GH_ACCESS_TOKEN,
});

export type Issue = {
  id: number;
  title: string;
  body: string;
  labels: (
    | string
    | {
        id?: number | undefined;
        node_id?: string | undefined;
        url?: string | undefined;
        name?: string | undefined;
        description?: string | null | undefined;
        color?: string | null | undefined;
        default?: boolean | undefined;
      }
  )[];
  url: string;
};

export async function fetchIssues({
  owner,
  repo,
  limit,
}: {
  owner: string;
  repo: string;
  limit: number;
}): Promise<Issue[]> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    per_page: limit + 1,
    sort: 'created',
  });

  const issues = response.data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      id: issue.id,
      title: normalizeText(issue.title || ''),
      body: normalizeText(issue.body || ''),
      labels: (issue.labels || [])
        .map((l: any) => (typeof l === 'string' ? l : l.name))
        .filter(Boolean),
      url: issue.url,
    }));

  return issues;
}
