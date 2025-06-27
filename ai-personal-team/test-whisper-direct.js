// Test script to directly test Whisper API with a simple audio file
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testWhisperDirect() {
  try {
    console.log('Testing Whisper API directly...');
    
    // Create a minimal WAV file (1 second of 440Hz tone)
    const createToneWav = (frequency = 440, duration = 1, sampleRate = 44100) => {
      const numSamples = duration * sampleRate;
      const buffer = Buffer.alloc(44 + numSamples * 2);
      
      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + numSamples * 2, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(numSamples * 2, 40);
      
      // Generate sine wave audio data
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.5;
        const intSample = Math.round(sample * 32767);
        buffer.writeInt16LE(intSample, 44 + i * 2);
      }
      
      return buffer;
    };
    
    // Create test audio
    const audioBuffer = createToneWav(440, 2); // 2 seconds of 440Hz tone
    console.log(`Created test audio: ${audioBuffer.length} bytes`);
    
    // Get API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('No OpenAI API key found in environment');
      return;
    }
    
    console.log('API key found, length:', apiKey.length);
    
    // Create form data
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'test-tone.wav',
      contentType: 'audio/wav'
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    formData.append('response_format', 'json');
    
    console.log('Sending request to Whisper API...');
    
    // Make the request
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return;
    }
    
    const result = await response.json();
    console.log('Whisper API success:', result);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWhisperDirect();
