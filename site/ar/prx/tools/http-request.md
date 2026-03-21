---
title: HTTP Request
description: تنفيذ طلبات HTTP إلى واجهات API مع قائمة سماح للنطاقات، وحدود قابلة للضبط لحجم الاستجابة، وفرض المهلة الزمنية.
---

# HTTP Request

تتيح أداة `http_request` لوكلاء PRX تنفيذ طلبات HTTP مباشرة إلى واجهات API الخارجية. وقد صُممت للتكاملات المنظمة مع API، مثل جلب بيانات JSON، واستدعاء نقاط REST، وإرسال webhooks، وليست للتصفح العام للويب. وتفرض الأداة سياسة نطاقات افتراضيًا على الرفض: لا يمكن الوصول إلا إلى النطاقات المذكورة صراحة في `allowed_domains`.

أداة HTTP request مقيّدة بميزة وتتطلب `http_request.enabled = true` في الإعدادات. وعلى عكس أداة المتصفح التي تعرض صفحات ويب، تعمل أداة HTTP request على مستوى البروتوكول، ما يجعلها أسرع وأكثر ملاءمة لتكاملات API.

تدعم الأداة جميع طرق HTTP القياسية (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)، مع رؤوس مخصصة، وأجسام طلب، ومهل زمنية قابلة للضبط. ويتم التقاط جسم الاستجابة حتى حد أقصى قابل للضبط لمنع استنزاف الذاكرة.

## الإعداد

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # Maximum response body size in bytes (1 MB)
timeout_secs = 30             # Request timeout in seconds
```

### قائمة سماح النطاقات

قائمة `allowed_domains` هي عنصر الأمان الأساسي لأداة HTTP request. لا يُسمح إلا بالطلبات إلى النطاقات الموجودة في هذه القائمة. قواعد مطابقة النطاق:

| Pattern | Example | Matches |
|---------|---------|---------|
| Exact domain | `"api.github.com"` | `api.github.com` فقط |
| Wildcard subdomain | `"*.github.com"` | `api.github.com`, `raw.github.com`, ... |
| Top-level domain | `"github.com"` | `github.com` فقط (لا يشمل النطاقات الفرعية افتراضيًا) |

::: warning
قائمة `allowed_domains` الفارغة تعني عدم السماح بأي طلبات HTTP، حتى عند تفعيل الأداة. وهذا هو الافتراضي الآمن.
:::

## الاستخدام

### طلب GET

جلب بيانات من REST API:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx/releases/latest",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer ghp_xxxxxxxxxxxx"
    }
  }
}
```

### طلب POST

إرسال بيانات إلى نقطة API:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/webhooks",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"event\": \"task_completed\", \"data\": {\"task_id\": 42}}"
  }
}
```

### طلب PUT

تحديث مورد:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "PUT",
    "url": "https://api.example.com/config/settings",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token-here"
    },
    "body": "{\"theme\": \"dark\", \"language\": \"en\"}"
  }
}
```

### طلب DELETE

حذف مورد:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "DELETE",
    "url": "https://api.example.com/items/42",
    "headers": {
      "Authorization": "Bearer token-here"
    }
  }
}
```

## المعاملات

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `method` | `string` | No | `"GET"` | طريقة HTTP: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | Yes | -- | عنوان URL الكامل للطلب. يجب أن يكون HTTPS أو HTTP. ويجب أن يكون النطاق ضمن `allowed_domains`. |
| `headers` | `object` | No | `{}` | خريطة key-value لرؤوس HTTP التي ستُضمَّن في الطلب |
| `body` | `string` | No | -- | جسم الطلب (لطُرق POST وPUT وPATCH) |
| `timeout_secs` | `integer` | No | قيمة الإعداد (`30`) | تجاوز المهلة الزمنية لكل طلب بالثواني |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | `true` إذا اكتمل الطلب (حتى مع رموز حالة غير 2xx) |
| `output` | `string` | جسم الاستجابة (نصي)، مع اقتطاع إلى `max_response_size`. ويتضمن رمز الحالة والرؤوس في مخرجات منظمة. |
| `error` | `string?` | رسالة خطأ إذا فشل الطلب (حظر نطاق، مهلة، خطأ اتصال) |

### صيغة الاستجابة

تعيد الأداة مخرجات منظمة تحتوي:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

بالنسبة للاستجابات غير النصية (بيانات ثنائية)، تُبلغ الأداة عن حجم الاستجابة ونوع المحتوى دون تضمين الجسم.

## أنماط شائعة

### التكامل مع API

تُستخدم أداة HTTP request عادةً للتكامل مع خدمات خارجية:

```
Agent thinking: The user wants to check the CI status of their PR.
  1. [http_request] GET https://api.github.com/repos/owner/repo/pulls/42/checks
  2. [parses JSON response]
  3. [reports status to user]
