---
title: تكامل CrowdSec
description: "تكامل PRX-WAF مع CrowdSec لاستخبارات التهديدات التعاونية. وضع Bouncer مع ذاكرة تخزين مؤقت للقرارات في الذاكرة ووضع AppSec لتحليل HTTP في الوقت الفعلي وناقل السجل للمشاركة المجتمعية."
---

# تكامل CrowdSec

يتكامل PRX-WAF مع [CrowdSec](https://www.crowdsec.net/) لجلب استخبارات التهديدات التعاونية المجتمعية مباشرةً إلى خط أنابيب كشف WAF. بدلاً من الاعتماد فقط على القواعد والاستدلالات المحلية، يمكن لـ PRX-WAF الاستفادة من شبكة CrowdSec -- حيث تشارك آلاف الأجهزة إشارات الهجوم في الوقت الفعلي -- لحجب عناوين IP الضارة المعروفة وكشف الهجمات على طبقة التطبيق والمساهمة بأحداث WAF إلى المجتمع.

يعمل التكامل في **ثلاثة أوضاع** يمكن استخدامها بشكل مستقل أو معاً:

| الوضع | الغرض | زمن الاستجابة | مرحلة خط الأنابيب |
|------|---------|---------|----------------|
| **Bouncer** | حجب IPs بقرارات LAPI المخزَّنة مؤقتاً | ميكروثوانٍ (في الذاكرة) | المرحلة 16a |
| **AppSec** | تحليل طلبات HTTP الكاملة عبر CrowdSec AppSec | ميلي ثوانٍ (استدعاء HTTP) | المرحلة 16b |
| **ناقل السجل** | الإبلاغ عن أحداث WAF إلى LAPI | غير متزامن (دفعات) | الخلفية |

## كيف يعمل

### وضع Bouncer

يُحافظ وضع Bouncer على **ذاكرة تخزين مؤقت للقرارات في الذاكرة** مُزامَنة مع واجهة برمجة CrowdSec المحلية (LAPI). عند وصول طلب إلى المرحلة 16a من خط أنابيب الكشف، يُجري PRX-WAF بحثاً O(1) في ذاكرة التخزين المؤقت:

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

تُحدَّث ذاكرة التخزين المؤقت بفترة قابلة للتهيئة (الافتراضي: كل 10 ثوانٍ) عن طريق استطلاع نقطة نهاية LAPI `/v1/decisions`. يضمن هذا التصميم أن عمليات البحث في IP لا تنتظر أبداً على إدخال/إخراج الشبكة -- يحدث التزامن في مهمة خلفية.

**هياكل البيانات:**

- **DashMap** لعناوين IP الدقيقة -- خريطة تجزئة متزامنة بدون قفل، بحث O(1)
- **RwLock\<Vec\>** لنطاقات CIDR -- تُفحص بالتسلسل عند إخفاق ذاكرة التخزين المؤقت، عادةً مجموعة صغيرة

**تصفية السيناريو** تتيح لك تضمين القرارات أو استبعادها استناداً إلى أسماء السيناريوهات:

```toml
# Only act on SSH brute-force and HTTP scanning scenarios
scenarios_containing = ["ssh-bf", "http-scan"]

# Ignore decisions from these scenarios
scenarios_not_containing = ["manual"]
```

### وضع AppSec

يرسل وضع AppSec تفاصيل طلب HTTP الكاملة إلى مكوِّن CrowdSec AppSec للتحليل في الوقت الفعلي. على خلاف وضع Bouncer الذي يفحص IPs فقط، يفحص AppSec رؤوس الطلب والجسم وURI والأسلوب لكشف الهجمات على طبقة التطبيق مثل حقن SQL وXSS وتجاوز المسار.

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

فحوصات AppSec **غير متزامنة** -- يُرسل PRX-WAF الطلب بمهلة قابلة للتهيئة (الافتراضي: 500ms). إذا كانت نقطة نهاية AppSec غير متاحة أو انتهت مهلتها، يحدد `fallback_action` ما إذا كان يجب السماح بالطلب أو حجبه أو تسجيله.

### ناقل السجل

يُبلِّغ ناقل السجل عن أحداث أمن WAF إلى CrowdSec LAPI، مساهماً في شبكة استخبارات التهديدات المجتمعية. تُجمَّع الأحداث في دفعات وتُفرَّغ بشكل دوري لتقليل حمل LAPI.

**معاملات الدُّفعات:**

| المعامل | القيمة | الوصف |
|-----------|-------|-------------|
| حجم الدفعة | 50 حدثاً | تفريغ عند امتلاء المخزن المؤقت بـ 50 حدثاً |
| فترة التفريغ | 30 ثانية | تفريغ حتى لو لم يمتلئ المخزن |
| المصادقة | JWT الجهاز | يستخدم `pusher_login` / `pusher_password` لمصادقة الجهاز |
| الإغلاق | تفريغ نهائي | تُفرَّغ جميع الأحداث المخزَّنة مؤقتاً قبل إنهاء العملية |

يُصادق الناقل مع LAPI باستخدام بيانات اعتماد الجهاز (منفصلة عن مفتاح API للـ Bouncer) وينشر الأحداث إلى نقطة نهاية `/v1/alerts`.

## الإعداد

أضِف قسم `[crowdsec]` إلى ملف إعداد TOML:

```toml
[crowdsec]
# Master switch
enabled = true

# Integration mode: "bouncer", "appsec", or "both"
mode = "both"

# --- Bouncer settings ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = use LAPI-provided duration
fallback_action = "allow"    # "allow" | "block" | "log"

# Scenario filtering (optional)
scenarios_containing = []
scenarios_not_containing = []

# --- AppSec settings ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Log Pusher settings ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### مرجع الإعداد

| المفتاح | النوع | الافتراضي | الوصف |
|-----|------|---------|-------------|
| `enabled` | `boolean` | `false` | تفعيل تكامل CrowdSec |
| `mode` | `string` | `"bouncer"` | وضع التكامل: `"bouncer"` أو `"appsec"` أو `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | عنوان URL أساسي لـ CrowdSec LAPI |
| `api_key` | `string` | `""` | مفتاح API للـ Bouncer (احصل عليه عبر `cscli bouncers add`) |
| `update_frequency_secs` | `integer` | `10` | عدد مرات تحديث ذاكرة التخزين المؤقت للقرارات من LAPI (بالثواني) |
| `cache_ttl_secs` | `integer` | `0` | تجاوز TTL القرار. `0` يعني استخدام المدة التي يوفرها LAPI. |
| `fallback_action` | `string` | `"allow"` | الإجراء عند عدم إمكانية الوصول إلى LAPI أو AppSec: `"allow"` أو `"block"` أو `"log"` |
| `scenarios_containing` | `string[]` | `[]` | تخزين القرارات التي يحتوي اسم سيناريوها على أحد هذه السلاسل الفرعية فقط. فارغة تعني الكل. |
| `scenarios_not_containing` | `string[]` | `[]` | استبعاد القرارات التي يحتوي اسم سيناريوها على أحد هذه السلاسل الفرعية. |
| `appsec_endpoint` | `string` | -- | عنوان URL لنقطة نهاية CrowdSec AppSec |
| `appsec_key` | `string` | -- | مفتاح API لـ AppSec |
| `appsec_timeout_ms` | `integer` | `500` | مهلة طلب HTTP لـ AppSec (بالميلي ثانية) |
| `pusher_login` | `string` | -- | تسجيل دخول الجهاز لمصادقة LAPI (ناقل السجل) |
| `pusher_password` | `string` | -- | كلمة مرور الجهاز لمصادقة LAPI (ناقل السجل) |

## دليل الإعداد

### المتطلبات الأولية

1. نسخة CrowdSec تعمل مع LAPI متاحة من مضيف PRX-WAF
2. مفتاح API للـ Bouncer (لوضع Bouncer)
3. مكوِّن CrowdSec AppSec (لوضع AppSec، اختياري)
4. بيانات اعتماد الجهاز (لناقل السجل، اختياري)

### الخطوة 1: تثبيت CrowdSec

إذا لم يكن لديك CrowdSec مثبتاً بعد:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Verify LAPI is running
sudo cscli metrics
```

### الخطوة 2: تسجيل Bouncer

```bash
# Create a bouncer API key for PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Output:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Copy this key -- it is only shown once.
```

### الخطوة 3: إعداد PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### الخطوة 4: التحقق من الاتصال

```bash
# Using the CLI
prx-waf crowdsec test

# Or via the API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### الخطوة 5 (اختياري): تفعيل AppSec

إذا كان لديك مكوِّن CrowdSec AppSec يعمل:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### الخطوة 6 (اختياري): تفعيل ناقل السجل

للمساهمة بأحداث WAF إلى CrowdSec:

```bash
# Register a machine on the CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### الإعداد التفاعلي

للتجربة الموجَّهة، استخدم معالج CLI:

```bash
prx-waf crowdsec setup
```

يرشدك المعالج خلال إعداد عنوان URL للـ LAPI وإدخال مفتاح API واختيار الوضع والتحقق من الاتصال.

## تكامل خط الأنابيب

تُنفَّذ فحوصات CrowdSec في **المرحلة 16** من خط أنابيب WAF من 16 مرحلة -- المرحلة الأخيرة قبل التوجيه إلى الخادم الخلفي. هذا الموضع مقصود:

1. **الفحوصات الأرخص أولاً.** قائمة السماح/الحظر بالـ IP (المرحلة 1-4) وتحديد المعدل (المرحلة 5) ومطابقة الأنماط (المرحلة 8-13) تُنفَّذ قبل CrowdSec، مُصفيةً الهجمات الواضحة دون عمليات بحث خارجية.
2. **Bouncer قبل AppSec.** المرحلة 16a (Bouncer) تعمل بشكل متزامن بزمن استجابة بالميكروثوانٍ. فقط إذا لم يكن IP في ذاكرة التخزين المؤقت للقرارات تعمل المرحلة 16b (AppSec)، التي تتضمن جولة HTTP.
3. **بنية غير محجوبة.** تُحدَّث ذاكرة التخزين المؤقت للقرارات في مهمة خلفية. تستخدم استدعاءات AppSec HTTP غير متزامن مع مهلة. لا يحجب أي وضع مجمع الخيوط الرئيسي للوكيل.

```
Phase 1-15 (local checks)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR lookup, ~1-5 us)
              │
              ├── Decision found ──> Block/Captcha/Throttle
              │
              └── No decision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                       │
                                       ├── Block ──> 403 Forbidden
                                       │
                                       └── Allow ──> Proxy to upstream
