# Virtual Conference Translator & Summarizer

A production-ready, real-time multilingual captioning and summarization platform for virtual conferences, built with modern web technologies and AI integration.

#  Features

# Core Functionality
- **Real-time Multilingual Captions**: Live speech-to-text with instant translation
- **Interactive Chat & Q&A**: Real-time messaging with moderator controls
- **AI-Powered Summaries**: Rolling summaries, key points extraction, and final reports
- **Role-Based Access**: Viewer, Moderator, and Host permissions
-  **Multi-language Support**: Support for 10+ languages with automatic detection

# Technical Features
- **WebSocket Streaming**: Sub-3-second latency for real-time updates
- **Modular AI Agents**: Separate services for transcription, translation, and summarization
- **PostgreSQL Database**: Robust data persistence with optimized queries
- **JWT Authentication**: Secure session management with OAuth integration
- **Docker Ready**: Containerized deployment with GPU support

##  Architecture

# Frontend (React + Tailwind CSS)

frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Main application dashboard
│   │   ├── CaptionsPanel.js      # Real-time captions display
│   │   ├── ChatPanel.js          # Chat and Q&A interface
│   │   ├── SummaryDashboard.js   # AI-generated summaries
│   │   └── LanguageSelector.js   # Language preferences
│   ├── App.js                    # Main application component
│   └── index.js                  # Application entry point
```

### Backend (Node.js + Express)

backend/
├── server.js                     # Main server file
├── routes/
│   ├── auth.js                   # Authentication routes
│   ├── sessions.js               # Session management
│   └── transcripts.js            # Transcript and summary routes
├── services/
│   └── geminiService.js          # Google Gemini AI integration
├── middleware/                   # Custom middleware
└── config/                       # Configuration files


### Database (PostgreSQL)
- **users**: User accounts and authentication
- **sessions**: Conference sessions and metadata
- **session_participants**: Session attendance tracking
- **transcripts**: Speech-to-text transcripts with timestamps
- **summaries**: AI-generated summaries and key points
- **language_preferences**: User language settings

## 🛠️ Tech Stack

### Frontend
- **React 18** - Functional components with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time WebSocket communication
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing

### Backend
- **Node.js 18** - Server runtime
- **Express.js** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **Passport.js** - OAuth integration (Google/GitHub)

### AI & ML
- **Google Gemini** - Multi-modal AI for transcription, translation, and summarization
- **Modular Agents** - Separate services for different AI tasks
- **Context Awareness** - Maintains conversation context for better results

## 📋 Prerequisites

- **Node.js 18+**
- **PostgreSQL 13+**
- **npm or yarn**
- **Google Gemini API Key** (for AI features)
- **Git**

## 🚀 Quick Start

### 1. Clone and Setup
```bash
git clone <repository-url>
cd virtual-conference-translator
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb virtual_conference

# Run schema
psql -d virtual_conference -f database/schema.sql
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### 6. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## 🐳 Docker Deployment

### Build and Run
```bash
# Build Docker image
docker build -t virtual-conference-translator .

# Run container
docker run -p 5000:5000 --env-file .env virtual-conference-translator
```

### Docker Compose (Production)
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: virtual_conference
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/github` - GitHub OAuth

### Session Endpoints
- `GET /api/sessions` - List user sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/join` - Join session
- `POST /api/sessions/:id/leave` - Leave session

### Transcript Endpoints
- `GET /api/transcripts/session/:sessionId` - Get session transcripts
- `POST /api/transcripts` - Add new transcript
- `GET /api/transcripts/session/:sessionId/summaries` - Get session summaries
- `POST /api/transcripts/summaries` - Generate new summary

## Security Features

- **JWT Authentication** with secure token handling
- **OAuth Integration** for Google and GitHub login
- **Role-Based Access Control** (Viewer/Moderator/Host)
- **Input Validation** and sanitization
- **Rate Limiting** on API endpoints
- **CORS Configuration** for cross-origin requests
- **Environment Variable** management for secrets

##  Performance Optimizations

- **WebSocket Connection Pooling** for real-time updates
- **Database Query Optimization** with proper indexing
- **Caching Layer** for frequently accessed data
- **Lazy Loading** for components and data
- **Code Splitting** for reduced bundle size
- **Compression** for API responses

##  Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests (if implemented)
npm run test:e2e
```

## Monitoring & Logging

- **Structured Logging** with Winston
- **Health Check Endpoints** for service monitoring
- **Error Tracking** with Sentry integration
- **Performance Metrics** with custom middleware
- **Database Connection Pooling** monitoring

##  Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema migrated
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] CDN setup for static assets
- [ ] Monitoring tools configured
- [ ] Backup strategy implemented
- [ ] Load balancer configured

##  Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Google Gemini for AI capabilities
- Socket.IO for real-time communication
- Tailwind CSS for styling
- PostgreSQL for data persistence






