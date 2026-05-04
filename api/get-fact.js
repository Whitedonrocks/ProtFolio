export default async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
    
    // Clean up response
    generatedText = generatedText.trim();
    if (generatedText.length > 400) {
      generatedText = generatedText.substring(0, 400) + '...';
    }

    res.status(200).json({ 
      fact: generatedText || 'Always use strong, unique passwords and enable two-factor authentication for critical accounts.'
    });
  } catch (error) {
    console.error('AI API Error:', error);
    res.status(500).json({ 
      error: error.message,
      fact: 'Keep your software and systems updated with the latest security patches to prevent known vulnerabilities from being exploited.'
    });
  }
}
