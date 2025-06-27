// Simple test to verify transcription functionality
const fs = require('fs');
const path = require('path');

// Test the transcription API endpoint with a minimal audio file
async function testTranscription() {
  try {
    console.log("Creating a minimal test audio file...");
    
    // Create a minimal WAV file with silence (44 bytes header + minimal data)
    const minimalWavData = Buffer.from([
      // WAV header (44 bytes)
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // File size - 8 (36 bytes)
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // Chunk size (16)
      0x01, 0x00,             // Audio format (PCM)
      0x01, 0x00,             // Number of channels (1)
      0x44, 0xAC, 0x00, 0x00, // Sample rate (44100)
      0x88, 0x58, 0x01, 0x00, // Byte rate
      0x02, 0x00,             // Block align
      0x10, 0x00,             // Bits per sample (16)
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // Data size (0 - no audio data)
    ]);
    
    console.log("Minimal WAV created:", minimalWavData.length, "bytes");
    
    // Test the server API endpoint
    const FormData = require('form-data');
    const form = new FormData();
    
    // Create a blob-like object
    form.append('audio', minimalWavData, {
      filename: 'test-recording.wav',
      contentType: 'audio/wav'
    });
    
    console.log("Sending test request to transcription API...");
    
    const response = await fetch('http://localhost:3000/api/transcribe-audio', {
      method: 'POST',
      body: form
    });
    
    console.log("Response status:", response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log("Transcription result:", result);
    } else {
      const error = await response.text();
      console.log("Error response:", error);
    }
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testTranscription();
