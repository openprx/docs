---
title: نظرة عامة على الأدوات
description: يوفر PRX أكثر من 46 أداة مدمجة منظّمة ضمن 12 فئة. الأدوات هي قدرات يمكن للوكيل استدعاؤها أثناء حلقات العمل للتفاعل مع نظام التشغيل والشبكة والذاكرة والخدمات الخارجية.
---

# نظرة عامة على الأدوات

الأدوات هي القدرات التي يستطيع وكيل PRX استدعاءها أثناء حلقة الاستدلال. عندما يقرر LLM أنه يحتاج تنفيذ إجراء، مثل تشغيل أمر أو قراءة ملف أو البحث في الويب أو تخزين ذاكرة، فإنه يستدعي أداة بالاسم مع معاملات JSON منظّمة. ينفذ PRX الأداة، ويطبق سياسات الأمان، ثم يعيد النتيجة إلى LLM للخطوة التالية.

يأتي PRX مع **46+ أداة مدمجة** ضمن 12 فئة، من إدخال/إخراج الملفات الأساسي إلى أتمتة المتصفح وتفويض المهام متعددة الوكلاء وتكامل بروتوكول MCP.

## معمارية الأدوات

كل أداة تطبق trait باسم `Tool`:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

كل أداة توفّر JSON Schema لمعلماتها، ويُرسل هذا المخطط إلى LLM كتعريف دالة. ينشئ LLM استدعاءات منظّمة، ويتحقق PRX من صحة المعاملات مقابل المخطط قبل التنفيذ.

## سجل الأدوات: `default_tools()` مقابل `all_tools()`

يستخدم PRX نظام تسجيل بطبقتين:

### `default_tools()` -- النواة الدنيا (3 أدوات)

مجموعة الأدوات الدنيا للوكلاء الخفيفين أو المقيّدين. متاحة دائمًا دون إعداد إضافي:

| الأداة | الوصف |
|------|-------------|
| `shell` | تنفيذ أوامر shell داخل sandbox |
| `file_read` | قراءة محتوى الملفات (مع مراعاة ACL) |
| `file_write` | كتابة المحتوى إلى الملفات |

### `all_tools()` -- السجل الكامل (46+ أداة)

مجموعة الأدوات الكاملة المبنية حسب إعدادك. تُسجّل الأدوات بشكل شرطي بناءً على الميزات المفعّلة:

- **تُسجّل دائمًا**: الأدوات الأساسية، الذاكرة، cron، الجدولة، git، الرؤية، nodes، pushover، canvas، proxy config، schema.
- **تُسجّل بشروط**: browser (يتطلب `browser.enabled`) وHTTP requests (يتطلب `http_request.enabled`) وweb search (يتطلب `web_search.enabled`) وweb fetch (يتطلب `web_search.fetch_enabled` + `browser.allowed_domains`) وMCP (يتطلب `mcp.enabled`) وComposio (يتطلب API key) و`delegate`/`agents_list` (يتطلب تعريفات وكلاء).

## مرجع الفئات

### Core (3 أدوات) -- متاحة دائمًا

أدوات الأساس الموجودة في `default_tools()` و`all_tools()`.

| الأداة | الوصف |
|------|-------------|
| `shell` | تنفيذ أوامر shell بعزل sandbox قابل للتهيئة (Landlock/Firejail/Bubblewrap/Docker) مع مهلة 60 ثانية وحد إخراج 1MB وتنقية للبيئة. |
| `file_read` | قراءة الملفات مع التحقق من المسار. عند تفعيل ACL للذاكرة يتم حظر ملفات markdown الخاصة بالذاكرة. |
| `file_write` | كتابة المحتوى إلى الملفات مع تطبيق فحوص سياسة الأمان. |

### Memory (5 أدوات)

عمليات الذاكرة طويلة الأمد لتخزين معرفة الوكيل واسترجاعها وإدارتها.

