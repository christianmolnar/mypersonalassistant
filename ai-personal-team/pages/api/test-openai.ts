import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'None'
    });

    if (!apiKey) {
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        details: 'OPENAI_API_KEY environment variable is missing'
      });
    }

    // Test a simple API call to OpenAI
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      return res.status(500).json({ 
        error: 'OpenAI API connection failed',
        details: errorText,
        status: testResponse.status
      });
    }

    const models = await testResponse.json();
    const whisperModels = models.data.filter((model: any) => model.id.includes('whisper'));

    return res.status(200).json({ 
      success: true,
      apiKeyValid: true,
      whisperModelsAvailable: whisperModels.length,
      whisperModels: whisperModels.map((m: any) => m.id)
    });

  } catch (error) {
    console.error('API test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
