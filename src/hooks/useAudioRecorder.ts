
import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioRecording } from '@/types/messaging';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  
  // Nettoyer quand le composant est démonté
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioRecording) {
        URL.revokeObjectURL(audioRecording.url);
      }
    };
  }, [audioRecording]);
  
  // Démarrer l'enregistrement
  const startRecording = useCallback(async () => {
    try {
      // Réinitialiser l'état
      setAudioRecording(null);
      audioChunksRef.current = [];
      
      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Créer un nouvel enregistreur
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Configurer l'événement de données disponibles
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      // Configurer l'événement de fin d'enregistrement
      mediaRecorder.onstop = () => {
        // Créer un blob à partir des morceaux audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Enregistrer l'enregistrement
        setAudioRecording({
          blob: audioBlob,
          url: audioUrl,
          duration: recordingDuration
        });
        
        // Arrêter tous les tracks audio
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Démarrer l'enregistrement
      mediaRecorder.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      // Démarrer le minuteur
      timerRef.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingDuration(seconds);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, []);
  
  // Arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Arrêter le minuteur
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);
  
  // Annuler l'enregistrement
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Arrêter le minuteur
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Réinitialiser l'état
      audioChunksRef.current = [];
      setRecordingDuration(0);
      setAudioRecording(null);
    }
  }, [isRecording]);
  
  // Convertir la durée en format mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    isRecording,
    recordingDuration,
    formattedDuration: formatDuration(recordingDuration),
    audioRecording,
    startRecording,
    stopRecording,
    cancelRecording
  };
}
