---
title: مرجع أوامر CLI
description: "مرجع CLI لـ OpenPR المدمج في ثنائي openpr-mcp. إدارة المشاريع وعناصر العمل والتعليقات والوسوم والسبرينت مباشرةً من الطرفية."
---

# مرجع أوامر CLI

يتضمن OpenPR واجهة سطر أوامر مدمجة في ثنائي `openpr-mcp`. بالإضافة إلى تشغيل خادم MCP، توفر أوامر لإدارة المشاريع وعناصر العمل والتعليقات والوسوم والسبرينت والمزيد مباشرةً من الطرفية.

## التثبيت

واجهة CLI متاحة كجزء من حزمة `mcp-server`. بعد البناء، الثنائي يُسمى `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## العلامات العامة

تنطبق هذه العلامات على جميع الأوامر:

| العلامة | الوصف | الافتراضي |
|--------|-------|----------|
| `--api-url <URL>` | نقطة نهاية خادم API | `http://localhost:8080` |
| `--bot-token <TOKEN>` | رمز المصادقة (بادئة `opr_`) | -- |
| `--workspace-id <UUID>` | سياق مساحة العمل للعمليات | -- |
| `--format json\|table` | تنسيق المخرجات | `table` |

يمكن أيضاً ضبط هذه عبر متغيرات البيئة:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## الأوامر

### serve -- بدء خادم MCP

شغِّل خادم MCP لتكامل أدوات الذكاء الاصطناعي.

```bash
# HTTP transport (default)
openpr-mcp serve --transport http --port 8090

# Stdio transport (for direct integration)
openpr-mcp serve --transport stdio
```

### projects -- إدارة المشاريع

```bash
# List all projects in the workspace
openpr-mcp projects list --format table

# Get details of a specific project
openpr-mcp projects get <project_id>

# Create a new project
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- إدارة عناصر العمل

```bash
# List work items with filters
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Get a specific work item
openpr-mcp work-items get <id>

# Create a work item
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Update a work item
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Search work items by text
openpr-mcp work-items search --query "authentication"
```

### comments -- إدارة التعليقات

```bash
# List comments on a work item
openpr-mcp comments list --work-item-id <id>

# Add a comment
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- إدارة الوسوم

```bash
# List workspace-level labels
openpr-mcp labels list --workspace

# List project-level labels
openpr-mcp labels list --project-id <id>
```

### sprints -- إدارة السبرينت

```bash
# List sprints for a project
openpr-mcp sprints list --project-id <id>
```

### search -- بحث عام

```bash
# Search across all entities
openpr-mcp search --query "bug"
```

### files -- مرفقات الملفات

```bash
# Upload a file to a work item
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## أمثلة الاستخدام

### سير عمل نموذجي

```bash
# Set up credentials
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# List projects
openpr-mcp projects list

# View todo items for a project
openpr-mcp work-items list --project-id <id> --state todo --format table

# Pick up a work item
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Add a comment when done
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Mark as done
openpr-mcp work-items update <item_id> --state done
```

### مخرجات JSON للبرمجة النصية

استخدم `--format json` للحصول على مخرجات قابلة للقراءة الآلية مناسبة للتوجيه إلى `jq` أو أدوات أخرى:

```bash
# Get all in-progress items as JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Count items by state
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## راجع أيضاً

- [خادم MCP](../mcp-server/) -- تكامل أدوات MCP لوكلاء الذكاء الاصطناعي
- [مرجع API](../api/) -- توثيق REST API الكامل
- [حالات سير العمل](../issues/workflow) -- إدارة حالات المهام وسير العمل المخصص
