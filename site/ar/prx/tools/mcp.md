---
title: تكامل MCP
description: عميل Model Context Protocol للاتصال بخوادم MCP الخارجية عبر stdio أو HTTP مع اكتشاف ديناميكي للأدوات وتوزيعها ضمن مساحات أسماء.
---

# تكامل MCP

ينفّذ PRX عميل Model Context Protocol (MCP) يتصل بخوادم MCP خارجية ويعرض أدواتها للوكيل. MCP هو بروتوكول مفتوح يوحّد طريقة تواصل تطبيقات LLM مع مزودي الأدوات الخارجية، ما يتيح لـ PRX الاندماج مع منظومة متنامية من خوادم متوافقة مع MCP لأنظمة الملفات وقواعد البيانات وواجهات API وغيرها.

أداة `mcp` مقيّدة بميزة وتتطلب `mcp.enabled = true` مع تعريف خادم واحد على الأقل. يدعم PRX كلًا من نقل stdio (تواصل مع عملية محلية) ونقل HTTP (تواصل مع خادم بعيد). تُكتشف أدوات خوادم MCP ديناميكيًا وقت التشغيل عبر طريقة البروتوكول `tools/list`، وتُوزّع ضمن مساحات أسماء لتجنب التعارض مع الأدوات المدمجة.

يدعم PRX أيضًا اكتشاف ملف `mcp.json` المحلي داخل مساحة العمل بنفس التنسيق المستخدم في VS Code وClaude Desktop، ما يسهل مشاركة إعدادات خوادم MCP عبر الأدوات.

## الإعداد

### تعريف الخوادم في config.toml

عرّف خوادم MCP تحت القسم `[mcp.servers]`:

```toml
[mcp]
enabled = true

# ── Stdio transport (local process) ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── HTTP transport (remote server) ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### إعداد كل خادم

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل هذا الخادم |
| `transport` | `string` | `"stdio"` | نوع النقل: `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | الأمر لنقل stdio (مثل `"npx"`, `"uvx"`, `"node"`) |
| `args` | `string[]` | `[]` | معاملات أمر stdio |
| `url` | `string` | -- | URL لنقل HTTP |
| `env` | `map` | `{}` | متغيرات البيئة لعملية stdio |
| `startup_timeout_ms` | `u64` | `10000` | أقصى وقت انتظار لبدء الخادم |
| `request_timeout_ms` | `u64` | `30000` | مهلة كل طلب |
| `tool_name_prefix` | `string` | `"mcp"` | بادئة أسماء الأدوات (مثل `"fs"` ينتج `"fs_read_file"`) |
| `allow_tools` | `string[]` | `[]` | قائمة سماح الأدوات (الفارغة = السماح بكل الأدوات المكتشفة) |
| `deny_tools` | `string[]` | `[]` | قائمة حظر الأدوات (لها أولوية على قائمة السماح) |

### mcp.json المحلي في مساحة العمل

يكتشف PRX خوادم MCP من ملف `mcp.json` محلي في مساحة العمل، بنفس تنسيق VS Code وClaude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

ضع هذا الملف في جذر مساحة العمل. يفحص PRX وجود `mcp.json` عند بدء التشغيل وعند تحديث الأدوات.

**قائمة السماح للمشغلات الآمنة**: الأوامر في `mcp.json` مقيّدة بقائمة سماح لمشغلات آمنة:

| Launcher | Language / Platform |
|----------|-------------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

تُرفض الأوامر غير الموجودة في هذه القائمة لمنع تنفيذ أوامر عشوائية عبر ملفات `mcp.json`.

## الاستخدام

### الاكتشاف الديناميكي للأدوات

تُكتشف أدوات MCP تلقائيًا عندما يتصل عميل MCP بالخوادم. ويراها الوكيل كأدوات عادية في سجل الأدوات:

```
Available MCP tools:
  fs_read_file          - Read the contents of a file
  fs_write_file         - Write content to a file
  fs_list_directory     - List directory contents
  gh_create_issue       - Create a GitHub issue
  gh_search_code        - Search code on GitHub
  sql_query             - Execute a SQL query
  sql_list_tables       - List database tables
```

### مساحات أسماء الأدوات

تُضاف بادئة `tool_name_prefix` لكل خادم MCP إلى أدواته لتجنب تعارض الأسماء:

- الخادم `filesystem` مع البادئة `"fs"` يعرض `fs_read_file`, `fs_write_file`, ...
- الخادم `github` مع البادئة `"gh"` يعرض `gh_create_issue`, `gh_search_code`, ...
- الخادم `sqlite` مع البادئة `"sql"` يعرض `sql_query`, `sql_list_tables`, ...

إذا كشف خادمان أداة بالاسم الأساسي نفسه، تفصل البادئة بينهما.

### تحديث الأدوات

تدعم أداة `mcp` خطاف `refresh()` لإعادة اكتشاف الأدوات قبل كل دور للوكيل. وهذا يعني:

- الأدوات الجديدة التي تُضاف إلى خادم MCP تصبح متاحة دون إعادة تشغيل PRX
- الأدوات المحذوفة لا تُعرض بعد الآن على LLM
- تغييرات مخطط الأدوات تنعكس فورًا

### استدعاء الوكيل

يستدعي الوكيل أدوات MCP بالطريقة نفسها للأدوات المدمجة:

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

يوجّه PRX هذا الاستدعاء إلى خادم MCP المناسب، ويرسل الطلب عبر النقل المهيأ، ثم يعيد النتيجة إلى LLM.

