# GSU SmartAssist – Intelligent University Chatbot

An intelligent chatbot system built for Gwanda State University (GSU) to assist students, staff, and prospective applicants with institutional information including admissions, programmes, fees, academic calendar, library services, ICT support, and general enquiries.

---

## Table of Contents

- [Overview](#overview)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Docker Setup](#docker-setup)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Testing](#testing)
- [Challenges Faced](#challenges-faced)
- [Future Improvements](#future-improvements)

---

## Overview

GSU SmartAssist is a full-stack web application consisting of a Django REST API backend and a React frontend. Users can interact with the chatbot through a clean chat interface, browse FAQs grouped by category, and administrators can manage the knowledge base and review chat logs through a protected admin dashboard.

The chatbot uses a two-stage response strategy. First, keyword-based matching searches the knowledge base for a strong answer. If no confident match is found, the message is escalated to the Groq AI API (LLaMA 3) with relevant FAQs injected as context. Conversation history is maintained using a sliding window of the last 10 messages, giving the AI memory of the current conversation without unbounded token growth. All conversations are logged for admin review.

---

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://gsu-chatbot-assessment.vercel.app |
| Backend API | https://gsu-chatbot-assessment-production.up.railway.app/api |

---

## Architecture

```
User/Admin Browser
      │
      ▼
React Frontend (Vite)
  - Chat UI (with conversation history)
  - FAQ Page
  - Admin Dashboard
  - JWT stored in localStorage
      │
      │ HTTP (REST API)
      ▼
Django REST Framework Backend
  - chat app   → POST /api/chat/, GET /api/admin/chat-logs/
  - faq app    → GET /api/faqs/, POST/PUT/DELETE /api/admin/faqs/
  - JWT Auth   → POST /api/token/
      │              │
      ▼              ▼
SQLite Database    Groq AI API (LLaMA 3)
  - Users +          - Fallback when keyword
    Profiles           matching finds no
  - KnowledgeBase      confident answer
  - ChatSessions     - FAQs injected as context
```

The backend is structured as a **modular monolith** — separate Django apps (`chat`, `faq`) enforce clean separation of concerns while sharing a single database and deployment. This is intentional: for a university chatbot at this scale, a monolith is simpler to build, debug, and deploy than microservices, while still being organized enough to extract services later if needed.

See `docs/architecture-diagram.png` for a visual overview.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | Django + Django REST Framework | Mature, batteries-included, clean ORM |
| Authentication | JWT (djangorestframework-simplejwt) | Stateless, secure, industry standard |
| Database (dev) | SQLite | Zero-config for local development |
| Database (prod) | PostgreSQL | Concurrent writes, better performance at scale |
| Frontend | React (Vite) | Fast dev server, component-based UI |
| HTTP Client | Axios | Interceptors for automatic token attachment and 401 handling |
| Routing | React Router DOM | Client-side navigation with protected routes |
| Rate Limiting | Django cache-based (built-in) | No extra dependencies, limits chat endpoint to 10 req/min per IP |
| AI | Groq API (LLaMA 3) | Free tier, fast inference, OpenAI-compatible SDK |
| Charts | Recharts | Lightweight React charting library |
| Input Sanitization | Bleach | Strips HTML/script tags from user input |
| Production Server | Gunicorn | Production-grade WSGI server for Django |
| Static Files | Whitenoise | Serves static files without a separate web server |
| Containerization | Docker + Docker Compose | Consistent environments, single command startup |
| Frontend Hosting | Vercel | Free tier, automatic deploys from GitHub |
| Backend Hosting | Railway | Free tier, supports Dockerfile and PostgreSQL |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/cavy111/gsu-chatbot-assessment.git
cd gsu-chatbot-assessment
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create admin superuser
python manage.py createsuperuser

```bash
# Load sample FAQ data
python manage.py loaddata faq/fixtures/faqs.json

# Create a .env file in the backend folder
echo GROQ_API_KEY=your-groq-api-key-here > .env

# Start backend server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

### 3. Frontend setup

```bash
cd frontend

# create environment file
echo VITE_API_URL=http://127.0.0.1:8000/api > .env

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## Docker Setup

Docker runs the entire stack — backend, frontend, and PostgreSQL database — with a single command.

### Prerequisites

- Docker Desktop installed and running
- `.wslconfig` created at `C:\Users\YOUR_USERNAME\.wslconfig` (Windows only) to cap memory usage:

```
[wsl2]
memory=4GB
processors=2
swap=2GB
```

# Create a .env file in the backend folder
```
GROQ_API_KEY=your-groq-api
DB_NAME=gsu_chatbot
DB_USER=gsu_user
DB_PASSWORD=gsu_password
DB_HOST=db
DB_PORT=5432
```

### Run with Docker

```bash
# from the project root
docker-compose up --build   # first time or after dependency changes
docker-compose up           # subsequent runs
docker-compose up -d        # run in background
docker-compose down         # stop all containers
```

### Run migrations inside Docker

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py loaddata faq/fixtures/faqs.json
```

### View logs

```bash
docker-compose logs -f backend    # backend logs
docker-compose logs -f frontend   # frontend logs
docker-compose logs -f            # all containers
```

Services run at:
- Frontend → `http://localhost`
- Backend → `http://localhost:8000`

---

## Database Setup

The project uses Django's ORM with SQLite for development. Migrations are included in the repository.

### Models

**Profile** (extends Django's built-in User)
| Field | Type | Description |
|-------|------|-------------|
| user | OneToOneField | Link to Django User |
| role | CharField | admin, student, or staff |

**KnowledgeBase**
| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| category | CharField | e.g. Admissions, Fees, Library |
| question | TextField | The FAQ question |
| answer | TextField | The FAQ answer |
| keywords | CharField | Comma-separated keywords for matching |

**ChatSession**
| Field | Type | Description |
|-------|------|-------------|
| id | AutoField | Primary key |
| session_id | CharField | Groups messages per conversation |
| message | TextField | User's message |
| response | TextField | Bot's response |
| timestamp | DateTimeField | Auto-set on creation |

### Switching to PostgreSQL (production)

In production the app automatically uses PostgreSQL via the `DATABASE_URL` environment variable provided by Railway. The `dj-database-url` package parses this into Django's database config automatically:

```python
import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL)}
else:
    # falls back to local PostgreSQL config for Docker
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'gsu_chatbot'),
            'USER': os.getenv('DB_USER', 'gsu_user'),
            'PASSWORD': os.getenv('DB_PASSWORD', 'gsu_password'),
            'HOST': os.getenv('DB_HOST', 'db'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }
```

---

## API Documentation

### Authentication

All admin endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

#### Obtain token (Login)

```
POST /api/token/
```

Request body:
```json
{
  "username": "admin",
  "password": "yourpassword"
}
```

Response:
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>"
}
```

#### Refresh token

```
POST /api/token/refresh/
```

Request body:
```json
{
  "refresh": "<refresh_token>"
}
```

---

### Chat

#### Send a message

```
POST /api/chat/
```

Public endpoint. Rate limited to 10 requests per minute per IP.

The chat logic uses a two-stage strategy: keyword matching is tried first against the knowledge base. If no strong match is found, the message is sent to the Groq AI API with the top 3 relevant FAQs and the last 10 messages of conversation history as context.

Request body:
```json
{
  "message": "How do I apply for admission?",
  "session_id": "session-123",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hello! How can I help you?" }
  ]
}
```

Response:
```json
{
  "response": "You can apply online at the GSU admissions portal...",
  "session_id": "session-123"
}
```

Error (rate limit exceeded):
```json
{
  "error": "Too many requests. Please slow down and try again in a minute."
}
```
Status: `429 Too Many Requests`

---

### FAQs

#### Get all FAQs (public)

```
GET /api/faqs/
```

Response:
```json
[
  {
    "id": 1,
    "category": "Admissions",
    "question": "How do I apply for admission?",
    "answer": "You can apply online at the GSU admissions portal...",
    "keywords": "apply, admission, application, register, enroll"
  }
]
```

#### Create FAQ (admin only)

```
POST /api/admin/faqs/
```

Request body:
```json
{
  "category": "Fees",
  "question": "How much are tuition fees?",
  "answer": "Tuition fees vary by programme...",
  "keywords": "fees, tuition, cost, payment"
}
```

#### Update FAQ (admin only)

```
PUT /api/admin/faqs/{id}/
```

Request body: same as create.

#### Delete FAQ (admin only)

```
DELETE /api/admin/faqs/{id}/
```

Response: `204 No Content`

---

### Chat Logs

#### Get all chat logs (admin only)

```
GET /api/admin/chat-logs/
```

Response:
```json
[
  {
    "session_id": "session-123",
    "message": "How do I apply?",
    "response": "You can apply online...",
    "timestamp": "2024-01-15T10:30:00Z"
  }
]
```

### Analytics

#### Get analytics data (admin only)

```
GET /api/admin/analytics/
```

Response:
```json
{
  "summary": {
    "total_messages": 42,
    "total_sessions": 15,
    "unmatched_queries": 8
  },
  "messages_over_time": [
    { "date": "2024-01-15", "messages": 10 }
  ],
  "topics": [
    { "topic": "Admissions", "count": 18 }
  ],
  "messages_per_session": [
    { "session": "session-123...", "messages": 5 }
  ]
}
```

## Security

The following security measures are implemented:

**Authentication** — All admin endpoints are protected with JWT tokens. Unauthenticated requests return 401, non-admin requests return 403.

**Input sanitization** — User messages are sanitized using `bleach` before processing and storage, stripping any HTML or script tags to prevent XSS.

**Rate limiting** — The public chat endpoint is limited to 10 requests per minute per IP using Django's built-in cache framework. Exceeding the limit returns a 429 response.

**SQL injection** — Django's ORM automatically parameterizes all queries. No raw SQL is used anywhere in the codebase.

**CORS** — In development all origins are allowed. In production CORS is restricted to the specific Vercel frontend domain via the `CORS_ALLOWED_ORIGINS` environment variable.

**Secret management** — All sensitive values (API keys, database credentials, secret key) are stored in environment variables and never committed to version control. `.env` is in `.gitignore`.

**Token expiry handling** — The Axios response interceptor automatically clears expired tokens from localStorage and redirects to the login page on any 401 response.

---

## Testing

Unit tests cover the security-sensitive components of the application. Run tests with:

```bash
python manage.py test
```

Tests cover:
- Chat endpoint returns a valid response
- Keyword matching returns the correct FAQ answer
- Admin FAQ endpoint rejects unauthenticated requests (401)
- Admin FAQ endpoint rejects non-admin users (403)
- Admin FAQ endpoint allows admin users (201)
- Chat logs endpoint rejects unauthenticated requests (401)

---

## Challenges Faced

**Keyword matching accuracy** — Simple keyword matching works well for exact or near-exact matches but struggles with phrasing variations. For example, "what does it cost to study" may not match a FAQ with keywords like "fees, tuition, payment". This was mitigated by lowering the match threshold and always passing the top 3 FAQs as context to the AI even for partial matches.

**OpenAI no longer offers a free API tier** — The initial plan was to use OpenAI for AI responses. After discovering the free tier was discontinued, the project was switched to Groq (LLaMA 3) which offers a generous free tier with fast inference and an OpenAI-compatible SDK, requiring minimal code changes.

**AI context and conversation memory** — Without conversation history, the AI treated every message as a new conversation with no memory of previous messages. This was solved by maintaining a sliding window of the last 10 messages in React state and sending it with each request, giving the AI continuous context without unbounded token growth.

**django-ratelimit compatibility on Windows** — The `django-ratelimit` package failed to import despite being installed correctly on Windows. This was resolved by implementing a custom cache-based rate limiter using Django's built-in cache framework, which achieves the same result without external dependencies.

**CORS in production** — Setting `CORS_ALLOW_ALL_ORIGINS = True` works in development but is a security risk in production. This was resolved by tying the setting to the `DEBUG` flag and using the `CORS_ALLOWED_ORIGINS` environment variable to explicitly list allowed origins in production.

**Docker and Python version mismatch** — Django 6.0.2 requires Python 3.12 but the Dockerfile was using `python:3.11-slim`, causing the pip install to fail. This was resolved by updating the Dockerfile base image to `python:3.12-slim`.

**Railway internal database URL** — Running `railway run` migrations locally failed because Railway's internal database URL (`postgres.railway.internal`) is only accessible from within Railway's network. This was resolved by using the public database URL for local migration runs.

**Frontend environment variable missing protocol** — The `VITE_API_URL` on Vercel was set without `https://`, causing Axios to treat the Railway URL as a relative path and append it to the Vercel domain. Adding the full protocol fixed all API requests.

---

## Future Improvements

**Semantic search with embeddings** — Replace keyword matching with vector embeddings stored in pgvector. This would allow matching based on meaning rather than exact keywords, so "how much does it cost to study" and "what are the tuition fees" would match the same FAQ without needing to manually specify keywords.

**AI response streaming** — Stream Groq responses token by token to the frontend so the user sees the answer appearing in real time rather than waiting for the full response.

**WebSocket support** — Replace the request/response HTTP pattern with WebSockets for a more real-time chat feel, especially useful combined with response streaming.

**Multilingual support** — Add support for Shona and Ndebele to serve the broader Zimbabwean student population.

**Redis cache** — Replace Django's in-memory cache with Redis for rate limiting and session storage, enabling the app to scale across multiple server processes.

**Full test coverage** — Expand unit and integration tests to cover all endpoints, edge cases, and the AI fallback logic.