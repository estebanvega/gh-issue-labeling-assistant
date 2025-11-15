import 'dotenv/config'
import { Octokit } from "octokit";
import OpenAI from "openai";
import { encode } from '@toon-format/toon';
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

const octokit = new Octokit({
    auth: process.env.GH_ACCESS_TOKEN
});
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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

async function processIssues(issues) {
    const encodedData = encode(issues);

    const response = await openai.responses.create({
        prompt: {
            "id": "pmpt_6918e75dee9081959ec957cfc814099805b4b81d337e32f7",
            "version": "2",
            "variables": {
                "similar_issues": encodedData,
                "title": "Tooltip: Renders behind dialog",
                "body": '### Bug already reported?\n' +
                    '\n' +
                    '- [x] I confirm that I have checked if the bug already has been reported\n' +
                    '\n' +
                    '### For which framework/library you are reporting the bug\n' +
                    '\n' +
                    'Angular\n' +
                    '\n' +
                    '### Component name\n' +
                    '\n' +
                    'Tooltip\n' +
                    '\n' +
                    '### Description\n' +
                    '\n' +
                    'Currently if you want to use tooltips in a green dialog (slide-out variant) tooltip is added to the DOM, but its hidden under the dialog. and is not visible\n' +
                    '\n' +
                    '### Steps To Reproduce\n' +
                    '\n' +
                    '1. Login into nibp\n' +
                    '2. Navigate "Pay and transfer" -> "My recipients"\n' +
                    '3. Click on any existing recipient that has either long recipient name or bank name (is truncated)\n' +
                    '4. Once dialog opens, hover over truncated text\n' +
                    '\n' +
                    'Notice that tooltip is not being visible, but in DOM new element is attached to body and removed once mouse is not hovering truncated text\n' +
                    '\n' +
                    '### Current Behaviour\n' +
                    '\n' +
                    'Tooltip element is added to DOM but is hidden behind the dialog\n' +
                    '\n' +
                    '### Expected Behaviour\n' +
                    '\n' +
                    'Tooltip element is added to DOM and is visible in dialog',
            }
        }
    });

    return response;
}

async function run() {
    const issues = await fetchIssues(50);
    const result = await processIssues(issues);
    console.info("Result: ", result.output_text);

    marked.use(markedTerminal());
    console.info(await marked.parse(result.output_text));
}

run();