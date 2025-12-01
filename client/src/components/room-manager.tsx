import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Users, Clock, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Room } from '@shared/schema';

export default function RoomManager() {
  const { toast } = useToast();
  const [showAll, setShowAll] = useState(false);

  const { data: rooms, isLoading } = useQuery<Room[]>({
    queryKey: [showAll ? '/api/rooms' : '/api/rooms/active'],
    queryFn: async () => {
      const response = await apiRequest('GET', showAll ? '/api/rooms' : '/api/rooms/active');
      return response.json();
    },
    refetchInterval: 5000,
  });

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: `Room code ${code} copied to clipboard`,
    });
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Room Management</h2>
          <p className="text-slate-600">Track and manage all interview rooms</p>
        </div>
        <Button
          onClick={() => setShowAll(!showAll)}
          variant="outline"
        >
          {showAll ? 'Show Active Only' : 'Show All Rooms'}
        </Button>
      </div>

      {!rooms || rooms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No {showAll ? '' : 'active '}rooms found
            </h3>
            <p className="text-slate-600">
              {showAll 
                ? 'No interview rooms have been created yet.' 
                : 'No active interview rooms at the moment.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{room.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(room.createdAt!)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Created by {room.createdBy}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={room.isActive ? 'default' : 'secondary'}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 px-3 py-2 rounded-lg font-mono text-lg font-bold tracking-wider">
                      {room.code}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyRoomCode(room.code)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/interview/${room.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open Room
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Room Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-blue-600 font-medium">Total Rooms</div>
            <div className="text-blue-900 text-lg font-bold">{rooms?.length || 0}</div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Active Rooms</div>
            <div className="text-blue-900 text-lg font-bold">
              {rooms?.filter(r => r.isActive).length || 0}
            </div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">Today's Rooms</div>
            <div className="text-blue-900 text-lg font-bold">
              {rooms?.filter(r => {
                const today = new Date();
                const roomDate = new Date(r.createdAt!);
                return roomDate.toDateString() === today.toDateString();
              }).length || 0}
            </div>
          </div>
          <div>
            <div className="text-blue-600 font-medium">This Week</div>
            <div className="text-blue-900 text-lg font-bold">
              {rooms?.filter(r => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(r.createdAt!) > weekAgo;
              }).length || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}