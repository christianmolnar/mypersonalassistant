"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

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
      const recorder = new MediaRecorder(stream);
      
      // Set up event handlers
      recorder.ondataavailable = (event) => {
        setAudioChunks((currentChunks) => [...currentChunks, event.data]);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        simulateTranscription(audioBlob);
      };
      
      // Start recording
      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono. Por favor, asegúrese de que está conectado y que ha dado permiso para usarlo.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const simulateTranscription = (audioBlob: Blob) => {
    // This is a placeholder for the actual API call to a transcription service
    // In a real implementation, you would upload the audio to a server or call
    // a transcription API like Whisper
    
    console.log("Audio blob size:", audioBlob.size, "bytes");
    
    // Simulate API call delay
    setTimeout(() => {
      // Example transcribed text - in a real app, this would come from the API
      const simulatedTranscription = "Cuando era chico en Buenos Aires, mi abuela solicitaba que tomara mate con ella cada tarde. Sentados en el patio, me contaba historias de su juventud, de cómo viajó desde Italia a Argentina, de los primeros días difíciles y de cómo encontró su lugar en este nuevo país. El aroma de los jazmines se mezclaba con el del mate, creando un recuerdo que nunca olvidaré.";
      setTranscribedText(simulatedTranscription);
      
      // After transcription, simulate story generation
      simulateStoryGeneration(simulatedTranscription);
    }, 2000);
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
    </div>
  );
}
