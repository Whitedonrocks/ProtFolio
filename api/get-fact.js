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

const MANUAL_PERSIST_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function getGithubWriteConfig() {
  const repo = resolveRepositorySlug();
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;

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

  return { branch, apiUrl, headers };
}

async function getExistingQuoteData() {
  const { branch, apiUrl, headers } = getGithubWriteConfig();
  const existingResponse = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, { headers });

  if (!existingResponse.ok) {
    return null;
  }

  const existing = await existingResponse.json();
  let parsedContent = null;

  if (typeof existing.content === 'string') {
    try {
      const decoded = Buffer.from(existing.content.replace(/\n/g, ''), 'base64').toString('utf8');
      parsedContent = JSON.parse(decoded);
    } catch (err) {
      parsedContent = null;
    }
  }

  return {
    sha: existing.sha,
    data: parsedContent
  };
}

async function writeFactsToGitHub(payload) {
  const { branch, apiUrl, headers } = getGithubWriteConfig();
  const { nepalDate } = getNepalDateParts();

  let sha;
  const existing = await getExistingQuoteData();
  if (existing?.sha) {
    sha = existing.sha;
  }

  const content = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`).toString('base64');
  const body = {
    message: `chore: add new AI fact #${payload.generationCount} (${nepalDate})`,
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
  // CORS headers for cross-origin requests
  const allowedOrigins = new Set([
    'https://prayagn.com.np',
    'https://www.prayagn.com.np'
  ]);

  const deploymentUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
  if (deploymentUrl) {
    allowedOrigins.add(deploymentUrl);
  }

  const requestOrigin = req.headers.origin;
  const requestReferer = req.headers.referer;
  const requestHost = req.headers.host ? `https://${req.headers.host}` : null;
  const isAllowedOrigin = !requestOrigin || allowedOrigins.has(requestOrigin) || requestOrigin === requestHost;
  const isAllowedReferer = !requestReferer || Array.from(allowedOrigins).some(origin => requestReferer.startsWith(origin));

  if (!isAllowedOrigin || !isAllowedReferer) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.setHeader('Access-Control-Allow-Origin', requestOrigin && allowedOrigins.has(requestOrigin) ? requestOrigin : 'https://prayagn.com.np');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const WINDOW_MS = 60_000;
  const MAX_REQUESTS = 10;

  globalThis.__factApiHits ||= new Map();
  const recentHits = (globalThis.__factApiHits.get(clientIp) || []).filter(timestamp => now - timestamp < WINDOW_MS);

  if (recentHits.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  recentHits.push(now);
  globalThis.__factApiHits.set(clientIp, recentHits);

  try {
    // Load existing facts
    const existingQuoteData = await getExistingQuoteData();
    const data = existingQuoteData?.data;
    
    if (!data || !Array.isArray(data.facts) || data.facts.length === 0) {
      return res.status(500).json({ error: 'No facts available' });
    }

    // Check if we need to generate a new AI fact (1 hour cooldown)
    const lastGeneratedAt = data.lastGeneratedAt ? Date.parse(data.lastGeneratedAt) : NaN;
    const nowMs = Date.now();
    const cooldownActive = Number.isFinite(lastGeneratedAt) && (nowMs - lastGeneratedAt) < MANUAL_PERSIST_COOLDOWN_MS;
    const cooldownRemainingMinutes = cooldownActive 
      ? Math.max(1, Math.ceil((MANUAL_PERSIST_COOLDOWN_MS - (nowMs - lastGeneratedAt)) / 60000))
      : 0;

    let newFact = null;
    let generatedNewFact = false;
    let commit = null;
    let persisted = false;

    // Only generate new AI fact if cooldown is not active
    if (!cooldownActive) {
      try {
        const response = await fetch(
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

        let generatedText = '';
        if (response.ok) {
          const result = await response.json();
          generatedText = result[0]?.generated_text || result.generated_text || '';
        }
        
        // Clean up response
        if (typeof generatedText !== 'string') {
          generatedText = '';
        }

        generatedText = generatedText
          .replace(/[\u0000-\u001F\u007F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (generatedText.length > 400) {
          generatedText = `${generatedText.slice(0, 400).trimEnd()}...`;
        }

        if (generatedText && generatedText.length > 10) {
          newFact = generatedText;
          generatedNewFact = true;

          // Append to facts array and update metadata
          const updatedData = {
            facts: [...data.facts, newFact],
            lastGeneratedAt: new Date().toISOString(),
            generationCount: data.generationCount + 1
          };

          try {
            const githubResult = await writeFactsToGitHub(updatedData);
            commit = githubResult.commit?.sha || null;
            persisted = true;
            data.facts.push(newFact);
            data.lastGeneratedAt = updatedData.lastGeneratedAt;
            data.generationCount = updatedData.generationCount;
          } catch (persistError) {
            console.error('Failed to persist new fact to GitHub:', persistError);
          }
        }
      } catch (aiError) {
        console.error('AI generation error:', aiError);
        // Return a random existing fact if AI fails
      }
    }

    // Pick a random fact from the array
    const randomFact = data.facts[Math.floor(Math.random() * data.facts.length)];

    res.status(200).json({
      fact: newFact || randomFact,
      facts: data.facts,
      generationCount: data.generationCount,
      lastGeneratedAt: data.lastGeneratedAt,
      generatedNewFact,
      persisted,
      commit,
      cooldownActive,
      cooldownRemainingMinutes
    });
  } catch (error) {
    console.error('Get fact error:', error);
    res.status(500).json({ 
      error: error.message,
      fact: 'Keep your software and systems updated with the latest security patches to prevent known vulnerabilities from being exploited.'
    });
  }
}
