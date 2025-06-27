"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { transcribeAudio } from '../../agents/whisper_transcribe';
// REMOVED: import { generateStoryFromTranscription } from '../../agents/story_writer';
// This was used for creative story generation which we've eliminated

export default function MemoriasAIPage() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  
  // New states for story management
  const [storyInProgress, setStoryInProgress] = useState(false);
  const [currentStory, setCurrentStory] = useState<string>('');
  const [aiEncouragement, setAiEncouragement] = useState<string | null>(null);
  const [storyComplete, setStoryComplete] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // New states for detail prompting
  const [needsDetailsPrompt, setNeedsDetailsPrompt] = useState(false);
  const [pendingDetailsType, setPendingDetailsType] = useState<string | null>(null);
  const [isWaitingForDetails, setIsWaitingForDetails] = useState(false);
  
  // Voice selection state
  const [selectedVoice, setSelectedVoice] = useState('nova'); // Default to Carmen (nova - feminine)

  // New states for download functionality
  const [audioSegments, setAudioSegments] = useState<Blob[]>([]); // Store all recorded audio segments
  const [storyTitle, setStoryTitle] = useState<string>(''); // Store story title for filename
  
  // New state for recording management
  const [recordingCompleted, setRecordingCompleted] = useState(false); // Track when recording is done but not processed
  const [pendingAudioBlob, setPendingAudioBlob] = useState<Blob | null>(null); // Store audio before processing
  
  // New states for last recording management
  const [lastRecordingTranscription, setLastRecordingTranscription] = useState<string>('');
  const [lastRecordingAudio, setLastRecordingAudio] = useState<Blob | null>(null);
  const [canDiscardLast, setCanDiscardLast] = useState(false);
  
  // State to track questions already asked to avoid repetition
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);

  // Available voices with Argentine names - properly gender-matched to OpenAI voices
  const voices = [
    { id: 'nova', name: 'Carmen', gender: 'female', description: 'Voz femenina joven y vibrante' },
    { id: 'onyx', name: 'Diego', gender: 'male', description: 'Voz masculina profunda y confiable' },
    { id: 'shimmer', name: 'Alfonsina', gender: 'female', description: 'Voz femenina cálida y melodiosa' },
    { id: 'echo', name: 'Mateo', gender: 'male', description: 'Voz masculina clara y resonante' }
  ];

  // Helper function to add debug information (console only)
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const debugMessage = `[MEMORIAS-AI ${timestamp}] ${message}`;
    console.log(debugMessage);
  };

  // Function to play text as speech
  const playTextAsSlowly = async (text: string) => {
    try {
      setIsPlayingTTS(true);
      addDebugInfo(`Starting TTS for text: ${text.substring(0, 50)}...`);

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Call our TTS API
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,  // Use the selected voice
          speed: 0.8       // Slower for clear Argentine Spanish pronunciation
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Create audio from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);

      // Play the audio
      audio.onended = () => {
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        addDebugInfo('TTS playback completed');
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      await audio.play();
      addDebugInfo('TTS playback started');

    } catch (error) {
      console.error('Error playing text as speech:', error);
      setIsPlayingTTS(false);
      setCurrentAudio(null);
      addDebugInfo(`TTS error: ${error}`);
    }
  };

  // Function to play a voice sample for a specific voice (used for voice selection)
  const playVoiceSample = async (voiceId: string, voiceName: string) => {
    try {
      setIsPlayingTTS(true);
      addDebugInfo(`Playing voice sample for ${voiceName} (${voiceId})`);

      // Call our TTS API with the specific voice ID
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `¡Hola! Soy ${voiceName}, tu guía. Estoy aquí para ayudarte a contar tu historia.`,
          voice: voiceId,  // Use the specific voice ID passed to this function
          speed: 0.8       // Slower for clear Argentine Spanish pronunciation
        })
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      // Create audio from the response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);

      // Play the audio
      audio.onended = () => {
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
        addDebugInfo(`Voice sample for ${voiceName} completed`);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlayingTTS(false);
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };

      await audio.play();
      addDebugInfo(`Voice sample for ${voiceName} started playing`);

    } catch (error) {
      console.error('Error playing voice sample:', error);
      setIsPlayingTTS(false);
      setCurrentAudio(null);
      addDebugInfo(`Voice sample error: ${error}`);
    }
  };

  // Function to convert audio to WAV format using Web Audio API
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Convert to WAV
          const wavBuffer = audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          
          audioContext.close();
          resolve(wavBlob);
        } catch (error) {
          audioContext.close();
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsArrayBuffer(audioBlob);
    });
  };

  // Helper function to convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * 2, true);
    
    // Audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return arrayBuffer;
  };

  // Set body styles when component mounts
  useEffect(() => {
    document.body.style.background = 
      "linear-gradient(135deg, #181a1b 0%, #232526 100%)";
    document.body.style.color = "#f3f3f3";
    document.body.style.fontFamily = "Segoe UI, Arial, sans-serif";

    // Clean up body styles when component unmounts
    return () => {
      document.body.style.background = "";
      document.body.style.color = "";
      document.body.style.fontFamily = "";
    };
  }, []);

  // New story management functions
  const startNewStory = async () => {
    setStoryInProgress(true);
    setCurrentStory('');
    setAudioSegments([]); // Reset audio segments for new story
    setStoryTitle(''); // Reset story title
    
    // Reset discard tracking
    setLastRecordingTranscription('');
    setLastRecordingAudio(null);
    setCanDiscardLast(false);
    
    // Reset questions tracking
    setQuestionsAsked([]);
    
    const welcomeMessage = 'Perfecto. Presiona "Grabar" para comenzar tu historia.';
    setAiEncouragement(welcomeMessage);
    setStoryComplete(false);
    setTranscribedText(null);
    setGeneratedStory(null);
    setAudioURL(null);
    
    // Don't auto-play - let the user start recording when ready
  };

  const finishCurrentStory = async () => {
    if (currentStory.trim()) {
      setStoryComplete(true);
      setStoryInProgress(false);
      
      // Generate final encouragement
      const finalMessage = await generateFinalEncouragement(currentStory);
      setAiEncouragement(finalMessage);
      
      // Format the final story nicely using AI
      const formattedStory = await formatStoryWithAI(currentStory);
      setGeneratedStory(formattedStory);
      
      // Play the final encouragement
      setTimeout(() => playTextAsSlowly(finalMessage), 500);
    }
  };

  const formatStoryForDisplay = (story: string) => {
    // Split story by double newlines (paragraph breaks) first
    const paragraphs = story.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    // Return JSX with proper paragraph breaks
    return paragraphs.map((paragraph, index) => (
      <p key={index} style={{ marginBottom: '1rem' }}>
        {paragraph.trim()}
      </p>
    ));
  };

  const formatStoryWithAI = async (story: string): Promise<string> => {
    try {
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: story,
          type: 'format_story'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.formattedStory || story;
      }
    } catch (error) {
      console.error('Error formatting story:', error);
    }

    // Fallback: basic paragraph formatting
    return story.split(/[.!?]+\s+/).filter(sentence => sentence.trim().length > 0)
      .map(sentence => sentence.trim())
      .join('. ') + (story.endsWith('.') ? '' : '.');
  };

  const generateFinalEncouragement = async (story: string): Promise<string> => {
    try {
      // Use OpenAI to generate a nice closing message
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: story,
          type: 'final_encouragement'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.message;
      }
    } catch (error) {
      console.error('Error generating final encouragement:', error);
    }

    // Fallback message
    return 'Tu historia está lista. ¡Quedó muy buena!';
  };

  const integrateDetailsIntoStory = async (story: string, newDetails: string, detailType: string): Promise<string> => {
    try {
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: story,
          newDetails: newDetails,
          detailType: detailType,
          type: 'integrate_details'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.integratedStory || `${story} ${newDetails}`;
      }
    } catch (error) {
      console.error('Error integrating details:', error);
    }

    // Fallback: simple append with context
    const contextualIntegration = (() => {
      switch (detailType) {
        case 'fecha/edad':
          return `${story} Esto pasó cuando tenía ${newDetails}.`;
        case 'lugar':
          return `${story} Todo esto ocurrió en ${newDetails}.`;
        case 'personas':
          return `${story} En esa ocasión estaba con ${newDetails}.`;
        default:
          return `${story} ${newDetails}`;
      }
    })();

    return contextualIntegration;
  };

  const processStorySegment = async (newTranscription: string) => {
    try {
      // Check if we're waiting for details to be added
      if (isWaitingForDetails && pendingDetailsType) {
        // Integrate the new details into the existing story
        const integratedStory = await integrateDetailsIntoStory(currentStory, newTranscription, pendingDetailsType);
        setCurrentStory(integratedStory);
        
        // Reset detail-waiting state
        setIsWaitingForDetails(false);
        setPendingDetailsType(null);
        setNeedsDetailsPrompt(false);
        
        // Generate normal encouragement
        const encouragement = await generateEncouragement(integratedStory);
        setAiEncouragement(encouragement);
        setTimeout(() => playTextAsSlowly(encouragement), 500);
        
        addDebugInfo(`Details integrated. Story length: ${integratedStory.length} characters`);
        return;
      }
      
      // Normal story segment processing - each new recording becomes a new paragraph
      const updatedStory = currentStory ? `${currentStory}\n\n${newTranscription}` : newTranscription;
      setCurrentStory(updatedStory);
      
      // Set story title from first segment if not already set
      if (!storyTitle && !currentStory) {
        const title = generateStoryTitle(newTranscription);
        setStoryTitle(title);
        addDebugInfo(`Story title set: ${title}`);
      }
      
      // Generate AI encouragement and prompting
      const encouragement = await generateEncouragement(updatedStory);
      setAiEncouragement(encouragement);
      
      // Play the encouragement message
      setTimeout(() => playTextAsSlowly(encouragement), 500);
      
      addDebugInfo(`Story updated. Length: ${updatedStory.length} characters`);
    } catch (error) {
      console.error('Error processing story segment:', error);
      const fallbackMessage = 'Perfecto. Continuá cuando estés listo.';
      setAiEncouragement(fallbackMessage);
      setTimeout(() => playTextAsSlowly(fallbackMessage), 500);
    }
  };

  const generateEncouragement = async (story: string): Promise<string> => {
    try {
      addDebugInfo(`Analyzing complete story for encouragement. Story length: ${story.length} chars`);
      console.log('Full story being analyzed:', story);
      console.log('Questions already asked:', questionsAsked);
      
      // Use a simple AI call to generate encouragement and prompting questions
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          story: story,
          type: 'encouragement',
          questionsAsked: questionsAsked // Pass previously asked questions
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // If the AI asked a question, track it to avoid repetition
        if (result.questionAsked) {
          setQuestionsAsked(prev => [...prev, result.questionAsked]);
        }
        
        return result.message;
      }
    } catch (error) {
      console.error('Error generating encouragement:', error);
    }

    // Fallback encouragement messages
    const fallbackMessages = [
      '¿Qué pasó después?',
      '¿Podés contarme más detalles?',
      '¿Había alguien más ahí?',
      '¿Dónde fue esto?',
      'Perfecto. Te escucho.',
      'Interesante. Continuá.'
    ];
    
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  };

  const startRecording = async () => {
    // Reset states
    setAudioChunks([]);
    setAudioURL(null);
    setTranscribedText(null);
    setGeneratedStory(null);
    
    try {
      addDebugInfo("Starting recording process...");
      
      // Check for browser compatibility
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser does not support audio recording");
      }
      
      // Request microphone access
      addDebugInfo("Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16
        }
      });
      
      // Create a local array to store audio chunks without relying on React state
      let localAudioChunks: Blob[] = [];
        // Specify audio MIME type options that are compatible with Whisper API
      let options = {};
      // Try different MIME types that are supported by both the browser and Whisper API
      // Prioritize formats that Whisper definitely supports
      const mimeTypes = [
        'audio/wav',     // Whisper's most reliable format
        'audio/mp4',     // Good compatibility 
        'audio/mpeg',    // MP3 alternative
        'audio/webm;codecs=pcm',  // PCM in WebM container
        'audio/ogg;codecs=opus',   // Good compression
        'audio/webm;codecs=opus',  // Good compression and quality
        'audio/mp3',     // Common but might have browser support issues
        'audio/webm',    // Fallback webm
        'audio/ogg'      // Fallback ogg
      ];
      
      // Find the first supported MIME type
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType };
          selectedMimeType = mimeType;
          addDebugInfo(`Using MIME type: ${mimeType}`);
          break;
        }
      }
      
      // Fallback if none of our preferred types are supported
      if (!selectedMimeType) {
        addDebugInfo("No preferred MIME types supported, using browser default");
      }
      
      const recorder = new MediaRecorder(stream, options);
      
      // Set up event handlers to collect audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          addDebugInfo(`Received audio chunk: ${event.data.size} bytes`);
          localAudioChunks.push(event.data);
          // Also update React state for UI updates
          setAudioChunks(chunks => [...chunks, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        // Get the recorder's mime type but clean it from codec info
        let mimeType = recorder.mimeType || 'audio/mp3';
        
        // If the mime type has codec information, extract just the base type
        if (mimeType.includes(';')) {
          mimeType = mimeType.split(';')[0];
        }
        
        addDebugInfo(`Recording stopped, collected ${localAudioChunks.length} chunks`);
        console.log("RECORDING STOPPED - Audio capture details:", {
          chunksCollected: localAudioChunks.length,
          mimeType: mimeType,
          recorderMimeType: recorder.mimeType,
          recorderState: recorder.state
        });
        
        // Make sure we have data - use local array instead of state
        if (localAudioChunks.length === 0) {
          console.error("RECORDING ERROR - No audio data captured!");
          addDebugInfo("ERROR: No audio chunks captured");
          setTranscribedText("Error: No se grabó audio. Por favor, intente nuevamente.");
          return;
        }
        
        // Log each chunk details
        localAudioChunks.forEach((chunk, index) => {
          console.log(`Chunk ${index}:`, {
            size: chunk.size,
            type: chunk.type
          });
        });
        
        // Create the audio blob with the actual type from the recorder
        // Use localAudioChunks instead of state variable
        const originalBlob = new Blob(localAudioChunks, { type: mimeType });
        addDebugInfo(`Creating audio blob with type: ${mimeType}, size: ${originalBlob.size} bytes`);
        console.log("AUDIO BLOB CREATED:", {
          size: originalBlob.size,
          type: originalBlob.type,
          mimeType: mimeType,
          recorderMimeType: recorder.mimeType
        });
        
        // Check for minimum audio size
        if (originalBlob.size < 1000) {
          addDebugInfo(`WARNING: Audio blob very small (${originalBlob.size} bytes), may not contain meaningful audio`);
        }
        
        // Convert WebM to WAV if necessary for better Whisper compatibility
        let audioBlob = originalBlob;
        if (mimeType.includes('webm') || mimeType.includes('ogg')) {
          addDebugInfo(`Converting ${mimeType} to WAV for better Whisper compatibility`);
          try {
            audioBlob = await convertToWav(originalBlob);
            addDebugInfo(`Conversion successful: ${audioBlob.size} bytes WAV`);
          } catch (conversionError) {
            addDebugInfo(`Conversion failed: ${conversionError}, using original format`);
            audioBlob = originalBlob; // Use original if conversion fails
          }
        }
        
        // Create URL for playback (use original for browser compatibility)
        const url = URL.createObjectURL(originalBlob);
        setAudioURL(url);
        
        // Automatically process the recording
        setRecordingCompleted(false);
        
        // Store the audio segment for later compilation
        if (storyInProgress) {
          setAudioSegments(prev => [...prev, audioBlob]);
          addDebugInfo(`Stored audio segment ${audioSegments.length + 1} (${audioBlob.size} bytes)`);
        }
        
        // Process transcription immediately
        await processTranscription(audioBlob);
        addDebugInfo("Recording automatically processed");
      };
      
      // Start recording with smaller time slices for more frequent data capture
      addDebugInfo("Starting MediaRecorder...");
      try {
        // Use a shorter time slice (100ms) to capture more chunks and ensure we get data
        recorder.start(100);
        addDebugInfo("MediaRecorder successfully started");
        
        setMediaRecorder(recorder);
        setRecording(true);
        setRecordingStartTime(Date.now());
        
        // Force additional data captures at regular intervals
        const requestDataInterval = setInterval(() => {
          if (recorder.state === 'recording') {
            addDebugInfo('Requesting periodic data capture');
            recorder.requestData();
          } else {
            clearInterval(requestDataInterval);
          }
        }, 1000); // Request data every second
        
        // Store the interval ID so we can clear it later
        (recorder as any).dataInterval = requestDataInterval;
      } catch (recorderError) {
        console.error("Error starting MediaRecorder:", recorderError);
        alert("Error al iniciar la grabación. Por favor, intente nuevamente.");
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono. Por favor, asegúrese de que está conectado y que ha dado permiso para usarlo.");
    }
  };
  const stopRecording = () => {
    if (mediaRecorder && recordingStartTime) {
      const recordingDuration = Date.now() - recordingStartTime;
      addDebugInfo(`Recording duration: ${recordingDuration}ms`);
      
      // Check for minimum recording duration (at least 1 second)
      if (recordingDuration < 1000) {
        addDebugInfo("WARNING: Recording too short, may not contain meaningful audio");
      }
      
      console.log(`Stopping recording. Current state: ${mediaRecorder.state}`);
      
      try {
        // Request a final data chunk before stopping
        if (mediaRecorder.state === 'recording') {
          console.log('Requesting final data chunk before stopping');
          mediaRecorder.requestData();
          
          // Small delay to ensure the data is processed
          setTimeout(() => {
            mediaRecorder.stop();
            console.log('MediaRecorder stopped');
            
            // Stop all audio tracks
            mediaRecorder.stream.getTracks().forEach(track => {
              track.stop();
              console.log('Audio track stopped');
            });
            
            // Clear the data request interval if it exists
            if ((mediaRecorder as any).dataInterval) {
              clearInterval((mediaRecorder as any).dataInterval);
            }
            
            setRecording(false);
            setRecordingStartTime(null);
          }, 200);
        } else {
          console.log('MediaRecorder not in recording state, cannot stop');
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        setRecording(false);
      }
    } else {
      console.error('No MediaRecorder instance found');
    }
  };

  const processTranscription = async (audioBlob: Blob) => {
    try {
      addDebugInfo(`Processing audio blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      console.log("TRANSCRIPTION START - Audio blob details:", {
        size: audioBlob.size,
        type: audioBlob.type,
        constructor: audioBlob.constructor.name
      });
      
      // Check if we have valid audio data
      if (!audioBlob || audioBlob.size === 0) {
        const errorMsg = "No valid audio data to transcribe";
        addDebugInfo(`ERROR: ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      setTranscribedText("Transcribiendo audio...");
      
      // First check if we can reach our test API endpoint
      try {
        addDebugInfo("Testing API endpoint availability...");
        const testResponse = await fetch('/api/test-env');
        const testData = await testResponse.json();
        addDebugInfo(`API test result: ${JSON.stringify(testData)}`);
      } catch (testError) {
        addDebugInfo(`API test failed: ${testError}`);
      }
      
      // Use server API approach (client-side can't access OpenAI API key)
      try {
        addDebugInfo("Using server API for transcription...");
        console.log("SERVER API - Starting transcription");
        
        // Create a File object for server handling
        const timestamp = Date.now();
        
        // Determine the proper file extension based on the actual audio type
        let fileExtension = 'mp3'; // default
        let actualMimeType = audioBlob.type;
        
        if (actualMimeType.includes('webm')) {
          fileExtension = 'webm';
        } else if (actualMimeType.includes('ogg')) {
          fileExtension = 'ogg';
        } else if (actualMimeType.includes('wav')) {
          fileExtension = 'wav';
        } else if (actualMimeType.includes('mp4')) {
          fileExtension = 'mp4';
        }
        
        const audioFile = new File(
          [audioBlob], 
          `recording-${timestamp}.${fileExtension}`, 
          { type: actualMimeType, lastModified: timestamp }
        );
        
        console.log("SERVER API - Created audio file:", {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type,
          originalBlobType: audioBlob.type,
          detectedExtension: fileExtension
        });
        
        // Set up form data with the File object
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // Add some basic debugging info
        formData.append('originalType', audioBlob.type);
        formData.append('timestamp', timestamp.toString());
        
        console.log("SERVER API - Sending audio to server-side API endpoint");
        addDebugInfo("Sending to server API...");
        
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          body: formData,
        });
        
        console.log("SERVER API - Response received:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("SERVER API - Server returned error:", errorData);
          addDebugInfo(`Server error: ${JSON.stringify(errorData)}`);
          throw new Error(`Server error: ${errorData.error || 'Unknown error'}`);
        }
        
        const transcriptionResult = await response.json();
        const transcription = transcriptionResult.text;
        
        console.log("SERVER API - Received transcription:", transcription);
        addDebugInfo(`Server transcription successful: ${transcription.substring(0, 50)}...`);
        setTranscribedText(transcription);
        
        // Track this as the last recording for potential discard
        setLastRecordingTranscription(transcription);
        setLastRecordingAudio(audioBlob);
        setCanDiscardLast(true);
        
        // Process the transcription based on current mode
        if (storyInProgress) {
          // Append to current story and generate encouragement
          await processStorySegment(transcription);
        } else {
          // For standalone transcriptions, just show the transcribed text
          // NEVER generate creative content or fabricate stories
          setGeneratedStory(transcription.trim());
        }
      } catch (serverError) {
        console.error("SERVER API - Transcription error:", serverError);
        addDebugInfo(`Server API error: ${serverError}`);
        throw serverError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("TRANSCRIPTION ERROR - Error transcribing audio:", error);
      addDebugInfo(`Transcription error: ${error}`);
      setTranscribedText("Error al transcribir el audio. Por favor, intente nuevamente.");
    }
  };

  // Function to generate story title from first segment
  const generateStoryTitle = (story: string): string => {
    if (!story) return 'Mi Historia';
    
    // Extract first 5-7 words for title
    const words = story.trim().split(/\s+/).slice(0, 6).join(' ');
    const title = words.charAt(0).toUpperCase() + words.slice(1);
    
    // Clean up title for filename (remove special characters)
    return title.replace(/[^\w\s]/gi, '').trim() || 'Mi Historia';
  };

  // Function to download story as plain text
  const downloadText = () => {
    try {
      const title = storyTitle || generateStoryTitle(currentStory);
      const textContent = `${title}\n\n${currentStory}\n\n---\n\nHistoria grabada con Memorias-AI el ${new Date().toLocaleDateString('es-AR')}`;
      
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      addDebugInfo(`Downloaded text file: ${link.download}`);
    } catch (error) {
      console.error('Error downloading text file:', error);
      addDebugInfo(`Error downloading text file: ${error}`);
    }
  };

  // Function to combine audio segments and download as MP3
  const downloadAudio = async () => {
    try {
      if (audioSegments.length === 0) {
        addDebugInfo('No audio segments to download');
        return;
      }

      addDebugInfo(`Combining ${audioSegments.length} audio segments...`);
      
      // Use Web Audio API to properly concatenate audio segments
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const combinedBuffers: AudioBuffer[] = [];
      
      // Decode all audio segments
      for (let i = 0; i < audioSegments.length; i++) {
        const arrayBuffer = await audioSegments[i].arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        combinedBuffers.push(audioBuffer);
      }
      
      // Calculate total length
      const totalLength = combinedBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const numberOfChannels = combinedBuffers[0]?.numberOfChannels || 1;
      const sampleRate = combinedBuffers[0]?.sampleRate || 44100;
      
      // Create combined buffer
      const combinedBuffer = audioContext.createBuffer(numberOfChannels, totalLength, sampleRate);
      
      // Copy all segments into the combined buffer
      let offset = 0;
      for (const buffer of combinedBuffers) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          combinedBuffer.getChannelData(channel).set(channelData, offset);
        }
        offset += buffer.length;
      }
      
      // Convert to WAV format
      const wavBuffer = audioBufferToWav(combinedBuffer);
      const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
      
      const title = storyTitle || generateStoryTitle(currentStory);
      const url = URL.createObjectURL(wavBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      addDebugInfo(`Downloaded audio: ${link.download}`);
    } catch (error) {
      console.error('Error downloading audio:', error);
      addDebugInfo(`Error downloading audio: ${error}`);
    }
  };

  // REMOVED: generateRealStory and simulateStoryGeneration functions
  // REMOVED: generateRealStory and simulateStoryGeneration functions
  // These functions were generating creative/fabricated content which violates
  // the core principle that MemoriasAI should NEVER invent or fabricate stories.
  
  // Function to discard recording and start over
  const discardRecording = () => {
    setRecordingCompleted(false);
    setPendingAudioBlob(null);
    setAudioURL(null);
    setTranscribedText('');
    addDebugInfo("Recording discarded, ready to record again");
  };

  // Function to discard the last recording and transcription
  const discardLastRecording = () => {
    if (!canDiscardLast || !lastRecordingTranscription) return;
    
    // Remove the last transcription from the current story
    if (storyInProgress && currentStory.includes(lastRecordingTranscription)) {
      // Since each recording is a paragraph, find the last occurrence and remove it
      const lastIndex = currentStory.lastIndexOf(lastRecordingTranscription);
      if (lastIndex !== -1) {
        // Remove the transcription and any preceding paragraph break
        let updatedStory = currentStory.substring(0, lastIndex) + currentStory.substring(lastIndex + lastRecordingTranscription.length);
        // Clean up trailing paragraph breaks
        updatedStory = updatedStory.replace(/\n\n+$/, '').trim();
        setCurrentStory(updatedStory);
      }
    }
    
    // Remove the last audio segment if it exists
    if (lastRecordingAudio && audioSegments.length > 0) {
      setAudioSegments(prev => prev.slice(0, -1));
    }
    
    // Clear the transcription display
    setTranscribedText('');
    
    // Reset last recording tracking
    setLastRecordingTranscription('');
    setLastRecordingAudio(null);
    setCanDiscardLast(false);
    
    // Clear AI encouragement
    setAiEncouragement('Grabación descartada. Presiona "Grabar" para continuar.');
    
    addDebugInfo("Last recording and transcription discarded");
  };

  return (
    <div className={styles.container} style={{
      background: 'rgba(34, 40, 49, 0.98)',
      borderRadius: 16,
      boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
      maxWidth: '800px',
      margin: '1rem auto',
      padding: '1.2rem'
    }}>
      <header style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <h1 style={{ 
          color: '#ffb347', 
          fontSize: '1.8rem',
          marginBottom: '0.2rem'
        }}>Memorias-AI</h1>
        <p style={{ color: '#ccc', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
          Capturando memorias para compartir con la familia...
        </p>
        
        {/* Voice Selection */}
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '0.6rem', 
          borderRadius: '6px',
          marginBottom: '0.6rem',
          border: '1px solid rgba(255,179,71,0.3)'
        }}>
          <h3 style={{ color: '#ffb347', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            🎙️ Elegí tu guía
          </h3>
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {voices.map((voice) => (
              <div
                key={voice.id}
                onClick={() => {
                  if (isPlayingTTS && selectedVoice === voice.id) {
                    // If this voice is currently playing, stop it
                    if (currentAudio) {
                      currentAudio.pause();
                      setIsPlayingTTS(false);
                      setCurrentAudio(null);
                    }
                  } else {
                    // Stop any currently playing audio first
                    if (currentAudio) {
                      currentAudio.pause();
                      setIsPlayingTTS(false);
                      setCurrentAudio(null);
                    }
                    
                    // Select this voice and play sample with the specific voice
                    setSelectedVoice(voice.id);
                    
                    // Play sample with THIS specific voice (not the selectedVoice state)
                    playVoiceSample(voice.id, voice.name);
                  }
                }}
                style={{
                  background: selectedVoice === voice.id 
                    ? 'rgba(255,179,71,0.3)' 
                    : 'rgba(255,255,255,0.1)',
                  border: selectedVoice === voice.id 
                    ? '2px solid #ffb347' 
                    : '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  padding: '0.4rem 0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  opacity: isPlayingTTS && selectedVoice !== voice.id ? 0.6 : 1,
                  minWidth: '100px'
                }}
              >
                <div style={{ 
                  color: selectedVoice === voice.id ? '#ffb347' : '#fff',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  fontSize: '0.85rem'
                }}>
                  {voice.gender === 'female' ? '👩' : '👨'} {voice.name}
                  {isPlayingTTS && selectedVoice === voice.id && (
                    <span style={{ fontSize: '0.7rem', color: '#ffb347' }}>🔊</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p style={{ 
            color: '#ccc', 
            fontSize: '0.8rem', 
            marginTop: '0.6rem',
            fontStyle: 'italic'
          }}>
            {isPlayingTTS ? (
              <>🔊 Reproduciendo muestra de <span style={{ color: '#ffb347', fontWeight: 'bold' }}>
                {voices.find(v => v.id === selectedVoice)?.name}
              </span> • Hacé clic para parar</>
            ) : (
              <>Guía seleccionado: <span style={{ color: '#ffb347', fontWeight: 'bold' }}>
                {voices.find(v => v.id === selectedVoice)?.name}
              </span> • Hacé clic en otros para escuchar</>
            )}
          </p>
        </div>
      </header>

      <main style={{ width: '100%' }}>
        {!storyInProgress && !storyComplete && (
          <section className={styles.section} style={{ textAlign: 'center' }}>
            <h2 className={styles.sectionTitle}>Comenzar Nueva Historia</h2>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              ¿Tienes una memoria especial que te gustaría compartir? Te ayudo a contarla paso a paso.
            </p>
            
            <button 
              onClick={startNewStory}
              className={styles.button}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '0.95rem',
                padding: '10px 20px'
              }}
            >
              🌟 Comenzar a Contar Mi Historia
            </button>
          </section>
        )}

        {storyInProgress && (
          <>
            <section className={styles.section} style={{ textAlign: 'center' }}>
              <h2 className={styles.sectionTitle}>Contando Tu Historia</h2>
              
              <div style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '0.8rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid rgba(255,179,71,0.3)'
              }}>
                {aiEncouragement && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <p style={{ 
                        color: '#ffb347', 
                        fontStyle: 'italic',
                        marginBottom: '0',
                        fontSize: '0.95rem',
                        flex: 1
                      }}>
                        💭 {aiEncouragement}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button
                          onClick={() => playTextAsSlowly(aiEncouragement)}
                          disabled={isPlayingTTS}
                          style={{
                            background: isPlayingTTS ? 'rgba(255,179,71,0.3)' : 'rgba(255,179,71,0.6)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: isPlayingTTS ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                          }}
                          title="Escuchar mensaje"
                        >
                          {isPlayingTTS ? '�' : '🔈'}
                        </button>
                        {isPlayingTTS && currentAudio && (
                          <button
                            onClick={() => {
                              currentAudio.pause();
                              setIsPlayingTTS(false);
                              setCurrentAudio(null);
                            }}
                            style={{
                              background: 'rgba(255,100,100,0.6)',
                              border: 'none',
                              borderRadius: '50%',
                              width: '36px',
                              height: '36px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px'
                            }}
                            title="Detener audio"
                          >
                            ⏹️
                          </button>
                        )}
                      </div>
                    </div>
                    {isPlayingTTS && (
                      <div style={{ 
                        color: '#ffb347', 
                        fontSize: '0.9rem', 
                        opacity: 0.8,
                        fontStyle: 'italic' 
                      }}>
                        🎵 Reproduciendo mensaje...
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginBottom: '1rem' }}>
                <button 
                  onClick={recording ? stopRecording : startRecording}
                  className={`${styles.button} ${recording ? styles.recording : ''}`}
                  disabled={storyComplete}
                >
                  {recording ? '⏹️ Pausar Grabación' : '🎙️ Grabar Siguiente Parte'}
                </button>
                
                <button 
                  onClick={finishCurrentStory}
                  className={styles.button}
                  style={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  }}
                  disabled={!currentStory.trim()}
                >
                  ✅ Terminar Historia
                </button>
                
                {canDiscardLast && (
                  <button 
                    onClick={discardLastRecording}
                    className={styles.button}
                    style={{ 
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa8a8 100%)',
                      fontSize: '0.8rem',
                      padding: '8px 12px'
                    }}
                    title="Descartar la última grabación y transcripción"
                  >
                    🗑️ Descartar última
                  </button>
                )}
              </div>
              
              {audioURL && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#ccc', marginBottom: '0.3rem', fontSize: '0.9rem' }}>Última Grabación:</h4>
                  <audio src={audioURL} controls style={{ width: '100%' }} />
                </div>
              )}
            </section>

            {transcribedText && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tu Transcripción Más Reciente</h2>
                <p className={styles.transcription} style={{ 
                  background: 'rgba(102, 126, 234, 0.1)', 
                  padding: '0.8rem', 
                  borderRadius: '6px',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  fontSize: '0.9rem'
                }}>
                  {transcribedText}
                </p>
              </section>
            )}

            {currentStory && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Tu Historia</h2>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  lineHeight: '1.5',
                  fontSize: '1rem'
                }}>
                  {formatStoryForDisplay(currentStory)}
                </div>
              </section>
            )}
          </>
        )}

        {storyComplete && (
          <section className={styles.section} style={{ textAlign: 'center' }}>
            <h2 className={styles.sectionTitle}>¡Historia Completa!</h2>
            
            {aiEncouragement && (
              <div style={{ 
                background: 'rgba(0,200,0,0.1)', 
                padding: '1rem', 
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid rgba(0,200,0,0.3)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ 
                    color: '#90EE90', 
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    marginBottom: '0',
                    flex: 1
                  }}>
                    🎉 {aiEncouragement}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => playTextAsSlowly(aiEncouragement)}
                      disabled={isPlayingTTS}
                      style={{
                        background: isPlayingTTS ? 'rgba(144,238,144,0.3)' : 'rgba(144,238,144,0.6)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: isPlayingTTS ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                      title="Escuchar felicitación"
                    >
                      {isPlayingTTS ? '🔊' : '🔈'}
                    </button>
                    {isPlayingTTS && currentAudio && (
                      <button
                        onClick={() => {
                          currentAudio.pause();
                          setIsPlayingTTS(false);
                          setCurrentAudio(null);
                        }}
                        style={{
                          background: 'rgba(255,100,100,0.6)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px'
                        }}
                        title="Detener audio"
                      >
                        ⏹️
                      </button>
                    )}
                  </div>
                </div>
                {isPlayingTTS && (
                  <div style={{ 
                    color: '#90EE90', 
                    fontSize: '0.9rem', 
                    opacity: 0.8,
                    fontStyle: 'italic',
                    marginTop: '0.5rem'
                  }}>
                    🎵 Reproduciendo felicitación...
                  </div>
                )}
              </div>
            )}
            
            {/* Download Links Section */}
            <div style={{ 
              background: 'rgba(255,179,71,0.1)', 
              padding: '1rem', 
              borderRadius: '8px',
              marginBottom: '1rem',
              border: '1px solid rgba(255,179,71,0.3)'
            }}>
              <h3 style={{ 
                color: '#ffb347', 
                marginBottom: '0.8rem',
                fontSize: '1.1rem'
              }}>
                📁 Descargar tu historia
              </h3>
              <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={downloadText}
                  style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Descargar la historia como archivo de texto plano"
                >
                  📄 Texto (.txt)
                </button>
                
                <button
                  onClick={downloadAudio}
                  disabled={audioSegments.length === 0}
                  style={{
                    background: audioSegments.length > 0 
                      ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                      : 'rgba(128,128,128,0.3)',
                    color: audioSegments.length > 0 ? 'white' : 'rgba(255,255,255,0.5)',
                    border: 'none',
                    padding: '0.8rem 1.5rem',
                    borderRadius: '8px',
                    cursor: audioSegments.length > 0 ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseOver={(e) => {
                    if (audioSegments.length > 0) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title={audioSegments.length > 0 
                    ? `Descargar ${audioSegments.length} segmentos de audio combinados`
                    : 'No hay audio disponible para descargar'
                  }
                >
                  🎵 Audio ({audioSegments.length} segmentos)
                </button>
              </div>
              <p style={{ 
                color: '#ccc', 
                fontSize: '0.8rem', 
                marginTop: '1rem',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                💡 El archivo de texto se puede abrir en cualquier editor. El audio conserva tu voz original.
              </p>
            </div>
            
            <button 
              onClick={() => {
                setStoryComplete(false);
                setStoryInProgress(false);
                setCurrentStory('');
                setAudioSegments([]); // Reset audio segments
                setStoryTitle(''); // Reset story title
                setAiEncouragement(null);
                setTranscribedText(null);
                setGeneratedStory(null);
                setAudioURL(null);
                
                // Reset questions tracking
                setQuestionsAsked([]);
                
                // Reset discard tracking
                setLastRecordingTranscription('');
                setLastRecordingAudio(null);
                setCanDiscardLast(false);
              }}
              className={styles.button}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                marginTop: '1rem'
              }}
            >
              🌟 Contar Otra Historia
            </button>
          </section>
        )}

        {/* Original standalone transcription section - only show if not in story mode */}
        {!storyInProgress && !storyComplete && (
          <section className={styles.section} style={{ textAlign: 'center' }}>
            <h2 className={styles.sectionTitle}>Transcripción Rápida</h2>
            <p style={{ marginBottom: '1.5rem' }}>
              O simplemente graba algo rápido para transcribir
            </p>
            
            <button 
              onClick={recording ? stopRecording : startRecording}
              className={`${styles.button} ${recording ? styles.recording : ''}`}
            >
              {recording ? '⏹️ Detener Grabación' : '🎙️ Grabación Rápida'}
            </button>
            
            {audioURL && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 className={styles.sectionTitle}>Grabación</h3>
                <audio src={audioURL} controls style={{ width: '100%', marginBottom: '1rem' }} />
              </div>
            )}
          </section>
        )}

        {/* Show transcribed text and generated story only for non-story mode */}
        {!storyInProgress && !storyComplete && transcribedText && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Transcripción</h2>
            <p className={styles.transcription}>
              {transcribedText}
            </p>
          </section>
        )}

        {!storyInProgress && !storyComplete && generatedStory && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Historia Generada</h2>
            <div 
              className={styles.storyContent}
              dangerouslySetInnerHTML={{ __html: generatedStory.replace(/\n/g, '<br>') }} 
            />
          </section>
        )}

        {/* Final story display for completed stories */}
        {storyComplete && generatedStory && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tu Historia Completa</h2>
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '2px solid rgba(144, 238, 144, 0.3)',
              lineHeight: '1.7',
              fontSize: '1.1rem'
            }}>
              {formatStoryForDisplay(generatedStory)}
            </div>
          </section>
        )}
      </main>
      
      <footer style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link 
          href="/"
          className={styles.backButton}
        >
          ← Regresar a Mission Control
        </Link>
      </footer>
    </div>
  );
}