const cds = require('@sap/cds');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

module.exports = cds.service.impl(function () {
    this.on('triggerChange', async (req) => {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH;
    const path = process.env.GITHUB_FILE_PATH;

    if (!token || !owner || !repo || !branch || !path) {
      req.error(500, 'Missing one of GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_FILE_PATH in .env');
      return;
    }

    const octokit = new Octokit({ auth: token });

    try {
      // 1) Read the file from GitHub branch
      const fileResponse = await octokit.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
      });

      if (Array.isArray(fileResponse.data) || !fileResponse.data.content) {
        req.error(500, `${path} is not a file or content could not be read`);
        return;
      }

      const existingContent = Buffer.from(
        fileResponse.data.content,
        'base64'
      ).toString('utf-8');

      // 2) Add a very simple change
      const updatedContent =
        existingContent +
        `\n// Updated by CAP at ${new Date().toISOString()}\n`;

      // 3) Commit back to the SAME branch
      const result = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `CAP demo update to ${path}`,
        content: Buffer.from(updatedContent, 'utf-8').toString('base64'),
        sha: fileResponse.data.sha,
        branch
      });

      return `Success: updated ${path} in branch ${branch}. Commit: ${result.data.commit.sha}`;
    } catch (err) {
      console.error(err);
      req.error(500, `GitHub operation failed: ${err.message}`);
    }
  });
});