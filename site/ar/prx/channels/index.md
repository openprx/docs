---
title: نظرة عامة على القنوات
description: يتصل PRX بـ 19 منصة مراسلة. نظرة عامة على جميع القنوات ومصفوفة المقارنة وأنماط الإعدادات وسياسات الرسائل المباشرة.
---

# القنوات

القنوات هي تكاملات منصات المراسلة التي تربط PRX بالعالم الخارجي. كل قناة تطبّق واجهة موحدة لإرسال واستقبال الرسائل ومعالجة الوسائط وإدارة مؤشرات الكتابة وإجراء فحوصات السلامة. يمكن لـ PRX تشغيل قنوات متعددة في آن واحد من عملية خادم واحدة.

## القنوات المدعومة

يدعم PRX 19 قناة مراسلة تشمل المنصات الاستهلاكية وأدوات المؤسسات والبروتوكولات مفتوحة المصدر وواجهات المطورين.

### مصفوفة مقارنة القنوات

| القناة | رسالة مباشرة | مجموعة | وسائط | صوت | E2EE | المنصة | الحالة |
|--------|:--:|:-----:|:-----:|:-----:|:----:|--------|:------:|
| [Telegram](./telegram) | نعم | نعم | نعم | لا | لا | متعددة المنصات | مستقر |
| [Discord](./discord) | نعم | نعم | نعم | لا | لا | متعددة المنصات | مستقر |
| [Slack](./slack) | نعم | نعم | نعم | لا | لا | متعددة المنصات | مستقر |
| [WhatsApp](./whatsapp) | نعم | نعم | نعم | لا | نعم | Cloud API | مستقر |
| [WhatsApp Web](./whatsapp-web) | نعم | نعم | نعم | لا | نعم | متعدد الأجهزة | تجريبي |
| [Signal](./signal) | نعم | نعم | نعم | لا | نعم | متعددة المنصات | مستقر |
| [iMessage](./imessage) | نعم | نعم | نعم | لا | نعم | macOS فقط | تجريبي |
| [Matrix](./matrix) | نعم | نعم | نعم | لا | نعم | موزّع | مستقر |
| [Email](./email) | نعم | لا | نعم | لا | لا | IMAP/SMTP | مستقر |
| [Lark / Feishu](./lark) | نعم | نعم | نعم | لا | لا | متعددة المنصات | مستقر |
| [DingTalk](./dingtalk) | نعم | نعم | نعم | لا | لا | متعددة المنصات | مستقر |
| [QQ](./qq) | نعم | نعم | نعم | لا | لا | متعددة المنصات | تجريبي |
| [Mattermost](./mattermost) | نعم | نعم | نعم | لا | لا | مستضاف ذاتيًا | مستقر |
| [Nextcloud Talk](./nextcloud-talk) | نعم | نعم | نعم | لا | لا | مستضاف ذاتيًا | تجريبي |
| [IRC](./irc) | نعم | نعم | لا | لا | لا | موزّع | مستقر |
| [LINQ](./linq) | نعم | نعم | نعم | لا | لا | Partner API | ألفا |
| [CLI](./cli) | نعم | لا | لا | لا | غ/م | الطرفية | مستقر |
| Terminal | نعم | لا | لا | لا | غ/م | الطرفية | مستقر |
| Wacli | نعم | نعم | نعم | لا | نعم | JSON-RPC | تجريبي |

**التوضيح:**
- **مستقر** -- جاهز للإنتاج، مختبر بالكامل
- **تجريبي** -- يعمل مع قيود معروفة
- **ألفا** -- تجريبي، قد تتغير الواجهة البرمجية

## نمط الإعدادات المشترك

جميع القنوات تُضبط تحت قسم `[channels]` من `~/.config/openprx/openprx.toml`. لكل قناة قسم فرعي خاص بإعدادات المنصة.

### الهيكل الأساسي

