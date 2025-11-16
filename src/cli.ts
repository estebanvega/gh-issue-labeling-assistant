import 'dotenv/config';
import { fetchIssues } from './github.ts';
import { classifyIssue } from './classifier.ts';

(async () => {
  console.info('Fetching issue and classifying...');

  const argv = process.argv.slice(2);
  function getArg(name: string) {
    const idx = argv.indexOf(name);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  }

  const repoArg = getArg('--repo') || 'seb-oss/green';
  const limitArg = getArg('--limit');
  const limit = limitArg ? parseInt(limitArg, 10) : 8;

  const [owner, repo] = repoArg.split('/');
  if (!owner || !repo) {
    console.error('Invalid --repo value. Expected owner/repo');
    process.exit(1);
  }

  const issues = await fetchIssues({
    owner,
    repo,
    limit,
  });

  const answer = await classifyIssue(issues);
  console.info('Predicted labels:', answer);
})();
