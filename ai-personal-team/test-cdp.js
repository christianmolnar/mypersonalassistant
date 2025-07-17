import { CdpClient } from '@coinbase/cdp-sdk'; 
require('dotenv').config({ path: '.env.local' });

async function testCDP() {
  try {
    console.log('Creating CDP client...');
    const client = new CdpClient({ 
      apiKeyId: process.env.CDP_API_KEY_ID, 
      apiKeySecret: process.env.CDP_API_KEY_SECRET,
      walletSecret: process.env.CDP_WALLET_SECRET 
    });
    
    console.log('Client created');
    console.log('Client properties:', Object.keys(client));
    
    if (client.evm) {
      console.log('EVM API available');
      // Try to get accounts
      try {
        console.log('Trying to get EVM accounts...');
        const accounts = await client.evm.getAccounts();
        console.log('Accounts:', accounts);
      } catch (err) {
        console.error('Error getting accounts:', err.message);
      }
    } else {
      console.log('EVM API not available');
    }
  } catch (error) {
    console.error('Error initializing CDP client:', error);
  }
}

testCDP();
