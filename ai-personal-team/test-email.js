const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  try {
    console.log('Testing email API...');
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('API Key length:', process.env.RESEND_API_KEY?.length);
    
    const response = await fetch('http://localhost:3000/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>This is a test email from Memorias AI</p>'
      }),
    });

    const result = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
    if (!response.ok) {
      console.error('❌ API call failed');
    } else {
      console.log('✅ API call succeeded');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();
