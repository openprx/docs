---
title: مرجع الإعدادات
description: مرجع كامل حقلًا بحقل لجميع أقسام وخيارات إعدادات PRX.
---

# مرجع الإعدادات

تُوثّق هذه الصفحة كل قسم وحقل في ملف `config.toml` الخاص بـ PRX. الحقول المعلّمة بقيمة افتراضية يمكن حذفها -- سيستخدم PRX القيمة الافتراضية.

## المستوى الأعلى (الإعدادات الافتراضية)

تظهر هذه الحقول على المستوى الجذر من `config.toml`، خارج أي عنوان قسم.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `default_provider` | `string` | `"openrouter"` | معرّف المزود أو اسمه المستعار (مثل `"anthropic"`، `"openai"`، `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | معرّف النموذج الموجّه عبر المزود المحدد |
| `default_temperature` | `float` | `0.7` | درجة حرارة العينات (0.0--2.0). أقل = أكثر حتمية |
| `api_key` | `string?` | `null` | مفتاح API للمزود المحدد. يُتجاوز بمتغيرات البيئة الخاصة بالمزود |
| `api_url` | `string?` | `null` | تجاوز عنوان URL الأساسي لواجهة API الخاصة بالمزود (مثل نقطة نهاية Ollama البعيدة) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

خادم بوابة HTTP لنقاط نهاية webhook والاقتران وواجهة الويب البرمجية.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `host` | `string` | `"127.0.0.1"` | عنوان الربط. استخدم `"0.0.0.0"` للوصول العام |
| `port` | `u16` | `16830` | منفذ الاستماع |
| `require_pairing` | `bool` | `true` | طلب اقتران الجهاز قبل قبول طلبات API |
| `allow_public_bind` | `bool` | `false` | السماح بالربط على عنوان غير localhost بدون نفق |
| `pair_rate_limit_per_minute` | `u32` | `5` | الحد الأقصى لطلبات الاقتران في الدقيقة لكل عميل |
| `webhook_rate_limit_per_minute` | `u32` | `60` | الحد الأقصى لطلبات webhook في الدقيقة لكل عميل |
| `api_rate_limit_per_minute` | `u32` | `120` | الحد الأقصى لطلبات API في الدقيقة لكل رمز مصادقة |
| `trust_forwarded_headers` | `bool` | `false` | الوثوق بترويسات `X-Forwarded-For` / `X-Real-IP` (فعّل فقط خلف وكيل عكسي) |
| `request_timeout_secs` | `u64` | `300` | مهلة معالج HTTP بالثواني |
| `idempotency_ttl_secs` | `u64` | `300` | مدة صلاحية مفاتيح تفرد webhook |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
تغيير `host` أو `port` يتطلب إعادة تشغيل كاملة. تُربط هذه القيم عند بدء التشغيل ولا يمكن إعادة تحميلها فوريًا.
:::

## `[channels_config]`

إعدادات القنوات على المستوى الأعلى. القنوات الفردية هي أقسام فرعية متداخلة.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `cli` | `bool` | `true` | تفعيل قناة سطر الأوامر التفاعلية |
| `message_timeout_secs` | `u64` | `300` | مهلة معالجة الرسالة (النموذج اللغوي + الأدوات) |

### `[channels_config.telegram]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `bot_token` | `string` | *(مطلوب)* | رمز Telegram Bot API من @BotFather |
| `allowed_users` | `string[]` | `[]` | معرّفات أو أسماء مستخدمي Telegram المسموح بهم. فارغ = رفض الكل |
| `mention_only` | `bool` | `false` | في المجموعات، الرد فقط على الرسائل التي تذكر البوت بـ @ |
| `stream_mode` | `"off" \| "partial"` | `"off"` | وضع البث: `off` يرسل الاستجابة كاملة، `partial` يحرر مسودة تدريجيًا |
| `draft_update_interval_ms` | `u64` | `1000` | الحد الأدنى للفاصل بين تحريرات المسودة (حماية من حد الطلبات) |
| `interrupt_on_new_message` | `bool` | `false` | إلغاء الاستجابة الجارية عندما يرسل المستخدم نفسه رسالة جديدة |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `bot_token` | `string` | *(مطلوب)* | رمز بوت Discord من بوابة المطورين |
| `guild_id` | `string?` | `null` | تقييد لخادم (guild) واحد |
| `allowed_users` | `string[]` | `[]` | معرّفات مستخدمي Discord المسموح بهم. فارغ = رفض الكل |
| `listen_to_bots` | `bool` | `false` | معالجة رسائل البوتات الأخرى (تُتجاهل رسائل البوت نفسه دائمًا) |
| `mention_only` | `bool` | `false` | الرد فقط على الإشارات بـ @ |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `bot_token` | `string` | *(مطلوب)* | رمز OAuth لبوت Slack (`xoxb-...`) |
| `app_token` | `string?` | `null` | رمز مستوى التطبيق لوضع Socket (`xapp-...`) |
| `channel_id` | `string?` | `null` | تقييد لقناة واحدة |
| `allowed_users` | `string[]` | `[]` | معرّفات مستخدمي Slack المسموح بهم. فارغ = رفض الكل |
| `mention_only` | `bool` | `false` | الرد فقط على الإشارات بـ @ في المجموعات |

### `[channels_config.lark]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `app_id` | `string` | *(مطلوب)* | معرّف تطبيق Lark/Feishu |
| `app_secret` | `string` | *(مطلوب)* | سر تطبيق Lark/Feishu |
| `encrypt_key` | `string?` | `null` | مفتاح تشفير الأحداث |
| `verification_token` | `string?` | `null` | رمز التحقق من الأحداث |
| `allowed_users` | `string[]` | `[]` | معرّفات المستخدمين المسموح بهم. فارغ = رفض الكل |
| `use_feishu` | `bool` | `false` | استخدام نقاط نهاية API الخاصة بـ Feishu (الصين) بدلاً من Lark (الدولية) |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | وضع استقبال الرسائل |
| `port` | `u16?` | `null` | منفذ استماع webhook (فقط لوضع webhook) |
| `mention_only` | `bool` | `false` | الرد فقط على الإشارات بـ @ |

يدعم PRX أيضًا هذه القنوات الإضافية (مضبوطة تحت `[channels_config.*]`):

- **Matrix** -- `homeserver`، `access_token`، قوائم سماح الغرف
- **Signal** -- عبر واجهة REST API لـ signal-cli
- **WhatsApp** -- واجهة Cloud API أو وضع Web
- **iMessage** -- macOS فقط، قوائم سماح جهات الاتصال
- **DingTalk** -- وضع البث مع `client_id` / `client_secret`
- **QQ** -- حزمة SDK البوت الرسمية مع `app_id` / `app_secret`
- **Email** -- IMAP/SMTP
- **IRC** -- الخادم، القناة، الاسم المستعار
- **Mattermost** -- عنوان URL + رمز البوت
- **Nextcloud Talk** -- عنوان URL الأساسي + رمز التطبيق
- **Webhook** -- webhook واردة عامة

## `[memory]`

واجهة الذاكرة لسجل المحادثات والمعرفة والتضمينات.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `backend` | `string` | `"sqlite"` | نوع الواجهة: `"sqlite"`، `"lucid"`، `"postgres"`، `"markdown"`، `"none"` |
| `auto_save` | `bool` | `true` | حفظ مدخلات محادثة المستخدم تلقائيًا في الذاكرة |
| `acl_enabled` | `bool` | `false` | تفعيل قوائم التحكم بالوصول للذاكرة |
| `hygiene_enabled` | `bool` | `true` | تشغيل الأرشفة الدورية وتنظيف الاحتفاظ |
| `archive_after_days` | `u32` | `7` | أرشفة الملفات اليومية/الجلسات الأقدم من هذا |
| `purge_after_days` | `u32` | `30` | حذف الملفات المؤرشفة الأقدم من هذا |
| `conversation_retention_days` | `u32` | `3` | SQLite: تنظيف صفوف المحادثة الأقدم من هذا |
| `daily_retention_days` | `u32` | `7` | SQLite: تنظيف الصفوف اليومية الأقدم من هذا |
| `embedding_provider` | `string` | `"none"` | مزود التضمينات: `"none"`، `"openai"`، `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | اسم نموذج التضمينات |
| `embedding_dimensions` | `usize` | `1536` | أبعاد متجه التضمينات |
| `vector_weight` | `f64` | `0.7` | وزن التشابه المتجهي في البحث الهجين (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | وزن بحث الكلمات المفتاحية BM25 (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | الحد الأدنى للنقاط الهجينة لتضمين الذاكرة في السياق |
| `embedding_cache_size` | `usize` | `10000` | الحد الأقصى لمدخلات ذاكرة التضمينات المؤقتة قبل إخلاء LRU |
| `snapshot_enabled` | `bool` | `false` | تصدير الذكريات الأساسية إلى `MEMORY_SNAPSHOT.md` |
| `snapshot_on_hygiene` | `bool` | `false` | تشغيل اللقطة أثناء مرور التنظيف |
| `auto_hydrate` | `bool` | `true` | التحميل التلقائي من اللقطة عند غياب `brain.db` |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

موجه النماذج اللغوية الإرشادي لعمليات النشر متعددة النماذج. يسجّل النماذج المرشحة باستخدام صيغة مرجّحة تجمع بين القدرة وتصنيف Elo والتكلفة وزمن الاستجابة.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل التوجيه الإرشادي |
| `alpha` | `f32` | `0.0` | وزن نقاط التشابه |
| `beta` | `f32` | `0.5` | وزن نقاط القدرة |
| `gamma` | `f32` | `0.3` | وزن نقاط Elo |
| `delta` | `f32` | `0.1` | معامل عقوبة التكلفة |
| `epsilon` | `f32` | `0.1` | معامل عقوبة زمن الاستجابة |
| `knn_enabled` | `bool` | `false` | تفعيل التوجيه الدلالي KNN من السجل |
| `knn_min_records` | `usize` | `10` | الحد الأدنى لسجلات التاريخ قبل أن يؤثر KNN على التوجيه |
| `knn_k` | `usize` | `7` | عدد أقرب الجيران للتصويت |

### `[router.automix]`

سياسة التصعيد التكيفية: البدء بنموذج رخيص، والتصعيد إلى نموذج متميز عند انخفاض الثقة.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل تصعيد Automix |
| `confidence_threshold` | `f32` | `0.7` | التصعيد عند انخفاض الثقة دون هذا (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | طبقات النماذج المعتبرة "رخيصة أولاً" |
| `premium_model_id` | `string` | `""` | النموذج المستخدم للتصعيد |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

الأمان على مستوى نظام التشغيل: صندوق الرمل، حدود الموارد، وتسجيل التدقيق.

### `[security.sandbox]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool?` | `null` (اكتشاف تلقائي) | تفعيل عزل صندوق الرمل |
| `backend` | `string` | `"auto"` | الواجهة: `"auto"`، `"landlock"`، `"firejail"`، `"bubblewrap"`، `"docker"`، `"none"` |
| `firejail_args` | `string[]` | `[]` | وسيطات Firejail مخصصة |

### `[security.resources]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `max_memory_mb` | `u32` | `512` | الحد الأقصى للذاكرة لكل أمر (ميجابايت) |
| `max_cpu_time_seconds` | `u64` | `60` | الحد الأقصى لوقت المعالج لكل أمر |
| `max_subprocesses` | `u32` | `10` | الحد الأقصى لعدد العمليات الفرعية |
| `memory_monitoring` | `bool` | `true` | تفعيل مراقبة استخدام الذاكرة |

### `[security.audit]`

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `true` | تفعيل تسجيل التدقيق |
| `log_path` | `string` | `"audit.log"` | مسار ملف سجل التدقيق (نسبي لمجلد الإعدادات) |
| `max_size_mb` | `u32` | `100` | الحد الأقصى لحجم السجل قبل التدوير |
| `sign_events` | `bool` | `false` | توقيع الأحداث بـ HMAC لإثبات عدم التلاعب |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

واجهة المقاييس والتتبع الموزّع.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `backend` | `string` | `"none"` | الواجهة: `"none"`، `"log"`، `"prometheus"`، `"otel"` |
| `otel_endpoint` | `string?` | `null` | عنوان URL لنقطة نهاية OTLP (مثل `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | اسم الخدمة لمجمّع OTel (الافتراضي `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

تكامل خادم [بروتوكول سياق النموذج](https://modelcontextprotocol.io/). يعمل PRX كعميل MCP، متصلاً بخوادم MCP خارجية للحصول على أدوات إضافية.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل تكامل عميل MCP |

### `[mcp.servers.<name>]`

كل خادم مسمّى هو قسم فرعي تحت `[mcp.servers]`.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `true` | مفتاح تفعيل لكل خادم |
| `transport` | `"stdio" \| "http"` | `"stdio"` | نوع النقل |
| `command` | `string?` | `null` | الأمر لوضع stdio |
| `args` | `string[]` | `[]` | وسيطات الأمر لوضع stdio |
| `url` | `string?` | `null` | عنوان URL لنقل HTTP |
| `env` | `map<string, string>` | `{}` | متغيرات البيئة لوضع stdio |
| `startup_timeout_ms` | `u64` | `10000` | مهلة بدء التشغيل |
| `request_timeout_ms` | `u64` | `30000` | مهلة كل طلب |
| `tool_name_prefix` | `string` | `"mcp"` | بادئة لأسماء الأدوات المكشوفة |
| `allow_tools` | `string[]` | `[]` | قائمة سماح الأدوات (فارغ = الكل) |
| `deny_tools` | `string[]` | `[]` | قائمة رفض الأدوات |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

إعدادات أداة أتمتة المتصفح.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل أداة `browser_open` |
| `allowed_domains` | `string[]` | `[]` | النطاقات المسموح بها (تطابق دقيق أو نطاق فرعي) |
| `session_name` | `string?` | `null` | جلسة متصفح مسمّاة للأتمتة |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

إعدادات أدوات البحث على الويب وجلب عناوين URL.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل أداة `web_search` |
| `provider` | `string` | `"duckduckgo"` | مزود البحث: `"duckduckgo"` (مجاني) أو `"brave"` (يتطلب مفتاح API) |
| `brave_api_key` | `string?` | `null` | مفتاح API لـ Brave Search |
| `max_results` | `usize` | `5` | الحد الأقصى للنتائج لكل بحث (1--10) |
| `timeout_secs` | `u64` | `15` | مهلة الطلب |
| `fetch_enabled` | `bool` | `true` | تفعيل أداة `web_fetch` |
| `fetch_max_chars` | `usize` | `10000` | الحد الأقصى للأحرف المعادة من `web_fetch` |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

محرك المهام المستقلة Xin (القلب/العقل) -- يجدول وينفذ المهام الخلفية بما في ذلك التطور وفحوصات اللياقة وعمليات التنظيف.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل محرك مهام Xin |
| `interval_minutes` | `u32` | `5` | فاصل النبض بالدقائق (الحد الأدنى 1) |
| `max_concurrent` | `usize` | `4` | الحد الأقصى لتنفيذ المهام المتزامنة لكل نبضة |
| `max_tasks` | `usize` | `128` | الحد الأقصى لإجمالي المهام في المخزن |
| `stale_timeout_minutes` | `u32` | `60` | الدقائق قبل تعليم المهمة الجارية كمتقادمة |
| `builtin_tasks` | `bool` | `true` | التسجيل التلقائي للمهام المدمجة في النظام |
| `evolution_integration` | `bool` | `false` | السماح لـ Xin بإدارة جدولة التطور/اللياقة |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

حدود الإنفاق والتسعير لكل نموذج لتتبع التكاليف.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل تتبع التكاليف |
| `daily_limit_usd` | `f64` | `10.0` | حد الإنفاق اليومي بالدولار |
| `monthly_limit_usd` | `f64` | `100.0` | حد الإنفاق الشهري بالدولار |
| `warn_at_percent` | `u8` | `80` | التحذير عند وصول الإنفاق لهذه النسبة من الحد |
| `allow_override` | `bool` | `false` | السماح للطلبات بتجاوز الميزانية مع راية `--override` |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

إعدادات سلسلة إعادة المحاولة والاحتياط لوصول مرن للمزودين.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `max_retries` | `u32` | `3` | الحد الأقصى لمحاولات إعادة المحاولة للأعطال العابرة |
| `fallback_providers` | `string[]` | `[]` | قائمة مرتبة لأسماء المزودين الاحتياطيين |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

مخزن بيانات الاعتماد المشفرة باستخدام ChaCha20-Poly1305.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `encrypt` | `bool` | `true` | تفعيل التشفير لمفاتيح API والرموز في الإعدادات |

## `[auth]`

إعدادات استيراد بيانات الاعتماد الخارجية.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `codex_auth_json_auto_import` | `bool` | `true` | الاستيراد التلقائي لبيانات OAuth من ملف `auth.json` الخاص بـ Codex CLI |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | مسار ملف المصادقة لـ Codex CLI |

## `[proxy]`

إعدادات وكيل HTTP/HTTPS/SOCKS5 الصادر.

| الحقل | النوع | القيمة الافتراضية | الوصف |
|-------|-------|-------------------|-------|
| `enabled` | `bool` | `false` | تفعيل الوكيل |
| `http_proxy` | `string?` | `null` | عنوان URL لوكيل HTTP |
| `https_proxy` | `string?` | `null` | عنوان URL لوكيل HTTPS |
| `all_proxy` | `string?` | `null` | وكيل احتياطي لجميع المخططات |
| `no_proxy` | `string[]` | `[]` | قائمة التجاوز (نفس تنسيق `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | النطاق: `"environment"`، `"zeroclaw"`، `"services"` |
| `services` | `string[]` | `[]` | محددات الخدمة عندما يكون النطاق `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