```

## REST API

جميع نقاط نهاية API الخاصة بـ CrowdSec تتطلب المصادقة (رمز JWT Bearer من API الإدارة).

### الحالة

```http
GET /api/crowdsec/status
```

تُعيد حالة التكامل الحالية تضمُّ حالة الاتصال وإحصاءات ذاكرة التخزين المؤقت وملخص الإعداد.

**الاستجابة:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### سرد القرارات

```http
GET /api/crowdsec/decisions
```

تُعيد جميع القرارات المخزَّنة مؤقتاً مع نوعها ونطاقها وقيمتها وانتهاء صلاحيتها.

**الاستجابة:**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### حذف قرار

```http
DELETE /api/crowdsec/decisions/:id
```

يُزيل قراراً من ذاكرة التخزين المؤقت المحلية وLAPI. مفيد لإلغاء حجب النتائج الإيجابية الخاطئة.

**مثال:**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### اختبار الاتصال

```http
POST /api/crowdsec/test
```

يختبر الاتصال بـ LAPI (ونقطة نهاية AppSec إذا كانت مُهيَّأة). يُعيد حالة الاتصال وزمن الاستجابة.

**الاستجابة:**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### الحصول على الإعداد

```http
GET /api/crowdsec/config
```

يُعيد إعداد CrowdSec الحالي (الحقول الحساسة مثل `api_key` مُخفَّاة).

### تحديث الإعداد

```http
PUT /api/crowdsec/config
Content-Type: application/json
```

يُحدِّث إعداد CrowdSec في وقت التشغيل. تسري التغييرات فوراً دون إعادة التشغيل.

**جسم الطلب:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_url": "http://127.0.0.1:8080",
  "api_key": "new-api-key",
  "update_frequency_secs": 15,
  "fallback_action": "log"
}
```

