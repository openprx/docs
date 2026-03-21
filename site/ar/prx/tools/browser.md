---
title: أداة المتصفح
description: أتمتة كاملة للمتصفح مع واجهات خلفية قابلة للاستبدال للتنقّل في الويب، والتعامل مع النماذج، ولقطات الشاشة، والتصفح المقيّد بالنطاقات.
---

# أداة المتصفح

توفّر أداة المتصفح لوكلاء PRX قدرات أتمتة ويب كاملة: التنقّل بين الصفحات، وملء النماذج، والنقر على العناصر، واستخراج المحتوى، والتقاط لقطات الشاشة. وتعتمد على بنية واجهات خلفية قابلة للتبديل تدعم ثلاثة محركات أتمتة، مع فرض قيود النطاقات لمنع الوصول غير المقيّد إلى الويب.

أدوات المتصفح مقيّدة بميزة (feature-gated) وتتطلب تعيين `browser.enabled = true` في الإعدادات. عند التفعيل، يسجّل PRX الأداتين `browser` و`browser_open` في سجل الأدوات. تدعم أداة المتصفح تدفقات ويب متعددة الخطوات ومعقدة، بينما توفّر `browser_open` واجهة أبسط لفتح عنوان URL واستخراج محتواه.

يتضمن PRX أيضًا أدوات مرتبطة بالرؤية (`screenshot`, `image`, `image_info`) تُكمل أداة المتصفح في المهام البصرية. ويمكن تمرير لقطات الشاشة الملتقطة عبر أداة المتصفح إلى نماذج LLM الداعمة للرؤية للاستدلال البصري.

