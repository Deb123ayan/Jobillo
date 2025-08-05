import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Code, Monitor } from "lucide-react";
import type { Message, Participant } from "@shared/schema";

interface ChatProps {
  messages: Message[];
  participants: Participant[];
  currentParticipant: Participant | null;
  roomId: string;
  socket: WebSocket | null;
}

export default function Chat({ messages: initialMessages, participants, currentParticipant, roomId, socket }: ChatProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (socket) {
      const handleMessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new-message') {
          setMessages(prev => [...prev, data.message]);
        }
      };

      socket.addEventListener('message', handleMessage);
      return () => socket.removeEventListener('message', handleMessage);
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !currentParticipant) return;

    socket.send(JSON.stringify({
      type: 'chat-message',
      content: newMessage,
      messageType: 'text',
    }));

    setNewMessage("");
  };

  const shareCode = () => {
    if (!socket || !currentParticipant) return;

    socket.send(JSON.stringify({
      type: 'chat-message',
      content: 'Shared current code',
      messageType: 'code',
    }));
  };

  const shareScreen = () => {
    // TODO: Implement screen sharing
    console.log('Share screen clicked');
  };

  const getParticipantById = (id: string) => {
    return participants.find(p => p.id === id);
  };

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getParticipantInitial = (participantId: string) => {
    const participant = getParticipantById(participantId);
    return participant?.name?.charAt(0).toUpperCase() || '?';
  };

  const getParticipantColor = (participantId: string) => {
    const participant = getParticipantById(participantId);
    return participant?.role === 'interviewer' ? 'blue' : 'green';
  };

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-slate-200 font-medium flex items-center">
          <svg className="w-4 h-4 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          Interview Chat
        </h3>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* System message */}
          <div className="text-center">
            <div className="inline-block bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full">
              Interview session started
            </div>
          </div>

          {messages.map((message) => {
            const participant = getParticipantById(message.senderId);
            const isCurrentUser = message.senderId === currentParticipant?.id;
            const color = getParticipantColor(message.senderId);

            return (
              <div key={message.id} className="flex space-x-3">
                <div className={`w-8 h-8 bg-${color}-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-xs font-medium">
                    {getParticipantInitial(message.senderId)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-slate-300 text-sm font-medium">
                      {participant?.name || 'Unknown'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {formatTime(message.timestamp!)}
                    </span>
                  </div>
                  {message.type === 'code' ? (
                    <div className="bg-purple-900/50 border border-purple-700 text-slate-200 text-sm p-3 rounded-lg">
                      <Code className="w-4 h-4 mr-2 inline" />
                      {message.content}
                    </div>
                  ) : (
                    <div className="bg-slate-700 text-slate-200 text-sm p-3 rounded-lg rounded-tl-none">
                      {message.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex space-x-2 mb-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-slate-700 text-slate-200 placeholder-slate-400 border-slate-600 focus:ring-blue-500 focus:border-blue-500"
          />
          <Button
            onClick={sendMessage}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              onClick={shareCode}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs h-auto py-1"
            >
              <Code className="w-3 h-3 mr-1" />
              Share Code
            </Button>
            <Button
              onClick={shareScreen}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white text-xs h-auto py-1"
            >
              <Monitor className="w-3 h-3 mr-1" />
              Share Screen
            </Button>
          </div>
          
          {/* Chat Status */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-slate-400 text-xs">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}