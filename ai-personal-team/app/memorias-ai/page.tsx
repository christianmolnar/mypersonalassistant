"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { transcribeAudio } from '../../agents/whisper_transcribe';
import { generateStoryFromTranscription } from '../../agents/story_writer';

export default function MemoriasAIPage() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Helper function to add debug information
  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo(prev => [...prev.slice(-10), debugMessage]); // Keep last 10 messages
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
    // Reset states
    setAudioChunks([]);
    setAudioURL(null);
    setTranscribedText(null);
    setGeneratedStory(null);
    
    try {
      addDebugInfo("Starting recording process...");
      
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
        const audioBlob = new Blob(localAudioChunks, { type: mimeType });
        addDebugInfo(`Creating audio blob with type: ${mimeType}, size: ${audioBlob.size} bytes`);
        console.log("AUDIO BLOB CREATED:", {
          size: audioBlob.size,
          type: audioBlob.type,
          mimeType: mimeType
        });
        
        // Create URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        try {
          console.log("STARTING TRANSCRIPTION PROCESS");
          await processTranscription(audioBlob);
        } catch (error) {
          console.error("TRANSCRIPTION PROCESS ERROR:", error);
          addDebugInfo(`Transcription process error: ${error}`);
          setTranscribedText("Error al transcribir. Por favor, intente nuevamente.");
        }
      };
      
      // Start recording with smaller time slices for more frequent data capture
      addDebugInfo("Starting MediaRecorder...");
      try {
        // Use a shorter time slice (200ms) to capture more chunks and ensure we get data
        recorder.start(200);
        addDebugInfo("MediaRecorder successfully started");
        
        setMediaRecorder(recorder);
        setRecording(true);
        
        // Force an additional data capture after a brief delay
        setTimeout(() => {
          if (recorder.state === 'recording') {
            addDebugInfo('Requesting additional data capture');
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
      
      // First try direct transcription using the whisper_transcribe function
      try {
        addDebugInfo("Attempting direct transcription with Whisper API...");
        console.log("DIRECT TRANSCRIPTION ATTEMPT - Starting");
        
        // Import the transcription function
        const { transcribeAudio } = await import('../../agents/whisper_transcribe');
        
        // Create a filename that indicates the format
        const fileName = `recording-${Date.now()}.mp3`;
        
        addDebugInfo(`Calling transcribeAudio with fileName: ${fileName}`);
        console.log("DIRECT TRANSCRIPTION - Calling transcribeAudio with:", {
          fileName,
          audioSize: audioBlob.size,
          audioType: audioBlob.type
        });
        
        // Call the transcription function directly
        const result = await transcribeAudio(audioBlob, {
          language: 'es',
          model: 'whisper-1',
          fileName: fileName
        });
        
        addDebugInfo(`Direct transcription successful: ${result.text.substring(0, 50)}...`);
        console.log("DIRECT TRANSCRIPTION SUCCESS:", result);
        setTranscribedText(result.text);
        
        // Generate a story based on the transcription
        generateRealStory(result.text);
        
        return; // Exit early since direct transcription worked
      } catch (directError) {
        addDebugInfo(`Direct transcription failed: ${directError}`);
        console.error("DIRECT TRANSCRIPTION FAILED:", directError);
        console.warn("Direct transcription failed, falling back to server API:", directError);
      }
      
      // Fallback to server API approach
      try {
        addDebugInfo("Falling back to server API approach...");
        console.log("SERVER API FALLBACK - Starting");
        
        // Create a File object for more reliable server handling
        const timestamp = Date.now();
        const audioFile = new File(
          [audioBlob], 
          `recording-${timestamp}.mp3`, 
          { type: 'audio/mp3', lastModified: timestamp }
        );
        
        console.log("SERVER API - Created audio file for server API:", {
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
        
        // After successful transcription, generate a story
        generateRealStory(transcription);
      } catch (serverError) {
        console.error("SERVER API - Server API transcription error:", serverError);
        addDebugInfo(`Server API error: ${serverError}`);
        throw serverError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("TRANSCRIPTION ERROR - Error transcribing audio:", error);
      addDebugInfo(`Transcription error: ${error}`);
      setTranscribedText("Error al transcribir el audio. Por favor, intente nuevamente.");
    }
  };

  const generateRealStory = async (text: string) => {
    try {
      setGeneratedStory("Generando historia...");
      
      // Use the actual story generation service
      const storyResult = await generateStoryFromTranscription(
        text,
        {
          narrator: "Memorias-AI User",
          recordedDate: new Date()
        },
        {
          formatStyle: 'literary',
          preserveDialect: true
        }
      );
      
      // Format the story content with markdown
      const formattedStory = `# ${storyResult.title}\n\n${storyResult.content}`;
      setGeneratedStory(formattedStory);
    } catch (error) {
      console.error("Error generating story:", error);
      // Fall back to simulation if there's an error
      simulateStoryGeneration(text);
    }
  };
  
  const simulateStoryGeneration = (text: string) => {
    // This would normally call an LLM API to structure the narrative
    // For this demo, we'll just simulate a delay and return formatted text
    
    setTimeout(() => {
      const formattedStory = `
# Tardes de Mate con mi Abuela

En mi infancia en Buenos Aires, existía un ritual sagrado que compartía con mi abuela: la hora del mate. Cada tarde, sin falta, ella me invitaba a sentarme junto a ella en el patio de nuestra casa.

El ritual comenzaba siempre igual. Mi abuela preparaba cuidadosamente el mate, ajustando la yerba y la temperatura del agua con la precisión de quien ha perfeccionado este arte durante décadas. Yo esperaba con anticipación, no solo por la bebida amarga que había aprendido a apreciar, sino por las historias que acompañaban cada sorbo.

Mientras compartíamos el mate, ella desenrollaba el hilo de sus memorias. Me contaba sobre su viaje desde Italia, siendo apenas una joven llena de sueños y temores. Me hablaba de los primeros días en Argentina, de las dificultades de adaptarse a un idioma diferente, a costumbres nuevas, a un país que poco a poco fue haciendo suyo.

Lo que más me fascinaba eran sus descripciones de la Buenos Aires de antaño, tan distinta y a la vez tan familiar a la que yo conocía. A través de sus palabras, yo viajaba en el tiempo, caminando junto a ella por calles adoquinadas que resonaban con tangos lejanos.

El patio donde compartíamos estos momentos estaba rodeado de jazmines, cuyo perfume intenso se mezclaba con el aroma herbáceo del mate. Este bouquet de aromas quedó grabado en mi memoria de tal manera que, incluso hoy, cuando percibo el aroma de un jazmín, inmediatamente me transporto a aquellas tardes con mi abuela.

Estos momentos, aparentemente simples pero profundamente significativos, forjaron en mí un sentido de identidad y pertenencia. A través de sus historias, mi abuela no solo me transmitió la historia de nuestra familia, sino también el valor de las raíces y la importancia de honrar nuestros orígenes mientras construimos nuestro propio camino.
      `;
      setGeneratedStory(formattedStory);
    }, 3000);
  };
  return (
    <div className={styles.container} style={{
      background: 'rgba(34, 40, 49, 0.98)',
      borderRadius: 20,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      maxWidth: '800px',
      margin: '2rem auto',
    }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          color: '#ffb347', 
          fontSize: '2.5rem',
          marginBottom: '0.5rem'
        }}>Memorias-AI</h1>
        <p style={{ color: '#ccc', marginBottom: '1rem' }}>
          Capturando historias en el acento español argentino
        </p>
      </header>

      <main style={{ width: '100%' }}>
        <section className={styles.section} style={{ textAlign: 'center' }}>
          <h2 className={styles.sectionTitle}>Grabar Historia</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            {recording 
              ? 'Grabando... Hable claramente al micrófono.' 
              : 'Presione el botón para comenzar a grabar su historia.'}
          </p>
          
          <button 
            onClick={recording ? stopRecording : startRecording}
            className={`${styles.button} ${recording ? styles.recording : ''}`}
          >
            {recording ? '⏹️ Detener Grabación' : '🎙️ Iniciar Grabación'}
          </button>
          
          {audioURL && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 className={styles.sectionTitle}>Grabación</h3>
              <audio src={audioURL} controls style={{ width: '100%', marginBottom: '1rem' }} />
            </div>
          )}
        </section>        {transcribedText && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Transcripción</h2>
            <p className={styles.transcription}>
              {transcribedText}
            </p>
          </section>
        )}

        {generatedStory && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Historia Generada</h2>
            <div 
              className={styles.storyContent}
              dangerouslySetInnerHTML={{ __html: generatedStory.replace(/\n/g, '<br>') }} 
            />
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

      {/* Debug Information */}
      {debugInfo.length > 0 && (
        <section className={styles.section} style={{ marginTop: '2rem' }}>
          <h3 className={styles.sectionTitle}>Debug Info</h3>
          <div style={{ 
            background: 'rgba(0,0,0,0.3)', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '0.8rem',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {debugInfo.map((info, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {info}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}