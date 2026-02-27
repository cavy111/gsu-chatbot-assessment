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