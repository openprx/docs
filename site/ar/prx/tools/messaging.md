---
title: المراسلة
description: أدوات لإرسال الرسائل عبر قنوات التواصل مع توجيه تلقائي ووصول منخفض المستوى إلى البوابة.
---

# المراسلة

يوفّر PRX أداتي مراسلة تُمكّنان الوكلاء من إرسال الرسائل عبر قنوات التواصل. أداة `message_send` هي الواجهة عالية المستوى لإرسال النصوص والوسائط والرسائل الصوتية إلى أي قناة مهيأة، بينما توفّر أداة `gateway` وصولًا منخفض المستوى إلى بوابة Axum عبر HTTP/WebSocket لإرسال الرسائل الخام.

تُسجَّل أدوات المراسلة على مستوى البوابة وتكون متاحة عند وجود قناة نشطة. تقوم `message_send` بتوجيه الرسائل تلقائيًا إلى القناة النشطة (Telegram وDiscord وSlack وCLI وغيرها)، بينما تمنح `gateway` وصولًا مباشرًا لبروتوكول البوابة لحالات الاستخدام المتقدمة.

تكمل هذه الأدوات نظام القنوات الواردة. فالقنوات تتولى استقبال رسائل المستخدمين وتوجيهها إلى الوكيل، بينما تتولى أدوات المراسلة الاتجاه الصادر، أي إعادة إرسال المحتوى الذي يولّده الوكيل إلى المستخدمين.

## الإعداد

لا تحتوي أدوات المراسلة على قسم إعداد مستقل. يعتمد توفرها على إعدادات القنوات والبوابة:

```toml
# Gateway configuration (messaging tools depend on this)
[gateway]
host = "127.0.0.1"
port = 16830

# Channel configuration (message_send routes to active channel)
[channels_config]
cli = true
message_timeout_secs = 300

[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
stream_mode = "partial"
```

تكون أداة `message_send` متاحة كلما كانت هناك قناة نشطة واحدة على الأقل. أمّا أداة `gateway` فتُسجَّل دائمًا ضمن `all_tools()`.

## مرجع الأدوات

### message_send

ترسل رسالة إلى أي قناة ومُستلم مُهيأين. وتقوم الأداة تلقائيًا بالتوجيه إلى القناة النشطة، أي القناة التي تتم عبرها المحادثة الحالية.

**إرسال رسالة نصية:**

```json
{
  "name": "message_send",
  "arguments": {
    "text": "The build completed successfully. All 42 tests passed.",
    "channel": "telegram"
  }
}
```

**إرسال وسائط (صورة/ملف):**

```json
{
  "name": "message_send",
  "arguments": {
    "media_path": "/tmp/screenshot.png",
    "caption": "Current dashboard state",
    "channel": "telegram"
  }
}
```

**إرسال رسالة صوتية:**

```json
{
  "name": "message_send",
  "arguments": {
    "voice_path": "/tmp/summary.mp3",
    "channel": "telegram"
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `text` | `string` | مشروط | -- | محتوى الرسالة النصية (مطلوب إذا لم تُرسل وسائط/صوت) |
| `channel` | `string` | لا | القناة النشطة | اسم القناة الهدف (يُكتشف تلقائيًا عند الإهمال) |
| `recipient` | `string` | لا | المستخدم الحالي | معرّف المستلم (user ID أو chat ID وغيرها) |
| `media_path` | `string` | لا | -- | مسار ملف الوسائط (صورة، مستند، فيديو) |
| `caption` | `string` | لا | -- | تعليق رسائل الوسائط |
| `voice_path` | `string` | لا | -- | مسار ملف الصوت |
| `reply_to` | `string` | لا | -- | معرّف الرسالة المراد الرد عليها (بحسب المنصة) |

### gateway

وصول منخفض المستوى إلى البوابة لإرسال رسائل خام عبر Axum HTTP/WebSocket. هذه الأداة مخصصة لحالات الاستخدام المتقدمة عندما لا تكون `message_send` كافية.

```json
{
  "name": "gateway",
  "arguments": {
    "action": "send",
    "payload": {
      "type": "text",
      "content": "Raw gateway message",
      "target": "ws://localhost:16830/ws"
    }
  }
}
```

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `action` | `string` | نعم | -- | إجراء البوابة: `"send"` أو `"broadcast"` أو `"status"` |
| `payload` | `object` | مشروط | -- | حمولة الرسالة (مطلوبة في `"send"` و`"broadcast"`) |

## الاستخدام

### التوجيه التلقائي للقناة

في أغلب الحالات لا يحتاج الوكيل لتحديد قناة صراحةً. عندما يرسل المستخدم رسالة عبر Telegram، يُوجَّه رد الوكيل تلقائيًا إلى Telegram:

```
User (via Telegram): What's the weather like?
Agent: [calls message_send with text="Currently 22C and sunny in Shanghai."]
       → Automatically sent to Telegram, to the same chat
