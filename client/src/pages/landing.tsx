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
import { Code, Video, MessageCircle, Share, Plus, LogIn } from "lucide-react";

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
      
      // Store participant data for the interview session
      localStorage.setItem(`participant_${joinData.room.id}`, JSON.stringify(joinData.participant));
      
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
      // Store participant data for the interview session
      localStorage.setItem(`participant_${data.room.id}`, JSON.stringify(data.participant));
      
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-32 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative border-b border-white/20 bg-white/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Code className="text-white w-6 h-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Jobillo</h1>
                <p className="text-xs text-slate-500 font-medium">Remote Interview Platform</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full mb-8">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            Live Coding • Video Calls • Real-time Chat
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight">
            Interview with Code,<br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Face to Face
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Transform your hiring process with seamless video interviews, collaborative coding environments, 
            and real-time communication tools. Built for modern teams.
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            <div className="flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
              <Video className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-slate-700 font-medium">HD Video Calls</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
              <Code className="w-5 h-5 text-purple-600 mr-2" />
              <span className="text-slate-700 font-medium">Live Code Editor</span>
            </div>
            <div className="flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 shadow-sm">
              <MessageCircle className="w-5 h-5 text-indigo-600 mr-2" />
              <span className="text-slate-700 font-medium">Real-time Chat</span>
            </div>
          </div>
        </div>

        {/* Room Creation/Join Section */}
        <div className="max-w-lg mx-auto mb-20">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Code className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Start Your Interview</h2>
              <p className="text-slate-600 text-lg">Create a new room or join an existing session</p>
            </div>

            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100/50 p-1 rounded-2xl">
                <TabsTrigger value="create" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </TabsTrigger>
                <TabsTrigger value="join" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <LogIn className="w-4 h-4 mr-2" />
                  Join Room
                </TabsTrigger>
              </TabsList>

              <TabsContent value="create">
                <form onSubmit={handleCreateRoom} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="create-name" className="text-slate-700 font-medium">Your Name</Label>
                    <Input
                      id="create-name"
                      placeholder="Enter your name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-title" className="text-slate-700 font-medium">Interview Title</Label>
                    <Input
                      id="create-title"
                      placeholder="e.g., Frontend Developer Interview"
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={createRoomMutation.isPending}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {createRoomMutation.isPending ? "Creating..." : "Create Interview Room"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="join">
                <form onSubmit={handleJoinRoom} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="join-name" className="text-slate-700 font-medium">Your Name</Label>
                    <Input
                      id="join-name"
                      placeholder="Enter your name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm({ ...joinForm, name: e.target.value })}
                      className="h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="join-code" className="text-slate-700 font-medium">Room Code</Label>
                    <Input
                      id="join-code"
                      placeholder="Enter 6-digit room code"
                      value={joinForm.code}
                      onChange={(e) => setJoinForm({ ...joinForm, code: e.target.value.toUpperCase() })}
                      className="h-12 rounded-xl border-slate-200 bg-white/50 backdrop-blur-sm focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-center text-lg tracking-wider"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    disabled={joinRoomMutation.isPending}
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {joinRoomMutation.isPending ? "Joining..." : "Join Interview"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
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
