"use client";

import { useState, useEffect, useRef, useReducer } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { transcribeAudio } from '../../agents/whisper_transcribe';
import { getArgentineVoices } from '../../agents/tts';
import { MemoryManager } from '../../lib/AgentMemory';
import { formatStoryText } from '../../lib/utils';
import { 
  memoriasReducer, 
  initialState, 
  agentActions, 
  recordingActions, 
  uiActions,
  userProfileActions,
  type MemoriasAIState,
  type SupportedLanguage 
} from '../../lib/memoriasReducer';

// Internationalization system for 99-language strategy
interface LocalizedStrings {
  VOICE_SELECTION_TITLE: string;
  VOICE_SELECTION_INSTRUCTION: string;
  VOICE_PREVIEW_MESSAGE: string;
  VOICE_PLAYING: string;
  WELCOME_MESSAGE: string;
  INTERRUPT_AGENT_BUTTON: string;
  SPEAK_TO_AGENT_BUTTON: string;
  STOP_RECORDING_BUTTON: string;
  INFO_FORM_TITLE: string;
  NAME_LABEL: string;
  AGE_LABEL: string;
  LOCATION_LABEL: string;
  NAME_PLACEHOLDER: string;
  AGE_PLACEHOLDER: string;
  LOCATION_PLACEHOLDER: string;
  CONTINUE_BUTTON: string;
  EDIT_INFO_BUTTON: string;
}

const localizedStrings: Record<SupportedLanguage, LocalizedStrings> = {
  es: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  en: {
    VOICE_SELECTION_TITLE: "Choose your guide to begin...",
    VOICE_SELECTION_INSTRUCTION: "Choose your guide to begin...",
    VOICE_PREVIEW_MESSAGE: "Hello, I'm {voiceName}. {description}",
    VOICE_PLAYING: "Playing...",
    WELCOME_MESSAGE: "Hello! I'm {voiceName}, your personal assistant for creating memories. To help you better, I'd like to get to know you. Could you tell me your name?",
    INTERRUPT_AGENT_BUTTON: "Interrupt Agent",
    SPEAK_TO_AGENT_BUTTON: "Speak to Agent",
    STOP_RECORDING_BUTTON: "⏹️ Stop Recording",
    INFO_FORM_TITLE: "Your Personal Information",
    NAME_LABEL: "Name",
    AGE_LABEL: "Age during events",
    LOCATION_LABEL: "Story location",
    NAME_PLACEHOLDER: "Tell me your name...",
    AGE_PLACEHOLDER: "How old were you when these events happened?",
    LOCATION_PLACEHOLDER: "Where did this story take place?",
    CONTINUE_BUTTON: "Continue with the story",
    EDIT_INFO_BUTTON: "Edit information"
  },
  // For now, use Spanish as fallback for other languages  
  pt: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  fr: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  de: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  it: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  zh: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  ja: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  ko: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  ar: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  hi: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  },
  ru: {
    VOICE_SELECTION_TITLE: "Selecciona tu guía para comenzar...",
    VOICE_SELECTION_INSTRUCTION: "Selecciona tu guía para comenzar...",
    VOICE_PREVIEW_MESSAGE: "Hola, soy {voiceName}. {description}",
    VOICE_PLAYING: "Reproduciendo...",
    WELCOME_MESSAGE: "¡Hola! Soy {voiceName}, tu asistente personal para crear memorias. Para poder ayudarte, me gustaría conocerte mejor. ¿Podrías decirme tu nombre?",
    INTERRUPT_AGENT_BUTTON: "Interrumpir Agente",
    SPEAK_TO_AGENT_BUTTON: "Hablar con el agente",
    STOP_RECORDING_BUTTON: "⏹️ Detener Grabación",
    INFO_FORM_TITLE: "Tu Información Personal",
    NAME_LABEL: "Nombre",
    AGE_LABEL: "Edad en los eventos",
    LOCATION_LABEL: "Lugar de la historia",
    NAME_PLACEHOLDER: "Dime tu nombre...",
    AGE_PLACEHOLDER: "¿Qué edad tenías cuando ocurrieron estos eventos?",
    LOCATION_PLACEHOLDER: "¿Dónde ocurrió esta historia?",
    CONTINUE_BUTTON: "Continuar con la historia",
    EDIT_INFO_BUTTON: "Editar información"
  }
};

