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
      }
      
      const recorder = new MediaRecorder(stream, options);
      
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
          setTranscribedText("Error: No se grabó audio. Por favor, intente nuevamente.");
          return;
        }
        
        console.log("Audio chunks captured:", localAudioChunks.length, 
          "First chunk size:", localAudioChunks[0]?.size || 0);
        
        // Create the audio blob with the actual type from the recorder
        // Use localAudioChunks instead of state variable
        const audioBlob = new Blob(localAudioChunks, { type: mimeType });
        console.log(`Creating audio blob with type: ${mimeType}, size: ${audioBlob.size} bytes`);
        
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
        throw new Error("No valid audio data to transcribe");
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
        setTranscribedText(result.text);
        
        // Generate a story based on the transcription
        simulateStoryGeneration(result.text);
        
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
        setTranscribedText(transcription);
        
        // After successful transcription, generate a story
        simulateStoryGeneration(transcription);
      } catch (serverError) {
        console.error("Server API transcription error:", serverError);
        throw serverError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
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
        </section>
        
        {transcribedText && (
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
    </div>
  );
}
