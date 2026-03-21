---
title: API მითითება
description: PRX გეითვეის სრული REST API მითითება -- სესიები, არხები, ჰუკები, MCP, დანამატები, უნარები, სტატუსი, კონფიგურაცია და ლოგები.
---

# API მითითება

ეს გვერდი დოკუმენტირებს PRX გეითვეის მიერ გამოქვეყნებულ ყველა REST API ენდფოინთს. API Axum-ზეა აგებული და იყენებს JSON-ს მოთხოვნისა და პასუხის სხეულებისთვის. ყველა ენდფოინთს `/api/v1` პრეფიქსი აქვს.

## საბაზისო URL

```
http://127.0.0.1:3120/api/v1
```

ჰოსტი და პორტი კონფიგურირებადია:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## ავთენტიფიკაცია

ყველა API ენდფოინთი მოითხოვს bearer ტოკენს, თუ სხვაგვარად არ არის მითითებული.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

ტოკენის გენერაცია:

```bash
prx auth token
```

## სესიები

აგენტის სესიების მართვა -- შექმნა, ჩამონათვალი, შემოწმება და შეწყვეტა.

### POST /api/v1/sessions

ახალი აგენტის სესიის შექმნა.

**მოთხოვნა:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**პასუხი (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

აქტიური სესიების ჩამონათვალი.

**შეკითხვის პარამეტრები:**

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `status` | `String` | `"active"` | ფილტრაცია სტატუსით: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *ყველა* | ფილტრაცია არხის სახელით |
| `limit` | `usize` | `50` | დასაბრუნებელი შედეგების მაქსიმუმი |
| `offset` | `usize` | `0` | პაგინაციის ოფსეტი |

**პასუხი (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

კონკრეტული სესიის დეტალური ინფორმაციის მიღება.

**პასუხი (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

სესიის შეწყვეტა.

**პასუხი (204):** შინაარსი არ არის.

## არხები

მესენჯერის არხების კავშირების შეკითხვა და მართვა.

### GET /api/v1/channels

ყველა კონფიგურირებული არხისა და მათი კავშირის სტატუსის ჩამონათვალი.

**პასუხი (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

კონკრეტული არხის კავშირის გადატვირთვა.

**პასუხი (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

კონკრეტული არხის ჯანმრთელობის შემოწმება.

**პასუხი (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## ჰუკები

webhook ენდფოინთების მართვა გარე ინტეგრაციებისთვის.

### GET /api/v1/hooks

რეგისტრირებული webhook-ების ჩამონათვალი.

**პასუხი (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

ახალი webhook-ის რეგისტრაცია.

**მოთხოვნა:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**პასუხი (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

webhook-ის წაშლა.

**პასუხი (204):** შინაარსი არ არის.

## MCP

Model Context Protocol სერვერის კავშირების მართვა.

### GET /api/v1/mcp

დაკავშირებული MCP სერვერების ჩამონათვალი.

**პასუხი (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

MCP სერვერთან ხელახლა დაკავშირება.

**პასუხი (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## დანამატები

WASM დანამატების მართვა.

### GET /api/v1/plugins

დაყენებული დანამატებისა და მათი სტატუსის ჩამონათვალი.

**პასუხი (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

დანამატის ხელახლა ჩატვირთვა (გათიშვა და ხელახლა ჩატვირთვა).

**პასუხი (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

დანამატის გათიშვა გადმოტვირთვის გარეშე.

**პასუხი (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## უნარები

რეგისტრირებული აგენტის უნარების შეკითხვა.

### GET /api/v1/skills

ყველა ხელმისაწვდომი უნარის ჩამონათვალი.

**პასუხი (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## სტატუსი

სისტემის სტატუსისა და ჯანმრთელობის ინფორმაცია.

### GET /api/v1/status

სისტემის ზოგადი სტატუსის მიღება.

**პასუხი (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

მსუბუქი ჯანმრთელობის შემოწმება (შესაფერისი დატვირთვის ბალანსერის პრობებისთვის).

**პასუხი (200):**

```json
{
  "healthy": true
}
```

## კონფიგურაცია

გაშვების კონფიგურაციის წაკითხვა და განახლება.

### GET /api/v1/config

მიმდინარე გაშვების კონფიგურაციის მიღება (საიდუმლოებები დაფარულია).

**პასუხი (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

კონფიგურაციის მნიშვნელობების გაშვების დროს განახლება. ცვლილებები ცხელი გადატვირთვით გამოიყენება.

**მოთხოვნა:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**პასუხი (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

ზოგიერთი კონფიგურაციის ცვლილება სრულ გადატვირთვას მოითხოვს და ვერ გადაიტვირთება ცხლად. პასუხი ამას `"reload_required": true`-ით მიუთითებს.

## ლოგები

აგენტის ლოგებისა და დიაგნოსტიკის შეკითხვა.

### GET /api/v1/logs

ბოლო ლოგ ჩანაწერების სტრიმინგი ან შეკითხვა.

**შეკითხვის პარამეტრები:**

| პარამეტრი | ტიპი | ნაგულისხმევი | აღწერა |
|-----------|------|-------------|--------|
| `level` | `String` | `"info"` | მინიმალური ლოგის დონე: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *ყველა* | ფილტრაცია მოდულის სახელით (მაგ., `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *1 საათის წინ* | ISO 8601 დროის ანაბეჭდი ან ხანგრძლივობა (მაგ., `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | დასაბრუნებელი ჩანაწერების მაქსიმუმი |
| `stream` | `bool` | `false` | true-ისას, აბრუნებს Server-Sent Events სტრიმს |

**პასუხი (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

Server-Sent Events სტრიმი რეალურ დროში ლოგების თვალყურის დევნისთვის.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## შეცდომის პასუხები

ყველა ენდფოინთი შეცდომებს თანმიმდევრულ ფორმატში აბრუნებს:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP სტატუსი | შეცდომის კოდი | აღწერა |
|-------------|--------------|--------|
| 400 | `bad_request` | არასწორი მოთხოვნის პარამეტრები ან სხეული |
| 401 | `unauthorized` | არასრული ან არასწორი bearer ტოკენი |
| 403 | `forbidden` | ტოკენს არ აქვს საჭირო ნებართვები |
| 404 | `not_found` | რესურსი არ არსებობს |
| 409 | `conflict` | რესურსის მდგომარეობის კონფლიქტი (მაგ., სესია უკვე შეწყვეტილია) |
| 429 | `rate_limited` | ძალიან ბევრი მოთხოვნა; ხელახლა ცადეთ მითითებული შეყოვნების შემდეგ |
| 500 | `internal_error` | მოულოდნელი სერვერის შეცდომა |

## სიჩქარის შეზღუდვა

API ტოკენზე სიჩქარის ლიმიტებს აღასრულებს:

| ენდფოინთების ჯგუფი | ლიმიტი |
|--------------------|--------|
| სესიები (ჩაწერა) | 10 მოთხოვნა/წამი |
| სესიები (წაკითხვა) | 50 მოთხოვნა/წამი |
| კონფიგურაცია (ჩაწერა) | 5 მოთხოვნა/წამი |
| ყველა სხვა ენდფოინთი | 30 მოთხოვნა/წამი |

სიჩქარის ლიმიტის ჰედერები ყველა პასუხში შედის:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## დაკავშირებული გვერდები

- [გეითვეის მიმოხილვა](./)
- [HTTP API](./http-api) -- HTTP API ფენის მიმოხილვა
- [WebSocket](./websocket) -- რეალურ დროში WebSocket API
- [შუალედური ფენა](./middleware) -- მოთხოვნის/პასუხის შუალედური ფენის პაიპლაინი
