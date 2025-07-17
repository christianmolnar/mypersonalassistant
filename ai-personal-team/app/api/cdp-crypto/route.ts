import { NextRequest, NextResponse } from "next/server";
import { cdpService } from "../../../services/cdpService";

export async function GET(req: NextRequest) {
  try {
    // Get crypto holdings using CDP SDK
    const holdings = await cdpService.getCryptoHoldings();
    
    // Get recent trades
    const trades = await cdpService.getCryptoTrades();
    
    return NextResponse.json({ 
      holdings, 
      trades,
      success: true
    });
    
  } catch (error) {
    console.error('API error fetching Coinbase data with CDP SDK:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch Coinbase data', 
      details: errorMessage,
      success: false,
      // Provide fallback data so the UI doesn't break
      holdings: [
        { coin: 'BTC', balance: 0.5, value: 16500, change: '+1.2%' },
        { coin: 'ETH', balance: 10, value: 27300, change: '-0.7%' }
      ],
      trades: [
        { date: '2025-07-15', coin: 'BTC', action: 'BUY', amount: 0.1, price: 33000 }
      ]
    }, { status: 500 });
  }
}
