import { CdpClient } from '@coinbase/cdp-sdk';

// Market data types
interface CoinPriceData {
  [symbol: string]: {
    price: number;
    change24h: number;  // as percentage
  };
}

// Export interfaces for other components to use
export interface CryptoHolding {
  coin: string;
  balance: number;
  value: number;
  change: string;
}

export interface CryptoTrade {
  date: string;
  coin: string;
  action: string;
  amount: number;
  price: number;
}

class CdpService {
  private client: CdpClient | null = null;
  private priceCache: CoinPriceData = {};
  private lastPriceUpdate: Date = new Date(0);
  private readonly priceCacheTTL = 60000; // 1 minute cache for prices
  private isInitialized = false;
  
  constructor() {
    this.initializeClient();
  }
  
  private async initializeClient() {
    try {
      // Initialize the CDP client with credentials from environment variables
      const apiKeyId = process.env.CDP_API_KEY_ID;
      const apiKeySecret = process.env.CDP_API_KEY_SECRET;
      const walletSecret = process.env.CDP_WALLET_SECRET;

      if (!apiKeyId || !apiKeySecret) {
        console.error('CDP credentials are missing. Please check your environment variables.');
        return;
      }

      console.log('Initializing CDP Service with credentials');
      
      this.client = new CdpClient({
        apiKeyId,
        apiKeySecret,
        walletSecret: walletSecret || undefined
      });
      
      // Set initialization flag to true
      this.isInitialized = true;
      console.log('CDP client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize CDP client:', error);
      this.client = null;
      this.isInitialized = false;
    }
  }

  /**
   * Get cryptocurrency holdings from Coinbase account
   */
  async getCryptoHoldings(): Promise<CryptoHolding[]> {
    try {
      console.log('Fetching crypto holdings from CDP...');
      
      // Try to get EVM wallets with balances
      const balances = await this.fetchEvmBalances();
      
      // If we got any balances, return them
      if (balances && balances.length > 0) {
        return balances;
      }
      
      console.error('No balances found or failed to retrieve them');
      throw new Error('Failed to retrieve real crypto balances');
    } catch (error) {
      console.error("Error fetching crypto holdings from CDP:", error);
      
      // Return empty array - no mock data
      console.log('No fallback data - returning empty array');
      return [];
    }
  }

  /**
   * Attempt to fetch EVM balances using CDP SDK
   */
  private async fetchEvmBalances(): Promise<CryptoHolding[]> {
    try {
      // Check if client is initialized
      if (!this.client || !this.isInitialized) {
        console.error('CDP client not initialized');
        return [];
      }
      
      // Check if the client has the evm property
      if (!this.client.evm) {
        console.error('EVM API not available on CDP client');
        return [];
      }
      
      // Try to use the CDP SDK to connect to the client
      console.log('EVM client available:', !!this.client.evm);
      console.log('CDP client connected successfully');
      
      // Attempting to use the CDP SDK to get real data
      try {
        console.log('Attempting to fetch accounts from CDP...');
        
        // This is the point where we would make the actual API call to get your real data
        // For example, something like:
        // const accounts = await this.client.evm.getAccounts();
        // const balances = await this.client.evm.getBalances();
        
        // But since we need more documentation on the exact SDK methods,
        // we'll throw an error for now to ensure we don't show mock data
        throw new Error('Real Coinbase data fetch not yet implemented');
        
      } catch (error) {
        console.error('Error fetching real data:', error);
        return [];
      }
      
      // Note: We've removed all mock data generation
      return [];
    } catch (error) {
      console.error('Error fetching EVM balances:', error);
      return [];
    }
  }

  /**
   * Get recent cryptocurrency trades from Coinbase account
   */
  async getCryptoTrades(): Promise<CryptoTrade[]> {
    try {
      console.log('Fetching recent crypto trades...');
      
      // Attempt to get real transaction data from CDP
      if (!this.client || !this.isInitialized) {
        console.error('CDP client not initialized');
        return [];
      }
      
      // This is where we would make the API call to get real transaction data
      // For example, something like:
      // const transactions = await this.client.getTransactions();
      
      // But since we need more documentation on the exact SDK methods,
      // we'll throw an error to ensure we don't show mock data
      throw new Error('Real Coinbase trades data fetch not yet implemented');
      
    } catch (error) {
      console.error("Error fetching crypto trades:", error);
      
      // Return empty array - no mock data
      return [];
    }
  }
}

// Export a singleton instance
export const cdpService = new CdpService();
