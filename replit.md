# Interview Platform

## Overview

This is a real-time collaborative interview platform that enables remote technical interviews with video calling, code collaboration, and chat functionality. The application allows interviewers to create interview rooms and candidates to join using room codes. Key features include live video/audio communication, collaborative code editing with syntax highlighting, real-time chat, and session management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with simple path-based navigation
- **UI Components**: Shadcn/ui component library built on Radix UI primitives with Tailwind CSS styling
- **State Management**: TanStack Query for server state management and React hooks for local state
- **Real-time Communication**: WebSocket connections for live updates and WebRTC for video/audio calling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful endpoints for room management and WebSocket handlers for real-time features
- **Session Management**: In-memory storage with interface abstraction for future database integration
- **Real-time Features**: WebSocket server for chat, code synchronization, and participant management

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Structured tables for rooms, participants, messages, and code states with proper foreign key relationships
- **Connection**: Neon Database serverless PostgreSQL instance
- **Migrations**: Drizzle Kit for database schema management and migrations

### Authentication & Authorization
- **Session-based**: Simple participant identification using browser storage
- **Room Access**: Code-based room joining with role assignment (interviewer/candidate)
- **Real-time Security**: WebSocket connection validation tied to room membership

### Real-time Communication
- **WebSocket Integration**: Custom WebSocket server handling multiple message types (chat, code updates, participant events)
- **WebRTC Implementation**: Peer-to-peer video/audio communication with STUN server configuration
- **Code Collaboration**: Operational transformation-like system for synchronized code editing
- **Chat System**: Real-time messaging with message persistence and history

## External Dependencies

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless UI components for accessibility and keyboard navigation
- **Monaco Editor**: VS Code-like code editor for collaborative coding sessions
- **Lucide Icons**: Modern icon library for consistent UI elements

### Real-time & Communication
- **WebSocket (ws)**: Native WebSocket implementation for real-time server communication
- **WebRTC**: Browser APIs for peer-to-peer video/audio communication
- **TanStack Query**: Server state synchronization and caching

### Database & Storage
- **Neon Database**: Serverless PostgreSQL hosting service
- **Drizzle ORM**: TypeScript-first ORM with compile-time query validation
- **Drizzle Kit**: Database migration and schema management tools

### Development & Build
- **Vite**: Fast development server and optimized production builds
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast JavaScript bundler for server-side code
- **Replit Integration**: Development environment plugins and error handling