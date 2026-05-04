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

    if (!response.ok) {
      return res.status(500).json({ 
        error: 'AI service unavailable',
        fact: 'Defense in depth is a security strategy that combines multiple layers of security controls to protect systems and data.' 
      });
    }

    const result = await response.json();
    
    // Extract generated text
    let generatedText = result[0]?.generated_text || result.generated_text || '';
    
    // Clean up response and reject malformed or oversized text
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

    if (!generatedText) {
      generatedText = 'Always use strong, unique passwords and enable two-factor authentication for critical accounts.';
    }

    res.status(200).json({ 
      fact: generatedText
    });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: error.message,
      fact: 'Keep your software and systems updated with the latest security patches to prevent known vulnerabilities from being exploited.'
    });
  }
}