```

### المراسلة بين قنوات مختلفة

يمكن للوكيل الإرسال إلى قناة مختلفة عن القناة الجارية للمحادثة:

```json
{
  "name": "message_send",
  "arguments": {
    "text": "Build failed! Check CI logs.",
    "channel": "discord",
    "recipient": "111222333"
  }
}
```

يفيد ذلك في تدفقات الإشعارات عندما يراقب الوكيل قناة ويرسل التنبيهات إلى قناة أخرى.

### تسليم الوسائط

يمكن للوكيل إرسال الملفات والصور والصوت عبر قنوات المراسلة:

1. توليد ملف الوسائط أو تنزيله.
2. حفظه في مسار مؤقت.
3. إرساله عبر `message_send` باستخدام `media_path`.

```
Agent thinking: User asked for a chart of the data.
  1. [shell] python3 generate_chart.py --output /tmp/chart.png
  2. [message_send] media_path="/tmp/chart.png", caption="Monthly revenue chart"
```

### الرسائل الصوتية

للقنوات التي تدعم الصوت (Telegram وWhatsApp وDiscord)، يمكن للوكيل إرسال رسائل صوتية:

```
Agent thinking: User asked for a voice summary.
  1. [tts] text="Here is your daily summary..." output="/tmp/summary.mp3"
  2. [message_send] voice_path="/tmp/summary.mp3"
```

## تفاصيل توجيه القناة

عند استدعاء `message_send` دون تحديد `channel` صراحةً، يحدد PRX القناة الهدف وفق المنطق التالي:

1. **قناة الجلسة النشطة**: القناة المرتبطة بجلسة الوكيل الحالية (تُحدد عند إنشاء الجلسة من رسالة واردة).
2. **القناة الافتراضية**: إذا لم تُضبط قناة للجلسة، يتم الرجوع إلى أول قناة نشطة.
3. **الرجوع إلى CLI**: إذا لم تُضبط أي قنوات، يذهب الإخراج إلى stdout.

### القنوات المدعومة

| القناة | نص | وسائط | صوت | رد |
|---------|:----:|:-----:|:-----:|:-----:|
| Telegram | نعم | نعم | نعم | نعم |
| Discord | نعم | نعم | نعم | نعم |
| Slack | نعم | نعم | لا | نعم |
| WhatsApp | نعم | نعم | نعم | نعم |
| Signal | نعم | نعم | لا | نعم |
| Matrix | نعم | نعم | لا | نعم |
| Email | نعم | نعم (مرفق) | لا | نعم |
| CLI | نعم | لا | لا | لا |

## الأمان

### صلاحيات القناة

الرسائل الصادرة تخضع لنفس سياسات القنوات الواردة. لا يستطيع الوكيل الإرسال إلا إلى القنوات المُهيأة والنشطة. محاولة الإرسال إلى قناة غير مهيأة تُرجع خطأ.

### التحقق من المستلم

عند تحديد `recipient`، يتحقق PRX من إمكانية الوصول إلى المستلم عبر القناة الهدف. وفي القنوات التي تحتوي على قوائم `allowed_users` يتم حظر الإرسال إلى مستلمين غير مدرجين.

### تحديد المعدل

تخضع الرسائل الصادرة لحدود المعدل الخاصة بالقناة (حسب المنصة). على سبيل المثال، يفرض Telegram حدود API يتعامل معها PRX عبر تراجع تلقائي.

### محرك السياسات

يمكن التحكم في أدوات المراسلة عبر سياسة الأمان:

```toml
[security.tool_policy.tools]
message_send = "allow"
gateway = "supervised"     # Require approval for raw gateway access
```

### سجل التدقيق

تُسجَّل جميع الرسائل الصادرة في سجل التدقيق:

- القناة والمستلم الهدف.
- نوع الرسالة (نص، وسائط، صوت).
- الطابع الزمني.
- حالة التسليم.

تُسجَّل مسارات ملفات الوسائط، لكن لا يتم تخزين محتوى الملفات في سجل التدقيق.

## مرتبط

- [نظرة عامة على القنوات](/ar/prx/channels/) -- جميع منصات المراسلة الـ 19 المدعومة
- [البوابة](/ar/prx/gateway/) -- معمارية HTTP API وWebSocket
- [Gateway HTTP API](/ar/prx/gateway/http-api) -- نقاط REST API
- [Gateway WebSocket](/ar/prx/gateway/websocket) -- البث اللحظي
- [أدوات الوسائط (TTS)](/ar/prx/tools/media) -- تحويل النص إلى كلام للرسائل الصوتية
- [نظرة عامة على الأدوات](/ar/prx/tools/) -- جميع الأدوات ونظام التسجيل