| الأداة | الوصف |
|------|-------------|
| `memory_store` | تخزين حقائق أو تفضيلات أو ملاحظات في الذاكرة طويلة الأمد. يدعم `core` و`daily` و`conversation` أو فئات مخصصة. |
| `memory_forget` | حذف إدخالات محددة من الذاكرة طويلة الأمد. |
| `memory_get` | استرجاع إدخال ذاكرة محدد بالمفتاح (مع مراعاة ACL عند التفعيل). |
| `memory_recall` | استرجاع ذكريات بالكلمات المفتاحية أو التشابه الدلالي. تُعطل عند تفعيل ACL للذاكرة. |
| `memory_search` | بحث نصي ومتجهي عبر إدخالات الذاكرة (مع مراعاة ACL عند التفعيل). |

### Cron / Scheduling (9 أدوات)

أتمتة المهام الزمنية ومحرك جدولة Xin.

| الأداة | الوصف |
|------|-------------|
| `cron` | نقطة دخول cron القديمة لإنشاء وإدارة المهام المجدولة. |
| `cron_add` | إضافة وظيفة cron جديدة بتعبير cron وأمر ووصف اختياري. |
| `cron_list` | عرض جميع وظائف cron المسجلة مع الجداول والحالة. |
| `cron_remove` | حذف وظيفة cron عبر المعرف. |
| `cron_update` | تحديث جدول وظيفة cron أو أمرها أو إعداداتها. |
| `cron_run` | تشغيل وظيفة cron يدويًا فورًا. |
| `cron_runs` | عرض سجل التنفيذ والـ logs الخاصة بتشغيلات cron. |
| `schedule` | جدولة مهمة لمرة واحدة أو متكررة بتعابير زمنية بلغة طبيعية. |
| `xin` | محرك جدولة Xin لجدولة متقدمة بسلاسل اعتماد وتنفيذ شرطي. |

### Browser / Vision (5 أدوات)

أتمتة الويب ومعالجة الصور. أدوات المتصفح تتطلب `[browser] enabled = true`.

| الأداة | الوصف |
|------|-------------|
| `browser` | أتمتة متصفح كاملة مع backends قابلة للتبديل (agent-browser CLI وRust-native وcomputer-use sidecar). |
| `browser_open` | فتح URL في المتصفح بشكل بسيط مع تقييد النطاق عبر `browser.allowed_domains`. |
| `screenshot` | التقاط لقطات شاشة للشاشة الحالية أو نوافذ محددة. |
| `image` | معالجة وتحويل الصور (تغيير الحجم، القص، تحويل الصيغ). |
| `image_info` | استخراج بيانات metadata وأبعاد ملفات الصور. |

### Network (4 أدوات)

طلبات HTTP، والبحث في الويب، وجلب صفحات الويب، وتكامل بروتوكول MCP.

| الأداة | الوصف |
|------|-------------|
| `http_request` | تنفيذ طلبات HTTP إلى APIs. الوصول مرفوض افتراضيًا إلا للنطاقات ضمن `allowed_domains`. |
| `web_search_tool` | البحث في الويب عبر DuckDuckGo (مجاني) أو Brave Search (يتطلب API key). |
| `web_fetch` | جلب واستخراج محتوى صفحات الويب. يتطلب `web_search.fetch_enabled` و`browser.allowed_domains`. |
| `mcp` | عميل Model Context Protocol للاتصال بخوادم MCP الخارجية واستدعاء أدواتها مع دعم `mcp.json` المحلي. |

### Messaging (2 أدوات)

إرسال الرسائل عبر قنوات التواصل.

| الأداة | الوصف |
|------|-------------|
| `message_send` | إرسال رسالة (نص/وسائط/صوت) إلى قناة ومُستلم مهيأين مع توجيه تلقائي للقناة النشطة. |
| `gateway` | وصول منخفض المستوى لإرسال رسائل خام عبر Axum HTTP/WebSocket gateway. |

### Sessions / Agents (8 أدوات)

تنسيق متعدد الوكلاء: إنشاء وكلاء فرعيين، تفويض المهام، وإدارة الجلسات المتزامنة.

| الأداة | الوصف |
|------|-------------|
| `sessions_spawn` | إنشاء وكيل فرعي async يعمل في الخلفية ويعيد run ID فورًا مع إعلان النتيجة عند الاكتمال. |
| `sessions_send` | إرسال رسالة إلى جلسة وكيل فرعي قيد التشغيل. |
| `sessions_list` | عرض الجلسات النشطة مع الحالة. |
| `sessions_history` | عرض سجل المحادثة لتشغيل وكيل فرعي. |
| `session_status` | فحص حالة جلسة محددة. |
| `subagents` | إدارة مجموعة الوكلاء الفرعيين (عرض، إيقاف، فحص). |
| `agents_list` | عرض وكلاء التفويض المعرّفين بنماذجهم وقدراتهم (يُسجل عند تعريف الوكلاء). |
| `delegate` | تفويض مهمة إلى وكيل مسمى بمزوّد/نموذج/مجموعة أدوات خاصة. |

### Remote Devices (2 أدوات)

التفاعل مع العقد البعيدة والإشعارات الدفعية.

| الأداة | الوصف |
|------|-------------|
| `nodes` | إدارة والتواصل مع عقد PRX البعيدة ضمن نشر موزع. |
| `pushover` | إرسال إشعارات Push عبر خدمة Pushover. |

### Git (1 أداة)

عمليات التحكم في الإصدارات.

| الأداة | الوصف |
|------|-------------|
| `git_operations` | تنفيذ عمليات Git (status/diff/commit/push/pull/log/branch) على مستودع مساحة العمل. |

### Config (2 أدوات)

إدارة الإعداد وقت التشغيل.

| الأداة | الوصف |
|------|-------------|
| `config_reload` | إعادة تحميل إعداد PRX مباشرةً دون إعادة تشغيل العملية. |
| `proxy_config` | عرض وتعديل إعدادات الشبكة/الوكيل أثناء التشغيل. |

### Third-party Integration (1 أداة)

تكاملات منصات خارجية.

| الأداة | الوصف |
|------|-------------|
| `composio` | الاتصال بأكثر من 250 تطبيقًا عبر منصة Composio (يتطلب API key). |

### Rendering (2 أدوات)

توليد المحتوى وتنسيق الإخراج.

| الأداة | الوصف |
|------|-------------|
| `canvas` | عرض محتوى منظم (جداول، مخططات، رسوم) للإخراج المرئي. |
| `tts` | تحويل النص إلى رسالة صوتية وإرسالها للمحادثة الحالية مع توليد MP3 والتحويل لـ M4A والتسليم تلقائيًا. |

### Admin (1 أداة)

أدوات داخلية للمخططات والتشخيص.

| الأداة | الوصف |
|------|-------------|
| `schema` | تنظيف وتطبيع JSON Schema لتوافق مزودي LLM عبر حل `$ref` وتبسيط unions وإزالة الكلمات غير المدعومة. |

## مصفوفة الأدوات الكاملة