### إحصاءات ذاكرة التخزين المؤقت

```http
GET /api/crowdsec/stats
```

يُعيد إحصاءات ذاكرة التخزين المؤقت التفصيلية بما فيها معدلات الإصابة/الإخفاق وتفصيل نوع القرار.

**الاستجابة:**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

### الأحداث الأخيرة

```http
GET /api/crowdsec/events
```

يُعيد أحداث الأمن الأخيرة التي أطلقتها قرارات CrowdSec.

**الاستجابة:**

```json
{
  "events": [
    {
      "timestamp": "2026-03-21T10:14:22Z",
      "source_ip": "192.168.1.100",
      "action": "ban",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "request_uri": "/wp-login.php",
      "method": "POST"
    }
  ],
  "total": 892
}
```

## أوامر CLI

### الحالة

```bash
prx-waf crowdsec status
```

يعرض حالة التكامل وحالة اتصال LAPI وحجم ذاكرة التخزين المؤقت وإحصاءات الناقل.

**مثال على المخرجات:**

```
CrowdSec Integration Status
============================
  Enabled:        true
  Mode:           both
  LAPI URL:       http://127.0.0.1:8080
  LAPI Connected: true
  Cache:
    Exact IPs:    1,247
    CIDR Ranges:  89
    Last Refresh: 2s ago
  AppSec:
    Endpoint:     http://127.0.0.1:7422
    Connected:    true
  Pusher:
    Authenticated: true
    Events Sent:   4,521
    Buffer:        12 pending
```