```toml
[channels]
# تفعيل قناة سطر الأوامر المدمجة (الافتراضي: true)
cli = true

# مهلة معالجة الرسالة بالثواني (الافتراضي: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # اختياري: تقييد لخادم واحد
allowed_users = []              # فارغ = السماح للكل
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### أمثلة خاصة بالقنوات

**Lark / Feishu:**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true لـ Feishu (الصين)، false لـ Lark (الدولية)
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal:**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (مع التشفير من طرف لطرف):**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**البريد الإلكتروني (IMAP/SMTP):**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk:**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## سياسات الرسائل المباشرة

يوفر PRX تحكمًا دقيقًا في من يمكنه إرسال رسائل مباشرة إلى وكيلك. تُضبط سياسة الرسائل المباشرة لكل قناة وتحدد كيفية معالجة الرسائل المباشرة الواردة.

### أنواع السياسات

| السياسة | السلوك |
|---------|--------|
| `pairing` | يتطلب مصافحة اقتران قبل قبول المرسل. يجب على المستخدم إكمال تدفق تحدي-استجابة للمصادقة. ميزة مستقبلية -- حاليًا يعود إلى `allowlist`. |
| `allowlist` | **(الافتراضي)** فقط المرسلون المدرجون في مصفوفة `allowed_users` الخاصة بالقناة يمكنهم التفاعل مع الوكيل. تُتجاهل رسائل المرسلين غير المدرجين بصمت. |
| `open` | أي مستخدم يمكنه إرسال رسائل مباشرة للوكيل. استخدم بحذر في الإنتاج. |
| `disabled` | تُتجاهل جميع الرسائل المباشرة. مفيد عندما يجب أن يرد PRX فقط في المجموعات. |

### الإعدادات

تُعيَّن سياسات الرسائل المباشرة على المستوى الأعلى لإعدادات القنوات:

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

مصفوفة `allowed_users` لكل قناة هي قائمة السماح لتلك القناة:

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # فقط هؤلاء المستخدمون يمكنهم المراسلة
```

عندما تكون `dm_policy = "open"`، يُتجاهل حقل `allowed_users` ويُقبل جميع المرسلين.

## سياسات المجموعات

مشابهة لسياسات الرسائل المباشرة، يتحكم PRX في محادثات المجموعات التي يشارك فيها الوكيل:

| السياسة | السلوك |
|---------|--------|
| `allowlist` | **(الافتراضي)** فقط المجموعات المدرجة في قائمة سماح المجموعات الخاصة بالقناة تُراقب. |
| `open` | يرد الوكيل في أي مجموعة يُضاف إليها. |
| `disabled` | تُتجاهل جميع رسائل المجموعات. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# قائمة سماح المجموعات تُضبط لكل قناة
```

## وضع الإشارة فقط

معظم القنوات تدعم خيار `mention_only`. عند تفعيله، يرد الوكيل فقط على الرسائل التي تشير إليه صراحة (عبر @إشارة أو رد أو محفز خاص بالمنصة). هذا مفيد في دردشات المجموعات لتجنب رد الوكيل على كل رسالة.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # الرد فقط عند الإشارة بـ @
```

## وضع البث

بعض القنوات تدعم بث استجابات النماذج اللغوية في الوقت الفعلي. يتحكم إعداد `stream_mode` في كيفية عرض مخرج البث:

| الوضع | السلوك |
|-------|--------|
| `edit` | يحرر نفس الرسالة مع وصول الرموز (Telegram، Discord) |
| `append` | يلحق نصًا جديدًا بالرسالة |
| `none` | ينتظر الاستجابة الكاملة قبل الإرسال |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # مدى تكرار تحديث المسودة (مللي ثانية)
```

## إضافة قناة جديدة

قنوات PRX مبنية على سمة `Channel`. لربط قناة جديدة:

1. أضف إعدادات القناة إلى ملف `openprx.toml`
2. أعد تشغيل الخادم: `prx daemon`

بدلاً من ذلك، استخدم معالج القنوات التفاعلي:

```bash
prx channel add telegram
```

لعرض القنوات النشطة:

```bash
prx channel list
```

لتشخيص مشاكل اتصال القنوات:

```bash
prx channel doctor
```

## بنية القنوات

تقوم كل قناة داخليًا بـ:

1. **الاستماع** للرسائل الواردة من المنصة (عبر الاستطلاع أو webhook أو WebSocket)
2. **تصفية** الرسائل بناءً على سياسات الرسائل المباشرة/المجموعات وقوائم السماح
3. **توجيه** الرسائل المقبولة إلى حلقة الوكيل للمعالجة
4. **إرسال** استجابة الوكيل عبر واجهة API الخاصة بالمنصة
5. **الإبلاغ** عن حالة السلامة وإعادة الاتصال تلقائيًا بتراجع أسي

تعمل جميع القنوات بشكل متزامن داخل عملية الخادم، مشاركةً بيئة تشغيل الوكيل والذاكرة وأنظمة الأدوات الفرعية.

## الخطوات التالية

اختر قناة للتعرف على إعدادها الخاص:

- [Telegram](./telegram) -- تكامل Bot API
- [Discord](./discord) -- بوت مع أوامر الشرطة المائلة
- [Slack](./slack) -- تطبيق Slack مع Socket Mode
- [WhatsApp](./whatsapp) -- تكامل Cloud API
- [Signal](./signal) -- جسر Signal CLI
- [Matrix](./matrix) -- دردشة موزّعة مع تشفير من طرف لطرف
- [Lark / Feishu](./lark) -- مراسلة المؤسسات
- [Email](./email) -- تكامل IMAP/SMTP
