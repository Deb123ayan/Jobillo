import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useWebRTC } from "@/hooks/use-webrtc";
import { Mic, MicOff, Video, VideoOff, Monitor, Phone } from "lucide-react";
import type { Participant } from "@shared/schema";

interface VideoCallProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  socket: WebSocket | null;
}

export default function VideoCall({ participants, currentParticipant, socket }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const {
    localStream,
    remoteStream,
    startCall,
    toggleAudio,
    toggleVideo,
    shareScreen,
    stopScreenShare,
  } = useWebRTC(socket, currentParticipant?.id || '');

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const handleToggleAudio = () => {
    toggleAudio();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsCameraOn(!isCameraOn);
  };

  const handleShareScreen = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        await shareScreen();
        setIsScreenSharing(true);
      } catch (error) {
        console.error('Failed to share screen:', error);
      }
    }
  };

  const otherParticipants = participants.filter(p => p.id !== currentParticipant?.id);
  const remoteParticipant = otherParticipants[0];

  return (
    <div className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Video Containers */}
      <div className="p-4 space-y-4 flex-1">
        {/* Local Video */}
        <div className="relative">
          <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
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
            
            {/* Local Video Controls Overlay */}
            <div className="absolute bottom-2 left-2 flex space-x-2">
              <button
                onClick={handleToggleAudio}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-black/50 hover:bg-black/70'
                }`}
              >
                {isMuted ? (
                  <MicOff className="text-white w-3 h-3" />
                ) : (
                  <Mic className="text-white w-3 h-3" />
                )}
              </button>
              <button
                onClick={handleToggleVideo}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  !isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-black/50 hover:bg-black/70'
                }`}
              >
                {isCameraOn ? (
                  <Video className="text-white w-3 h-3" />
                ) : (
                  <VideoOff className="text-white w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Remote Video */}
        <div className="relative">
          <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden relative">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-xl font-medium">
                      {remoteParticipant?.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <p className="text-white text-sm">{remoteParticipant?.name || 'Waiting...'}</p>
                  <p className="text-green-200 text-xs capitalize">{remoteParticipant?.role || 'Participant'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Controls */}
      <div className="p-4 border-t border-slate-700">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAudio}
            className={`flex flex-col items-center py-3 px-2 h-auto ${
              isMuted ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 mb-1" /> : <Mic className="w-4 h-4 mb-1" />}
            <span className="text-xs">Mic</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleVideo}
            className={`flex flex-col items-center py-3 px-2 h-auto ${
              !isCameraOn ? 'text-red-400 hover:text-red-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            {isCameraOn ? <Video className="w-4 h-4 mb-1" /> : <VideoOff className="w-4 h-4 mb-1" />}
            <span className="text-xs">Camera</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareScreen}
            className={`flex flex-col items-center py-3 px-2 h-auto ${
              isScreenSharing ? 'text-blue-400 hover:text-blue-300' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-4 h-4 mb-1" />
            <span className="text-xs">Share</span>
          </Button>
        </div>

        {/* Call Controls */}
        <div className="mt-4 flex justify-center">
          {remoteParticipant && !remoteStream && (
            <Button
              onClick={() => startCall(remoteParticipant.id!)}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
