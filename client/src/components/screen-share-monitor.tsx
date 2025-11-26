import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Monitor, AlertTriangle } from 'lucide-react';

interface ScreenShareMonitorProps {
  isJoiner: boolean;
  onScreenShareComplete: () => void;
}

export default function ScreenShareMonitor({ isJoiner, onScreenShareComplete }: ScreenShareMonitorProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    if (!isJoiner) {
      onScreenShareComplete();
    }
  }, [isJoiner, onScreenShareComplete]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setIsSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
        setMediaRecorder(null);
      };

      recorder.start();
      onScreenShareComplete();
    } catch (error) {
      console.error('Failed to start screen sharing:', error);
    }
  };

  if (!isJoiner) {
    return null;
  }

  if (isSharing) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <div className="flex items-center space-x-2 bg-green-800/95 backdrop-blur px-3 py-2 rounded-lg border border-green-700">
          <Monitor className="w-4 h-4 text-green-400" />
          <span className="text-white text-sm">Screen Sharing Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-orange-600" />
          </div>
          <CardTitle>Screen Sharing Required</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You must share your screen when joining a room to prevent malpractices.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <Monitor className="w-5 h-5 text-orange-600" />
              <div>
                <div className="font-medium">Share Your Screen</div>
                <div className="text-sm text-slate-600">Select "Entire Screen" when prompted</div>
              </div>
            </div>
          </div>
          
          <Button onClick={startScreenShare} className="w-full">
            <Monitor className="w-4 h-4 mr-2" />
            Start Screen Sharing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}