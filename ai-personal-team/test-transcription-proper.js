// Simple test to verify transcription functionality with proper FormData
const fs = require('fs');
const path = require('path');

// Test the transcription API endpoint with proper multipart form data
async function testTranscription() {
  try {
    console.log("Creating a minimal test audio file...");
    
    // Create a very simple audio file (just minimal MP3 header + minimal data)
    // This is a minimal MP3 file with just the header and a bit of silence
    const minimalMp3Data = Buffer.from([
      // MP3 frame header (4 bytes) - this is a valid MP3 frame header for silence
      0xFF, 0xFB, 0x90, 0x00,
      // Some padding/silence data (minimal)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    console.log("Minimal MP3 created:", minimalMp3Data.length, "bytes");
    
    // Create a proper FormData payload manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    
    const formDataParts = [];
    
    // Add the audio file part
    formDataParts.push(`--${boundary}\r\n`);
    formDataParts.push(`Content-Disposition: form-data; name="audio"; filename="test-recording.mp3"\r\n`);
    formDataParts.push(`Content-Type: audio/mp3\r\n\r\n`);
    formDataParts.push(minimalMp3Data);
    formDataParts.push(`\r\n--${boundary}--\r\n`);
    
    // Combine all parts
    const formDataBuffer = Buffer.concat([
      Buffer.from(formDataParts[0]),
      Buffer.from(formDataParts[1]),
      Buffer.from(formDataParts[2]),
      formDataParts[3],
      Buffer.from(formDataParts[4])
    ]);
    
    console.log("Sending test request to transcription API...");
    console.log("Total form data size:", formDataBuffer.length, "bytes");
    
    const response = await fetch('http://localhost:3000/api/transcribe-audio', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formDataBuffer.length.toString()
      },
      body: formDataBuffer
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