// Helper function to get localized text with variable interpolation
const getLocalizedText = (
  key: keyof LocalizedStrings, 
  language: SupportedLanguage, 
  variables?: Record<string, string>
): string => {
  let text = localizedStrings[language]?.[key] || localizedStrings['es'][key]; // Fallback to Spanish
  
  if (variables) {
    Object.entries(variables).forEach(([varKey, value]) => {
      text = text.replace(`{${varKey}}`, value);
    });
  }
  
  return text;
};

export default function MemoriasAIPage() {
  // 🚀 STEP 1: REDUCER FOUNDATION
  // Replace useState with useReducer for better state management
  const [state, dispatch] = useReducer(memoriasReducer, initialState);

  // Audio reference for proper interruption control
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // ⚠️ TEMPORARY: Legacy useState hooks (will be migrated progressively)
  // These will be moved to reducer in subsequent steps
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [questionsAsked, setQuestionsAsked] = useState<string[]>([]);
  const silenceTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastTranscriptionTime, setLastTranscriptionTime] = useState<number>(0);
  const [storySegments, setStorySegments] = useState<string[]>([]);
  const [storytellerName, setStorytellerName] = useState('');
  const [storytellerEmail, setStorytellerEmail] = useState('');
  const [ageAtEvents, setAgeAtEvents] = useState('');
  const [eventLocation, setEventLocation] = useState('');
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
      } catch (error) {
        console.error('Error initializing agent:', error);
      }
    };
    
    initializeAgent();
  }, []);

  // 🎯 CORE FLOW: Welcome message when voice is selected
  useEffect(() => {
    const triggerWelcomeMessage = async () => {
      // Only trigger when voice is selected and not already started
      if (state.agent.selectedVoice && !state.agent.hasAutoStarted && state.agent.agentSpeechState === 'idle') {
        console.log('🎤 Voice selected, triggering welcome message...');
        
        // Mark as auto-started to prevent re-triggering
        dispatch(agentActions.setHasAutoStarted(true));
        
        // Start the info gathering process
        await startInfoGathering();
      }
    };
    
    triggerWelcomeMessage();
  }, [state.agent.selectedVoice, state.agent.hasAutoStarted, state.agent.agentSpeechState]);

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
    const combinedBlob = new Blob(storyAudioSegments, { type: state.recording.audioMimeType });
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

  // Enhanced button state management with internationalization
  const getRecordingButtonState = () => {
    if (state.recording.recording) {
      return {
        text: getLocalizedText('STOP_RECORDING_BUTTON', state.ui.currentLanguage),
        disabled: false,
        variant: 'stop'
      };
    }
    
    // If agent is speaking and user can interrupt
    if (state.agent.agentSpeechState === 'speaking' && state.agent.userCanInterrupt) {
      return {
        text: getLocalizedText('INTERRUPT_AGENT_BUTTON', state.ui.currentLanguage),
        disabled: false,
        variant: 'interrupt',
        highlight: true
      };
    }
    
    // If agent is preparing speech and user can interrupt
    if (state.agent.agentSpeechState === 'preparing' && state.agent.userCanInterrupt) {
      return {
        text: getLocalizedText('INTERRUPT_AGENT_BUTTON', state.ui.currentLanguage),
        disabled: false,
        variant: 'interrupt'
      };
    }
    
    // If agent was interrupted or completed speaking, or awaiting user response
    if (state.agent.agentSpeechState === 'awaiting_user_response' || 
        state.agent.agentSpeechState === 'interrupted' ||
        state.agent.agentSpeechState === 'completed' ||
        state.agent.awaitingUserResponse) {
      return {
        text: getLocalizedText('SPEAK_TO_AGENT_BUTTON', state.ui.currentLanguage),
        disabled: false,
        variant: 'response'
      };
    }
    
    // Default conversation flow
    if (state.agent.conversationPhase === 'info_gathering') {
      return {
        text: '🎙️ ' + getLocalizedText('SPEAK_TO_AGENT_BUTTON', state.ui.currentLanguage),
        disabled: false,
        variant: 'normal'
      };
    }
    
    // Storytelling phase
    if (state.agent.conversationPhase === 'storytelling') {
      return {
        text: '🎙️ Grabar Historia',
        disabled: false,
        variant: 'normal'
      };
    }

    // Default fallback
    return {
      text: '🎙️ ' + getLocalizedText('SPEAK_TO_AGENT_BUTTON', state.ui.currentLanguage),
      disabled: false,
      variant: 'normal'
    };
  };

  const startRecording = async () => {
    // For storytelling phase, ensure we have all required info
    if (state.agent.conversationPhase === 'storytelling') {
      if (!state.userProfile.storytellerName.trim() || !state.userProfile.ageAtEvents.trim() || !state.userProfile.eventLocation.trim()) {
        alert('Faltan datos del narrador. Por favor complete la información primero.');
        return;
      }
    }
    
    // Reset states
    dispatch(recordingActions.clearAudioChunks());
    dispatch(recordingActions.setAudioURL(null));
    if (state.agent.conversationPhase === 'storytelling') {
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
      dispatch(recordingActions.setAudioMimeType(recorder.mimeType || selectedMimeType));
      
      // Set up event handlers to collect audio data
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Received audio chunk: ${event.data.size} bytes`);
          localAudioChunks.push(event.data);
          // Also update React state for UI updates
          dispatch(recordingActions.addAudioChunk(event.data));
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
        if (state.agent.conversationPhase === 'storytelling') {
          setStoryAudioSegments(prev => [...prev, audioBlob]);
          console.log('Saved story audio segment');
        }
        
        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        dispatch(recordingActions.setAudioURL(url));
        
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
        
        dispatch(recordingActions.setMediaRecorder(recorder));
        dispatch(recordingActions.startRecording());
        
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
    if (state.recording.mediaRecorder) {
      console.log(`Stopping recording. Current state: ${state.recording.mediaRecorder.state}`);
      
      try {
        // Request a final data chunk before stopping
        if (state.recording.mediaRecorder.state === 'recording') {
          console.log('Requesting final data chunk before stopping');
          state.recording.mediaRecorder.requestData();
          
          // Small delay to ensure the data is processed
          setTimeout(() => {
            state.recording.mediaRecorder?.stop();
            console.log('MediaRecorder stopped');
            
            // Stop all audio tracks
            state.recording.mediaRecorder?.stream.getTracks().forEach(track => {
              track.stop();
              console.log('Audio track stopped');
            });
            
            dispatch(recordingActions.stopRecording());
          }, 200);
        } else {
          console.log('MediaRecorder not in recording state, cannot stop');
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        dispatch(recordingActions.stopRecording());
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
      
      // Try server API first since environment variables work better there
      try {
        console.log("Attempting server-side transcription...");
        
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
        
        console.log("Sending audio to server-side API endpoint");
        
        const response = await fetch('/api/transcribe-audio', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error("Server returned error:", errorData);
          throw new Error(`Server error: ${errorData.error || 'Unknown error'}`);
        }
        
        const transcriptionResult = await response.json();
        const transcription = transcriptionResult.text;
        
        console.log("Received server transcription:", transcription);
        const formattedTranscription = formatStoryText(transcription);
        setTranscribedText(formattedTranscription);
        
        // Handle conversation flow based on current phase
        if (state.agent.conversationPhase === 'info_gathering') {
          await processInfoGatheringResponse(transcription);
        } else if (state.agent.conversationPhase === 'storytelling') {
          await analyzeStoryAndRespond(transcription);
        }
        
        return; // Exit early since server transcription worked
      } catch (serverError) {
        console.warn("Server API transcription failed, trying direct approach:", serverError);
      }
      
      // Fallback to direct transcription using the whisper_transcribe function
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
        
        // Handle conversation flow based on current phase
        if (state.agent.conversationPhase === 'info_gathering') {
          await processInfoGatheringResponse(result.text);
        } else if (state.agent.conversationPhase === 'storytelling') {
          await analyzeStoryAndRespond(result.text);
        }
        
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
        if (state.agent.conversationPhase === 'info_gathering') {
          await processInfoGatheringResponse(transcription);
        } else if (state.agent.conversationPhase === 'storytelling') {
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
  
  // Enhanced voice preview with double-click prevention
  const previewVoice = async (voice: any) => {
    // Prevent multiple voice previews from playing simultaneously
    if (state.agent.voicePreviewInProgress) {
      console.log('Voice preview already in progress, ignoring click');
      return;
    }

    // If voice is already selected, play preview (user wants to hear it again)
    if (state.agent.selectedVoice === voice.id) {
      dispatch(agentActions.startVoicePreview());
      
      try {
        const previewText = getLocalizedText('VOICE_PREVIEW_MESSAGE', state.ui.currentLanguage, {
          voiceName: voice.name,
          description: voice.description
        });
        
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
        
        // Set up completion handlers
        audio.onended = () => {
          dispatch(agentActions.completeVoicePreview());
          URL.revokeObjectURL(audioUrl); // Clean up memory
        };
        
        audio.onerror = () => {
          dispatch(agentActions.completeVoicePreview());
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.play();
        
      } catch (error) {
        console.error('Error previewing voice:', error);
        dispatch(agentActions.completeVoicePreview());
      }
      return; // Exit early, don't change voice selection
    }
    
    // First time selecting this voice - just select it without preview
    dispatch(agentActions.selectVoice(voice.id));
    
    // If this interrupts any agent speech, stop it
    if (state.agent.agentSpeechState === 'speaking' || state.agent.agentSpeechState === 'preparing') {
      dispatch(agentActions.interruptAgentSpeech());
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    }
  };

  // Agent conversation functions
  const speakAgentMessage = async (message: string) => {
    // Dispatch agent speech preparation
    dispatch(agentActions.prepareAgentSpeech(message));
    
    try {
      // Call the API route instead of client-side function
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          voice: state.agent.selectedVoice,
          speed: 0.9
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS API failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Store reference for interruption
      currentAudioRef.current = audio;
      
      // Set state to speaking when audio starts playing
      audio.onloadeddata = () => {
        dispatch(agentActions.startAgentSpeaking());
      };
      
      audio.onended = () => {
        dispatch(agentActions.completeAgentSpeech());
        dispatch(agentActions.awaitUserResponse());
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        dispatch(agentActions.stopAgentSpeaking());
        dispatch(agentActions.awaitUserResponse());
        currentAudioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
    } catch (error) {
      console.error('Error generating agent speech:', error);
      dispatch(agentActions.stopAgentSpeaking());
      dispatch(agentActions.awaitUserResponse());
      currentAudioRef.current = null;
    }
  };

  const startInfoGathering = async () => {
    dispatch(agentActions.setConversationPhase('info_gathering'));
    dispatch(agentActions.setInfoGatheringStep('name'));
    
    const welcomeMessage = "¡Hola! Soy tu asistente de Memorias AI. Te voy a ayudar a grabar tu historia. Primero necesito conocerte mejor. ¿Podrías decirme tu nombre?";
    await speakAgentMessage(welcomeMessage);
  };

  // Function to extract age number from Spanish text
  const extractAgeFromText = (text: string): string => {
    const lowerText = text.toLowerCase().trim();
    
    // First try to find actual numbers
    const numberMatch = lowerText.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }
    
    // Spanish number words to digits mapping
    const spanishNumbers: { [key: string]: string } = {
      'cero': '0', 'uno': '1', 'una': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
      'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
      'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
      'dieciséis': '16', 'diecisiete': '17', 'dieciocho': '18', 'diecinueve': '19', 'veinte': '20',
      'veintiuno': '21', 'veintidós': '22', 'veintitrés': '23', 'veinticuatro': '24', 'veinticinco': '25',
      'veintiséis': '26', 'veintisiete': '27', 'veintiocho': '28', 'veintinueve': '29', 'treinta': '30',
      'treinta y uno': '31', 'treinta y dos': '32', 'treinta y tres': '33', 'treinta y cuatro': '34', 'treinta y cinco': '35',
      'cuarenta': '40', 'cincuenta': '50', 'sesenta': '60', 'setenta': '70', 'ochenta': '80', 'noventa': '90'
    };
    
    // Check for direct matches
    for (const [word, number] of Object.entries(spanishNumbers)) {
      if (lowerText.includes(word)) {
        return number;
      }
    }
    
    // Check for compound numbers like "treinta y cinco"
    const compoundMatch = lowerText.match(/(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s*y\s*(uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)/);
    if (compoundMatch) {
      const tens = spanishNumbers[compoundMatch[1]];
      const units = spanishNumbers[compoundMatch[2]];
      if (tens && units) {
        return (parseInt(tens) + parseInt(units)).toString();
      }
    }
    
    // If no number found, return the original text
    return text.trim();
  };

  const processInfoGatheringResponse = async (transcription: string) => {
    const lowerTranscription = transcription.toLowerCase().trim();
    
    switch (state.agent.infoGatheringStep) {
      case 'returning_user_check':
        // Handle returning user response about what they want to change
        if (lowerTranscription.includes('edad') || lowerTranscription.includes('cambiar edad')) {
          dispatch(agentActions.setInfoGatheringStep('age'));
          const ageMessage = `Perfecto. ¿Qué edad tenías cuando ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(ageMessage);
        } else if (lowerTranscription.includes('lugar') || lowerTranscription.includes('cambiar lugar')) {
          dispatch(agentActions.setInfoGatheringStep('location'));
          const locationMessage = `Perfecto. ¿En qué lugar ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(locationMessage);
        } else if (lowerTranscription.includes('ambos') || lowerTranscription.includes('los dos') || (lowerTranscription.includes('edad') && lowerTranscription.includes('lugar'))) {
          dispatch(agentActions.setInfoGatheringStep('age'));
          const bothMessage = `Perfecto. Primero, ¿qué edad tenías cuando ocurrieron los eventos de esta nueva historia?`;
          await speakAgentMessage(bothMessage);
        } else {
          // User wants to keep the same data
          dispatch(agentActions.setInfoGatheringStep('completed'));
          dispatch(agentActions.setConversationPhase('storytelling'));
          const readyMessage = `Perfecto, ${state.userProfile.storytellerName}. Mantenemos tu edad de ${state.userProfile.ageAtEvents} años y el lugar ${state.userProfile.eventLocation}. Ahora estoy listo para escuchar tu nueva historia. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme.`;
          await speakAgentMessage(readyMessage);
          dispatch(agentActions.receiveUserResponse());
        }
        break;
        
      case 'name':
        // Extract name from transcription (simple approach)
        dispatch(userProfileActions.setStorytellerName(transcription.trim()));
        dispatch(agentActions.setInfoGatheringStep('age'));
        
        const ageMessage = `Perfecto, ${transcription.trim()}. Ahora, ¿qué edad tenías cuando ocurrieron los eventos de esta historia que me vas a contar?`;
        await speakAgentMessage(ageMessage);
        break;
        
      case 'age':
        // Extract numeric age from transcription
        const extractedAge = extractAgeFromText(transcription);
        dispatch(userProfileActions.setAgeAtEvents(extractedAge));
        
        // If this is a returning user who only wanted to change age, go to storytelling
        if (state.userProfile.isReturningUser) {
          dispatch(agentActions.setInfoGatheringStep('completed'));
          dispatch(agentActions.setConversationPhase('storytelling'));
          const readyMessage = `Perfecto, ${state.userProfile.storytellerName}. Ahora con tu nueva edad de ${extractedAge} años y el lugar ${state.userProfile.eventLocation}. Estoy listo para escuchar tu nueva historia. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme.`;
          await speakAgentMessage(readyMessage);
          dispatch(agentActions.receiveUserResponse());
        } else {
          dispatch(agentActions.setInfoGatheringStep('location'));
          const locationMessage = `Muy bien. ¿En qué lugar ocurrieron estos eventos que me vas a narrar?`;
          await speakAgentMessage(locationMessage);
        }
        break;
        
      case 'location':
        dispatch(userProfileActions.setEventLocation(transcription.trim()));
        dispatch(agentActions.setInfoGatheringStep('completed'));
        dispatch(agentActions.setConversationPhase('storytelling'));
        
        const readyMessage = `Perfecto, ${state.userProfile.storytellerName}. Ya tengo toda la información. Ahora estoy listo para escuchar tu historia sobre cuando tenías ${state.userProfile.ageAtEvents} años en ${transcription.trim()}. Cuando estés listo, presiona 'Grabar Historia' y comienza a contarme tu historia.`;
        await speakAgentMessage(readyMessage);
        dispatch(agentActions.receiveUserResponse());
        break;
    }
  };

  const analyzeStoryAndRespond = async (storyText: string) => {
    if (state.agent.conversationPhase !== 'storytelling') return;
    
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
    if (state.agent.agentSpeechState === 'speaking' || state.agent.awaitingUserResponse) return;
    
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
          questionsAsked: state.agent.questionsAsked,
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
    
    if (!state.userProfile.storytellerName) {
      alert('Falta el nombre del narrador. Por favor complete la información primero.');
      return;
    }
    
    if (!storytellerEmail) {
      alert('Por favor, ingrese su dirección de email.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(state.userProfile.storytellerEmail)) {
      alert('Por favor, ingrese una dirección de email válida.');
      return;
    }
    
    dispatch(uiActions.setIsEmailSending(true));
    
    try {
      const emailContent = `Hola ${state.userProfile.storytellerName},

Aquí está tu historia transcrita de Memorias AI:

---

${formatStoryText(transcribedText)}

---

Contexto de la historia:
- Narrador: ${state.userProfile.storytellerName}
- Email: ${storytellerEmail}
- Edad durante los eventos: ${state.userProfile.ageAtEvents}
- Lugar donde ocurrieron: ${state.userProfile.eventLocation}
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
          alert(`¡Historia enviada exitosamente a ${state.userProfile.storytellerEmail}!`);
        }
      } else {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error al enviar el email. Por favor, intente nuevamente.');
    } finally {
      dispatch(uiActions.setIsEmailSending(false));
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
    link.download = `mi-historia-${new Date().toISOString().split('T')[0]}.${getFileExtension(state.recording.audioMimeType)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    dispatch(uiActions.setShowDownloadOffer(false));
    alert('¡Audio descargado exitosamente!');
  };

  const generateAgentQuestion = async () => {
    if (!transcribedText) return;
    
    dispatch(agentActions.setIsGeneratingQuestion(true));
    
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
          questionsAsked: state.agent.questionsAsked
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          dispatch(agentActions.setAgentQuestion(data.message));
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
                voice: state.agent.selectedVoice,
                speed: 0.9
              }),
            });

            if (ttsResponse.ok) {
              const audioBlob = await ttsResponse.blob();
              const audioUrl = URL.createObjectURL(audioBlob);
              dispatch(agentActions.setAgentAudio(audioUrl));
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
      dispatch(agentActions.setIsGeneratingQuestion(false));
    }
  };

  // Function to reset conversation for a new story
  const startNewStory = async () => {
    // Reset conversation states
    dispatch(agentActions.setConversationPhase('info_gathering'));
    dispatch(agentActions.clearAgentMessage());
    dispatch(agentActions.receiveUserResponse());
    dispatch(agentActions.setInfoGatheringStep('returning_user_check'));
    dispatch(userProfileActions.setIsReturningUser(true));
    
    // Reset story data
    setTranscribedText(null);
    setStorySegments([]);
    setStoryAudioSegments([]);
    setQuestionsAsked([]);
    dispatch(agentActions.setAgentQuestion(null));
    
    // Reset recording states
    dispatch(recordingActions.stopRecording());
    dispatch(recordingActions.setAudioURL(null));
    dispatch(recordingActions.clearAudioChunks());
    
    // Reset email states but keep email and user info (we'll ask what to change)
    dispatch(uiActions.setStoryEmailSent(false));
    dispatch(uiActions.setShowDownloadOffer(false));
    dispatch(uiActions.setIsEmailSending(false));
    
    // Clear any existing timers
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    console.log('Conversation reset for new story');
    
    // Start the returning user flow
    const returningMessage = `Estoy listo para grabar otra historia, así que mantengo tu nombre ${state.userProfile.storytellerName}. En la historia que me vas a contar, ¿quieres cambiar tu edad o el lugar, o mantener los mismos datos?`;
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

      {/* Voice Selection - Core Entry Point */}
      <section className={styles.section} style={{ marginBottom: '1.5rem' }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>
          {getLocalizedText('VOICE_SELECTION_TITLE', state.ui.currentLanguage)}
        </h2>
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
              className={`${styles.voiceButtonSmall} ${state.agent.selectedVoice === voice.id ? styles.voiceSelected : ''}`}
              disabled={state.agent.voicePreviewInProgress && state.agent.selectedVoice !== voice.id}
              style={{
                backgroundColor: state.agent.selectedVoice === voice.id ? '#ffb347' : 'rgba(255, 255, 255, 0.1)',
                color: state.agent.selectedVoice === voice.id ? '#000' : '#fff',
                border: `2px solid ${state.agent.selectedVoice === voice.id ? '#ffb347' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '15px',
                padding: '0.75rem 0.5rem',
                cursor: state.agent.voicePreviewInProgress && state.agent.selectedVoice !== voice.id ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 'clamp(0.8rem, 3vw, 0.9rem)',
                minHeight: '60px',
                display: 'flex',
                opacity: state.agent.voicePreviewInProgress && state.agent.selectedVoice !== voice.id ? 0.5 : 1,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center'
              }}
            >
              <span style={{ marginBottom: '0.25rem', fontSize: '1.2rem' }}>
                {voice.gender === 'male' ? '♂️' : '♀️'}
              </span>
              <span style={{ fontWeight: 'bold' }}>
                {state.agent.voicePreviewInProgress && state.agent.selectedVoice === voice.id 
                  ? getLocalizedText('VOICE_PLAYING', state.ui.currentLanguage)
                  : voice.name
                }
              </span>
            </button>
          ))}
        </div>
        <p style={{ 
          textAlign: 'center', 
          fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)', 
          color: '#ccc',
          padding: '0 1rem'
        }}>
          {getLocalizedText('VOICE_SELECTION_INSTRUCTION', state.ui.currentLanguage)}
        </p>
      </section>

      {/* Show full interface only after voice selection */}
      {state.agent.selectedVoice && (
        <>
          {/* Conversation Module */}
      {(state.agent.conversationPhase !== 'setup' || state.agent.currentAgentMessage) && (
        <section className={styles.section} style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionTitle}>Conversación con tu Asistente</h2>
          
          {/* Current Agent Message */}
          {state.agent.currentAgentMessage && (
            <div style={{ 
              backgroundColor: 'rgba(255, 179, 71, 0.1)', 
              border: '1px solid #ffb347',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                <strong style={{ color: '#ffb347' }}>
                  {getArgentineVoices().find(v => v.id === state.agent.selectedVoice)?.name}:
                </strong>{' '}
                <span style={{ color: '#fff' }}>{state.agent.currentAgentMessage}</span>
              </div>
              
              {state.agent.agentSpeechState === 'speaking' && (
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
              
              {state.agent.awaitingUserResponse && state.agent.agentSpeechState !== 'speaking' && (
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
          
          {/* Recording Button - moved here */}
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={() => {
                // 🎯 CORE INTERRUPTION LOGIC: Handle agent speech interruption
                if (state.agent.agentSpeechState === 'speaking' || state.agent.agentSpeechState === 'preparing') {
                  console.log('🛑 Interrupting agent speech...');
                  dispatch(agentActions.interruptAgentSpeech());
                  
                  // Stop the actual audio playback
                  if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                  }
                  return; // Exit early, don't start recording
                }
                
                // Recording logic - call the actual functions
                if (state.recording.recording) {
                  console.log('🛑 Stopping recording...');
                  stopRecording();
                } else {
                  console.log('🎤 Starting recording...');
                  startRecording();
                }
              }}
              className={`${styles.button} ${state.recording.recording ? styles.recording : ''}`}
              disabled={getRecordingButtonState().disabled}
              style={{
                backgroundColor: getRecordingButtonState().highlight ? '#e74c3c' : undefined,
                animation: getRecordingButtonState().highlight ? 'pulse 1.5s infinite' : undefined,
                fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                padding: '0.75rem 1.5rem'
              }}
            >
              {getRecordingButtonState().text}
            </button>
          </div>
        </section>
      )}

      {/* User Information Form - Clean 3-line design */}
      {state.agent.selectedVoice && (
        <section style={{ 
          marginBottom: '2rem',
          maxWidth: '600px', 
          margin: '0 auto'
        }}>
          <div style={{ 
            padding: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            
            {/* Clean 3-line format matching the design */}
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              
              {/* Name Line */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: '#ffb347', 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  minWidth: '80px'
                }}>
                  {getLocalizedText('NAME_LABEL', state.ui.currentLanguage)}:
                </span>
                <div style={{ 
                  flex: 1,
                  borderBottom: state.userProfile.storytellerName ? '1px solid #ffb347' : '1px dotted rgba(255, 255, 255, 0.3)',
                  paddingBottom: '4px',
                  color: state.userProfile.storytellerName ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  minHeight: '20px',
                  fontStyle: state.userProfile.storytellerName ? 'normal' : 'italic'
                }}>
                  {state.userProfile.storytellerName || getLocalizedText('NAME_PLACEHOLDER', state.ui.currentLanguage)}
                </div>
              </div>

              {/* Age Line */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: '#ffb347', 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  minWidth: '80px'
                }}>
                  {getLocalizedText('AGE_LABEL', state.ui.currentLanguage)}:
                </span>
                <div style={{ 
                  flex: 1,
                  borderBottom: state.userProfile.ageAtEvents ? '1px solid #ffb347' : '1px dotted rgba(255, 255, 255, 0.3)',
                  paddingBottom: '4px',
                  color: state.userProfile.ageAtEvents ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  minHeight: '20px',
                  fontStyle: state.userProfile.ageAtEvents ? 'normal' : 'italic'
                }}>
                  {state.userProfile.ageAtEvents || getLocalizedText('AGE_PLACEHOLDER', state.ui.currentLanguage)}
                </div>
              </div>

              {/* Location Line */}
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: '#ffb347', 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  minWidth: '80px'
                }}>
                  {getLocalizedText('LOCATION_LABEL', state.ui.currentLanguage)}:
                </span>
                <div style={{ 
                  flex: 1,
                  borderBottom: state.userProfile.eventLocation ? '1px solid #ffb347' : '1px dotted rgba(255, 255, 255, 0.3)',
                  paddingBottom: '4px',
                  color: state.userProfile.eventLocation ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.9rem',
                  minHeight: '20px',
                  fontStyle: state.userProfile.eventLocation ? 'normal' : 'italic'
                }}>
                  {state.userProfile.eventLocation || getLocalizedText('LOCATION_PLACEHOLDER', state.ui.currentLanguage)}
                </div>
              </div>
            </div>

            {/* Hidden input fields for data capture */}
            <div style={{ display: 'none' }}>
              <input
                type="text"
                value={state.userProfile.storytellerName}
                onChange={(e) => dispatch(userProfileActions.setStorytellerName(e.target.value))}
              />
              <input
                type="text"
                value={state.userProfile.ageAtEvents}
                onChange={(e) => dispatch(userProfileActions.setAgeAtEvents(e.target.value))}
              />
              <input
                type="text"
                value={state.userProfile.eventLocation}
                onChange={(e) => dispatch(userProfileActions.setEventLocation(e.target.value))}
              />
            </div>

            {/* Action button to proceed to storytelling */}
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1.5rem'
            }}>
              <button
                onClick={() => {
                  // Mark as returning user if they have data
                  if (state.userProfile.storytellerName || state.userProfile.ageAtEvents || state.userProfile.eventLocation) {
                    dispatch(userProfileActions.setIsReturningUser(true));
                  }
                  // Move to storytelling phase
                  dispatch(agentActions.setConversationPhase('storytelling'));
                  
                  // Agent confirms the information and asks to begin story
                  const confirmationMessage = `Perfecto, ${state.userProfile.storytellerName || 'mi querido amigo'}. Tienes ${state.userProfile.ageAtEvents || '[edad]'} años en esta historia que ocurrió en ${state.userProfile.eventLocation || '[lugar]'}. Ahora cuéntame, ¿cómo comenzó todo?`;
                  speakAgentMessage(confirmationMessage);
                }}
                disabled={!state.userProfile.storytellerName && !state.userProfile.ageAtEvents && !state.userProfile.eventLocation}
                style={{
                  backgroundColor: (!state.userProfile.storytellerName && !state.userProfile.ageAtEvents && !state.userProfile.eventLocation) ? '#666' : '#ffb347',
                  color: (!state.userProfile.storytellerName && !state.userProfile.ageAtEvents && !state.userProfile.eventLocation) ? '#ccc' : '#000',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: (!state.userProfile.storytellerName && !state.userProfile.ageAtEvents && !state.userProfile.eventLocation) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: (!state.userProfile.storytellerName && !state.userProfile.ageAtEvents && !state.userProfile.eventLocation) ? 0.5 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {getLocalizedText('CONTINUE_BUTTON', state.ui.currentLanguage)}
              </button>
            </div>
          </div>
        </section>
      )}

      <main style={{ width: '100%' }}>
        {/* Only show recording area during storytelling phase */}
        {state.agent.conversationPhase === 'storytelling' && (
          <section className={styles.section} style={{ textAlign: 'center' }}>
            <h2 className={styles.sectionTitle}>Grabar Historia</h2>
            
            <p style={{ marginBottom: '1.5rem' }}>
              {state.recording.recording ? 'Grabando tu historia... Habla claramente al micrófono.' : 'Presiona para grabar tu historia o continuar narrando.'}
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem' }}>
              <button 
                onClick={() => {
                  // Recording logic - call the actual functions
                  if (state.recording.recording) {
                    console.log('🛑 Stopping recording...');
                    stopRecording();
                  } else {
                    console.log('🎤 Starting recording...');
                    startRecording();
                  }
                }}
                className={`${styles.button} ${state.recording.recording ? styles.recording : ''}`}
                style={{
                  fontSize: 'clamp(0.9rem, 3vw, 1rem)',
                  padding: '0.75rem 1.5rem'
                }}
              >
                {state.recording.recording ? '🛑 Detener Grabación' : '🎙️ Grabar Historia'}
              </button>
              
              <button 
                onClick={startNewStory}
                className={styles.button}
                style={{ backgroundColor: '#e74c3c', fontSize: '0.9rem' }}
              >
                🔄 Nueva Historia
              </button>
            </div>
            
            {state.recording.audioURL && (
              <div style={{ marginTop: '1.5rem' }}>
                <h3 className={styles.sectionTitle}>Grabación Más Reciente</h3>
                <audio src={state.recording.audioURL} controls style={{ width: '100%', marginBottom: '1rem' }} />
              </div>
            )}
          </section>
        )}
        
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
                  disabled={state.ui.isEmailSending}
                  className={styles.button}
                  style={{ 
                    backgroundColor: state.ui.isEmailSending ? '#95a5a6' : '#27ae60',
                    cursor: state.ui.isEmailSending ? 'not-allowed' : 'pointer'
                  }}
                >
                  {state.ui.isEmailSending ? '📧 Enviando...' : '📧 Enviame Mi Historia'}
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
                    �                                         🎵 Descargar Audio
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
      </>
      )}
    </div>
  );
}
