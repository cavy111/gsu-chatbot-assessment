# GSU SmartAssist – Intelligent University Chatbot

An intelligent chatbot system built for Gwanda State University (GSU) to assist students, staff, and prospective applicants with institutional information including admissions, programmes, fees, academic calendar, library services, ICT support, and general enquiries.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Setup Instructions](#setup-instructions)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Challenges Faced](#challenges-faced)
- [Future Improvements](#future-improvements)

---

## Overview

GSU SmartAssist is a full-stack web application consisting of a Django REST API backend and a React frontend. Users can interact with the chatbot through a clean chat interface, browse FAQs grouped by category, and administrators can manage the knowledge base and review chat logs through a protected admin dashboard.

The chatbot uses keyword-based matching to find relevant answers from a structured knowledge base. Each user message is matched against FAQ keywords stored in the database, and the most relevant answer is returned. All conversations are logged for admin review.

---

## Architecture

```
User/Admin Browser
      │
      ▼
React Frontend (Vite)
  - Chat UI
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
      │
      ▼
SQLite Database
  - Users + Profiles (role-based)
  - KnowledgeBase (FAQ store)
  - ChatSessions (conversation logs)
```

The backend is structured as a **modular monolith** — separate Django apps (`chat`, `faq`) enforce clean separation of concerns while sharing a single database and deployment. This is intentional: for a university chatbot at this scale, a monolith is simpler to build, debug, and deploy than microservices, while still being organized enough to extract services later if needed.

See `docs/architecture-diagram.png` for a visual overview.

---

## Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | Django + Django REST Framework | Mature, batteries-included, clean ORM |
| Authentication | JWT (djangorestframework-simplejwt) | Stateless, secure, industry standard |
| Database | SQLite (dev) | Zero-config for MVP; swap to PostgreSQL for production |
| Frontend | React (Vite) | Fast dev server, component-based UI |
| HTTP Client | Axios | Interceptors for automatic token attachment |
| Routing | React Router DOM | Client-side navigation |
| Rate Limiting | Django cache-based (built-in) | No extra dependencies, limits chat endpoint to 10 req/min per IP |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/gsu-chatbot-assessment.git
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

# Create admin profile
python manage.py shell
```

In the shell, run:

```python
from django.contrib.auth.models import User
from chat.models import Profile
user = User.objects.first()
Profile.objects.create(user=user, role='admin')
exit()
```

```bash
# Load sample FAQ data
python manage.py loaddata faq/fixtures/faqs.json

# Start backend server
python manage.py runserver
```

Backend runs at: `http://127.0.0.1:8000`

### 3. Frontend setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

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

In `core/settings.py`, replace the DATABASES config with:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'gsu_chatbot',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

Then run `pip install psycopg2-binary` and `python manage.py migrate`.

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

Request body:
```json
{
  "message": "How do I apply for admission?",
  "session_id": "session-123"
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

---

## Challenges Faced

**Keyword matching accuracy** — Simple keyword matching works well for exact or near-exact matches but struggles with phrasing variations. For example, "what does it cost to study" may not match a FAQ with keywords like "fees, tuition, payment". This was partially mitigated by encouraging broad keyword coverage in each FAQ entry.

**django-ratelimit compatibility on Windows** — The `django-ratelimit` package failed to import despite being installed correctly on Windows. This was resolved by implementing a custom cache-based rate limiter using Django's built-in cache framework, which achieves the same result without external dependencies.

**CORS configuration** — During development, the React frontend and Django backend run on different ports (5173 and 8000), which triggers CORS errors. This was resolved using `django-cors-headers` with `CORS_ALLOW_ALL_ORIGINS = True` for development. In production this should be locked down to the specific frontend domain.

---

## Future Improvements

**AI/NLP integration** — Integrate the OpenAI API to handle questions that don't match any keywords. The current keyword matching would serve as a first-pass filter; unmatched questions would be escalated to the AI with relevant FAQs injected as context (Retrieval Augmented Generation / RAG pattern).

**Semantic search with embeddings** — Store vector embeddings for each FAQ using OpenAI's embeddings API and pgvector. This would allow matching based on meaning rather than exact keywords, so "how much does it cost to study" and "what are the tuition fees" would match the same FAQ.

**WebSocket support** — Replace the request/response HTTP pattern with WebSockets for a more real-time chat feel, especially useful if AI response streaming is added.

**Multilingual support** — Add support for Shona and Ndebele to serve the broader Zimbabwean student population.

**Analytics dashboard** — Add charts to the admin panel showing message volume over time, most asked questions, and unmatched query patterns to help administrators improve the knowledge base.

**Redis cache** — Replace Django's in-memory cache with Redis for rate limiting and session storage, enabling the app to scale across multiple server processes.

**Docker deployment** — Containerise the backend and frontend with Docker Compose for consistent, reproducible deployments.

**PostgreSQL in production** — Migrate from SQLite to PostgreSQL for concurrent write support and better performance at scale.