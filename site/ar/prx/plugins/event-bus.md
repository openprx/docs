---
title: ناقل الأحداث
description: ناقل أحداث بين الإضافات مع pub/sub قائم على المواضيع، واشتراكات wildcard، وضمانات التسليم في PRX.
---

# ناقل الأحداث

يُتيح ناقل أحداث PRX التواصل بين الإضافات ونظام المضيف عبر آلية نشر/اشتراك قائمة على المواضيع. يمكن للإضافات نشر أحداث، والاشتراك في مواضيع، والتفاعل مع أحداث دورة الحياة -- وكل ذلك دون اقتران مباشر بين المكونات.

## نظرة عامة

يوفّر ناقل الأحداث:

- **توجيه قائم على المواضيع** -- تُنشر الأحداث إلى مواضيع هرمية وتُسلّم للمشتركين المطابقين
- **اشتراكات wildcard** -- الاشتراك في أشجار مواضيع كاملة باستخدام أنماط على طريقة glob
- **حدود الحمولة** -- حد أقصى 64 KB لكل حمولة حدث لمنع إساءة استخدام الموارد
- **الحماية من التكرار العودي** -- حد أقصى 8 مستويات لعمق event-triggered-event لمنع الحلقات اللانهائية
- **تسليم مرة واحدة كحد أقصى** -- تُسلّم الأحداث للمشتركين دون تخزين دائم أو إعادة محاولة

## بنية المواضيع

تتبع المواضيع نمط تسمية هرميًا مفصولًا بنقاط ضمن نطاق الاسم `prx.`:

```
prx.<category>.<event>
```

### المواضيع المدمجة

| Topic | Published By | Description |
|-------|-------------|-------------|
| `prx.lifecycle.started` | Host | تم تشغيل PRX وتهيئة جميع المكونات |
| `prx.lifecycle.stopping` | Host | يجري إيقاف PRX؛ يجب على الإضافات تنفيذ التنظيف |
| `prx.lifecycle.config_reloaded` | Host | تم إعادة تحميل الإعدادات بشكل حي |
| `prx.session.created` | Host | تم إنشاء جلسة وكيل جديدة |
| `prx.session.terminated` | Host | تم إنهاء جلسة وكيل |
| `prx.session.message` | Host | تم إرسال رسالة أو استلامها في جلسة |
| `prx.channel.connected` | Host | أنشأت قناة اتصالًا |
| `prx.channel.disconnected` | Host | فقدت قناة اتصالها |
| `prx.channel.error` | Host | واجهت قناة خطأ |
| `prx.tool.before_execute` | Host | أداة على وشك التنفيذ (يمكن اعتراضها) |
| `prx.tool.after_execute` | Host | اكتمل تنفيذ أداة |
| `prx.plugin.loaded` | Host | تم تحميل إضافة |
| `prx.plugin.unloaded` | Host | تم إلغاء تحميل إضافة |
| `prx.evolution.proposed` | Host | تم إنشاء مقترح تطور ذاتي |
| `prx.evolution.applied` | Host | تم تطبيق تغيير تطور ذاتي |
| `prx.evolution.rolled_back` | Host | تم التراجع عن تغيير تطور ذاتي |
| `prx.memory.stored` | Host | تم تخزين إدخال ذاكرة |
| `prx.memory.recalled` | Host | تم استدعاء ذكريات للسياق |
| `prx.cron.tick` | Host | حدث نبض cron |

### مواضيع مخصصة

يمكن للإضافات النشر إلى مواضيع مخصصة ضمن نطاقها الخاص:

```
prx.plugin.<plugin_name>.<event>
```

على سبيل المثال، قد تنشر إضافة الطقس:

```
prx.plugin.weather.forecast_updated
prx.plugin.weather.alert_issued
```

## أنماط الاشتراك

### تطابق تام

اشترك في موضوع محدد واحد:

```rust
event_bus.subscribe("prx.session.created", handler);
```

### تطابق Wildcard

اشترك في جميع المواضيع ضمن شجرة باستخدام `*` (مستوى واحد) أو `**` (عدة مستويات):

```rust
// All session events
event_bus.subscribe("prx.session.*", handler);

// All lifecycle events
event_bus.subscribe("prx.lifecycle.*", handler);

// All events from a specific plugin
event_bus.subscribe("prx.plugin.weather.*", handler);

// All events (use sparingly)
event_bus.subscribe("prx.**", handler);
```

