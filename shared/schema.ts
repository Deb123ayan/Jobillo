import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 6 }).notNull().unique(),
  title: text("title").notNull(),
  createdBy: text("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  name: text("name").notNull(),
  role: text("role").notNull(), // "interviewer" | "candidate"
  peerId: text("peer_id"),
  isConnected: boolean("is_connected").default(true),
  isSpeaking: boolean("is_speaking").default(false),
  lastSpokeAt: timestamp("last_spoke_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: varchar("room_id").notNull().references(() => rooms.id),
  senderId: varchar("sender_id").notNull().references(() => participants.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // "text" | "code" | "system"
  timestamp: timestamp("timestamp").defaultNow(),
});



export const insertRoomSchema = createInsertSchema(rooms).pick({
  title: true,
  createdBy: true,
});

export const insertParticipantSchema = createInsertSchema(participants).pick({
  roomId: true,
  name: true,
  role: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  roomId: true,
  senderId: true,
  content: true,
  type: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Room = typeof rooms.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type Message = typeof messages.$inferSelect;
