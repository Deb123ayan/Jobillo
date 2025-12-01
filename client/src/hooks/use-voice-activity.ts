import { useEffect, useRef, useState } from 'react';

interface VoiceActivityOptions {
  threshold?: number;
  smoothingTimeConstant?: number;
  minDecibels?: number;
}

export function useVoiceActivity(
  stream: MediaStream | null,
  options: VoiceActivityOptions = {}
) {
  const {
    threshold = 0.01,
    smoothingTimeConstant = 0.8,
    minDecibels = -45
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!stream) return;

    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    // Create audio context and analyser
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    
    analyserRef.current.fftSize = 256;
    analyserRef.current.smoothingTimeConstant = smoothingTimeConstant;
    analyserRef.current.minDecibels = minDecibels;
    
    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkVoiceActivity = () => {
      if (!analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const normalizedVolume = average / 255;
      
      setVolume(normalizedVolume);
      setIsSpeaking(normalizedVolume > threshold);

      animationFrameRef.current = requestAnimationFrame(checkVoiceActivity);
    };

    checkVoiceActivity();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stream, threshold, smoothingTimeConstant, minDecibels]);

  return { isSpeaking, volume };
}