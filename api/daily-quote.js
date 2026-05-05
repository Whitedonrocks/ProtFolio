const fs = require('node:fs/promises');
const path = require('node:path');

function resolveRepositorySlug() {
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repoName = process.env.VERCEL_GIT_REPO_SLUG;

  if (owner && repoName) {
    return `${owner}/${repoName}`;
  }

  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  return repoName;
}

async function readLocalQuote() {
  const filePath = path.join(process.cwd(), 'data', 'daily-quote.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function readGitHubQuote() {
  const repo = resolveRepositorySlug();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';

  if (!repo || !repo.includes('/')) {
    return null;
  }

  const token = process.env.GITHUB_TOKEN;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const filePath = 'data/daily-quote.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const response = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (typeof data.content !== 'string') {
    return null;
  }

  const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return JSON.parse(decoded);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Origin');

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const githubData = await readGitHubQuote();
    const data = githubData || await readLocalQuote();

    if (!data || !Array.isArray(data.facts) || data.facts.length === 0) {
      return res.status(404).json({ error: 'Daily quotes not found' });
    }

    // Return all facts so the client can pick a random one
    return res.status(200).json({
      facts: data.facts,
      generationCount: data.generationCount,
      lastGeneratedAt: data.lastGeneratedAt
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
