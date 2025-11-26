import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Eye, Users } from 'lucide-react';
import { useFaceModels } from '@/hooks/use-face-models';

interface Violation {
  type: 'multiple_faces' | 'face_absent' | 'looking_away' | 'suspicious_movement';
  timestamp: number;
  confidence: number;
  description: string;
}

interface FaceAnalyzerProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onViolation?: (violation: Violation) => void;
}

export default function FaceAnalyzer({ videoRef, isActive, onViolation }: FaceAnalyzerProps) {
  const { isLoaded, error } = useFaceModels();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [currentStatus, setCurrentStatus] = useState<string>('Initializing...');
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastFacePosition = useRef<{ x: number; y: number } | null>(null);
  const lookAwayCount = useRef(0);
  const faceAbsentCount = useRef(0);

  useEffect(() => {
    if (isLoaded) {
      setCurrentStatus('Face analysis ready');
    } else if (error) {
      setCurrentStatus('Face analysis unavailable');
    }
  }, [isLoaded, error]);

  const addViolation = useCallback((violation: Violation) => {
    setViolations(prev => [...prev.slice(-9), violation]); // Keep last 10 violations
    onViolation?.(violation);
  }, [onViolation]);

  const analyzeFace = useCallback(async () => {
    if (!videoRef.current || !isLoaded || !isActive) return;

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceExpressions();

      // Check for multiple faces
      if (detections.length > 1) {
        addViolation({
          type: 'multiple_faces',
          timestamp: Date.now(),
          confidence: 0.9,
          description: `${detections.length} faces detected`
        });
        setCurrentStatus(`⚠️ ${detections.length} faces detected`);
        return;
      }

      // Check for face absence
      if (detections.length === 0) {
        faceAbsentCount.current++;
        if (faceAbsentCount.current > 3) { // 3 consecutive frames without face
          addViolation({
            type: 'face_absent',
            timestamp: Date.now(),
            confidence: 0.8,
            description: 'Face not visible'
          });
          setCurrentStatus('⚠️ Face not visible');
        }
        return;
      }

      faceAbsentCount.current = 0;
      const detection = detections[0];
      const landmarks = detection.landmarks;

      // Analyze eye gaze direction using landmarks
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();

      // Calculate face center
      const faceCenter = {
        x: detection.detection.box.x + detection.detection.box.width / 2,
        y: detection.detection.box.y + detection.detection.box.height / 2
      };

      // Check for suspicious head movement
      if (lastFacePosition.current) {
        const movement = Math.sqrt(
          Math.pow(faceCenter.x - lastFacePosition.current.x, 2) +
          Math.pow(faceCenter.y - lastFacePosition.current.y, 2)
        );

        if (movement > 50) { // Significant movement threshold
          addViolation({
            type: 'suspicious_movement',
            timestamp: Date.now(),
            confidence: 0.6,
            description: 'Unusual head movement detected'
          });
        }
      }

      // Estimate gaze direction using face angle
      const faceBox = detection.detection.box;
      const faceWidth = faceBox.width;
      const faceHeight = faceBox.height;
      
      // Calculate face angle based on eye positions
      const leftEyeCenter = leftEye.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
      leftEyeCenter.x /= leftEye.length;
      leftEyeCenter.y /= leftEye.length;
      
      const rightEyeCenter = rightEye.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
      rightEyeCenter.x /= rightEye.length;
      rightEyeCenter.y /= rightEye.length;
      
      // Check for head rotation (looking away)
      const eyeDistance = Math.abs(rightEyeCenter.x - leftEyeCenter.x);
      const expectedEyeDistance = faceWidth * 0.3; // Expected eye distance ratio
      
      if (eyeDistance < expectedEyeDistance * 0.7) { // Face turned significantly
        lookAwayCount.current++;
        if (lookAwayCount.current > 3) {
          addViolation({
            type: 'looking_away',
            timestamp: Date.now(),
            confidence: 0.7,
            description: 'Head turned away from camera'
          });
          setCurrentStatus('⚠️ Looking away detected');
          lookAwayCount.current = 0;
        }
      } else {
        lookAwayCount.current = 0;
        setCurrentStatus('✅ Face analysis active');
      }

      lastFacePosition.current = faceCenter;

    } catch (error) {
      console.error('Face analysis error:', error);
      setCurrentStatus('Face analysis error');
    }
  }, [videoRef, isLoaded, isActive, addViolation]);

  // Start/stop analysis
  useEffect(() => {
    if (isActive && isLoaded) {
      intervalRef.current = setInterval(analyzeFace, 1000); // Analyze every second
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isLoaded, analyzeFace]);

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'multiple_faces': return <Users className="w-3 h-3" />;
      case 'face_absent': return <Eye className="w-3 h-3" />;
      case 'looking_away': return <Eye className="w-3 h-3" />;
      case 'suspicious_movement': return <AlertTriangle className="w-3 h-3" />;
      default: return <AlertTriangle className="w-3 h-3" />;
    }
  };

  const getViolationColor = (type: string) => {
    switch (type) {
      case 'multiple_faces': return 'destructive';
      case 'face_absent': return 'destructive';
      case 'looking_away': return 'secondary';
      case 'suspicious_movement': return 'outline';
      default: return 'outline';
    }
  };

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Face Analysis</span>
        <span className={`${currentStatus.includes('✅') ? 'text-green-400' : 
                          currentStatus.includes('⚠️') ? 'text-yellow-400' : 
                          'text-slate-400'}`}>
          {currentStatus}
        </span>
      </div>

      {/* Recent Violations */}
      {violations.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Recent Alerts ({violations.length})
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {violations.slice(-5).reverse().map((violation, index) => (
              <div key={`${violation.timestamp}-${index}`} 
                   className="flex items-center justify-between text-xs p-2 bg-slate-800 rounded">
                <div className="flex items-center gap-2">
                  {getViolationIcon(violation.type)}
                  <span>{violation.description}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={getViolationColor(violation.type) as any} className="text-xs px-1 py-0">
                    {Math.round(violation.confidence * 100)}%
                  </Badge>
                  <span className="text-slate-500">
                    {new Date(violation.timestamp).toLocaleTimeString('en-US', { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warning for high violation count */}
      {violations.filter(v => Date.now() - v.timestamp < 300000).length > 3 && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Multiple suspicious activities detected in the last 5 minutes
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}