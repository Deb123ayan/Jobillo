import { 
  type Room, type InsertRoom,
  type Participant, type InsertParticipant,
  type Message, type InsertMessage,
  type CodeState, type InsertCodeState
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Rooms
  createRoom(room: InsertRoom): Promise<{ room: Room; code: string }>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  getRoom(id: string): Promise<Room | undefined>;
  
  // Participants
  addParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipantsByRoom(roomId: string): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  updateParticipantPeerId(id: string, peerId: string): Promise<void>;
  
  // Messages
  addMessage(message: InsertMessage): Promise<Message>;
  getMessagesByRoom(roomId: string): Promise<Message[]>;
  
  // Code States
  updateCodeState(codeState: InsertCodeState & { version: number }): Promise<CodeState>;
  getCodeState(roomId: string): Promise<CodeState | undefined>;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private participants: Map<string, Participant>;
  private messages: Map<string, Message>;
  private codeStates: Map<string, CodeState>;

  constructor() {
    this.rooms = new Map();
    this.participants = new Map();
    this.messages = new Map();
    this.codeStates = new Map();
  }

  async createRoom(insertRoom: InsertRoom): Promise<{ room: Room; code: string }> {
    const id = randomUUID();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: Room = {
      ...insertRoom,
      id,
      code,
      isActive: true,
      createdAt: new Date(),
    };
    this.rooms.set(id, room);
    
    // Initialize code state for the room
    const codeStateId = randomUUID();
    const codeState: CodeState = {
      id: codeStateId,
      roomId: id,
      content: "// Welcome to the collaborative coding interview!\n// Both interviewer and candidate can edit this code in real-time\n\nfunction fibonacci(n) {\n    if (n <= 1) {\n        return n;\n    }\n    return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// TODO: Optimize this function\n// Hint: Consider using dynamic programming\n\nconsole.log(fibonacci(10));\n\n// Feel free to ask questions and discuss your approach!",
      language: "javascript",
      lastModifiedBy: null,
      version: 0,
      updatedAt: new Date(),
    };
    this.codeStates.set(id, codeState);
    
    return { room, code };
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async addParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = {
      ...insertParticipant,
      id,
      peerId: null,
      isConnected: true,
      joinedAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipantsByRoom(roomId: string): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(p => p.roomId === roomId);
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async updateParticipantPeerId(id: string, peerId: string): Promise<void> {
    const participant = this.participants.get(id);
    if (participant) {
      participant.peerId = peerId;
      this.participants.set(id, participant);
    }
  }

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      type: insertMessage.type || 'text',
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }

  async updateCodeState(update: InsertCodeState & { version: number }): Promise<CodeState> {
    const existing = this.codeStates.get(update.roomId);
    const codeState: CodeState = {
      id: existing?.id || randomUUID(),
      roomId: update.roomId,
      content: update.content || "",
      language: update.language || "javascript",
      lastModifiedBy: update.lastModifiedBy || null,
      version: update.version,
      updatedAt: new Date(),
    };
    this.codeStates.set(update.roomId, codeState);
    return codeState;
  }

  async getCodeState(roomId: string): Promise<CodeState | undefined> {
    return this.codeStates.get(roomId);
  }
}

export const storage = new MemStorage();