## تفاصيل النقل

### نقل Stdio

ينشئ نقل stdio خادم MCP كعملية فرعية ويتواصل عبر stdin/stdout باستخدام JSON-RPC:

```
PRX Process
    │
    ├── stdin  ──→ MCP Server Process
    └── stdout ←── MCP Server Process
```

- يُبدأ الخادم عند أول استخدام (تهيئة كسولة) أو عند بدء daemon
- دورة حياة العملية تُدار بواسطة PRX (إعادة تشغيل تلقائية عند التعطل)
- تُلتقط مخرجات stderr من الخادم لأغراض التشخيص

### نقل HTTP

يتصل نقل HTTP بخادم MCP بعيد عبر HTTP:

```
PRX  ──HTTP/SSE──→  Remote MCP Server
```

- يدعم Server-Sent Events (SSE) للاستجابات المتدفقة
- يُنشأ الاتصال عند أول استدعاء أداة
- يدعم المصادقة عبر الرؤوس (قابلة للضبط لكل خادم)

### نقل Streamable HTTP

يستخدم نقل streamable HTTP بروتوكول MCP streamable HTTP الأحدث:

```
PRX  ──HTTP POST──→  MCP Server (streamable)
     ←──Streaming──
```

هذا النقل أكثر كفاءة من SSE للتواصل ثنائي الاتجاه، وهو الموصى به لتطبيقات خوادم MCP الجديدة.

## المعاملات

أداة MCP نفسها لا تحتوي معاملات ثابتة. كل خادم MCP يعرض أدواته الخاصة بمخططات معاملات خاصة به، وتُكتشف عبر طريقة البروتوكول `tools/list`. وتُعرّف المعاملات من قبل تطبيقات خوادم MCP الفردية.

أداة MCP الوصفية (للإدارة) تدعم:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | No | -- | إجراء إداري: `"status"`, `"refresh"`, `"servers"` |

## الأمان

### تنقية متغيرات البيئة

يقوم PRX تلقائيًا بإزالة متغيرات بيئة خطرة من عمليات خوادم MCP لمنع هجمات الحقن:

| Stripped Variable | Risk |
|------------------|------|
| `LD_PRELOAD` | حقن مكتبات (Linux) |
| `DYLD_INSERT_LIBRARIES` | حقن مكتبات (macOS) |
| `NODE_OPTIONS` | التلاعب ببيئة تشغيل Node.js |
| `PYTHONPATH` | اختطاف مسار وحدات Python |
| `PYTHONSTARTUP` | حقن سكربت بدء Python |
| `RUBYOPT` | حقن خيارات تشغيل Ruby |
| `PERL5OPT` | حقن خيارات تشغيل Perl |

لا يُمرر إلى العملية الفرعية إلا متغيرات `env` المضبوطة صراحةً إضافةً إلى متغيرات نظام آمنة.

### قائمة أوامر سماح لـ mcp.json

تنسيق `mcp.json` مريح لكنه قد يكون خطيرًا. يخفف PRX ذلك عبر تقييد الأوامر بقائمة سماح من مشغلات معروفة وآمنة. وهذا يمنع ملف `mcp.json` خبيثًا من تنفيذ ملفات تنفيذية عشوائية.

### قوائم سماح/حظر الأدوات

تتحكم تصفية الأدوات لكل خادم في الأدوات التي تُعرض للوكيل:

```toml
[mcp.servers.filesystem]
# Only expose these tools
allow_tools = ["read_file", "list_directory"]
# Block these tools even if discovered
deny_tools = ["write_file", "delete_file"]
```

تتقدم قائمة الحظر على قائمة السماح. وهذا يتيح نهج دفاع متعدد الطبقات حيث يمكنك السماح افتراضيًا بكل الأدوات مع حظر الأدوات الخطرة صراحة.

### عزل الشبكة

في خوادم نقل stdio، ترث عملية الخادم إعدادات sandbox. إذا كان sandbox يحظر الشبكة، فلن يتمكن خادم MCP أيضًا من إجراء طلبات شبكة.

في خوادم نقل HTTP، يكون أمان الخادم البعيد خارج سيطرة PRX. احرص على أن تشير عناوين نقل HTTP إلى خوادم موثوقة فقط.

### محرك السياسات

تخضع أدوات MCP لمحرك سياسات الأمان:

```toml
[security.tool_policy.tools]
mcp = "allow"           # Allow all MCP tools globally
fs_write_file = "deny"  # Block specific MCP tools by prefixed name
```

### سجلات التدقيق

تُسجَّل جميع استدعاءات أدوات MCP في سجل التدقيق، بما يشمل:

- اسم الخادم واسم الأداة
- المعاملات (مع إخفاء القيم الحساسة)
- حالة الاستجابة
- زمن التنفيذ

## مرتبط

- [Configuration Reference](/ar/prx/config/reference) -- إعدادات `[mcp]` و`[mcp.servers]`
- [Tools Overview](/ar/prx/tools/) -- نظرة عامة على الأدوات المدمجة وتكامل MCP
- [Security Sandbox](/ar/prx/security/sandbox) -- sandbox لعمليات خوادم MCP
- [Secrets Management](/ar/prx/security/secrets) -- تخزين مشفر لبيانات اعتماد خوادم MCP
- [Shell Execution](/ar/prx/tools/shell) -- بديل لتشغيل الأدوات عبر أوامر shell
