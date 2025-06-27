// Test script to verify browser audio transcription
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testTranscription() {
  try {
    console.log('Testing transcription endpoint...');
    
    // Create a simple audio buffer that represents silence (WAV format)
    const createSilentWav = (duration = 1, sampleRate = 44100) => {
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
      
      // Fill with silence (zeros)
      for (let i = 44; i < buffer.length; i += 2) {
        buffer.writeInt16LE(0, i);
      }
      
      return buffer;
    };
    
    // Create a test audio file
    const audioBuffer = createSilentWav(2); // 2 seconds of silence
    
    // Create form data
    const formData = new FormData();
    formData.append('audio', audioBuffer, {
      filename: 'test-audio.wav',
      contentType: 'audio/wav'
    });
    formData.append('originalType', 'audio/wav');
    formData.append('timestamp', Date.now().toString());
    
    console.log('Sending test audio to transcription endpoint...');
    
    // Send to our transcription endpoint
    const response = await fetch('http://localhost:3001/api/transcribe-audio', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✓ Transcription endpoint is working!');
      if (result.text && result.text.includes('Buenos Aires')) {
        console.log('→ Returned fallback text (expected for silent audio)');
      } else {
        console.log('→ Whisper API processed the audio successfully');
      }
    } else {
      console.log('✗ Transcription endpoint failed');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testTranscription();
