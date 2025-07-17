import { NextRequest, NextResponse } from "next/server";
import { coinbaseService } from "../../../services/coinbaseService";

export async function GET(req: NextRequest) {
  try {
    // Get all accounts/holdings
    const accounts = await coinbaseService.getAccounts();
    
    // Get current prices for each account with a balance
    const holdingsPromises = accounts.data
      .filter(account => parseFloat(account.balance.amount) > 0)
      .map(async (account) => {
        // Get current price for this currency
        const priceData = await coinbaseService.getPrice(account.currency);
        
        // Calculate the current value in USD
        const value = parseFloat(account.balance.amount) * parseFloat(priceData.data.amount);
        
        return {
          coin: account.currency,
          balance: parseFloat(account.balance.amount),
          value: Math.round(value * 100) / 100,
          change: "+0%", // We would need historical data to calculate this
          price: parseFloat(priceData.data.amount)
        };
      });
    
    const holdings = await Promise.all(holdingsPromises);
    
    // Get transactions from the last 30 days
    const allTransactions = await coinbaseService.getAllTransactions();
    
    // Map transactions to our format
    const trades = allTransactions
      .slice(0, 20) // Limit to last 20 transactions
      .map(t => ({
        date: new Date(t.created_at).toISOString().split('T')[0],
        coin: t.amount.currency,
        action: t.type.toUpperCase(),
        amount: parseFloat(t.amount.amount),
        price: parseFloat(t.price.amount)
      }));
    
    return NextResponse.json({ 
      holdings, 
      trades,
      success: true
    });
    
  } catch (error) {
    console.error('API error fetching Coinbase data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to fetch Coinbase data', 
      details: errorMessage,
      success: false 
    }, { status: 500 });
  }
}
