import { Button } from "@/components/ui/button";
import { Mic, Video, Users, Shield } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Participant } from "@shared/schema";
import FaceAnalyzer from "./face-analyzer";
import { useFaceModels } from "@/hooks/use-face-models";

interface SimpleVideoProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  onViolation?: (violation: any) => void;
}

export default function SimpleVideo({ participants, currentParticipant, onViolation }: SimpleVideoProps) {
  const otherParticipant = participants.find(p => p.id !== currentParticipant?.id);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isFaceAnalysisEnabled, setIsFaceAnalysisEnabled] = useState(false);
  const { isLoaded: modelsLoaded } = useFaceModels();

  // Initialize local video stream and auto-enable face analysis for candidates
  useEffect(() => {
    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240 }, 
          audio: false 
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          setIsVideoEnabled(true);
          
          // Auto-enable face analysis for candidates
          if (currentParticipant?.role === 'candidate') {
            setIsFaceAnalysisEnabled(true);
          }
        }
      } catch (error) {
        console.error('Failed to access camera:', error);
      }
    };

    initVideo();

    return () => {
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [currentParticipant?.role]);

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 space-y-4 flex-1">
        {/* Local Video */}
        <div className="aspect-video bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg overflow-hidden relative">
          {isVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-xl font-medium">
                    {currentParticipant?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <p className="text-white text-sm">{currentParticipant?.name || 'You'}</p>
                <p className="text-blue-200 text-xs capitalize">{currentParticipant?.role || 'Participant'}</p>
              </div>
            </div>
          )}
          {isFaceAnalysisEnabled && (
            <div className="absolute top-2 right-2">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
          )}
        </div>

        {/* Remote Video Placeholder */}
        <div className="aspect-video bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xl font-medium">
                {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <p className="text-white text-sm">{otherParticipant?.name || 'Waiting...'}</p>
            <p className="text-green-200 text-xs capitalize">{otherParticipant?.role || 'Participant'}</p>
          </div>
        </div>
      </div>

      {/* Simple Controls */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center py-2 px-1 h-auto text-slate-400 hover:text-white"
            disabled
          >
            <Mic className="w-3 h-3 mb-1" />
            <span className="text-xs">Mic</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex flex-col items-center py-2 px-1 h-auto ${
              isVideoEnabled ? 'text-green-400' : 'text-slate-400'
            } hover:text-white`}
            disabled
          >
            <Video className="w-3 h-3 mb-1" />
            <span className="text-xs">Cam</span>
          </Button>
          {currentParticipant?.role === 'candidate' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex flex-col items-center py-2 px-1 h-auto text-green-400"
              disabled
            >
              <Shield className="w-3 h-3 mb-1" />
              <span className="text-xs">Active</span>
            </Button>
          )}
        </div>
        
        {/* Face Analysis Panel - Candidates Only */}
        {isFaceAnalysisEnabled && isVideoEnabled && currentParticipant?.role === 'candidate' && (
          <div className="mt-3 p-3 bg-slate-900 rounded-lg">
            <FaceAnalyzer 
              videoRef={localVideoRef}
              isActive={isFaceAnalysisEnabled}
              onViolation={(violation) => {
                console.log('Face analysis violation:', violation);
                onViolation?.(violation);
              }}
            />
          </div>
        )}
        
        <p className="text-xs text-slate-500 text-center mt-3">
          {currentParticipant?.role === 'candidate' 
            ? (modelsLoaded ? 'Face monitoring active' : 'Loading face models...')
            : 'Interviewer mode'
          }
        </p>
      </div>
    </div>
  );
}