| Tool | Category | Default | Condition |
|------|----------|---------|-----------|
| `shell` | Core | نعم | دائمًا |
| `file_read` | Core | نعم | دائمًا |
| `file_write` | Core | نعم | دائمًا |
| `memory_store` | Memory | -- | `all_tools()` |
| `memory_forget` | Memory | -- | `all_tools()` |
| `memory_get` | Memory | -- | `all_tools()` |
| `memory_recall` | Memory | -- | `all_tools()`، ومعطلة عند `memory.acl_enabled = true` |
| `memory_search` | Memory | -- | `all_tools()` |
| `cron` | Cron | -- | `all_tools()` |
| `cron_add` | Cron | -- | `all_tools()` |
| `cron_list` | Cron | -- | `all_tools()` |
| `cron_remove` | Cron | -- | `all_tools()` |
| `cron_update` | Cron | -- | `all_tools()` |
| `cron_run` | Cron | -- | `all_tools()` |
| `cron_runs` | Cron | -- | `all_tools()` |
| `schedule` | Scheduling | -- | `all_tools()` |
| `xin` | Scheduling | -- | `all_tools()` |
| `browser` | Browser | -- | `browser.enabled = true` |
| `browser_open` | Browser | -- | `browser.enabled = true` |
| `screenshot` | Vision | -- | `all_tools()` |
| `image` | Vision | -- | `all_tools()` (ضمنيًا عبر ImageTool) |
| `image_info` | Vision | -- | `all_tools()` |
| `http_request` | Network | -- | `http_request.enabled = true` |
| `web_search_tool` | Network | -- | `web_search.enabled = true` |
| `web_fetch` | Network | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | Network | -- | `mcp.enabled = true` + تعريف الخوادم |
| `message_send` | Messaging | -- | قناة نشطة (تسجيل على مستوى gateway) |
| `gateway` | Messaging | -- | `all_tools()` |
| `sessions_spawn` | Sessions | -- | `all_tools()` |
| `sessions_send` | Sessions | -- | `all_tools()` |
| `sessions_list` | Sessions | -- | `all_tools()` |
| `sessions_history` | Sessions | -- | `all_tools()` |
| `session_status` | Sessions | -- | `all_tools()` |
| `subagents` | Sessions | -- | `all_tools()` |
| `agents_list` | Agents | -- | تعريف أقسام `[agents.*]` |
| `delegate` | Agents | -- | تعريف أقسام `[agents.*]` |
| `nodes` | Remote | -- | `all_tools()` |
| `pushover` | Remote | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | Config | -- | `all_tools()` |
| `proxy_config` | Config | -- | `all_tools()` |
| `composio` | Third-party | -- | ضبط `composio.api_key` |
| `canvas` | Rendering | -- | `all_tools()` |
| `tts` | Rendering | -- | قناة نشطة (تسجيل على مستوى gateway) |
| `schema` | Admin | -- | داخلي (وحدة تطبيع schema) |

## تفعيل وتعطيل الأدوات

### أدوات مفعّلة بالميزات

كثير من الأدوات تُفعّل عبر أقسام الإعداد المقابلة. أضف التالي إلى `config.toml`:

```toml
# ── Browser tools ──────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP request tool ─────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── Web search tool ───────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (free) or "brave" (requires API key)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# Also enable web_fetch for page content extraction:
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio integration ──────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### مسار سياسة الأدوات

لتحكم دقيق، استخدم قسم `[security.tool_policy]` للسماح أو المنع أو الإشراف على أدوات منفردة أو مجموعات:

```toml
[security.tool_policy]
# Default policy: "allow", "deny", or "supervised"
default = "allow"

# Group-level policies
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# Per-tool overrides (highest priority)
[security.tool_policy.tools]
shell = "supervised"     # Requires approval before execution
gateway = "allow"
composio = "deny"        # Disable Composio even if API key is set
```

ترتيب حل السياسات (من الأعلى أولوية):

1. سياسة الأداة المفردة (`security.tool_policy.tools.<name>`)
2. سياسة المجموعة (`security.tool_policy.groups.<group>`)
3. السياسة الافتراضية (`security.tool_policy.default`)

### تقييد أدوات وكلاء التفويض

عند إعداد وكلاء التفويض، يمكن تقييد الأدوات التي يسمح لهم بالوصول إليها:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## تكامل أداة MCP

ينفذ PRX عميل Model Context Protocol (MCP)، مما يسمح له بالاتصال بخوادم MCP خارجية وإتاحة أدواتها للوكيل.

### الإعداد

عرّف خوادم MCP داخل `config.toml`:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### ملف `mcp.json` المحلي

يمكن لـ PRX أيضًا اكتشاف خوادم MCP من ملف `mcp.json` محلي في مساحة العمل، بنفس صيغة VS Code وClaude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

الأوامر داخل `mcp.json` مقيّدة بقائمة بيضاء من launchers الآمنة: `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### اكتشاف الأدوات ديناميكيًا

