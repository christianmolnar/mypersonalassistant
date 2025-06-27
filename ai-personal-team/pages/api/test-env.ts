import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if OpenAI API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    
    return res.status(200).json({ 
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'No key found'
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
