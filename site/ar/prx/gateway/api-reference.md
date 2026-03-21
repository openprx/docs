---
title: مرجع API
description: مرجع REST API الكامل لبوابة PRX -- الجلسات، القنوات، hooks، MCP، plugins، skills، الحالة، الإعدادات، والسجلات.
---

# مرجع API

توثّق هذه الصفحة جميع نقاط نهاية REST API التي تعرضها بوابة PRX. الواجهة مبنية على Axum وتستخدم JSON لأجسام الطلبات والاستجابات. جميع نقاط النهاية لها البادئة `/api/v1`.

## Base URL

```
http://127.0.0.1:3120/api/v1
```

يمكن ضبط المضيف والمنفذ:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## المصادقة

جميع نقاط نهاية API تتطلب bearer token ما لم يُذكر خلاف ذلك.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

أنشئ رمزًا عبر:

```bash
prx auth token
```

## الجلسات

إدارة جلسات الوكيل: إنشاء، عرض، فحص، وإنهاء.

### POST /api/v1/sessions

إنشاء جلسة وكيل جديدة.

**الطلب:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**الاستجابة (201):**

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

عرض الجلسات النشطة.

**معاملات الاستعلام:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `String` | `"active"` | التصفية حسب الحالة: `"active"` أو `"idle"` أو `"terminated"` |
| `channel` | `String` | *all* | التصفية حسب اسم القناة |
| `limit` | `usize` | `50` | الحد الأقصى للنتائج المعادة |
| `offset` | `usize` | `0` | إزاحة ترقيم الصفحات |

**الاستجابة (200):**

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

جلب معلومات مفصلة عن جلسة محددة.

**الاستجابة (200):**

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

إنهاء جلسة.

**الاستجابة (204):** لا يوجد محتوى.

## القنوات

الاستعلام عن اتصالات قنوات المراسلة وإدارتها.

### GET /api/v1/channels

عرض جميع القنوات المُعدّة وحالة اتصالها.

**الاستجابة (200):**

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

إعادة تشغيل اتصال قناة محددة.

**الاستجابة (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

فحص سلامة لقناة محددة.

**الاستجابة (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## Hooks

إدارة نقاط نهاية webhook للتكاملات الخارجية.

### GET /api/v1/hooks

عرض webhooks المسجلة.

**الاستجابة (200):**

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

تسجيل webhook جديدة.

**الطلب:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**الاستجابة (201):**

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

إزالة webhook.

**الاستجابة (204):** لا يوجد محتوى.

## MCP

إدارة اتصالات خوادم Model Context Protocol.

### GET /api/v1/mcp

عرض خوادم MCP المتصلة.

**الاستجابة (200):**

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

إعادة الاتصال بخادم MCP.

**الاستجابة (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## Plugins

إدارة إضافات WASM.

### GET /api/v1/plugins

عرض الإضافات المثبتة وحالاتها.

**الاستجابة (200):**

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

إعادة تحميل إضافة (تفريغ ثم تحميل مرة أخرى).

**الاستجابة (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

تعطيل إضافة دون تفريغها.

**الاستجابة (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## Skills

الاستعلام عن مهارات الوكيل المسجلة.

### GET /api/v1/skills

عرض جميع المهارات المتاحة.

**الاستجابة (200):**

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

## الحالة

معلومات حالة النظام وصحته.

### GET /api/v1/status

جلب الحالة العامة للنظام.

**الاستجابة (200):**

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

فحص صحة خفيف (مناسب لفحوصات load balancer).

**الاستجابة (200):**

```json
{
  "healthy": true
}
```

## الإعدادات

قراءة إعدادات وقت التشغيل وتحديثها.

### GET /api/v1/config

جلب إعدادات وقت التشغيل الحالية (تُحجب الأسرار).

**الاستجابة (200):**

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

تحديث قيم الإعدادات أثناء التشغيل. تُطبَّق التغييرات عبر hot-reload.

**الطلب:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**الاستجابة (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

بعض تغييرات الإعدادات تتطلب إعادة تشغيل كاملة ولا يمكن تطبيقها عبر hot-reload. توضّح الاستجابة ذلك عبر القيمة `"reload_required": true`.

## السجلات

الاستعلام عن سجلات الوكيل وبيانات التشخيص.

### GET /api/v1/logs

بث إدخالات السجل الحديثة أو الاستعلام عنها.

**معاملات الاستعلام:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `level` | `String` | `"info"` | الحد الأدنى لمستوى السجل: `"trace"` أو `"debug"` أو `"info"` أو `"warn"` أو `"error"` |
| `module` | `String` | *all* | التصفية حسب اسم الوحدة (مثلًا `"agent"` أو `"channel::telegram"`) |
| `since` | `String` | *1 hour ago* | طابع زمني ISO 8601 أو مدة (مثلًا `"1h"` أو `"30m"`) |
| `limit` | `usize` | `100` | الحد الأقصى للإدخالات المعادة |
| `stream` | `bool` | `false` | عند تفعيلها، تعيد تدفق Server-Sent Events |

**الاستجابة (200):**

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

تدفق Server-Sent Events للتتبع الفوري للسجلات.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## استجابات الأخطاء

تعيد جميع نقاط النهاية الأخطاء بتنسيق موحّد:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `bad_request` | معاملات طلب أو جسم طلب غير صالح |
| 401 | `unauthorized` | bearer token مفقود أو غير صالح |
| 403 | `forbidden` | الرمز لا يملك الصلاحيات المطلوبة |
| 404 | `not_found` | المورد غير موجود |
| 409 | `conflict` | تعارض في حالة المورد (مثلًا الجلسة منتهية مسبقًا) |
| 429 | `rate_limited` | طلبات كثيرة جدًا؛ أعد المحاولة بعد المهلة المحددة |
| 500 | `internal_error` | خطأ خادم غير متوقع |

## تحديد المعدّل

تطبّق API حدود معدل لكل token:

| Endpoint Group | Limit |
|---------------|-------|
| Sessions (write) | 10 requests/second |
| Sessions (read) | 50 requests/second |
| Config (write) | 5 requests/second |
| All other endpoints | 30 requests/second |

تتضمن جميع الاستجابات ترويسات حدود المعدّل:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## صفحات ذات صلة

- [نظرة عامة على البوابة](./)
- [HTTP API](./http-api) -- نظرة عامة على طبقة HTTP API
- [WebSocket](./websocket) -- WebSocket API فوري
- [Webhooks](./webhooks) -- إعداد webhooks الصادرة
- [Middleware](./middleware) -- خط middleware للطلبات/الاستجابات
