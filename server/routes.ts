import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertRoomSchema, insertParticipantSchema, insertMessageSchema, insertCodeStateSchema } from "@shared/schema";

interface WebSocketWithData extends WebSocket {
  roomId?: string;
  participantId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create room
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const result = await storage.createRoom(roomData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Invalid room data" });
    }
  });

  // Join room
  app.post("/api/rooms/:code/join", async (req, res) => {
    try {
      const { code } = req.params;
      const { name, role } = req.body;
      
      // Validate required fields
      if (!name || !role) {
        return res.status(400).json({ error: "Name and role are required" });
      }

      if (!["interviewer", "candidate"].includes(role)) {
        return res.status(400).json({ error: "Role must be 'interviewer' or 'candidate'" });
      }
      
      const room = await storage.getRoomByCode(code);
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const participant = await storage.addParticipant({
        roomId: room.id,
        name,
        role,
      });

      // Store participant data in response for client to save
      const participantData = {
        id: participant.id,
        name: participant.name,
        role: participant.role,
        roomId: room.id,
      };

      const participants = await storage.getParticipantsByRoom(room.id);
      const messages = await storage.getMessagesByRoom(room.id);
      const codeState = await storage.getCodeState(room.id);

      res.json({
        room,
        participant: participantData,
        participants,
        messages,
        codeState,
      });
    } catch (error) {
      console.error("Join room error:", error);
      res.status(400).json({ error: "Failed to join room" });
    }
  });

  // Get room data
  app.get("/api/rooms/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoom(id);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      const participants = await storage.getParticipantsByRoom(id);
      const messages = await storage.getMessagesByRoom(id);
      const codeState = await storage.getCodeState(id);

      res.json({
        room,
        participants,
        messages,
        codeState,
      });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocketWithData) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-room':
            ws.roomId = message.roomId;
            ws.participantId = message.participantId;
            
            // Notify others in the room about new participant
            wss.clients.forEach((client: WebSocketWithData) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.roomId === message.roomId) {
                client.send(JSON.stringify({
                  type: 'participant-joined',
                  participantId: message.participantId,
                }));
              }
            });
            break;

          case 'webrtc-signal':
            // Forward WebRTC signaling messages
            wss.clients.forEach((client: WebSocketWithData) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.roomId === ws.roomId &&
                  (message.targetParticipantId === null || client.participantId === message.targetParticipantId)) {
                client.send(JSON.stringify({
                  type: 'webrtc-signal',
                  signal: message.signal,
                  fromParticipantId: ws.participantId,
                }));
              }
            });
            break;

          case 'chat-message':
            if (ws.roomId && ws.participantId) {
              const chatMessage = await storage.addMessage({
                roomId: ws.roomId,
                senderId: ws.participantId,
                content: message.content,
                type: message.messageType || 'text',
              });

              // Broadcast to all clients in the room
              wss.clients.forEach((client: WebSocketWithData) => {
                if (client.readyState === WebSocket.OPEN && 
                    client.roomId === ws.roomId) {
                  client.send(JSON.stringify({
                    type: 'new-message',
                    message: chatMessage,
                  }));
                }
              });
            }
            break;

          case 'code-change':
            if (ws.roomId && ws.participantId) {
              const codeState = await storage.updateCodeState({
                roomId: ws.roomId,
                content: message.content,
                language: message.language,
                lastModifiedBy: ws.participantId,
                version: message.version + 1,
              });

              // Broadcast to all other clients in the room
              wss.clients.forEach((client: WebSocketWithData) => {
                if (client !== ws && 
                    client.readyState === WebSocket.OPEN && 
                    client.roomId === ws.roomId) {
                  client.send(JSON.stringify({
                    type: 'code-update',
                    codeState,
                  }));
                }
              });
            }
            break;

          case 'cursor-position':
            // Broadcast cursor position to other clients
            wss.clients.forEach((client: WebSocketWithData) => {
              if (client !== ws && 
                  client.readyState === WebSocket.OPEN && 
                  client.roomId === ws.roomId) {
                client.send(JSON.stringify({
                  type: 'cursor-update',
                  participantId: ws.participantId,
                  position: message.position,
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Notify others about participant leaving
      if (ws.roomId && ws.participantId) {
        wss.clients.forEach((client: WebSocketWithData) => {
          if (client.readyState === WebSocket.OPEN && 
              client.roomId === ws.roomId) {
            client.send(JSON.stringify({
              type: 'participant-left',
              participantId: ws.participantId,
            }));
          }
        });
      }
    });
  });

  return httpServer;
}
