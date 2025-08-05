import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import VideoCall from "@/components/video-call";
import CodeEditor from "@/components/code-editor";
import Chat from "@/components/chat";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { Code, LogOut, Video } from "lucide-react";
import type { Room, Participant, Message, CodeState } from "@shared/schema";

interface InterviewPageProps {
  params: { roomId: string };
}

export default function Interview({ params }: InterviewPageProps) {
  const [, setLocation] = useLocation();
  const { roomId } = params;
  const [isRecording, setIsRecording] = useState(false);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);

  const { data: roomData, isLoading } = useQuery<{
    room: Room;
    participants: Participant[];
    messages: Message[];
    codeState: CodeState;
  }>({
    queryKey: ["/api/rooms", roomId],
    enabled: !!roomId,
  });

  const { socket, isConnected } = useWebSocket();

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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // TODO: Implement actual recording functionality
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
      {/* Top Header */}
      <header className="bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Code className="text-white w-4 h-4" />
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

            {/* Recording Status */}
            <Button
              onClick={toggleRecording}
              className={`${isRecording ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25' : 'bg-slate-600/50 hover:bg-slate-600 backdrop-blur-sm'} px-4 py-2 rounded-xl border border-white/10`}
              size="sm"
            >
              <div className={`w-3 h-3 rounded-full mr-2 ${isRecording ? 'bg-white animate-pulse shadow-white/50' : 'bg-slate-400'}`}></div>
              <span className="text-white text-sm font-medium">{isRecording ? 'Recording' : 'Record'}</span>
            </Button>

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

      {/* Main Interface */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Video & Controls */}
        <VideoCall 
          participants={roomData.participants}
          currentParticipant={currentParticipant}
          socket={socket}
        />

        {/* Center Panel - Code Editor */}
        <CodeEditor 
          initialCode={roomData.codeState}
          roomId={roomId}
          participantId={currentParticipant?.id}
          socket={socket}
        />

        {/* Right Panel - Chat */}
        <Chat 
          messages={roomData.messages}
          participants={roomData.participants}
          currentParticipant={currentParticipant}
          roomId={roomId}
          socket={socket}
        />
      </div>
    </div>
  );
}
