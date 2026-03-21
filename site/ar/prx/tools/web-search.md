---
title: البحث على الويب
description: البحث في الويب عبر DuckDuckGo (مجاني دون مفتاح API) أو Brave Search (يتطلب مفتاح API) مع حدود نتائج ومهل زمنية قابلة للضبط.
---

# البحث على الويب

تتيح أداة `web_search_tool` لوكلاء PRX البحث في الويب للحصول على معلومات حديثة. وهي تدعم مزودين للبحث: DuckDuckGo (مجاني ولا يتطلب مفتاح API) وBrave Search (يتطلب مفتاح API)، وتعيد نتائج بحث منظمة يمكن للوكيل استخدامها للإجابة عن الأسئلة المتعلقة بالأحداث الحديثة، أو البحث عن التوثيق، أو إجراء أبحاث موضوعية.

البحث على الويب مقيّد بميزة ويتطلب `web_search.enabled = true` في الإعداد. وعند التفعيل، يسجّل PRX اختياريًا أداة `web_fetch` لاستخراج محتوى الصفحة الكامل من عناوين URL الموجودة في نتائج البحث.

يوفّر الجمع بين `web_search_tool` و`web_fetch` خط بحث ويب كاملًا: البحث عن الصفحات ذات الصلة ثم جلب واستخراج المحتوى من أفضل النتائج.

## الإعداد

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (free) or "brave" (API key required)
max_results = 5              # Maximum results per search (1-10)
timeout_secs = 10            # Request timeout in seconds

# Brave Search (requires API key)
# provider = "brave"
# brave_api_key = "BSA-xxxxxxxxxxxx"

# Web fetch (page content extraction)
fetch_enabled = true         # Enable the web_fetch tool
fetch_max_chars = 50000      # Maximum characters returned by web_fetch
```

### مقارنة المزودين

| Feature | DuckDuckGo | Brave Search |
|---------|-----------|-------------|
| Cost | مجاني | شريحة مجانية (2000 استعلام/شهر) مع خطط مدفوعة |
| API key | غير مطلوب | مطلوب (`brave_api_key`) |
| Result quality | جيد للاستعلامات العامة | جودة أعلى وبنية أفضل |
| Rate limits | ضمنية (قد يحدث throttling) | صريحة (حسب الخطة) |
| Privacy | يركز على الخصوصية | يركز على الخصوصية |
| Structured data | أساسي (title, URL, snippet) | غني (title, URL, snippet, extra descriptions) |

### اختيار المزود

- **DuckDuckGo** هو الافتراضي ويعمل مباشرة دون إعداد إضافي سوى `enabled = true`. مناسب لمعظم الحالات ولا يتطلب حسابًا أو مفتاح API.
- **Brave Search** يقدّم نتائج أعلى جودة وبيانات وصفية أغنى. استخدمه عندما تكون جودة البحث حرجة أو عند الحاجة إلى `web_fetch` لاستخراج محتوى أكثر موثوقية.

## الاستخدام

### web_search_tool

تعيد أداة البحث قائمة نتائج مع العناوين وURL والملخصات:

```json
{
  "name": "web_search_tool",
  "arguments": {
    "query": "Rust async runtime comparison tokio vs async-std 2026",
    "max_results": 5
  }
}
```

**Example response:**

```json
{
  "success": true,
  "output": "1. Comparing Tokio and async-std in 2026 - https://blog.example.com/rust-async\n   Snippet: A detailed comparison of the two main Rust async runtimes...\n\n2. Tokio documentation - https://docs.rs/tokio\n   Snippet: Tokio is an asynchronous runtime for Rust...\n\n..."
}
```

### web_fetch

بعد العثور على عناوين URL ذات صلة عبر البحث، يمكن للوكيل جلب المحتوى واستخراجه:

```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://blog.example.com/rust-async"
  }
}
```

أداة `web_fetch`:

1. تتحقق من نطاق URL مقابل `browser.allowed_domains`
2. تجلب محتوى الصفحة
3. تستخرج النص القابل للقراءة (مع إزالة HTML وscripts وstyles)
4. تقتطع إلى `fetch_max_chars`
5. تعيد المحتوى المستخرج

::: warning
تتطلب `web_fetch` كِلا `web_search.fetch_enabled = true` **و** ضبط `browser.allowed_domains`. ويجب أن يطابق URL المطلوب جلبه أحد النطاقات المسموح بها.
:::

## المعاملات

### معاملات web_search_tool

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `query` | `string` | Yes | -- | نص استعلام البحث |
| `max_results` | `integer` | No | قيمة الإعداد (`5`) | الحد الأقصى لعدد النتائج المعادة (1-10) |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا اكتمل البحث |
| `output` | `string` | نتائج بحث منسقة مع العنوان وURL والملخص |
| `error` | `string?` | رسالة خطأ إذا فشل البحث (مهلة، خطأ مزود، إلخ) |

### معاملات web_fetch

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | `string` | Yes | -- | عنوان URL المراد جلب المحتوى واستخراجه منه |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا تم جلب الصفحة وتحليلها |
| `output` | `string` | النص المستخرج مع اقتطاع إلى `fetch_max_chars` |
| `error` | `string?` | رسالة خطأ إذا فشل الجلب (النطاق غير مسموح، مهلة، إلخ) |

## تدفق بحث نموذجي

عادةً يتبع تدفق بحث ويب كامل النمط التالي:

1. **Search**: يستخدم الوكيل `web_search_tool` للعثور على صفحات ذات صلة
2. **Evaluate**: يراجع الوكيل الملخصات لتحديد النتائج الأكثر صلة
3. **Fetch**: يستخدم الوكيل `web_fetch` لاستخراج المحتوى الكامل من الصفحات المختارة
4. **Synthesize**: يدمج الوكيل المعلومات من مصادر متعددة في إجابة واحدة

```
Agent thinking: The user asked about the latest Rust release features.
  1. [web_search_tool] query="Rust 1.82 release features changelog"
  2. [reviews results, selects top 2 URLs]
  3. [web_fetch] url="https://blog.rust-lang.org/2026/..."
  4. [web_fetch] url="https://releases.rs/docs/1.82.0/"
  5. [synthesizes response from fetched content]
