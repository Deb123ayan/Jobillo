import express from 'express';
import { storage } from '../server/storage';
import { insertRoomSchema } from '../shared/schema';

const app = express();
app.use(express.json());

export default async function handler(req: any, res: any) {
  const { method, url, body } = req;
  
  if (method === 'POST' && url === '/api/rooms') {
    try {
      const roomData = insertRoomSchema.parse(body);
      const result = await storage.createRoom(roomData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Invalid room data' });
    }
  } else if (method === 'GET' && url === '/api/rooms') {
    const rooms = await storage.getAllRooms();
    res.json(rooms);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
}