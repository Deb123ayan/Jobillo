import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceActivity } from '@/hooks/use-voice-activity';
import { Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import type { Participant } from '@shared/schema';

interface VideoSwitcherProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  socket: WebSocket | null;
}

export default function VideoSwitcher({ participants, currentParticipant, socket }: VideoSwitcherProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [voiceActivities, setVoiceActivities] = useState<Map<string, boolean>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement>(null);
  
  const { isSpeaking: isLocalSpeaking } = useVoiceActivity(localStream);

  // Initialize local media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Set self as active video initially
        if (currentParticipant) {
          setActiveVideo(currentParticipant.id);
        }
      } catch (error) {
        console.error('Failed to get media:', error);
      }
    };

    initializeMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle voice activity updates and media control from WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'voice-activity-update') {
          setVoiceActivities(prev => new Map(prev.set(data.participantId, data.isSpeaking)));
          
          // Auto-switch video to speaking participant
          if (data.isSpeaking && data.participantId !== currentParticipant?.id) {
            setActiveVideo(data.participantId);
          }
        }
        
        if (data.type === 'media-control-command') {
          // Handle host media control commands
          if (localStream) {
            if (data.action === 'mute-audio') {
              const audioTrack = localStream.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = false;
                setIsAudioEnabled(false);
              }
            } else if (data.action === 'enable-audio') {
              const audioTrack = localStream.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = true;
                setIsAudioEnabled(true);
              }
            } else if (data.action === 'disable-video') {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                videoTrack.enabled = false;
                setIsVideoEnabled(false);
              }
            } else if (data.action === 'enable-video') {
              const videoTrack = localStream.getVideoTracks()[0];
              if (videoTrack) {
                videoTrack.enabled = true;
                setIsVideoEnabled(true);
              }
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, currentParticipant, localStream]);

  // Send voice activity updates
  useEffect(() => {
    if (socket && currentParticipant) {
      socket.send(JSON.stringify({
        type: 'voice-activity',
        isSpeaking: isLocalSpeaking
      }));
    }
  }, [isLocalSpeaking, socket, currentParticipant]);

  // Send media status updates
  useEffect(() => {
    if (socket && currentParticipant) {
      socket.send(JSON.stringify({
        type: 'media-status-update',
        hasVideo: isVideoEnabled,
        hasAudio: isAudioEnabled
      }));
    }
  }, [isVideoEnabled, isAudioEnabled, socket, currentParticipant]);

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const switchToParticipant = (participantId: string) => {
    setActiveVideo(participantId);
    
    if (socket) {
      socket.send(JSON.stringify({
        type: 'request-video-switch',
        targetParticipantId: participantId
      }));
    }
  };

  return (
    <div className="w-72 bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Active Video Display */}
      <div className="p-3">
        <Card className="bg-slate-900 border-slate-700 overflow-hidden">
          <div className="aspect-video relative">
            {activeVideo === currentParticipant?.id ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                ref={activeVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Speaking indicator */}
            {voiceActivities.get(activeVideo || '') && (
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                Live
              </div>
            )}
            
            {/* Participant name */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              {activeVideo === currentParticipant?.id 
                ? 'You (Main)' 
                : participants.find(p => p.id === activeVideo)?.name || 'Unknown'
              }
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Participant Switcher */}
      <div className="px-3 pb-3">
        <div className="text-white text-sm font-medium mb-2">Quick Switch</div>
        <div className="grid grid-cols-2 gap-1">
          {participants.slice(0, 4).map((participant) => {
            const isSpeaking = voiceActivities.get(participant.id) || 
              (participant.id === currentParticipant?.id && isLocalSpeaking);
            const isActive = activeVideo === participant.id;
            
            return (
              <button
                key={participant.id}
                onClick={() => switchToParticipant(participant.id)}
                className={`p-2 rounded text-xs transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    isSpeaking ? 'bg-green-400 animate-pulse' : 'bg-slate-500'
                  }`} />
                  <span className="truncate">
                    {participant.id === currentParticipant?.id ? 'You' : participant.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-slate-700 mt-auto">
        <div className="flex gap-2">
          <Button
            onClick={toggleVideo}
            size="sm"
            variant={isVideoEnabled ? "default" : "destructive"}
            className="flex-1"
          >
            {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </Button>
          <Button
            onClick={toggleAudio}
            size="sm"
            variant={isAudioEnabled ? "default" : "destructive"}
            className="flex-1"
          >
            {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};