```

## الأمان

### بيانات اعتماد المزود

- **DuckDuckGo**: لا يتطلب بيانات اعتماد. تُرسل الاستعلامات إلى نقاط API الخاصة بـ DuckDuckGo.
- **Brave Search**: يُخزن `brave_api_key` في ملف الإعداد. استخدم مخزن الأسرار المشفر في PRX لحمايته:

```toml
[web_search]
brave_api_key = "enc:xxxxxxxxxxxxx"  # Encrypted with ChaCha20-Poly1305
```

### قيود النطاق لـ web_fetch

تحترم أداة `web_fetch` قائمة `browser.allowed_domains`. وهذا يمنع الوكيل من جلب محتوى من URLs عشوائية قد:

- تعرّض الوكيل لمحتوى خبيث (prompt injection عبر صفحات الويب)
- تسبب SSRF إذا جلب الوكيل عناوين داخلية
- تسرّب معلومات عبر DNS أو طلبات HTTP إلى نطاقات يتحكم بها مهاجم

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

### الحماية بالمهلة

لكل من البحث والجلب مهل زمنية قابلة للضبط لمنع التعليق على خوادم بطيئة أو غير مستجيبة:

- `web_search.timeout_secs` (الافتراضي: 10 ثوانٍ) -- مهلة استعلام البحث
- تنطبق مهل على مستوى الشبكة على `web_fetch` أيضًا

### حدود حجم المحتوى

إعداد `fetch_max_chars` (الافتراضي: 50,000 حرف) يمنع استنزاف الذاكرة بسبب صفحات كبيرة جدًا. ويُقتطع المحتوى بعد هذا الحد.

### محرك السياسات

تمر أدوات البحث على الويب عبر محرك سياسات الأمان:

```toml
[security.tool_policy.tools]
web_search_tool = "allow"
web_fetch = "supervised"     # Require approval before fetching
```

## مرتبط

- [HTTP Request](/ar/prx/tools/http-request) -- طلبات HTTP برمجية إلى APIs
- [Browser Tool](/ar/prx/tools/browser) -- أتمتة متصفح كاملة للمواقع كثيفة JavaScript
- [Configuration Reference](/ar/prx/config/reference) -- حقول `[web_search]` و`[browser]`
- [Secrets Management](/ar/prx/security/secrets) -- تخزين مشفر لمفاتيح API
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل
