"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { transcribeAudio } from '../../agents/whisper_transcribe';
import { getArgentineVoices } from '../../agents/tts';
import { MemoryManager } from '../../lib/AgentMemory';
import { formatStoryText } from '../../lib/utils';

export default function MemoriasAIPage() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm'); // Track actual format
  
  // Agent voice and interaction states
  const [selectedVoice, setSelectedVoice] = useState('nova'); // Default to Valentina
  const [agentQuestion, setAgentQuestion] = useState<string | null>(null);
  const [agentAudio, setAgentAudio] = useState<string | null>(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  
  // Conversation workflow states
  const [conversationPhase, setConversationPhase] = useState<'setup' | 'info_gathering' | 'storytelling' | 'completed'>('info_gathering');
  const [currentAgentMessage, setCurrentAgentMessage] = useState<string>('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [awaitingUserResponse, setAwaitingUserResponse] = useState(false);
  const [storySegments, setStorySegments] = useState<string[]>([]);
  const [infoGatheringStep, setInfoGatheringStep] = useState<'name' | 'age' | 'location' | 'returning_user_check' | 'completed'>('name');
  
  // Auto-question timing
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastTranscriptionTime, setLastTranscriptionTime] = useState<number>(0);
  
  // Form fields for story context
  const [storytellerName, setStorytellerName] = useState('');
  const [storytellerEmail, setStorytellerEmail] = useState('');
  const [ageAtEvents, setAgeAtEvents] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  // Audio segment storage for story parts only (excluding info gathering)
  const [storyAudioSegments, setStoryAudioSegments] = useState<Blob[]>([]);
  const [storyEmailSent, setStoryEmailSent] = useState(false);
  const [showDownloadOffer, setShowDownloadOffer] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);

  // Initialize agent memory with best practices
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        await MemoryManager.initializeAgentBestPractices('MemoriasAI');
        console.log('Agent best practices initialized');
        
        // Start the conversation automatically
        if (conversationPhase === 'info_gathering' && !currentAgentMessage) {
          await startInfoGathering();
        }
      } catch (error) {
        console.error('Error initializing agent:', error);
      }
    };
    
    initializeAgent();
  }, []);

  // Helper function to get correct file extension based on MIME type
  const getFileExtension = (mimeType: string): string => {
    const mimeToExt: { [key: string]: string } = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3'
    };
    
    // Extract base mime type (remove codec info)
    const baseMimeType = mimeType.split(';')[0];
    return mimeToExt[baseMimeType] || 'webm'; // default to webm
  };

  // Function to concatenate story audio segments
  const createCombinedStoryAudio = (): Blob | null => {
    if (storyAudioSegments.length === 0) return null;
    
    // Combine all story audio segments
    const combinedBlob = new Blob(storyAudioSegments, { type: audioMimeType });
    console.log(`Combined audio: ${storyAudioSegments.length} segments, total size: ${combinedBlob.size} bytes`);
    return combinedBlob;
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

  const startRecording = async () => {
    // For storytelling phase, ensure we have all required info
    if (conversationPhase === 'storytelling') {
      if (!storytellerName.trim() || !ageAtEvents.trim() || !eventLocation.trim()) {
        alert('Faltan datos del narrador. Por favor complete la información primero.');
        return;
      }
    }
    
    // Reset states
    setAudioChunks([]);
    setAudioURL(null);
    if (conversationPhase === 'storytelling') {
      setTranscribedText(null); // Only reset transcription for storytelling
    }
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a local array to store audio chunks without relying on React state
      let localAudioChunks: Blob[] = [];
      
      // Specify audio MIME type options that are compatible with Whisper API
      let options = {};
      
      // Try different MIME types that are supported by both the browser and Whisper API
      // Prioritize MP3 as it's more compressed than WAV
      const mimeTypes = [
        'audio/mp3',
        'audio/mpeg', 
        'audio/ogg',
        'audio/wav',  // WAV is less compressed but widely supported
        'audio/webm'  // Often supported but with codec issues
      ];
      
      // Find the first supported MIME type
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          options = { mimeType };
          selectedMimeType = mimeType;
          console.log(`Using MIME type: ${mimeType}`);
          break;
        }
      }
      
      // Fallback if none of our preferred types are supported
      if (!selectedMimeType) {
        console.log("No preferred MIME types supported, using browser default");
        selectedMimeType = 'audio/webm'; // reasonable default
      }
      
      const recorder = new MediaRecorder(stream, options);
      
      // Store the actual MIME type for proper file naming
      setAudioMimeType(recorder.mimeType || selectedMimeType);
      
      // Set up event handlers to collect audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received audio chunk: ${event.data.size} bytes`);
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
        
        console.log(`Recording stopped, collected ${localAudioChunks.length} chunks`);
        
        // Make sure we have data - use local array instead of state
        if (localAudioChunks.length === 0) {
          console.error("No audio data captured!");
          setTranscribedText("No recorded narration");
          return;
        }
        
        // Check total audio size - if too small, likely just silence
        const totalSize = localAudioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log("Audio chunks captured:", localAudioChunks.length, 
          "Total size:", totalSize, "bytes");
          
        if (totalSize < 1000) { // Less than 1KB is likely just headers/silence
          console.warn("Audio data too small, likely silence or no meaningful content");
          setTranscribedText("No recorded narration");
          return;
        }
        
        // Create the audio blob with the actual type from the recorder
        // Use localAudioChunks instead of state variable
        const audioBlob = new Blob(localAudioChunks, { type: mimeType });
        console.log(`Creating audio blob with type: ${mimeType}, size: ${audioBlob.size} bytes`);
        
        // Save audio segment if this is story content (not info gathering)
        if (conversationPhase === 'storytelling') {
          setStoryAudioSegments(prev => [...prev, audioBlob]);
          console.log('Saved story audio segment');
        }
        
        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        try {
          // Log the audio details before sending
          console.log("Audio details:", {
            type: audioBlob.type,
            size: audioBlob.size,
            chunks: localAudioChunks.length
          });
          
          await processTranscription(audioBlob);
        } catch (error) {
          console.error("Error in transcription process:", error);
          setTranscribedText("Error al transcribir. Por favor, intente nuevamente.");
        }
      };
      
      // Start recording with smaller time slices for more frequent data capture
      console.log("Starting MediaRecorder...");
      try {
        // Use a shorter time slice (200ms) to capture more chunks and ensure we get data
        recorder.start(200);
        console.log("MediaRecorder successfully started");
        
        setMediaRecorder(recorder);
        setRecording(true);
        
        console.log("Recording started with MediaRecorder:", {
          state: recorder.state,
          mimeType: recorder.mimeType
        });
        
        // Force an additional data capture after a brief delay
        setTimeout(() => {
          if (recorder.state === 'recording') {
            console.log('Requesting additional data capture');
            recorder.requestData();
          }
        }, 500);
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
    if (mediaRecorder) {
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
            
            setRecording(false);
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
      console.log("Processing audio blob:", audioBlob.size, "bytes", "type:", audioBlob.type);
      
      // Check if we have valid audio data
      if (!audioBlob || audioBlob.size === 0) {
        setTranscribedText("No recorded narration");
        return;
      }
      
      setTranscribedText("Transcribiendo audio...");
      
      // First try direct transcription using the whisper_transcribe function
      try {
        console.log("Attempting direct transcription with Whisper API...");
        
        // Create a filename that indicates the format
        const fileName = `recording-${Date.now()}.mp3`;
        
        // Call the transcription function directly
        const result = await transcribeAudio(audioBlob, {
          language: 'es',
          model: 'whisper-1',
          fileName: fileName
        });
        
        console.log("Direct transcription successful:", result);
        const formattedText = formatStoryText(result.text);
        setTranscribedText(formattedText);
        
        return; // Exit early since direct transcription worked
      } catch (directError) {
        console.warn("Direct transcription failed, falling back to server API:", directError);
      }
      
      // Fallback to server API approach
      try {
        // Create a File object for more reliable server handling
        const timestamp = Date.now();
        const audioFile = new File(
          [audioBlob], 
          `recording-${timestamp}.mp3`, 
          { type: 'audio/mp3', lastModified: timestamp }
        );
        
        console.log("Created audio file for server API:", {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type
        });
        
        // Set up form data with the File object
        const formData = new FormData();
        formData.append('audio', audioFile);
        
        // Add some basic debugging info
        formData.append('originalType', audioBlob.type);
        formData.append('timestamp', timestamp.toString());
        
        console.log("Sending audio to server-side API endpoint");
        
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server returned error:", errorData);
          throw new Error(`Server error: ${errorData.error || 'Unknown error'}`);
        }
        
        const transcriptionResult = await response.json();
        const transcription = transcriptionResult.text;
        
        console.log("Received transcription:", transcription);
        const formattedTranscription = formatStoryText(transcription);
        setTranscribedText(formattedTranscription);
        
        // Handle conversation flow based on current phase
        if (conversationPhase === 'info_gathering' && awaitingUserResponse) {
          await processInfoGatheringResponse(transcription);
        } else if (conversationPhase === 'storytelling') {
          await analyzeStoryAndRespond(transcription);
        }
      } catch (serverError) {
        console.error("Server API transcription error:", serverError);
        throw serverError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
      
      // Provide more specific error messages
      let errorMessage = "No recorded narration";
      if (error instanceof Error) {
        if (error.message.includes("API key")) {
          errorMessage = "Transcription service not configured";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error - please check your connection";
        } else if (error.message.includes("audio") || error.message.includes("format")) {
          errorMessage = "Audio format not supported";
        }
      }
      
      setTranscribedText(errorMessage);
    }
  };
  
  // Voice preview functionality
  const previewVoice = async (voice: any) => {
    try {
      const previewText = `Hola, soy ${voice.name}. ${voice.description}`;
      
      // Call the API route instead of client-side function
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: previewText,
          voice: voice.id,
          speed: 0.9
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Also select this voice
      setSelectedVoice(voice.id);
    } catch (error) {
      console.error('Error previewing voice:', error);
      // Fallback: just select the voice
      setSelectedVoice(voice.id);
    }
  };

  // Agent conversation functions
  const speakAgentMessage = async (message: string) => {
    setCurrentAgentMessage(message);
    setIsAgentSpeaking(true);
    
    try {
      // Call the API route instead of client-side function
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          voice: selectedVoice,
          speed: 0.9
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsAgentSpeaking(false);
        setAwaitingUserResponse(true);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error generating agent speech:', error);
      setIsAgentSpeaking(false);
      setAwaitingUserResponse(true);
    }
  };

  const startInfoGathering = async () => {
    setConversationPhase('info_gathering');
    setInfoGatheringStep('name');
    
    const welcomeMessage = "¡Hola! Soy tu asistente de Memorias AI. Te voy a ayudar a grabar tu historia. Primero necesito conocerte mejor. ¿Podrías decirme tu nombre completo?";
    await speakAgentMessage(welcomeMessage);
  };

  const processInfoGatheringResponse = async (transcription: string) => {
    const lowerTranscription = transcription.toLowerCase().trim();
    
    switch (infoGatheringStep) {
      case 'returning_user_check':
        // Handle returning user response about what they want to change
        if (lowerTranscription.includes('edad') || lowerTranscription.includes('cambiar edad')) {
          setInfoGatheringStep('age');
          const ageMessage = `Perfecto. ¿Qué edad tenías cuando ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(ageMessage);
        } else if (lowerTranscription.includes('lugar') || lowerTranscription.includes('cambiar lugar')) {
          setInfoGatheringStep('location');
          const locationMessage = `Perfecto. ¿En qué lugar ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(locationMessage);
        } else if (lowerTranscription.includes('ambos') || lowerTranscription.includes('los dos') || (lowerTranscription.includes('edad') && lowerTranscription.includes('lugar'))) {
          setInfoGatheringStep('age');
          const bothMessage = `Perfecto. Primero, ¿qué edad tenías cuando ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(bothMessage);
        } else {
          // User wants to keep the same data
          setInfoGatheringStep('completed');
          setConversationPhase('storytelling');
          const readyMessage = `Perfecto, ${storytellerName}. Mantenemos tu edad de ${ageAtEvents} y el lugar ${eventLocation}. Ahora estoy listo para escuchar tu nueva historia. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme.`;
          await speakAgentMessage(readyMessage);
          setAwaitingUserResponse(false);
        }
        break;
        
      case 'name':
        // Extract name from transcription (simple approach)
        setStorytellerName(transcription.trim());
        setInfoGatheringStep('age');
        
        const ageMessage = `Perfecto, ${transcription.trim()}. Ahora, ¿qué edad tenías cuando ocurrieron los eventos de esta historia que me vas a contar?`;
        await speakAgentMessage(ageMessage);
        break;
        
      case 'age':
        setAgeAtEvents(transcription.trim());
        
        // If this is a returning user who only wanted to change age, go to storytelling
        if (isReturningUser) {
          setInfoGatheringStep('completed');
          setConversationPhase('storytelling');
          const readyMessage = `Perfecto, ${storytellerName}. Ahora con tu nueva edad de ${transcription.trim()} y el lugar ${eventLocation}. Estoy listo para escuchar tu nueva historia. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme.`;
          await speakAgentMessage(readyMessage);
          setAwaitingUserResponse(false);
        } else {
          setInfoGatheringStep('location');
          const locationMessage = `Muy bien. ¿En qué lugar ocurrieron estos eventos que me vas a narrar?`;
          await speakAgentMessage(locationMessage);
        }
        break;
        
      case 'location':
        setEventLocation(transcription.trim());
        setInfoGatheringStep('completed');
        setConversationPhase('storytelling');
        
        const readyMessage = `Perfecto, ${storytellerName}. Ya tengo toda la información. Ahora estoy listo para escuchar tu historia sobre cuando tenías ${ageAtEvents} en ${transcription.trim()}. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme tu historia.`;
        await speakAgentMessage(readyMessage);
        setAwaitingUserResponse(false);
        break;
    }
  };

  const analyzeStoryAndRespond = async (storyText: string) => {
    if (conversationPhase !== 'storytelling') return;
    
    // Add this segment to story segments
    setStorySegments(prev => [...prev, storyText]);
    
    // Use a simple timer to detect when user has paused
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
    }
    
    silenceTimer.current = setTimeout(async () => {
      await generateContextualQuestion(storyText);
    }, 3000); // Wait 3 seconds after transcription before asking question
  };

  const generateContextualQuestion = async (currentStory: string) => {
    if (isAgentSpeaking || awaitingUserResponse) return;
    
    try {
      // Get memory context for better questioning
      const memoryContext = MemoryManager.generateContextForAgent('MemoriasAI');
      
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story: currentStory,
          type: 'encouragement',
          questionsAsked: questionsAsked,
          memoryContext: memoryContext
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setQuestionsAsked(prev => [...prev, data.message]);
          await speakAgentMessage(data.message);
        }
      }
    } catch (error) {
      console.error('Error generating contextual question:', error);
    }
  };

  const sendStoryByEmail = async () => {
    // Validate required fields
    if (!transcribedText) {
      alert('No hay historia transcrita para enviar.');
      return;
    }
    
    if (!storytellerName) {
      alert('Falta el nombre del narrador. Por favor complete la información primero.');
      return;
    }
    
    if (!storytellerEmail) {
      alert('Por favor, ingrese su dirección de email.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(storytellerEmail)) {
      alert('Por favor, ingrese una dirección de email válida.');
      return;
    }
    
    setIsEmailSending(true);
    
    try {
      const emailContent = `Hola ${storytellerName},

Aquí está tu historia transcrita de Memorias AI:

---

${formatStoryText(transcribedText)}

---

Contexto de la historia:
- Narrador: ${storytellerName}
- Email: ${storytellerEmail}
- Edad durante los eventos: ${ageAtEvents}
- Lugar donde ocurrieron: ${eventLocation}
- Fecha de grabación: ${new Date().toLocaleDateString('es-ES')}

Esta historia fue capturada y transcrita usando Memorias AI.

Saludos,
El equipo de Memorias AI`;

      // Formspree endpoint - you'll need to replace this with your actual endpoint
      const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT || 'https://formspree.io/f/YOUR_FORM_ID';
      
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: storytellerEmail,
          subject: 'Tu Historia de Memorias AI',
          message: emailContent,
          _replyto: storytellerEmail,
          _subject: 'Tu Historia de Memorias AI'
        }),
      });

      if (response.ok) {
        setStoryEmailSent(true);
        setShowDownloadOffer(true);
        // Don't alert immediately, let the agent speak
        if (storyAudioSegments.length > 0) {
          speakAgentMessage("Te envié la historia por email. ¿Te gustaría descargar tu audio, o puedes hacer clic en 'Nueva Historia' para empezar una nueva?");
        } else {
          alert(`¡Historia enviada exitosamente a ${storytellerEmail}!`);
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el email. Por favor, intente nuevamente.');
    } finally {
      setIsEmailSending(false);
    }
  };

  const downloadStoryAudio = () => {
    const combinedAudio = createCombinedStoryAudio();
    if (!combinedAudio) {
      alert('No hay audio de historia disponible para descargar.');
      return;
    }
    
    const url = URL.createObjectURL(combinedAudio);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi-historia-${new Date().toISOString().split('T')[0]}.${getFileExtension(audioMimeType)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowDownloadOffer(false);
    alert('¡Audio descargado exitosamente!');
  };

  const generateAgentQuestion = async () => {
    if (!transcribedText) return;
    
    setIsGeneratingQuestion(true);
    
    try {
      // Call the feedback API to get a question
      const response = await fetch('/api/agents/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story: transcribedText,
          type: 'encouragement',
          questionsAsked: questionsAsked
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setAgentQuestion(data.message);
          setQuestionsAsked(prev => [...prev, data.message]);
          
          // Generate audio for the question using selected voice
          try {
            // Call the API route instead of client-side function
            const ttsResponse = await fetch('/api/text-to-speech', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: data.message,
                voice: selectedVoice,
                speed: 0.9
              }),
            });

            if (ttsResponse.ok) {
              const audioBlob = await ttsResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              setAgentAudio(audioUrl);
            } else {
              throw new Error(`TTS API failed: ${ttsResponse.status}`);
            }
          } catch (audioError) {
            console.error('Error generating speech:', audioError);
            // Question will still be displayed as text
          }
        }
      }
    } catch (error) {
      console.error('Error generating question:', error);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  // Function to reset conversation for a new story
  const startNewStory = async () => {
    // Reset conversation states
    setConversationPhase('info_gathering');
    setCurrentAgentMessage('');
    setIsAgentSpeaking(false);
    setAwaitingUserResponse(false);
    setInfoGatheringStep('returning_user_check');
    setIsReturningUser(true);
    
    // Reset story data
    setTranscribedText(null);
    setStorySegments([]);
    setStoryAudioSegments([]);
    setQuestionsAsked([]);
    setAgentQuestion(null);
    setAgentAudio(null);
    
    // Reset recording states
    setRecording(false);
    setAudioURL(null);
    setAudioChunks([]);
    
    // Reset email states but keep email and user info (we'll ask what to change)
    setStoryEmailSent(false);
    setShowDownloadOffer(false);
    setIsEmailSending(false);
    
    // Clear any existing timers
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    console.log('Conversation reset for new story');
    
    // Start the returning user flow
    const returningMessage = `Estoy listo para grabar otra historia, así que mantengo tu nombre ${storytellerName}. En la historia que me vas a contar, ¿quieres cambiar tu edad o el lugar, o mantener los mismos datos?`;
    await speakAgentMessage(returningMessage);
  };
  
  return (
    <div className={styles.container} style={{
      background: 'rgba(34, 40, 49, 0.98)',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      maxWidth: '900px',
      width: '95%',
      margin: '1rem auto',
      padding: '1.5rem',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ 
          color: '#ffb347', 
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          marginBottom: '0.5rem',
          lineHeight: '1.2'
        }}>Memorias-AI</h1>
        <p style={{ 
          color: '#ccc', 
          marginBottom: '1rem',
          fontSize: 'clamp(0.9rem, 3vw, 1rem)',
          padding: '0 1rem'
        }}>
          Capturando historias en el acento español argentino
        </p>
      </header>

      {/* Voice Selection */}
      <section className={styles.section} style={{ marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>Seleccionar Voz del Asistente</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem', 
          marginBottom: '1rem',
          padding: '0 0.5rem'
        }}>
          {getArgentineVoices().map((voice) => (
            <button
              key={voice.id}
              onClick={() => previewVoice(voice)}
              className={`${styles.voiceButtonSmall} ${selectedVoice === voice.id ? styles.voiceSelected : ''}`}
              style={{
                backgroundColor: selectedVoice === voice.id ? '#ffb347' : 'rgba(255, 255, 255, 0.1)',
                color: selectedVoice === voice.id ? '#000' : '#fff',
                border: `2px solid ${selectedVoice === voice.id ? '#ffb347' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '15px',
                padding: '0.75rem 0.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <span style={{ marginBottom: '0.25rem', fontSize: '1.2rem' }}>
                {voice.gender === 'male' ? '♂️' : '♀️'}
              </span>
              <span style={{ fontWeight: 'bold' }}>{voice.name}</span>
            </button>
          ))}
        </div>
        <p style={{ 
          textAlign: 'center', 
          fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)', 
          color: '#ccc',
          padding: '0 1rem'
        }}>
          Toca un agente para escuchar su voz y seleccionarlo
        </p>
      </section>

      {/* Conversation Module */}
      {(conversationPhase !== 'setup' || currentAgentMessage) && (
        <section className={styles.section} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionTitle}>Conversación con tu Asistente</h2>
          
          {/* Current Agent Message */}
          {currentAgentMessage && (
            <div style={{ 
              backgroundColor: 'rgba(255, 179, 71, 0.1)', 
              border: '1px solid #ffb347',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                <strong style={{ color: '#ffb347' }}>
                  {getArgentineVoices().find(v => v.id === selectedVoice)?.name}:
                </strong>{' '}
                <span style={{ color: '#fff' }}>{currentAgentMessage}</span>
              </div>
              
              {isAgentSpeaking && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#ffb347'
                }}>
                  <div className={styles.speakingIndicator}>🎵</div>
                  <span>Hablando...</span>
                </div>
              )}
              
              {awaitingUserResponse && !isAgentSpeaking && (
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#ccc',
                  fontStyle: 'italic'
                }}>
                  Esperando tu respuesta...
                </div>
              )}
            </div>
          )}
          
          {/* Conversation Status */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            {conversationPhase === 'info_gathering' && (
              <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
                Fase: Recopilando información personal ({infoGatheringStep === 'name' ? 'nombre' : 
                infoGatheringStep === 'age' ? 'edad' : 
                infoGatheringStep === 'location' ? 'ubicación' : 
                infoGatheringStep === 'returning_user_check' ? 'verificando cambios' : 'completado'})
              </p>
            )}
            {conversationPhase === 'storytelling' && (
              <p style={{ color: '#ccc', fontSize: '0.9rem' }}>
                Fase: Escuchando tu historia • Preguntas realizadas: {questionsAsked.length}
              </p>
            )}
          </div>
        </section>
      )}

      <main style={{ width: '100%' }}>
        <section className={styles.section} style={{ textAlign: 'center' }}>
          <h2 className={styles.sectionTitle}>
            {conversationPhase === 'info_gathering' ? 'Información Personal' :
             conversationPhase === 'storytelling' ? 'Grabar Historia' : 'Grabación Completada'}
          </h2>
          
          <p style={{ marginBottom: '1.5rem' }}>
            {conversationPhase === 'info_gathering' ? 
              (recording ? 'Grabando tu respuesta...' : (awaitingUserResponse ? 'Responde la pregunta de tu asistente.' : 'Esperando...')) :
             conversationPhase === 'storytelling' ? 
              (recording ? 'Grabando tu historia... Habla claramente al micrófono.' : 'Presiona para grabar tu historia o continuar narrando.') :
             'Historia completada. Revisa y envía por email.'}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={recording ? stopRecording : startRecording}
              className={`${styles.button} ${recording ? styles.recording : ''}`}
              disabled={conversationPhase === 'info_gathering' && !awaitingUserResponse}
            >
              {recording ? '⏹️ Detener Grabación' : 
               conversationPhase === 'info_gathering' ? '🎙️ Responder' :
               '🎙️ Grabar Historia'}
            </button>
            
            {conversationPhase === 'storytelling' && (
              <button 
                onClick={startNewStory}
                className={styles.button}
                style={{ backgroundColor: '#e74c3c', fontSize: '0.9rem' }}
              >
                📖 Nueva Historia
              </button>
            )}
          </div>
          
          {audioURL && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className={styles.sectionTitle}>Grabación Más Reciente</h3>
              <audio src={audioURL} controls style={{ width: '100%', marginBottom: '1rem' }} />
            </div>
          )}
        </section>
        
        {transcribedText && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Transcripción de la Historia</h2>
            
            {/* Memo-style header with story information */}
            <div style={{
              backgroundColor: 'rgba(255, 179, 71, 0.1)',
              border: '1px solid #ffb347',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              color: '#ccc'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Para:</strong> {storytellerName || 'Narrador'}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>De:</strong> Memorias AI
              </div>
              <div>
                <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}
              </div>
            </div>
            
            <p className={styles.transcription} style={{ whiteSpace: 'pre-line' }}>
              {transcribedText}
            </p>
            
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              {/* Email input field moved here, compact design */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem', 
                marginBottom: '1rem',
                flexWrap: 'wrap'
              }}>
                <label style={{ 
                  fontSize: '0.9rem', 
                  color: '#ccc',
                  minWidth: 'fit-content'
                }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={storytellerEmail}
                  onChange={(e) => setStorytellerEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    fontSize: '0.9rem',
                    maxWidth: '200px'
                  }}
                  required
                />
              </div>

              {!storyEmailSent ? (
                <button 
                  onClick={sendStoryByEmail}
                  disabled={isEmailSending}
                  className={styles.button}
                  style={{ 
                    backgroundColor: isEmailSending ? '#95a5a6' : '#27ae60',
                    cursor: isEmailSending ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isEmailSending ? '📧 Enviando...' : '📧 Enviame Mi Historia'}
                </button>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  flexWrap: 'wrap' 
                }}>
                  <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
                    ✅ Historia enviada exitosamente a {storytellerEmail}
                  </div>
                  <button 
                    onClick={sendStoryByEmail}
                    className={styles.button}
                    style={{ 
                      backgroundColor: '#27ae60',
                      fontSize: '0.8rem'
                    }}
                  >
                    📧 Enviar vía Email
                  </button>
                </div>
              )}
              
              {showDownloadOffer && (
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    onClick={downloadStoryAudio}
                    className={styles.button}
                    style={{ 
                      backgroundColor: '#e67e22',
                      marginRight: '0.5rem'
                    }}
                  >
                    🎵 Descargar Audio
                  </button>
                  <button 
                    onClick={() => setShowDownloadOffer(false)}
                    className={styles.button}
                    style={{ 
                      backgroundColor: '#95a5a6',
                      fontSize: '0.8rem'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              )}
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