### سرد القرارات

```bash
prx-waf crowdsec decisions
```

يطبع جدولاً بجميع القرارات النشطة في ذاكرة التخزين المؤقت المحلية.

### اختبار الاتصال

```bash
prx-waf crowdsec test
```

يُجري فحص اتصال مع LAPI ونقطة نهاية AppSec، مُبلِّغاً عن زمن الاستجابة ومعلومات الإصدار.

### معالج الإعداد

```bash
prx-waf crowdsec setup
```

معالج تفاعلي يرشدك خلال:

1. إعداد عنوان URL للـ LAPI ومفتاح API
2. اختيار الوضع (bouncer / appsec / both)
3. إعداد نقطة نهاية AppSec (إذا انطبق)
4. إعداد بيانات اعتماد ناقل السجل (اختياري)
5. التحقق من الاتصال
6. كتابة الإعداد في ملف TOML

## واجهة المستخدم الإدارية

تتضمن لوحة تحكم Vue 3 الإدارية ثلاثة طرق عرض لإدارة CrowdSec:

### إعدادات CrowdSec

يوفر طريق العرض **CrowdSecSettings** (`الإعدادات > CrowdSec`) نموذجاً لإعداد جميع معاملات CrowdSec:

- تبديل التفعيل/التعطيل
- محدِّد الوضع (bouncer / appsec / both)
- حقول عنوان URL لـ LAPI ومفتاح API
- شريط تمرير فترة تحديث ذاكرة التخزين المؤقت
- محدِّد إجراء الاحتياط
- إعداد نقطة نهاية AppSec
- بيانات اعتماد ناقل السجل
- زر اختبار الاتصال مع تغذية راجعة في الوقت الفعلي

### قرارات CrowdSec

يعرض طريق العرض **CrowdSecDecisions** (`الأمن > قرارات CrowdSec`) جميع القرارات المخزَّنة مؤقتاً في جدول قابل للفرز والتصفية:

- شارات نوع القرار (ban وcaptcha وthrottle)
- IP/النطاق مع بحث الموقع الجغرافي
- اسم السيناريو مع رابط التوثيق
- عداد تنازلي للانتهاء
- حذف بنقرة واحدة لإلغاء حجب IPs

### إحصاءات CrowdSec

يعرض طريق العرض **CrowdSecStats** (`لوحة التحكم > CrowdSec`) مقاييس التشغيل:

- مخطط معدل إصابة/إخفاق ذاكرة التخزين المؤقت (سلسلة زمنية)
- تفصيل نوع القرار (مخطط دائري)
- أبرز السيناريوهات المحجوبة (مخطط شريطي)
- إنتاجية أحداث الناقل
- مدرَّج متكرر لزمن استجابة LAPI

## أنماط النشر

### Bouncer فقط (نقطة بداية موصى بها)

النشر الأبسط. يستطلع PRX-WAF القرارات من CrowdSec LAPI ويحجب IPs الضارة المعروفة:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "allow"
```

الأفضل لـ: معظم النشرات وحد أدنى من الحمل الزائد ولا حاجة لمكوِّنات CrowdSec إضافية.

### التكامل الكامل (Bouncer + AppSec + Pusher)

أقصى حماية مع استخبارات تهديدات ثنائية الاتجاه:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 10
fallback_action = "log"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
pusher_login = "prx-waf-machine"
pusher_password = "secure-password"
```

الأفضل لـ: بيئات الإنتاج التي تريد فحص سمعة IP وطبقة التطبيق بالإضافة إلى المساهمة المجتمعية.

### توافر عالٍ مع LAPI بعيد

