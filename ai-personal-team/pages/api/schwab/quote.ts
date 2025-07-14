import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// GET /api/schwab/quote?access_token=...&symbol=MSFT
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { access_token, symbol = 'MSFT' } = req.query;

  if (!access_token) {
    return res.status(400).json({ error: 'Missing access_token in query params.' });
  }

  try {
    // Schwab's market data endpoint (example, may need adjustment per Schwab docs)
    const response = await axios.get(
      `https://api.schwab.com/marketdata/v1/quotes/${symbol}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    res.status(200).json({ symbol, data: response.data });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch quote',
      details: error?.response?.data || error?.message,
    });
  }
}
