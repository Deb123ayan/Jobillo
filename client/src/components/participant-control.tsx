import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Video, VideoOff, Crown, Users } from 'lucide-react';
import type { Participant } from '@shared/schema';

interface ParticipantStatus {
  id: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isSpeaking: boolean;
}

interface ParticipantControlProps {
  participants: Participant[];
  currentParticipant: Participant | null;
  socket: WebSocket | null;
}

export default function ParticipantControl({ participants, currentParticipant, socket }: ParticipantControlProps) {
  const [participantStatuses, setParticipantStatuses] = useState<Map<string, ParticipantStatus>>(new Map());
  const [isOpen, setIsOpen] = useState(false);

  const isHost = currentParticipant?.role === 'interviewer';

  useEffect(() => {
    const initialStatuses = new Map<string, ParticipantStatus>();
    participants.forEach(p => {
      initialStatuses.set(p.id, {
        id: p.id,
        hasVideo: true,
        hasAudio: true,
        isSpeaking: false
      });
    });
    setParticipantStatuses(initialStatuses);
  }, [participants]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'participant-media-status') {
          setParticipantStatuses(prev => {
            const updated = new Map(prev);
            const current = updated.get(data.participantId) || { 
              id: data.participantId, 
              hasVideo: true, 
              hasAudio: true, 
              isSpeaking: false 
            };
            updated.set(data.participantId, {
              ...current,
              hasVideo: data.hasVideo,
              hasAudio: data.hasAudio
            });
            return updated;
          });
        }
        
        if (data.type === 'voice-activity-update') {
          setParticipantStatuses(prev => {
            const updated = new Map(prev);
            const current = updated.get(data.participantId) || { 
              id: data.participantId, 
              hasVideo: true, 
              hasAudio: true, 
              isSpeaking: false 
            };
            updated.set(data.participantId, {
              ...current,
              isSpeaking: data.isSpeaking
            });
            return updated;
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  const controlParticipantMedia = (participantId: string, action: string) => {
    if (!socket || !isHost) return;

    socket.send(JSON.stringify({
      type: 'host-control-media',
      targetParticipantId: participantId,
      action
    }));
  };

  const getParticipantName = (participantId: string) => {
    if (participantId === currentParticipant?.id) return 'You';
    return participants.find(p => p.id === participantId)?.name || 'Unknown';
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="lg"
      >
        <Users className="w-5 h-5 mr-2" />
        Participants ({participants.length})
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 shadow-xl border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants ({participants.length})
          </CardTitle>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 max-h-64 overflow-y-auto">
        <div className="space-y-3">
          {participants.map((participant) => {
            const status = participantStatuses.get(participant.id);
            const isCurrentUser = participant.id === currentParticipant?.id;
            
            return (
              <div
                key={participant.id}
                className={`p-3 rounded-lg border transition-colors ${
                  status?.isSpeaking 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {getParticipantName(participant.id)}
                    </span>
                    {participant.role === 'interviewer' && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                    <Badge 
                      variant={participant.role === 'interviewer' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {participant.role}
                    </Badge>
                  </div>
                  {status?.isSpeaking && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Speaking
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${status?.hasVideo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {status?.hasVideo ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                    </div>
                    <div className={`p-1 rounded ${status?.hasAudio ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {status?.hasAudio ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    </div>
                  </div>
                  
                  {isHost && !isCurrentUser && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => controlParticipantMedia(
                          participant.id, 
                          status?.hasAudio ? 'mute-audio' : 'enable-audio'
                        )}
                        className="h-6 w-6 p-0"
                      >
                        {status?.hasAudio ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => controlParticipantMedia(
                          participant.id, 
                          status?.hasVideo ? 'disable-video' : 'enable-video'
                        )}
                        className="h-6 w-6 p-0"
                      >
                        {status?.hasVideo ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {isHost && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="text-xs text-slate-600 flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Host controls available
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}