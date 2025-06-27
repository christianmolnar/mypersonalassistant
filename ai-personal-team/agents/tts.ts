/**
 * Text-to-Speech Module for Memorias-AI
 * 
 * This module handles converting text to speech with Argentine Spanish accent using OpenAI's TTS API.
 */

// Configuration for the Text-to-Speech service
interface TTSConfig {
  apiKey?: string;      // Optional API key for TTS service
  voice: string;        // Voice ID to use
  model: string;        // TTS model to use
  speed: number;        // Speech rate (0.25 to 4.0)
  responseFormat: string; // Output format ('mp3', 'opus', 'aac', 'flac')
}

// Default configuration for Spanish TTS with warm, friendly voice
const defaultConfig: TTSConfig = {
  voice: 'nova',         // Nova is a feminine voice good for Spanish (Carmen)
  model: 'tts-1',        // Standard quality model
  speed: 0.9,            // Slightly slower for clear pronunciation
  responseFormat: 'mp3'
};

/**
 * Convert text to speech using OpenAI's TTS API
 * 
 * @param text - The text to convert to speech
 * @param config - Optional configuration overrides
 * @returns Promise resolving to an audio blob
 */
export async function textToSpeech(
  text: string,
  config?: Partial<TTSConfig>
): Promise<Blob> {
  // Merge provided config with defaults
  const fullConfig: TTSConfig = { ...defaultConfig, ...config };
  
  try {
    // Check for API key
    const apiKey = fullConfig.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn("No OpenAI API key provided for TTS. Cannot generate speech.");
      throw new Error("No API key available for text-to-speech");
    }

    console.log(`Converting text to speech:`, {
      textLength: text.length,
      voice: fullConfig.voice,
      model: fullConfig.model,
      speed: fullConfig.speed
    });

    // Call OpenAI TTS API
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: fullConfig.model,
        input: text,
        voice: fullConfig.voice,
        speed: fullConfig.speed,
        response_format: fullConfig.responseFormat
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      throw new Error(`TTS API error: ${response.status} ${errorText}`);
    }

    // Return the audio blob
    const audioBlob = await response.blob();
    console.log(`TTS successful: Generated ${audioBlob.size} bytes of audio`);
    
    return audioBlob;

  } catch (error) {
    console.error('Error in text-to-speech conversion:', error);
    throw error;
  }
}

/**
 * Get available voices with Argentine names
 * 
 * @returns Array of available voice options
 */
export function getArgentineVoices(): Array<{
  id: string;
  name: string;
  gender: 'male' | 'female';
  description: string;
}> {
  // OpenAI TTS API voices mapped to Argentine names - properly gender-matched
  return [
    {
      id: 'alloy',
      name: 'Carmen',
      gender: 'female',
      description: 'Voz femenina cálida y amigable'
    },
    {
      id: 'onyx',
      name: 'Diego',
      gender: 'male',
      description: 'Voz masculina profunda y confiable'
    },
    {
      id: 'nova',
      name: 'Valentina',
      gender: 'female',
      description: 'Voz femenina joven y vibrante'
    },
    {
      id: 'fable',
      name: 'Mateo',
      gender: 'male',
      description: 'Voz masculina suave y expresiva'
    }
  ];
}

/**
 * Process audio for better playback quality
 * 
 * @param audioBlob - The raw TTS audio blob
 * @returns Processed audio with enhanced quality
 */
export async function enhanceAudioQuality(audioBlob: Blob): Promise<Blob> {
  // In a real implementation, this could:
  // - Apply compression
  // - Adjust volume levels
  // - Add subtle effects to increase naturalness
  
  console.log('Enhancing audio quality for playback');
  
  // Return the original blob for now
  // In production, this would apply actual audio processing
  return audioBlob;
}
