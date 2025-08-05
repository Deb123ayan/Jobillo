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
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <Code className="text-white w-3 h-3" />
              </div>
              <span className="text-white font-medium">CodeInterview</span>
            </div>
            <div className="h-6 w-px bg-slate-600"></div>
            <div className="text-slate-300">
              <span className="text-sm">{roomData.room.title}</span>
              <span className="text-xs text-slate-400 ml-2">Room: {roomData.room.code}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm text-slate-300">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Recording Status */}
            <Button
              onClick={toggleRecording}
              className={`${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-600 hover:bg-slate-700'} px-3 py-1.5`}
              size="sm"
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isRecording ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></div>
              <span className="text-white text-sm">{isRecording ? 'Recording' : 'Record'}</span>
            </Button>

            {/* Leave Button */}
            <Button
              onClick={handleLeaveInterview}
              variant="destructive"
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
