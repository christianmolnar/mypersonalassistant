import { NextApiRequest, NextApiResponse } from 'next';
import { textToSpeech } from '../../agents/tts';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice, speed } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('TTS API: Converting text to speech:', {
      textLength: text.length,
      voice: voice || 'default',
      speed: speed || 'default'
    });

    // Convert text to speech
    const audioBlob = await textToSpeech(text, {
      voice: voice || 'nova',   // Default to nova voice (Carmen - feminine)
      speed: speed || 0.9       // Slightly slower for clarity
    });

    // Set appropriate headers for audio response
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBlob.size.toString());
    
    // Convert blob to buffer and send
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('TTS API error:', error);
    return res.status(500).json({ 
      error: 'Error generating speech', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
