---
title: أدوات الوسائط
description: أدوات لمعالجة الصور ولقطات الشاشة وتحويل النص إلى كلام وعرض المحتوى عبر canvas لتوليد محتوى بصري وصوتي.
---

# أدوات الوسائط

يتضمن PRX خمس أدوات مرتبطة بالوسائط تغطي معالجة الصور، والتقاط الشاشة، وتحويل النص إلى كلام، وعرض المحتوى المنظم. تُمكّن هذه الأدوات الوكلاء من العمل مع المحتوى البصري والصوتي: تغيير حجم الصور، والتقاط لقطات للشاشة للاستدلال البصري، وإنشاء رسائل صوتية، وعرض المخططات والرسوم.

تتوزع أدوات الوسائط عبر فئتين في سجل الأدوات. أدوات الرؤية (`image`, `image_info`, `screenshot`) تُسجل دائمًا في `all_tools()`. أما أدوات العرض (`tts`, `canvas`) فتُسجل عند تفعيل قناة (للأولى) أو بشكل غير مشروط (للثانية).

معًا، تمنح هذه الأدوات وكلاء PRX قدرات إخراج متعددة الوسائط لإنتاج صور وصوت ومخرجات بصرية إلى جانب الردود النصية.

## الإعداد

لأدوات الوسائط إعدادات محدودة. وتتحكم معظم الإعدادات على مستوى القناة (للتسليم) أو عبر مزود LLM (لقدرات نماذج الرؤية):

```toml
# Browser configuration affects screenshot capabilities
[browser]
enabled = true
backend = "rust_native"

# Channel configuration affects TTS delivery
[channels_config.telegram]
bot_token = "..."
stream_mode = "partial"

# No dedicated media tool configuration section
# Vision tools are always available in all_tools()
```

## مرجع الأدوات

### image

تعالج الصور وتحولها. تدعم عمليات resize وcrop وتحويل الصيغ.

**Resize an image:**

```json
{
  "name": "image",
  "arguments": {
    "action": "resize",
    "path": "/home/user/photo.png",
    "width": 800,
    "height": 600
  }
}
```

**Crop an image:**

```json
{
  "name": "image",
  "arguments": {
    "action": "crop",
    "path": "/home/user/photo.png",
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300
  }
}
```

**Convert format:**