| Pattern | Matches | Does Not Match |
|---------|---------|---------------|
| `prx.session.*` | `prx.session.created`, `prx.session.terminated` | `prx.session.message.sent` |
| `prx.session.**` | `prx.session.created`, `prx.session.message.sent` | `prx.channel.connected` |
| `prx.*.connected` | `prx.channel.connected` | `prx.channel.error` |
| `prx.**` | كل ما يقع تحت `prx.` | مواضيع خارج نطاق `prx.` |

## بنية الحدث

يحتوي كل حدث على:

| Field | Type | Description |
|-------|------|-------------|
| `topic` | `String` | مسار الموضوع الكامل (مثل `prx.session.created`) |
| `payload` | `Vec<u8>` | بيانات الحدث المسلسلة (JSON حسب العرف، حد أقصى 64 KB) |
| `source` | `String` | هوية الناشر (مثل `host`، `plugin:weather`) |
| `timestamp` | `u64` | طابع Unix الزمني بالمللي ثانية |
| `correlation_id` | `Option<String>` | معرّف اختياري لتتبع الأحداث المرتبطة |

### صيغة الحمولة

تُسلسل الحمولة كـ JSON حسب العرف. يعرّف كل موضوع مخطط حمولة خاصًا به. مثال:

**`prx.session.created`:**

```json
{
  "session_id": "sess_abc123",
  "channel": "telegram",
  "user_id": "user:telegram:123456789"
}
```

**`prx.tool.after_execute`:**

```json
{
  "session_id": "sess_abc123",
  "tool_name": "shell",
  "command": "ls -la /tmp",
  "duration_ms": 45,
  "success": true
}
```

## الإعداد

```toml
[plugins.event_bus]
enabled = true
max_payload_bytes = 65536           # 64 KB
max_recursion_depth = 8             # prevent infinite event loops
max_subscribers_per_topic = 64      # limit subscribers per topic
channel_capacity = 1024             # internal event queue capacity
delivery_timeout_ms = 5000          # timeout for slow subscribers
```

## مرجع الإعداد

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل ناقل الأحداث |
| `max_payload_bytes` | `usize` | `65536` | الحد الأقصى لحجم حمولة الحدث (64 KB) |
| `max_recursion_depth` | `u8` | `8` | العمق الأقصى لسلاسل event-triggered-event |
| `max_subscribers_per_topic` | `usize` | `64` | أقصى عدد مشتركين لكل موضوع مطابق تامًا |
| `channel_capacity` | `usize` | `1024` | سعة قناة محدودة لطابور الأحداث |
| `delivery_timeout_ms` | `u64` | `5000` | أقصى وقت انتظار لمعالجة مشترك لحدث |

## استخدام ناقل الأحداث داخل الإضافات

### PDK (Plugin Development Kit)

يوفّر PRX PDK دوال مساعدة للتعامل مع ناقل الأحداث داخل إضافات WASM:

```rust
use prx_pdk::event_bus;

// Subscribe to events
event_bus::subscribe("prx.session.created", |event| {
    let payload: SessionCreated = serde_json::from_slice(&event.payload)?;
    log::info!("New session: {}", payload.session_id);
    Ok(())
})?;

// Publish an event
let payload = serde_json::to_vec(&MyEvent { data: "hello" })?;
event_bus::publish("prx.plugin.my_plugin.my_event", &payload)?;
```

### الاشتراك في Plugin Manifest

تُعلن الإضافات اشتراكاتها داخل ملف manifest:

```toml
# plugin.toml
[plugin]
name = "my-plugin"
version = "1.0.0"

[permissions]
event_bus_subscribe = [
    "prx.session.*",
    "prx.tool.after_execute",
]
event_bus_publish = [
    "prx.plugin.my_plugin.*",
]
```

يفرض المضيف هذه التصريحات الخاصة بالصلاحيات. لا يمكن للإضافة الاشتراك أو النشر خارج المواضيع المصرح بها.

## ضمانات التسليم

يوفّر ناقل الأحداث تسليمًا **مرة واحدة كحد أقصى**:

- يتم إرسال الأحداث إلى جميع المشتركين المطابقين بشكل غير متزامن
- إذا كان أحد المشتركين بطيئًا أو غير مستجيب، يُسقط الحدث بعد `delivery_timeout_ms`
- إذا امتلأ طابور الأحداث الداخلي (وصول `channel_capacity`)، تُسقط الأحداث الجديدة مع تحذير
- لا توجد آلية تخزين دائم أو إعادة محاولة أو تأكيد استلام

في حالات الاستخدام التي تتطلب تسليمًا مضمونًا، يُنصح باستخدام نظام webhook أو طابور رسائل خارجي.

## الحماية من التكرار العودي

عندما ينشر معالج حدث حدثًا آخر، تتشكل سلسلة. يتتبع ناقل الأحداث عمق التكرار العودي ويفرض `max_recursion_depth`:

```
prx.session.created           ← depth 0
  → handler publishes prx.plugin.audit.session_log    ← depth 1
    → handler publishes prx.plugin.metrics.counter     ← depth 2
      → ...
```

إذا تجاوز العمق الحد، يُسقط الحدث ويُسجل تحذير:

```
WARN event_bus: Recursion depth 8 exceeded for topic prx.plugin.metrics.counter, event dropped
```

## اعتراض تنفيذ الأدوات

يدعم حدث `prx.tool.before_execute` الاعتراض. يمكن للمشتركين تعديل أو إلغاء استدعاء الأداة قبل تشغيلها:

```rust
event_bus::subscribe("prx.tool.before_execute", |event| {
    let mut payload: ToolBeforeExecute = serde_json::from_slice(&event.payload)?;

    // Block dangerous commands
    if payload.tool_name == "shell" && payload.args.contains("rm -rf") {
        return Err(EventBusError::Rejected("Dangerous command blocked".into()));
    }

    Ok(())
})?;
```

عند إرجاع أي مشترك لخطأ، يتم إلغاء تنفيذ الأداة ويتم الإبلاغ عن الخطأ إلى الوكيل.

## المراقبة

### CLI

```bash
# View recent event bus activity
prx events --tail 50

# Filter by topic pattern
prx events --topic "prx.session.*"

# Show event payloads
prx events --verbose

# View subscriber counts
prx events stats
```

### المقاييس

يكشف ناقل الأحداث مقاييس Prometheus التالية:

| Metric | Type | Description |
|--------|------|-------------|
| `prx_event_bus_published_total` | Counter | إجمالي الأحداث المنشورة حسب الموضوع |
| `prx_event_bus_delivered_total` | Counter | إجمالي الأحداث المُسلَّمة للمشتركين |
| `prx_event_bus_dropped_total` | Counter | الأحداث التي أُسقطت (امتلاء الطابور، مهلة، تكرار عودي) |
| `prx_event_bus_delivery_duration_seconds` | Histogram | زمن تسليم الأحداث إلى المشتركين |
| `prx_event_bus_subscribers` | Gauge | العدد الحالي للمشتركين حسب الموضوع |

## القيود

- تسليم مرة واحدة كحد أقصى يعني إمكانية فقدان الأحداث عند امتلاء الطابور أو بطء المشتركين
- ناقل الأحداث محلي ضمن عملية PRX؛ لا يتم توزيع الأحداث عبر العقد
- حجم الحمولة محدود بـ 64 KB؛ البيانات الكبيرة يُفضّل الإشارة إليها بمعرّف بدل تضمينها
- اشتراكات wildcard (خصوصًا `prx.**`) قد تولّد حملًا كبيرًا؛ استخدمها بحذر
- تعمل معالجات أحداث الإضافات داخل WASM sandbox ولا يمكنها الوصول مباشرة إلى نظام الملفات أو الشبكة
- ترتيب الأحداث بأفضل جهد؛ قد يستلم المشتركون الأحداث بترتيب مختلف تحت الحمل العالي

## صفحات ذات صلة

- [نظرة عامة على نظام الإضافات](./)
- [بنية الإضافات](./architecture) -- بيئة تشغيل WASM وحدود المضيف-الضيف
- [دليل المطور](./developer-guide) -- بناء الإضافات باستخدام PDK
- [وظائف المضيف](./host-functions) -- وظائف المضيف المتاحة للإضافات
- [Webhooks](../gateway/webhooks) -- للتسليم المضمون إلى الأنظمة الخارجية