عندما يعمل CrowdSec LAPI على خادم مخصص:

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "https://crowdsec.internal:8080"
api_key = "your-bouncer-key"
update_frequency_secs = 5
fallback_action = "allow"  # Don't block if LAPI is unreachable
cache_ttl_secs = 300       # Keep decisions for 5 min even if LAPI goes down
```

الأفضل لـ: نشرات متعددة الخوادم حيث CrowdSec LAPI مركزي.

### أمن صارم (حجب عند الفشل)

لبيئات الأمن العالي حيث تفضل حجب الحركة عند عدم توفر استخبارات التهديدات:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-key"
fallback_action = "block"
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 200     # Short timeout, fail fast
```

::: warning
إعداد `fallback_action = "block"` يعني حجب جميع الحركة إذا أصبح LAPI أو نقطة نهاية AppSec غير متاحة. استخدم هذا فقط في البيئات التي يكون فيها توفر CrowdSec مضموناً.
:::

## تصفية السيناريو

تمثِّل سيناريوهات CrowdSec أنماط هجوم محددة (مثل `crowdsecurity/ssh-bf` للقوة الغاشمة على SSH). يمكنك تصفية السيناريوهات التي يتخذ PRX-WAF إجراءً بشأنها:

### تضمين سيناريوهات محددة فقط

```toml
[crowdsec]
# Only block IPs flagged for HTTP-related attacks
scenarios_containing = ["http-"]
```

هذا مفيد عندما يتعامل WAF الخاص بك مع حركة HTTP فقط ولا تريد أن تملأ قرارات القوة الغاشمة على SSH أو SMTP ذاكرة التخزين المؤقت.

### استبعاد سيناريوهات محددة

```toml
[crowdsec]
# Block everything except manual decisions
scenarios_not_containing = ["manual"]
```

### دمج المرشحات

```toml
[crowdsec]
# Only HTTP scenarios, but exclude DDoS (handled by upstream)
scenarios_containing = ["http-"]
scenarios_not_containing = ["http-ddos"]
```

## استكشاف الأخطاء

### رفض اتصال LAPI

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**السبب:** CrowdSec LAPI لا يعمل أو يستمع على عنوان مختلف.

**الحل:**
```bash
# Check CrowdSec status
sudo systemctl status crowdsec

# Verify LAPI is listening
sudo ss -tlnp | grep 8080

# Check CrowdSec logs
sudo journalctl -u crowdsec -f
```

### مفتاح API غير صالح

```
CrowdSec LAPI returned 403: invalid API key
```

**السبب:** مفتاح API للـ Bouncer غير صحيح أو تم إلغاؤه.

**الحل:**
```bash
# List existing bouncers
sudo cscli bouncers list

# Create a new bouncer key
sudo cscli bouncers add prx-waf-bouncer
```

### انتهاء مهلة AppSec

```
CrowdSec AppSec timeout after 500ms
```

**السبب:** نقطة نهاية AppSec بطيئة أو محمَّلة زيادة.

**الحل:**
- زِد `appsec_timeout_ms` (مثل إلى 1000)
- تحقق من استخدام موارد AppSec
- فكِّر في استخدام `mode = "bouncer"` فقط إذا لم يكن AppSec بالغ الأهمية

### ذاكرة تخزين مؤقت للقرارات فارغة

إذا لم يُظهر `prx-waf crowdsec decisions` أي إدخالات:

1. تحقق من وجود قرارات في LAPI: `sudo cscli decisions list`
2. تحقق من تصفية السيناريو -- قد يكون مرشح `scenarios_containing` مقيِّداً جداً
3. تحقق من أن مفتاح Bouncer لديه أذونات القراءة

### فشل مصادقة ناقل السجل

```
CrowdSec pusher: machine authentication failed
```

**السبب:** بيانات اعتماد الجهاز غير صالحة.

**الحل:**
```bash
# Verify machine exists
sudo cscli machines list

# Re-register the machine
sudo cscli machines add prx-waf-pusher --password "new-password" --force
```

حدِّث `pusher_login` و`pusher_password` في الإعداد وفقاً لذلك.

## الخطوات التالية

- [مرجع الإعداد](../configuration/reference) -- مرجع إعداد TOML الكامل
- [مرجع CLI](../cli/) -- جميع أوامر CLI بما فيها أوامر CrowdSec الفرعية
- [محرك القواعد](../rules/) -- كيف يندمج CrowdSec في خط أنابيب الكشف
- [واجهة المستخدم الإدارية](../admin-ui/) -- إدارة CrowdSec من لوحة التحكم