```

### إرسال Webhook

إرسال إشعارات إلى أنظمة خارجية:

```
Agent thinking: Task completed, need to notify the webhook.
  1. [http_request] POST https://hooks.slack.com/services/T.../B.../xxx
     body: {"text": "Task #42 completed successfully"}
```

### جلب البيانات

استرجاع بيانات منظمة للتحليل:

```
Agent thinking: Need to look up package metadata.
  1. [http_request] GET https://crates.io/api/v1/crates/tokio
  2. [extracts version, download count, dependencies]
```

## الأمان

### الرفض الافتراضي

تستخدم أداة HTTP request نموذج أمان قائمًا على الرفض الافتراضي. إذا لم يكن النطاق مدرجًا صراحة في `allowed_domains`، يُحظر الطلب قبل إنشاء أي اتصال شبكي. وهذا يمنع:

- **Server-Side Request Forgery (SSRF)**: لا يمكن للوكيل إجراء طلبات إلى عناوين الشبكة الداخلية (`localhost`, `10.x.x.x`, `192.168.x.x`) إلا إذا سُمِح بها صراحة
- **تسريب البيانات**: لا يمكن للوكيل إرسال بيانات إلى خوادم خارجية عشوائية
- **DNS rebinding**: يُفحص النطاق وقت الطلب وليس فقط عند حل DNS

### التعامل مع بيانات الاعتماد

لا تحقن أداة HTTP request بيانات الاعتماد تلقائيًا. إذا احتاج الوكيل المصادقة مع API، فعليه تضمين رؤوس المصادقة صراحةً في معاملات استدعاء الأداة. وهذا يعني:

- مفاتيح API مرئية في استدعاء الأداة (وسجل التدقيق)
- لا يمكن للوكيل استخدام إلا بيانات اعتماد مُنحت له أو استرجعها من الذاكرة
- يمنع تسرب بيانات الاعتماد إلى نطاقات غير مصرح بها عبر قائمة سماح النطاقات

فكّر باستخدام `[security.tool_policy]` لجعل `http_request` تحت الإشراف لاستدعاءات API الحساسة:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### حدود حجم الاستجابة

إعداد `max_response_size` (الافتراضي: 1 MB) يمنع استنزاف الذاكرة من الاستجابات كبيرة الحجم غير المتوقعة. وتُقتطع الاستجابات التي تتجاوز هذا الحد مع إضافة ملاحظة في المخرجات.

### الحماية بالمهلة

إعداد `timeout_secs` (الافتراضي: 30 ثانية) يمنع تعليق الوكيل على خوادم بطيئة أو غير مستجيبة. وتُفرض المهلة على مستوى الاتصال.

### دعم Proxy

عند ضبط `[proxy]`، تُمرر طلبات HTTP عبر الـ proxy المحدد:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### سجلات التدقيق

تُسجَّل جميع طلبات HTTP في سجل التدقيق عند التفعيل، بما في ذلك:

- طريقة الطلب وURL
- رؤوس الطلب (مع إخفاء القيم الحساسة)
- رمز حالة الاستجابة
- حجم الاستجابة
- حالة النجاح/الفشل

## مرتبط

- [Web Search](/ar/prx/tools/web-search) -- البحث في الويب وجلب محتوى الصفحات
- [Browser Tool](/ar/prx/tools/browser) -- أتمتة متصفح كاملة لصفحات الويب
- [MCP Integration](/ar/prx/tools/mcp) -- الاتصال بأدوات خارجية عبر بروتوكول MCP
- [Configuration Reference](/ar/prx/config/reference) -- حقول إعداد `[http_request]`
- [Proxy Configuration](/ar/prx/config/reference#proxy) -- إعدادات outbound proxy
- [Tools Overview](/ar/prx/tools/) -- جميع الأدوات ونظام السجل