## الإعداد

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # Named browser session for persistent state
```

### خيارات الواجهة الخلفية

| Backend | Description | Dependencies | Best For |
|---------|------------|-------------|----------|
| `agent_browser` | يستدعي أداة CLI خارجية باسم `agent-browser` لمتصفح دون واجهة | وجود ملف `agent-browser` التنفيذي في PATH | أتمتة ويب عامة، ومواقع كثيفة JavaScript |
| `rust_native` | تنفيذ متصفح مدمج في Rust باستخدام Chrome/Chromium دون واجهة | تثبيت Chromium | أتمتة خفيفة، دون اعتماديات خارجية |
| `computer_use` | Sidecar لاستخدام الحاسوب للتفاعل الكامل مع سطح المكتب | Anthropic computer-use sidecar | تفاعلات على مستوى نظام التشغيل، وتدفقات GUI معقدة |

### قيود النطاقات

تتحكم قائمة `allowed_domains` في النطاقات التي يمكن للمتصفح الوصول إليها. ويدعم تطابق النطاق:

- **تطابق تام**: القيمة `"github.com"` تطابق `github.com` فقط
- **wildcard للنطاقات الفرعية**: القيمة `"*.openprx.dev"` تطابق `docs.openprx.dev` و`api.openprx.dev` وغيرها
- **بدون wildcard**: القائمة الفارغة تمنع كل تنقّل عبر المتصفح

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## الاستخدام

### أداة browser

تدعم أداة `browser` الرئيسية عدة إجراءات لتدفقات الويب المعقدة:

**التنقل إلى URL:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**ملء حقل في نموذج:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**النقر على عنصر:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**التقاط لقطة شاشة:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**استخراج محتوى الصفحة:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### أداة browser_open

أداة مبسطة لفتح URL وإرجاع محتواه:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### مثال على تدفق متعدد الخطوات

قد يربط تدفق بحث نموذجي عدة إجراءات متصفح:

1. التنقل إلى محرك بحث
2. ملء مربع البحث باستعلام
3. النقر على زر البحث
4. استخراج النتائج من الصفحة
5. التنقل إلى نتيجة ذات صلة
6. استخراج المحتوى التفصيلي
7. التقاط لقطة شاشة كمرجع بصري

## المعاملات

### معاملات browser

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | الإجراء المطلوب: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | Conditional | -- | عنوان URL للتنقل (مطلوب لإجراء `"navigate"`) |
| `selector` | `string` | Conditional | -- | محدد CSS للعنصر الهدف (مطلوب لإجرائي `"fill"`, `"click"`) |
| `value` | `string` | Conditional | -- | القيمة المراد تعبئتها (مطلوبة لإجراء `"fill"`) |
| `timeout_ms` | `integer` | No | `30000` | أقصى مدة انتظار لإكمال الإجراء |

### معاملات browser_open

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | -- | عنوان URL المراد فتحه واستخراج المحتوى منه |

### معاملات أدوات الرؤية

**screenshot:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | No | `"screen"` | ما يجب التقاطه: `"screen"` أو معرّف نافذة |

**image:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | عملية الصورة: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Yes | -- | مسار ملف الصورة |

**image_info:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | مسار ملف الصورة المراد فحصه |

## تفاصيل الواجهة الخلفية

### agent-browser

تعتمد واجهة `agent_browser` الخلفية على تفويض التنفيذ إلى أداة CLI خارجية `agent-browser`، والتي توفّر بيئة أتمتة قائمة على Chrome دون واجهة. يتم التواصل عبر stdio برسائل JSON-RPC.

المزايا:
- تنفيذ كامل لـ JavaScript
- استمرارية ملفات تعريف الارتباط (cookies) والجلسات
- دعم الامتدادات

### rust_native

تستخدم واجهة `rust_native` الخلفية ربطيات Rust للتحكم مباشرةً في تثبيت Chromium/Chrome محليًا. ويتم التواصل عبر بروتوكول Chrome DevTools (CDP).

المزايا:
- لا حاجة لاعتماد على ملف تنفيذي خارجي (باستثناء Chromium)
- زمن استجابة أقل من تشغيل عملية فرعية
- تكامل أوثق مع مكوّنات PRX الداخلية

### computer_use

تستخدم واجهة `computer_use` الخلفية sidecar الخاص بـ Anthropic للتفاعل على مستوى نظام التشغيل، بما يشمل حركة الفأرة، وإدخال لوحة المفاتيح، والتقاط الشاشة. وهذا يتجاوز أتمتة المتصفح إلى تحكم كامل بسطح المكتب.

المزايا:
- يمكنها التفاعل مع التطبيقات الأصلية وليس المتصفحات فقط
- تدعم تدفقات GUI معقدة
- تتعامل مع النوافذ المنبثقة، وحوارات الملفات، وتنبيهات النظام

## الأمان

### قائمة سماح النطاقات

تفرض أداة المتصفح قائمة سماح صارمة للنطاقات. قبل التنقل إلى أي URL:

1. يُحلَّل عنوان URL ويُستخرج اسم المضيف
2. يُفحَص اسم المضيف مقابل `allowed_domains`
3. إذا لم يوجد تطابق، يُمنع التنقل وتُعاد رسالة خطأ

يمنع ذلك الوكيل من الوصول إلى مواقع عشوائية، ما قد يعرّضه لمحتوى خبيث أو يطلق إجراءات غير مقصودة ضمن جلسات مصادقة.

### عزل الجلسات

تُعزل جلسات المتصفح بحسب الاسم. ويمكن لجلسات الوكلاء المختلفة أو الوكلاء الفرعيين استخدام سياقات متصفح منفصلة لتجنب تسرب الحالة (cookies, localStorage, session data).

### حدود استخراج المحتوى

يخضع استخراج محتوى الصفحة لحد `web_search.fetch_max_chars` لمنع استنزاف الذاكرة بسبب الصفحات كبيرة الحجم جدًا.

### محرك السياسات

تمر استدعاءات أداة المتصفح عبر محرك سياسات الأمان. ويمكن رفض الأداة كليًا، أو جعلها تحت الإشراف لتتطلب موافقة لكل عملية تنقل:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### أمان بيانات الاعتماد

لا تقوم أداة المتصفح بحقن بيانات اعتماد أو رموز مصادقة داخل جلسات المتصفح. إذا احتاج الوكيل إلى المصادقة على موقع، فعليه استخدام أداة المتصفح لملء نماذج تسجيل الدخول صراحةً، وذلك يخضع لسياسات الإشراف.

## مرتبط

- [Web Search](/ar/prx/tools/web-search) -- البحث في الويب دون أتمتة المتصفح
- [HTTP Request](/ar/prx/tools/http-request) -- طلبات HTTP برمجية إلى واجهات API
- [Shell Execution](/ar/prx/tools/shell) -- بديل للتفاعلات القائمة على CLI مع الويب (`curl`, `wget`)
- [Security Sandbox](/ar/prx/security/sandbox) -- عزل العمليات لتنفيذ الأدوات
- [Configuration Reference](/ar/prx/config/reference) -- حقول إعداد `[browser]`
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل
