import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Chat from "@/components/chat";
import SimpleVideo from "@/components/simple-video";
import ScreenShareMonitor from "@/components/screen-share-monitor";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/hooks/use-websocket";
import { useViolationTracker } from "@/hooks/use-violation-tracker";
import { Users, LogOut, Shield, AlertTriangle } from "lucide-react";
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
        {/* Left Panel - Simple Video */}
        <div className="flex flex-col">
          <SimpleVideo 
            participants={roomData.participants}
            currentParticipant={currentParticipant}
            onViolation={handleViolation}
          />
          
          {/* Violation Alerts for Interviewers */}
          {currentParticipant?.role === "interviewer" && remoteViolations.length > 0 && (
            <div className="w-80 p-4 bg-slate-800 border-r border-slate-700">
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Candidate Alerts
                </div>
                {remoteViolations.slice(-3).map((violation, index) => (
                  <Alert key={index} className="border-yellow-500 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {violation.description}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}
        </div>

          {/* Center Panel - Interview Area */}
          <div className="flex-1 bg-slate-900 flex flex-col">
            {/* Interview Header */}
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">Live Interview Session</span>
                </div>
                <div className="text-slate-400 text-sm">
                  {currentParticipant?.role === "interviewer" ? "Interviewing" : "Being Interviewed"}
                </div>
              </div>
            </div>

            {/* Main Interview Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Interview Welcome */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-xl font-semibold text-white mb-4">Welcome to Your Interview</h3>
                  <p className="text-slate-300 mb-4">This is a simple interview platform. Use the chat to communicate and discuss your interview questions.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Participants</div>
                      <div className="text-white font-medium">{roomData.participants.length}</div>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="text-slate-400 text-sm">Your Role</div>
                      <div className="text-white font-medium capitalize">{currentParticipant?.role}</div>
                    </div>
                  </div>
                </div>

                {/* Notes Area */}
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Interview Notes</h3>
                  <textarea
                    className="w-full h-32 bg-slate-700 text-white rounded-lg p-3 border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder={currentParticipant?.role === "interviewer" 
                      ? "Take notes about the candidate's responses, technical skills, and overall performance..."
                      : "Jot down key points, questions to ask, or thoughts about the discussion..."
                    }
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Right Panel - Chat */}
        <Chat 
          messages={roomData.messages}
          participants={roomData.participants}
          currentParticipant={currentParticipant}
          roomId={roomId}
          socket={socket}
        />
        </div>
      )}
    </div>
  );
}
