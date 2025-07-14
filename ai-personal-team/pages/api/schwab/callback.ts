import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// This route handles Schwab's OAuth callback
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Schwab will redirect here with ?code=... and possibly state
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code from Schwab.' });
  }

  try {
    // Determine the redirect URI based on environment
    const redirectUri =
      process.env.SCHWAB_REDIRECT_URI ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}/api/schwab/callback`
        : 'http://localhost:3000/api/schwab/callback');

    // Exchange the code for an access token
    const tokenResponse = await axios.post(
      'https://api.schwab.com/v1/oauth2/token',
      new URLSearchParams({
        client_id: process.env.SCHWAB_CLIENT_ID || '',
        client_secret: process.env.SCHWAB_CLIENT_SECRET || '',
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Return the token response for debugging (remove in production)
    res.status(200).json({
      code,
      state,
      redirectUri,
      token: tokenResponse.data,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to exchange code for token',
      details: error?.response?.data || error?.message,
    });
  }
}
