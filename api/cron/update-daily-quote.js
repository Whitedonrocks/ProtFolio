const fs = require('node:fs/promises');
const path = require('node:path');

function resolveRepositorySlug() {
  // Vercel commonly provides owner/repo in separate vars.
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repoName = process.env.VERCEL_GIT_REPO_SLUG;

  if (owner && repoName) {
    return `${owner}/${repoName}`;
  }

  // Fall back to explicit owner/repo if user provided it.
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  // Last resort for backward compatibility (may be repo name only).
  return repoName;
}

function getNepalDateParts() {
  const now = new Date();
  const nepalDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now);

  const publishedOn = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kathmandu',
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(now);

  return { nepalDate, publishedOn };
}

async function getExistingFactsData() {
  const repo = resolveRepositorySlug();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;

  if (!repo || !repo.includes('/') || !token) {
    return null;
  }

  const filePath = 'data/daily-quote.json';
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };

  const response = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });
  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (typeof data.content !== 'string') {
    return null;
  }

  try {
    const decoded = Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return { sha: data.sha, data: parsed };
  } catch (err) {
    return null;
  }
}

async function writeFactsToGitHub(payload) {
  const repo = resolveRepositorySlug();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  const { nepalDate } = getNepalDateParts();

  if (!repo || !repo.includes('/')) {
    throw new Error('Missing repository owner/name slug (expected owner/repo)');
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
  const existingData = await getExistingFactsData();
  if (existingData?.sha) {
    sha = existingData.sha;
  }

  const content = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`).toString('base64');
  const body = {
    message: `chore: add AI fact #${payload.generationCount} (${nepalDate})`,
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

async function writeQuoteToGitHub(payload) {
  const repo = resolveRepositorySlug();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  const { nepalDate } = getNepalDateParts();

  if (!repo || !repo.includes('/')) {
    throw new Error('Missing repository owner/name slug (expected owner/repo)');
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
    message: `chore: update daily quote (${nepalDate})`,
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
    // Generate new AI fact
    const aiResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistral-community/Mistral-7B-Instruct-v0.1',
      {
        headers: { 
          Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`
        },
        method: 'POST',
        body: JSON.stringify({ 
          inputs: `Generate a unique, educational cybersecurity fact or security tip in 1-2 sentences. 
          Focus on threat prevention, security best practices, or cyber awareness. 
          Make it concise and actionable. Do not include the prompt in response.`
        }),
      }
    );

    let newFact = '';
    if (aiResponse.ok) {
      const result = await aiResponse.json();
      newFact = result[0]?.generated_text || result.generated_text || '';
    }

    // Clean up the fact
    if (typeof newFact !== 'string') {
      newFact = '';
    }

    newFact = newFact
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (newFact.length > 400) {
      newFact = `${newFact.slice(0, 400).trimEnd()}...`;
    }

    if (!newFact || newFact.length < 10) {
      newFact = 'Always maintain a robust backup strategy to protect against data loss from ransomware attacks and system failures.';
    }

    // Load existing facts and append new one
    const existingData = await getExistingFactsData();
    if (!existingData || !existingData.data) {
      return res.status(500).json({
        ok: false,
        error: 'Could not load existing facts data'
      });
    }

    const factsData = existingData.data;
    if (!Array.isArray(factsData.facts)) {
      return res.status(500).json({
        ok: false,
        error: 'Invalid facts structure'
      });
    }

    // Append new fact
    const updatedData = {
      facts: [...factsData.facts, newFact],
      lastGeneratedAt: new Date().toISOString(),
      generationCount: (factsData.generationCount || 0) + 1
    };

    const githubResult = await writeFactsToGitHub(updatedData);

    return res.status(200).json({
      ok: true,
      newFact,
      generationCount: updatedData.generationCount,
      totalFacts: updatedData.facts.length,
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