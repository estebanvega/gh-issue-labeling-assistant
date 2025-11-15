import 'dotenv/config'
import { Octokit } from "octokit";

console.info("Fetching issues from seb-oss/green...");

const octokit = new Octokit({
    auth: process.env.GH_ACCESS_TOKEN
});

async function fetchIssues(limit) {
    const response = await octokit.request("GET /repos/{owner}/{repo}/issues", {
        owner: "seb-oss",
        repo: "green",
        per_page: limit,
        sort: "created",
    });

    const issues = response.data.filter(issue => !issue.pull_request).map(issue => ({
        id: issue.id,
        title: issue.title,
        body: issue.body,
        labels: issue.labels.map(label => label.name),
        created_at: issue.created_at,
    }));

    return issues;
}

const issues = await fetchIssues(10);
console.info(`Fetched ${issues.length} issues.`);