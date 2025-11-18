import 'dotenv/config';
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

export type RepoLabel = {
  id: number;
  node_id: string;
  url: string;
  name: string;
  description: string | null;
  color: string;
  default: boolean;
};

export async function fetchLabels({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}): Promise<RepoLabel[]> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/labels', {
    owner,
    repo,
  });

  if (response.status !== 200) {
    console.error(`Failed to fetch labels: ${response.status}`);
    return [];
  }

  // Response is an array of label objects
  return response.data as RepoLabel[];
}

export async function fetchIssue({
  owner,
  repo,
  issueNumber,
}: {
  owner: string;
  repo: string;
  issueNumber: number;
}): Promise<Issue | null> {
  const response = await octokit.request(
    'GET /repos/{owner}/{repo}/issues/{issue_number}',
    {
      owner,
      repo,
      issue_number: issueNumber,
    }
  );

  if (response.status !== 200) {
    console.error(`Failed to fetch issue: ${response.status}`);
    return null;
  }

  return {
    id: response.data.id,
    title: normalizeText(response.data.title || ''),
    body: normalizeText(response.data.body || ''),
    labels: (response.data.labels || [])
      .map((l: any) => (typeof l === 'string' ? l : l.name))
      .filter(Boolean),
    url: response.data.url,
  };
}

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