```json
{
  "name": "image",
  "arguments": {
    "action": "convert",
    "path": "/home/user/photo.png",
    "format": "jpeg",
    "output": "/home/user/photo.jpg"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | العملية: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Yes | -- | مسار ملف الصورة المصدر |
| `width` | `integer` | Conditional | -- | العرض الهدف (للـ resize والـ crop) |
| `height` | `integer` | Conditional | -- | الارتفاع الهدف (للـ resize والـ crop) |
| `x` | `integer` | Conditional | -- | إزاحة X لبداية القص |
| `y` | `integer` | Conditional | -- | إزاحة Y لبداية القص |
| `format` | `string` | Conditional | -- | الصيغة الهدف للتحويل: `"png"`, `"jpeg"`, `"webp"`, `"gif"` |
| `output` | `string` | No | Overwrites source | مسار ملف الإخراج |

### image_info

تستخرج بيانات التعريف والأبعاد من ملفات الصور دون تعديلها.

```json
{
  "name": "image_info",
  "arguments": {
    "path": "/home/user/photo.png"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | مسار ملف الصورة |

**تعيد معلومات تشمل:**

| Field | Description |
|-------|-------------|
| Width | عرض الصورة بالبكسل |
| Height | ارتفاع الصورة بالبكسل |
| Format | صيغة الصورة (PNG, JPEG, WebP, ...) |
| Color space | RGB, RGBA, Grayscale, ... |
| File size | الحجم على القرص |
| DPI | الدقة (إن توفرت في البيانات الوصفية) |

### screenshot

تلتقط لقطات شاشة للشاشة الحالية أو لنوافذ محددة. مفيدة لمهام الاستدلال البصري عندما يحتاج الوكيل لمعاينة الحالة الحالية لسطح المكتب أو تطبيق ما.

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "screen"
  }
}
```

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "window",
    "window_name": "Firefox"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | No | `"screen"` | ما سيتم التقاطه: `"screen"` (كامل الشاشة) أو `"window"` (نافذة محددة) |
| `window_name` | `string` | Conditional | -- | عنوان النافذة المطلوب التقاطها (مطلوب عندما `target = "window"`) |
| `output` | `string` | No | Auto-generated temp path | مسار ملف الإخراج للقطة الشاشة |

تُحفظ لقطات الشاشة بصيغة PNG. وعند الاستخدام مع نماذج LLM الداعمة للرؤية (GPT-4o, Claude Sonnet, ...)، يمكن إدراج اللقطة في الرسالة التالية للتحليل البصري.

### tts

تحويل النص إلى كلام. يحول النص إلى ملف صوتي ويرسله كرسالة صوتية إلى المحادثة الحالية. تتولى الأداة توليد MP3، والتحويل الاختياري إلى M4A، والتسليم عبر القناة النشطة.

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Yes | -- | النص المراد تحويله إلى كلام |
| `language` | `string` | No | `"en"` | رمز اللغة للتخليق الصوتي |
| `voice` | `string` | No | Provider default | معرّف الصوت (يعتمد على المزود) |

تتطلب أداة TTS قناة نشطة تدعم الرسائل الصوتية (Telegram, WhatsApp, Discord). وعلى القنوات التي لا تدعم الصوت، تُرجع الأداة خطأ.

**مسار TTS:**

1. يُرسل النص إلى مزود TTS (مدمج أو خارجي)
2. يُولّد الصوت بصيغة MP3
3. إذا كانت القناة تتطلب M4A (مثل بعض عملاء الهاتف)، يتم التحويل تلقائيًا
4. يُسلَّم ملف الصوت عبر `message_send` كرسالة صوتية

### canvas

تعرض محتوى منظمًا لمخرجات بصرية. تدعم الجداول والرسوم البيانية والمخططات والتنسيقات المنسقة.

```json
{
  "name": "canvas",
  "arguments": {
    "type": "table",
    "data": {
      "headers": ["Name", "Status", "Score"],
      "rows": [
        ["Module A", "Passed", "98"],
        ["Module B", "Failed", "45"],
        ["Module C", "Passed", "87"]
      ]
    }
  }
}
```

```json
{
  "name": "canvas",
  "arguments": {
    "type": "diagram",
    "content": "graph LR\n  A[Input] --> B[Process]\n  B --> C[Output]"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | Yes | -- | نوع المحتوى: `"table"`, `"chart"`, `"diagram"`, `"code"` |
| `data` | `object` | Conditional | -- | بيانات منظمة للجداول والرسوم |
| `content` | `string` | Conditional | -- | محتوى نصي للمخططات (صيغة Mermaid) وكتل الكود |
| `format` | `string` | No | `"png"` | صيغة الإخراج: `"png"`, `"svg"`, `"html"` |
| `output` | `string` | No | Auto-generated temp path | مسار ملف الإخراج |

## أنماط الاستخدام

### تدفق الاستدلال البصري

استخدام لقطات الشاشة مع نماذج LLM الداعمة للرؤية لفهم حالة الواجهة:

```
Agent thinking: Need to verify the web application looks correct.
  1. [browser] action="navigate", url="https://app.example.com/dashboard"
  2. [screenshot] target="screen"
  3. [LLM vision analysis of screenshot]
  4. "The dashboard shows 3 active alerts and a chart with declining metrics..."
```

### توليد التقارير

إنشاء تقارير بصرية بالجداول والرسوم:

```
Agent thinking: User wants a project status report.
  1. [memory_search] query="project status"
  2. [canvas] type="table", data={project status data}
  3. [canvas] type="chart", data={progress chart data}
  4. [message_send] media_path="/tmp/status_table.png", caption="Project Status"
  5. [message_send] media_path="/tmp/progress_chart.png", caption="Sprint Progress"
```

### التفاعل الصوتي

تقديم ردود صوتية لسيناريوهات الاستخدام بدون استخدام اليدين:

```
Agent thinking: User asked for a voice summary.
  1. [memory_recall] query="today's meetings and tasks"
  2. [tts] text="You have 3 meetings today. The first is at 10 AM with the engineering team..."
  → Voice message delivered via Telegram
```

## الأمان

### الوصول لنظام الملفات

أدوات الصور ولقطات الشاشة تقرأ وتكتب ملفات على نظام الملفات المحلي. وتخضع هذه العمليات لنفس سياسة الأمان الخاصة بـ `file_read` و`file_write`:

- التحقق من المسار يمنع الوصول خارج الأدلة المسموح بها
- عمليات الكتابة تحترم قواعد سياسة الأمان
- الملفات المؤقتة تُكتب إلى `TMPDIR` افتراضيًا

### خصوصية TTS

قد تحتوي الرسائل الصوتية على معلومات حساسة من المحادثة. ضع في الاعتبار:

- محتوى TTS يُرسل إلى مزود TTS (قد يكون خارجيًا)
- ملفات الصوت المولدة تُخزن مؤقتًا على القرص
- الرسائل الصوتية تُسلَّم عبر القناة وتخضع لسياسة خصوصية المنصة

### أمان محتوى Canvas

تعرض أداة canvas بيانات يقدّمها المستخدم. وعند عرض المخططات بصيغة Mermaid، تتم معالجة المحتوى محليًا دون خدمات خارجية.

### محرك السياسات

يمكن التحكم في أدوات الوسائط بشكل منفصل:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # Require approval for screenshots
tts = "allow"
canvas = "allow"
```

## مرتبط

- [Browser Tool](/ar/prx/tools/browser) -- أتمتة الويب مع دعم لقطات الشاشة
- [Messaging](/ar/prx/tools/messaging) -- تسليم الوسائط والصوت عبر القنوات
- [Channels Overview](/ar/prx/channels/) -- مصفوفة قدرات الوسائط في القنوات
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل
