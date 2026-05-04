const fs = require('node:fs/promises');
const path = require('node:path');

async function loadFacts() {
  const filePath = path.join(process.cwd(), 'data', 'cyber-facts.json');
  const raw = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(raw);

  if (!data.facts || !Array.isArray(data.facts) || data.facts.length === 0) {
    throw new Error('No cyber facts available');
  }

  return data.facts;
}

function pickRandomFact(facts) {
  const index = Math.floor(Math.random() * facts.length);
  const fact = facts[index];

  return {
    fact: typeof fact === 'string' ? fact : fact.fact || String(fact),
    category: typeof fact === 'object' && fact ? fact.category || 'general' : 'general',
    severity: typeof fact === 'object' && fact ? fact.severity || 'low' : 'low'
  };
}

async function writeQuoteToGitHub(payload) {
  const repo = process.env.VERCEL_GIT_REPO_SLUG || process.env.GITHUB_REPOSITORY;
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;

  if (!repo) {
    throw new Error('Missing repository slug');
  }

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN');
  }

  const filePath = 'data/daily-quote.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  let sha;
  const existingResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
  if (existingResponse.ok) {
    const existing = await existingResponse.json();
    sha = existing.sha;
  }

  const content = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`).toString('base64');
  const body = {
    message: `chore: update daily quote (${new Date().toISOString().slice(0, 10)})`,
    content,
    branch
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub update failed: ${errorText}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  const isVercelCron = req.headers['x-vercel-cron'] === '1' || req.headers['user-agent']?.toLowerCase().includes('vercel-cron');

  if (!isVercelCron) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const facts = await loadFacts();
    const picked = pickRandomFact(facts);

    const quotePayload = {
      fact: picked.fact,
      category: picked.category,
      severity: picked.severity,
      updatedAt: new Date().toISOString(),
      source: 'vercel-cron',
      publishedOn: new Date().toDateString()
    };

    const githubResult = await writeQuoteToGitHub(quotePayload);

    return res.status(200).json({
      ok: true,
      quote: quotePayload,
      commit: githubResult.commit?.sha || null
    });
  } catch (error) {
    console.error('Daily quote cron failed:', error);
    return res.status(500).json({
      ok: false,
      error: error.message
    });
  }
}