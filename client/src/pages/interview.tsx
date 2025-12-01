import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Chat from "@/components/chat";
import ScreenShareMonitor from "@/components/screen-share-monitor";
import ParticipantControl from "@/components/participant-control";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWebSocket } from "@/hooks/use-websocket";
import { useViolationTracker } from "@/hooks/use-violation-tracker";
import { useVoiceActivity } from "@/hooks/use-voice-activity";
import { Users, LogOut, Shield, AlertTriangle, MessageCircle, FileText, Video, Mic } from "lucide-react";

interface ParticipantVideoProps {
  participant: Participant;
  currentParticipant: Participant | null;
  socket: WebSocket | null;
}

function ParticipantVideo({ participant, currentParticipant, socket }: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  
  const isCurrentUser = participant.id === currentParticipant?.id;
  const { isSpeaking: localSpeaking } = useVoiceActivity(isCurrentUser ? stream : null);
  const isSpeaking = isCurrentUser ? localSpeaking : remoteSpeaking;

  useEffect(() => {
    if (isCurrentUser) {
      // Get local media for current user
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(mediaStream => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch(console.error);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCurrentUser]);

  // Send voice activity for current user
  useEffect(() => {
    if (isCurrentUser && socket && currentParticipant) {
      socket.send(JSON.stringify({
        type: 'voice-activity',
        isSpeaking: localSpeaking
      }));
    }
  }, [localSpeaking, isCurrentUser, socket, currentParticipant]);

  // Send media status for current user
  useEffect(() => {
    if (isCurrentUser && socket && currentParticipant) {
      socket.send(JSON.stringify({
        type: 'media-status-update',
        hasVideo: isVideoEnabled,
        hasAudio: isAudioEnabled
      }));
    }
  }, [isVideoEnabled, isAudioEnabled, isCurrentUser, socket, currentParticipant]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'voice-activity-update' && data.participantId === participant.id) {
          setRemoteSpeaking(data.isSpeaking);
        }
        
        if (data.type === 'participant-media-status' && data.participantId === participant.id) {
          setIsVideoEnabled(data.hasVideo);
          setIsAudioEnabled(data.hasAudio);
        }
        
        if (data.type === 'media-control-command' && isCurrentUser) {
          if (stream) {
            if (data.action === 'mute-audio') {
              const audioTrack = stream.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = false;
                setIsAudioEnabled(false);
              }
            } else if (data.action === 'enable-audio') {
              const audioTrack = stream.getAudioTracks()[0];
              if (audioTrack) {
                audioTrack.enabled = true;
                setIsAudioEnabled(true);
              }
            } else if (data.action === 'disable-video') {
              const videoTrack = stream.getVideoTracks()[0];
              if (videoTrack) {
                videoTrack.enabled = false;
                setIsVideoEnabled(false);
              }
            } else if (data.action === 'enable-video') {
              const videoTrack = stream.getVideoTracks()[0];
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
  }, [socket, participant.id, isCurrentUser, stream]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative">
      <div className="aspect-video bg-slate-900 relative">
        {isCurrentUser ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                participant.role === 'interviewer' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                <span className="text-white text-xl font-bold">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-sm">{participant.name}</div>
            </div>
          </div>
        )}
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            Speaking
          </div>
        )}
        
        {/* Video disabled overlay */}
        {!isVideoEnabled && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 ${
                participant.role === 'interviewer' ? 'bg-blue-600' : 'bg-green-600'
              }`}>
                <span className="text-white text-xl font-bold">
                  {participant.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-slate-400 text-sm">Camera Off</div>
            </div>
          </div>
        )}
        
        {/* Participant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {isCurrentUser ? 'You' : participant.name}
              </span>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                participant.role === 'interviewer' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-green-600 text-white'
              }`}>
                {participant.role}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Mic className={`w-4 h-4 ${
                isAudioEnabled ? 'text-white' : 'text-red-400'
              }`} />
              <Video className={`w-4 h-4 ${
                isVideoEnabled ? 'text-white' : 'text-red-400'
              }`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import type { Room, Participant, Message } from "@shared/schema";

interface InterviewPageProps {
  params: { roomId: string };
}

export default function Interview({ params }: InterviewPageProps) {
  const [, setLocation] = useLocation();
  const { roomId } = params;

  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [screenShareComplete, setScreenShareComplete] = useState(false);
  const [remoteViolations, setRemoteViolations] = useState<any[]>([]);
  
  const { addViolation, getViolationSummary } = useViolationTracker(roomId, currentParticipant?.id);
  const violationSummary = getViolationSummary();


  const { data: roomData, isLoading } = useQuery<{
    room: Room;
    participants: Participant[];
    messages: Message[];
  }>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  const { socket, isConnected } = useWebSocket();

  // Handle violation alerts from other participants
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'violation-detected') {
          setRemoteViolations(prev => [...prev.slice(-4), data.violation]); // Keep last 5
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  // Send violation alerts to other participants
  const handleViolation = (violation: any) => {
    addViolation(violation);
    
    if (socket && currentParticipant?.role === 'candidate') {
      socket.send(JSON.stringify({
        type: 'violation-alert',
        violation
      }));
    }
  };

  useEffect(() => {
    if (roomData && socket) {
      // Get current participant from localStorage (set during room join)
      const participantData = localStorage.getItem(`participant_${roomId}`);
      if (participantData) {
        const participant = JSON.parse(participantData);
        setCurrentParticipant(participant);
        

        
        // Join the WebSocket room
        socket.send(JSON.stringify({
          type: 'join-room',
          roomId: roomId,
          participantId: participant.id,
        }));
      }
    }
  }, [roomData, socket, roomId]);

  const handleLeaveInterview = () => {
    localStorage.removeItem(`participant_${roomId}`);
    setLocation("/");
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading interview room...</p>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Room Not Found</h1>
          <p className="text-slate-400 mb-6">The interview room you're looking for doesn't exist.</p>
          <Button onClick={() => setLocation("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Screen Share Monitor for Candidates Only */}
      <ScreenShareMonitor
        isJoiner={currentParticipant?.role === "candidate"}
        onScreenShareComplete={() => setScreenShareComplete(true)}
      />

      {/* Top Header */}
      <header className="bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="text-white w-4 h-4" />
              </div>
              <span className="text-white font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Jobillo</span>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-slate-600 to-slate-700"></div>
            <div className="text-slate-300">
              <div className="font-semibold text-white">{roomData.room.title}</div>
              <div className="text-xs text-slate-400 font-mono">Room: {roomData.room.code}</div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-700/50 rounded-xl backdrop-blur-sm">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse' : 'bg-red-400 shadow-lg shadow-red-400/50'}`}></div>
              <span className="text-sm text-slate-300 font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Screen Share Status - Only show for interviewers */}
            {currentParticipant?.role === "interviewer" && (
              <div className="flex items-center space-x-3 px-3 py-2 bg-slate-700/50 rounded-xl backdrop-blur-sm">
                <div className={`w-3 h-3 rounded-full ${screenShareComplete ? 'bg-green-400' : 'bg-orange-400'}`}></div>
                <span className="text-sm text-slate-300 font-medium">
                  Joiner Screen: {screenShareComplete ? 'Sharing' : 'Not Sharing'}
                </span>
              </div>
            )}

            {/* Face Analysis Status */}
            <div className="flex items-center space-x-3 px-3 py-2 bg-slate-700/50 rounded-xl backdrop-blur-sm">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300 font-medium">
                Violations: {violationSummary.total}
              </span>
              {violationSummary.riskLevel === 'high' && (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              )}
            </div>



            {/* Leave Button */}
            <Button
              onClick={handleLeaveInterview}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm px-4 py-2 rounded-xl transition-all duration-200"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave
            </Button>
          </div>
        </div>
      </header>

      {/* Main Interface - Show after screen share setup */}
      {(screenShareComplete || currentParticipant?.role === "interviewer") && (
        <div className="flex h-[calc(100vh-64px)]">
          {/* Main Video Area - Zoom Style */}
          <div className="flex-1 bg-slate-900 p-4 relative">
            {/* Video Grid */}
            <div className="h-full grid grid-cols-2 gap-4">
              {roomData.participants.map((participant) => (
                <ParticipantVideo
                  key={participant.id}
                  participant={participant}
                  currentParticipant={currentParticipant}
                  socket={socket}
                />
              ))}
            </div>
            
            {/* Bottom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-slate-800/90 backdrop-blur-sm rounded-full px-6 py-3 flex items-center gap-4 border border-slate-700">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="rounded-full w-12 h-12 p-0"
                  onClick={() => {
                    // Toggle audio for current user
                    const currentUserVideo = roomData.participants.find(p => p.id === currentParticipant?.id);
                    if (currentUserVideo && socket) {
                      socket.send(JSON.stringify({
                        type: 'media-control-command',
                        targetParticipantId: currentParticipant?.id,
                        action: 'toggle-audio'
                      }));
                    }
                  }}
                >
                  <Mic className="w-5 h-5 text-white" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="rounded-full w-12 h-12 p-0"
                  onClick={() => {
                    // Toggle video for current user
                    const currentUserVideo = roomData.participants.find(p => p.id === currentParticipant?.id);
                    if (currentUserVideo && socket) {
                      socket.send(JSON.stringify({
                        type: 'media-control-command',
                        targetParticipantId: currentParticipant?.id,
                        action: 'toggle-video'
                      }));
                    }
                  }}
                >
                  <Video className="w-5 h-5 text-white" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  className="rounded-full px-6"
                  onClick={handleLeaveInterview}
                >
                  End Call
                </Button>
              </div>
            </div>
            
            {/* Violation Alerts for Interviewers */}
            {currentParticipant?.role === "interviewer" && remoteViolations.length > 0 && (
              <div className="absolute top-4 right-4 max-w-sm">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-400 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Candidate Alert
                  </div>
                  <div className="text-xs text-yellow-300">
                    {remoteViolations[remoteViolations.length - 1]?.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar with Tabs */}
          <div className="w-80 bg-slate-800 border-l border-slate-700">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
              <TabsList className="bg-slate-700 rounded-none justify-start p-0 h-12 border-b border-slate-600">
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-none px-4 h-12 text-sm"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="data-[state=active]:bg-slate-600 data-[state=active]:text-white text-slate-400 rounded-none px-4 h-12 text-sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Notes
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="flex-1 m-0">
                <Chat 
                  messages={roomData.messages}
                  participants={roomData.participants}
                  currentParticipant={currentParticipant}
                  roomId={roomId}
                  socket={socket}
                />
              </TabsContent>

              <TabsContent value="notes" className="flex-1 p-4 m-0">
                <div className="h-full flex flex-col">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-white mb-1">Notes</h3>
                    <p className="text-slate-400 text-xs">
                      {currentParticipant?.role === "interviewer" 
                        ? "Document key points during the interview"
                        : "Keep track of discussion points"
                      }
                    </p>
                  </div>
                  <textarea
                    className="flex-1 bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none text-sm"
                    placeholder={currentParticipant?.role === "interviewer" 
                      ? "• Technical skills\n• Communication\n• Problem-solving\n• Cultural fit"
                      : "• Key topics\n• Questions\n• Important points"
                    }
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      
      {/* Participant Control Panel */}
      <ParticipantControl
        participants={roomData.participants}
        currentParticipant={currentParticipant}
        socket={socket}
      />
    </div>
  );
}
