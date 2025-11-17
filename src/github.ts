import { Octokit } from 'octokit';
import { normalizeText } from './util';

const octokit = new Octokit({
  auth: process.env.GH_ACCESS_TOKEN,
});

export async function fetchIssues({
  owner,
  repo,
  limit,
}: {
  owner: string;
  repo: string;
  limit: number;
}) {
  const response = await octokit.request('GET /repos/{owner}/{repo}/issues', {
    owner,
    repo,
    per_page: limit,
    sort: 'created',
  });

  const issues = response.data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      id: issue.id,
      title: normalizeText(issue.title || ''),
      body: normalizeText(issue.body || ''),
      labels: issue.labels,
      created_at: issue.created_at,
    }));

  return issues;
}
