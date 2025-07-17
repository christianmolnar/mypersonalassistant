# Setting Up Coinbase API Access

## Understanding the Issue

We're currently experiencing a `401 Unauthorized` error when trying to access the Coinbase API. This indicates that there's an issue with the API credentials being used.

## Coinbase API vs CDP API

There are two different types of API credentials being used:

1. **Coinbase Developer Platform (CDP)** - Used for blockchain and wallet interactions
   - Variables: `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET`, `CDP_ADDRESS`
   - Format: UUID-style keys (`218d7e0b-caf9-437f-adaa-44952cfafe7e`)

2. **Coinbase REST API** - Used for account/trading data
   - Variables: `COINBASE_API_KEY`, `COINBASE_API_SECRET`
   - Format: Typically longer alphanumeric strings, not UUID format

## How to Create Proper Coinbase API Keys

Follow these steps to create the correct API keys for the Coinbase REST API:

1. Log in to your Coinbase account at https://www.coinbase.com/
2. Go to Settings → API
3. Click "New API Key"
4. Select the following permissions:
   - wallet:accounts:read (required)
   - wallet:transactions:read (required)
   - wallet:buys:read (optional)
   - wallet:sells:read (optional)
5. Set a nickname for the key (e.g., "Personal Assistant")
6. Complete any security verification steps
7. Copy both the API Key and API Secret

## Update Your Environment Variables

Once you have the new API key and secret, update your `.env.local` file:

```
# Coinbase REST API credentials
COINBASE_API_KEY=your_new_api_key_here
COINBASE_API_SECRET=your_new_api_secret_here
```

## Testing Your API Key

After updating your environment variables, you can test your API connection by:

1. Visiting `/api/coinbase-diagnostic` in your browser
2. Check the console logs for authentication status
3. Try the Crypto tab in the Financial Insights section

## Important Notes

- The Coinbase REST API requires specific permissions to access your account data
- API keys from the Coinbase Developer Platform (CDP) cannot be used with the REST API
- For security, never share your API Secret with anyone
- Consider using an API key with read-only permissions for better security
