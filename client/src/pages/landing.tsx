import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Code, Video, Share, Plus, LogIn } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [createForm, setCreateForm] = useState({
    name: "",
    title: "",
  });
  
  const [joinForm, setJoinForm] = useState({
    name: "",
    code: "",
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: { name: string; title: string }) => {
      const response = await apiRequest("POST", "/api/rooms", {
        title: data.title,
        createdBy: data.name,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      // Join the room as interviewer
      const joinResponse = await apiRequest("POST", `/api/rooms/${data.code}/join`, {
        name: createForm.name,
        role: "interviewer",
      });
      const joinData = await joinResponse.json();
      
      setLocation(`/interview/${joinData.room.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (data: { name: string; code: string }) => {
      const response = await apiRequest("POST", `/api/rooms/${data.code}/join`, {
        name: data.name,
        role: "candidate",
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/interview/${data.room.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Room not found or invalid code. Please check and try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.title) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    createRoomMutation.mutate(createForm);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinForm.name || !joinForm.code) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    joinRoomMutation.mutate(joinForm);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Code className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">CodeInterview</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Features</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#" className="text-slate-600 hover:text-slate-900 transition-colors">Support</a>
              <Button variant="default">Sign In</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Interview with Code,<br />
            <span className="text-blue-600">Face to Face</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
            Conduct technical interviews with video calling and real-time collaborative coding. 
            Perfect for remote hiring and pair programming sessions.
          </p>
        </div>

        {/* Room Creation/Join Section */}
        <div className="max-w-md mx-auto mb-16">
          <Card className="shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Start Your Interview</h2>
              <p className="text-slate-600">Create a new room or join an existing session</p>
            </div>

            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create">Create Room</TabsTrigger>
                <TabsTrigger value="join">Join Room</TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">Your Name</Label>
                    <Input
                      id="create-name"
                      placeholder="Enter your name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-title">Interview Title</Label>
                    <Input
                      id="create-title"
                      placeholder="e.g., Frontend Developer Interview"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createRoomMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Interview Room
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <Label htmlFor="join-name">Your Name</Label>
                    <Input
                      id="join-name"
                      placeholder="Enter your name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="join-code">Room Code</Label>
                    <Input
                      id="join-code"
                      placeholder="Enter 6-digit room code"
                      value={joinForm.code}
                      onChange={(e) => setJoinForm({ ...joinForm, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={joinRoomMutation.isPending}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Join Interview
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Video className="text-blue-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">HD Video Calling</h3>
            <p className="text-slate-600">Crystal clear video and audio for professional interviews</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Code className="text-green-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Live Code Editor</h3>
            <p className="text-slate-600">Real-time collaborative coding with syntax highlighting</p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Share className="text-purple-600 w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Screen Sharing</h3>
            <p className="text-slate-600">Share your screen to review code or discuss concepts</p>
          </div>
        </div>
      </main>
    </div>
  );
}
