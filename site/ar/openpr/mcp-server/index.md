---
title: خادم MCP
description: "يتضمن OpenPR خادم MCP مدمجاً بـ 34 أداة عبر بروتوكولات HTTP وstdio وSSE. دمج مساعدي الذكاء الاصطناعي كـ Claude وCodex وCursor مع إدارة مشاريعك."
---

# خادم MCP

يتضمن OpenPR **خادم MCP (بروتوكول سياق النموذج)** مدمجاً يوفر 34 أداة لمساعدي الذكاء الاصطناعي لإدارة المشاريع والمهام والسبرينت والوسوم والتعليقات والمقترحات والملفات. يدعم الخادم ثلاثة بروتوكولات نقل في آنٍ واحد.

## بروتوكولات النقل

| البروتوكول | حالة الاستخدام | نقطة النهاية |
|-----------|------------|------------|
| **HTTP** | تكاملات الويب، إضافات OpenClaw | `POST /mcp/rpc` |
| **stdio** | Claude Desktop، Codex، CLI محلي | stdin/stdout JSON-RPC |
| **SSE** | عملاء البث، واجهات الوقت الفعلي | `GET /sse` + `POST /messages` |

::: tip متعدد البروتوكولات
في وضع HTTP، تتوفر الثلاثة بروتوكولات على منفذ واحد: `/mcp/rpc` (HTTP)، `/sse` + `/messages` (SSE)، و`/health` (فحص الصحة).
:::

## الإعداد

### متغيرات البيئة

| المتغير | مطلوب | الوصف | مثال |
|---------|-------|-------|------|
| `OPENPR_API_URL` | نعم | رابط أساس خادم API | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | نعم | رمز البوت بادئة `opr_` | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | نعم | UUID مساحة العمل الافتراضية | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

أضِف إلى إعداد عميل MCP الخاص بك:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### وضع HTTP

```bash
# Start the MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Verify
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### وضع SSE

```bash
# 1. Connect SSE stream (returns session endpoint)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. POST request to the returned endpoint
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Response arrives via SSE stream as event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## مرجع الأدوات (34 أداة)

### المشاريع (5)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `projects.list` | -- | سرد جميع المشاريع في مساحة العمل |
| `projects.get` | `project_id` | الحصول على تفاصيل المشروع مع أعداد المهام |
| `projects.create` | `key`, `name` | إنشاء مشروع |
| `projects.update` | `project_id` | تحديث الاسم/الوصف |
| `projects.delete` | `project_id` | حذف مشروع |

### عناصر العمل / المهام (11)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `work_items.list` | `project_id` | سرد المهام في مشروع |
| `work_items.get` | `work_item_id` | الحصول على مهمة بـ UUID |
| `work_items.get_by_identifier` | `identifier` | الحصول بمعرف بشري (مثل `API-42`) |
| `work_items.create` | `project_id`, `title` | إنشاء مهمة مع حالة اختيارية وأولوية ووصف وmassignee_id وdue_at ومرفقات |
| `work_items.update` | `work_item_id` | تحديث أي حقل |
| `work_items.delete` | `work_item_id` | حذف مهمة |
| `work_items.search` | `query` | بحث نصي كامل عبر جميع المشاريع |
| `work_items.add_label` | `work_item_id`, `label_id` | إضافة وسم واحد |
| `work_items.add_labels` | `work_item_id`, `label_ids` | إضافة وسوم متعددة |
| `work_items.remove_label` | `work_item_id`, `label_id` | إزالة وسم |
| `work_items.list_labels` | `work_item_id` | سرد وسوم مهمة |

### التعليقات (3)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `comments.create` | `work_item_id`, `content` | إنشاء تعليق مع مرفقات اختيارية |
| `comments.list` | `work_item_id` | سرد تعليقات مهمة |
| `comments.delete` | `comment_id` | حذف تعليق |

### الملفات (1)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `files.upload` | `filename`, `content_base64` | رفع ملف (base64)، يُعيد URL واسم الملف |

### الوسوم (5)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `labels.list` | -- | سرد جميع وسوم مساحة العمل |
| `labels.list_by_project` | `project_id` | سرد وسوم مشروع |
| `labels.create` | `name`, `color` | إنشاء وسم (اللون: hex، مثل `#2563eb`) |
| `labels.update` | `label_id` | تحديث الاسم/اللون/الوصف |
| `labels.delete` | `label_id` | حذف وسم |

### السبرينت (4)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `sprints.list` | `project_id` | سرد السبرينتات في مشروع |
| `sprints.create` | `project_id`, `name` | إنشاء سبرينت مع start_date وend_date اختياريتين |
| `sprints.update` | `sprint_id` | تحديث الاسم/التواريخ/الحالة |
| `sprints.delete` | `sprint_id` | حذف سبرينت |

### المقترحات (3)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `proposals.list` | `project_id` | سرد المقترحات مع تصفية اختيارية بالحالة |
| `proposals.get` | `proposal_id` | الحصول على تفاصيل مقترح |
| `proposals.create` | `project_id`, `title`, `description` | إنشاء مقترح حوكمة |

### الأعضاء والبحث (2)

| الأداة | المعاملات المطلوبة | الوصف |
|--------|-----------------|-------|
| `members.list` | -- | سرد أعضاء مساحة العمل وأدوارهم |
| `search.all` | `query` | بحث عام عبر المشاريع والمهام والتعليقات |

## تنسيق الاستجابة

جميع استجابات أدوات MCP تتبع هذا الهيكل:

### نجاح

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### خطأ

```json
{
  "code": 400,
  "message": "error description"
}
```

## مصادقة رمز البوت

يصادق خادم MCP عبر **رموز البوت** (بادئة `opr_`). أنشئ رموز البوت في **Workspace Settings** > **Bot Tokens**.

كل رمز بوت:
- له اسم عرض (يُظهَر في خلاصات النشاط)
- مُقيَّد بمساحة عمل واحدة
- ينشئ كيان مستخدم `bot_mcp` لسلامة سجل التدقيق
- يدعم جميع عمليات القراءة/الكتابة المتاحة لأعضاء مساحة العمل

## تكامل الوكيل

لوكلاء البرمجة، يوفر OpenPR:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- أنماط سير العمل وأمثلة الأدوات للوكلاء.
- **حزمة المهارة** (`skills/openpr-mcp/SKILL.md`) -- مهارة محكومة مع قوالب سير عمل ونصوص.

سير عمل الوكيل الموصى به:
1. حمِّل `AGENTS.md` لدلالات الأدوات.
2. استخدم `tools/list` لتعداد الأدوات المتاحة في وقت التشغيل.
3. اتبع أنماط سير العمل: بحث -> إنشاء -> وسم -> تعليق.

## الخطوات التالية

- [نظرة عامة على API](../api/) -- مرجع REST API
- [الأعضاء والصلاحيات](../workspace/members) -- إدارة رموز البوت
- [الإعداد](../configuration/) -- جميع متغيرات البيئة
