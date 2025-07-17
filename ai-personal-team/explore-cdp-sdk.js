import { CdpClient } from '@coinbase/cdp-sdk';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function exploreCdpSdk() {
  try {
    console.log('Starting CDP SDK exploration...');
    
    // Check for credentials
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;
    const walletSecret = process.env.CDP_WALLET_SECRET;
    
      throw new Error('CDP credentials missing in .env.local');
    }
    
    console.log('CDP credentials found in .env.local');
    
    // Initialize the CDP client
    console.log('Initializing CDP client...');
    const client = new CdpClient({
      apiKeyId,
      apiKeySecret,
      walletSecret: walletSecret || undefined
    });
    
    console.log('CDP client initialized');
    
    // Explore client properties
    console.log('\nExploring CDP client structure:');
    const clientProps = Object.getOwnPropertyNames(client);
    console.log('Client properties:', clientProps);
    
    const clientProtoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
    console.log('Client prototype methods:', clientProtoProps);
    
    // Check for specific APIs
    console.log('\nChecking for specific APIs:');
    console.log('- Has EVM API:', cd c:/Repo/MyPersonalAssistant/ai-personal-team && npx kill-port 3000 3004client.evm);
    console.log('- Has wallet API:', cd c:/Repo/MyPersonalAssistant/ai-personal-team && npx kill-port 3000 3004client.wallet);
    console.log('- Has account API:', cd c:/Repo/MyPersonalAssistant/ai-personal-team && npx kill-port 3000 3004client.account);
    
    // Try to explore EVM API if available
    if (client.evm) {
      console.log('\nExploring EVM API:');
      const evmProps = Object.getOwnPropertyNames(client.evm);
      console.log('EVM properties:', evmProps);
      
      const evmProtoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(client.evm));
      console.log('EVM prototype methods:', evmProtoProps);
      
      // Try to get accounts
      try {
        console.log('\nAttempting to get EVM accounts...');
        const accounts = await client.evm.getAccounts();
        console.log('EVM accounts:', JSON.stringify(accounts, null, 2));
      } catch (err) {
        console.log('Error getting EVM accounts:', err.message);
      }
    }
    
    // Try to explore wallet API if available
    if (client.wallet) {
      console.log('\nExploring wallet API:');
      const walletProps = Object.getOwnPropertyNames(client.wallet);
      console.log('Wallet properties:', walletProps);
      
      const walletProtoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(client.wallet));
      console.log('Wallet prototype methods:', walletProtoProps);
      
      // Try to get wallet info
      try {
        console.log('\nAttempting to get wallet info...');
        // Note: These are guesses at potential method names
        if (typeof client.wallet.getAccounts === 'function') {
          const accounts = await client.wallet.getAccounts();
          console.log('Wallet accounts:', JSON.stringify(accounts, null, 2));
        } else if (typeof client.wallet.getBalances === 'function') {
          const balances = await client.wallet.getBalances();
          console.log('Wallet balances:', JSON.stringify(balances, null, 2));
        } else {
          console.log('No recognized wallet methods found');
        }
      } catch (err) {
        console.log('Error accessing wallet info:', err.message);
      }
    }
    
    // Try to explore account API if available
    if (client.account) {
      console.log('\nExploring account API:');
      const accountProps = Object.getOwnPropertyNames(client.account);
      console.log('Account properties:', accountProps);
      
      const accountProtoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(client.account));
      console.log('Account prototype methods:', accountProtoProps);
      
      // Try to get account info
      try {
        console.log('\nAttempting to get account info...');
        if (typeof client.account.getBalances === 'function') {
          const balances = await client.account.getBalances();
          console.log('Account balances:', JSON.stringify(balances, null, 2));
        } else if (typeof client.account.getDetails === 'function') {
          const details = await client.account.getDetails();
          console.log('Account details:', JSON.stringify(details, null, 2));
        } else {
          console.log('No recognized account methods found');
        }
      } catch (err) {
        console.log('Error accessing account info:', err.message);
      }
    }
    
    // Log all available methods as a reference
    console.log('\nAll available methods on client object:');
    logAllMethods(client);
    
  } catch (error) {
    console.error('Error during CDP SDK exploration:', error);
  }
}

// Helper function to log all methods on an object and its prototypes
function logAllMethods(obj, prefix = '') {
  
  // Get all properties of the object
  const props = new Set();
  let currentObj = obj;
  
  while (currentObj) {
    Object.getOwnPropertyNames(currentObj).forEach(name => props.add(name));
    currentObj = Object.getPrototypeOf(currentObj);
  }
  
  // Log properties that are functions
  props.forEach(prop => {
    try {
      if (typeof obj[prop] === 'function') {
        console.log();
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        // For nested objects, recursively log their methods
        console.log();
        logAllMethods(obj[prop], );
      }
    } catch (e) {
      // Ignore errors accessing properties
    }
  });
}

// Run the exploration
exploreCdpSdk().then(() => {
  console.log('CDP SDK exploration completed');
}).catch(err => {
  console.error('Exploration failed:', err);
});

