import { useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

export function useFaceModels() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        // Download models to public/models directory
        const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load face detection models:', err);
        setError('Failed to load face detection models');
      }
    };

    loadModels();
  }, []);

  return { isLoaded, error };
}