# Jobillo - Simple Interview Platform

A basic, no-login interview platform for conducting simple video interviews with real-time chat.

## Features

- **No Login Required** - Just create a room and share the code
- **Live Video Streaming** - Real camera access with video preview
- **Face Analysis & Monitoring** - AI-powered detection of interview malpractice
- **Real-time Chat** - Instant messaging during interviews
- **Room-based Sessions** - Easy room creation and joining with 6-digit codes
- **Role-based Access** - Interviewer and candidate roles
- **Violation Tracking** - Monitor and report suspicious behavior

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or bun

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Download face detection models:
   ```bash
   npm run setup-models
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to `http://localhost:5000`

## Usage

### Creating an Interview Room

1. Go to the landing page
2. Click "Create Room" tab
3. Enter your name and interview title
4. Click "Create Interview Room"
5. Share the 6-digit room code with the candidate

### Joining an Interview

1. Go to the landing page
2. Click "Join Room" tab
3. Enter your name and the room code
4. Click "Join Interview"

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Express backend
├── shared/                 # Shared types and schemas
└── package.json
```

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter (routing)
- **Backend**: Express.js, WebSocket (ws)
- **Database**: SQLite with Drizzle ORM
- **UI Components**: Radix UI primitives
- **Build Tool**: Vite

## API Endpoints

- `POST /api/rooms` - Create a new interview room
- `POST /api/rooms/:code/join` - Join a room with a code
- `GET /api/rooms/:id` - Get room details
- `POST /api/violations` - Report face analysis violations
- `WebSocket /ws` - Real-time communication and violation alerts

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run db:push` - Push database schema
- `npm run setup-models` - Download face detection models

## Face Analysis Features

### Detection Capabilities
- **Multiple Face Detection** - Alerts when more than one person is detected
- **Face Absence Monitoring** - Flags when candidate leaves camera view
- **Gaze Tracking** - Detects when candidate looks away from camera
- **Head Movement Analysis** - Monitors unusual head turning patterns
- **Real-time Violations** - Live alerts for suspicious behavior

### Privacy & Security
- **Client-side Processing** - Face analysis runs in the browser
- **No Face Data Storage** - Only violation metadata is logged
- **Mandatory for Candidates** - Face monitoring automatically enabled for all candidates
- **Transparent Alerts** - All violations are visible to participants

### Usage
1. **Candidates**: Join an interview room and allow camera access
2. **Candidates**: Face analysis automatically starts (mandatory)
3. **Candidates**: Violations are tracked and displayed in real-time
4. **Interviewers**: Receive alerts about candidate violations automatically
5. **Note**: Face analysis is mandatory for candidates, not available for interviewers

### Adding Features

The platform is designed to be simple and extensible. Key areas for enhancement:

1. **WebRTC Integration** - Implement peer-to-peer video calls
2. **File Sharing** - Add document/code sharing capabilities  
3. **Recording** - Add interview recording functionality
4. **Authentication** - Add user accounts and authentication
5. **Advanced ML Models** - More sophisticated behavior analysis
6. **Scheduling** - Add interview scheduling features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details