تُكتشف أدوات MCP وقت التشغيل عبر method البروتوكول `tools/list`. يتم وضع namespace لأدوات كل خادم MCP وإتاحتها لـ LLM كدوال قابلة للاستدعاء. تدعم أداة `mcp` hook باسم `refresh()` لإعادة الاكتشاف قبل كل دور للوكيل.

تُزال تلقائيًا متغيرات البيئة الخطرة (`LD_PRELOAD` و`DYLD_INSERT_LIBRARIES` و`NODE_OPTIONS` و`PYTHONPATH` وغيرها) من عمليات خادم MCP.

## الأمان: العزل و ACL

### عزل الأدوات

أداة `shell` تنفذ الأوامر داخل sandbox قابل للتهيئة. يدعم PRX أربعة backends للعزل بالإضافة إلى وضع no-op:

```toml
[security.sandbox]
enabled = true           # None = auto-detect, true/false = explicit
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Custom Firejail arguments (when backend = "firejail")
firejail_args = ["--net=none", "--noroot"]
```

| Backend | Platform | Isolation Level | Notes |
|---------|----------|-----------------|-------|
| Landlock | Linux (kernel LSM) | Filesystem | مدمج في النواة دون تبعيات إضافية |
| Firejail | Linux | Full (network, filesystem, PID) | مساحة مستخدم ومتوافر على نطاق واسع |
| Bubblewrap | Linux, macOS | Namespace-based | user namespaces وخفيف |
| Docker | Any | Container | عزل كامل بالحاويات |
| None | Any | Application-layer only | بدون عزل على مستوى نظام التشغيل |

وضع الاكتشاف التلقائي (`backend = "auto"`) يفحص backends بالترتيب: Landlock ثم Firejail ثم Bubblewrap ثم Docker ثم يرجع إلى None مع تحذير.

### تنقية بيئة shell

أداة `shell` تمرر قائمة بيضاء محددة من متغيرات البيئة فقط: `PATH` و`HOME` و`TERM` و`LANG` و`LC_ALL` و`LC_CTYPE` و`USER` و`SHELL` و`TMPDIR`. لا تُكشف مفاتيح API أو الرموز أو الأسرار.

### Memory ACL

عند `memory.acl_enabled = true` يطبق التحكم في الوصول على عمليات الذاكرة:

- `file_read` يمنع الوصول إلى ملفات markdown الخاصة بالذاكرة.
- `memory_recall` تُعطّل بالكامل (تزال من سجل الأدوات).
- `memory_get` و`memory_search` يفرضان قيود وصول لكل principal.

### سياسة الأمان

يمر كل استدعاء أداة عبر طبقة `SecurityPolicy` قبل التنفيذ. يستطيع محرك السياسة:

- حظر العمليات حسب قواعد سياسة الأدوات.
- طلب موافقة المشرف للأدوات في وضع `supervised`.
- تدقيق كل استدعاءات الأدوات.
- فرض حدود المعدل والموارد.

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## التوسعة: كتابة أدوات مخصصة

لإضافة أداة جديدة:

1. أنشئ وحدة جديدة في `src/tools/` تطبق trait `Tool`.
2. سجّلها في `all_tools_with_runtime_ext()` داخل `src/tools/mod.rs`.
3. أضف إدخالات `pub mod` و`pub use` في `mod.rs`.

مثال:

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

راجع القسم 7.3 في `AGENTS.md` لخطوات التغيير الكاملة.
