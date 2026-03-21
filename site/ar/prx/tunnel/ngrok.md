---
title: تكامل ngrok
description: عرّض وكيل PRX للإنترنت باستخدام ngrok للتطوير السريع واختبار webhooks.
---

# تكامل ngrok

ngrok خدمة أنفاق شائعة تنشئ دخولًا آمنًا إلى نسخة PRX المحلية لديك. وهي أسرع طريقة للبدء مع webhooks والتكاملات الخارجية، إذ يمنحك أمر واحد عنوان HTTPS عامًا يشير إلى وكيلك المحلي.

## نظرة عامة

ngrok مناسب أكثر لـ:

- **التطوير والاختبار** -- الحصول على رابط عام خلال ثوانٍ دون إعداد حساب معقد
- **نمذجة webhook بسرعة** -- اختبار تكاملات Telegram وDiscord وGitHub وSlack بسرعة
- **العروض التوضيحية والتقديمات** -- مشاركة رابط عام مؤقت لعرض وكيلك
- **البيئات التي لا يتوفر فيها Cloudflare أو Tailscale**

لعمليات النشر الإنتاجية، فكّر في [Cloudflare Tunnel](./cloudflare) أو [Tailscale Funnel](./tailscale) لما يقدمانه من اعتمادية أفضل، ونطاقات مخصصة، وضوابط وصول وفق انعدام الثقة.

## المتطلبات المسبقة

1. تثبيت ngrok CLI على الجهاز الذي يشغّل PRX
2. حساب ngrok مع auth token (الخطة المجانية كافية)

### تثبيت ngrok

```bash
# Debian / Ubuntu (via snap)
sudo snap install ngrok

# macOS
brew install ngrok

# Binary download (all platforms)
# https://ngrok.com/download

# Authenticate (one-time setup)
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

احصل على auth token من [لوحة ngrok](https://dashboard.ngrok.com/get-started/your-authtoken).

## الإعداد

### إعداد أساسي

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# Auth token. Can also be set via NGROK_AUTHTOKEN environment variable.
# If omitted, ngrok uses the token from its local config file.
authtoken = ""

# Region for the tunnel endpoint.
# Options: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### نطاق مخصص (الخطط المدفوعة)

تدعم الخطط المدفوعة في ngrok نطاقات مخصصة ثابتة:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Custom domain (requires ngrok paid plan)
domain = "agent.example.com"

# Alternatively, use a static ngrok subdomain (free on some plans)
# subdomain = "my-prx-agent"
```

### نطاق محجوز

للحصول على روابط ثابتة في الخطة المجانية، يقدم ngrok نطاقات محجوزة:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Reserved domain assigned by ngrok (e.g., "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## مرجع الإعداد

| المعامل | النوع | الافتراضي | الوصف |
|-----------|------|---------|-------------|
| `authtoken` | string | -- | رمز مصادقة ngrok |
| `region` | string | `"us"` | منطقة النفق: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | نطاق مخصص أو نطاق محجوز (ميزة مدفوعة) |
| `subdomain` | string | -- | نطاق فرعي ثابت على `ngrok-free.app` |
| `ngrok_path` | string | `"ngrok"` | المسار إلى ملف `ngrok` التنفيذي |
| `inspect` | boolean | `true` | تفعيل لوحة فحص ngrok (`localhost:4040`) |
| `log_level` | string | `"info"` | مستوى سجل ngrok: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | سلسلة بيانات وصفية مرتبطة بجلسة النفق |
| `basic_auth` | string | -- | مصادقة HTTP Basic بصيغة `user:password` |
| `ip_restrictions` | list | `[]` | قائمة نطاقات CIDR المسموح بها (مثل `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | عتبة معدل الخطأ (0.0-1.0) لتفعيل circuit breaker |
| `compression` | boolean | `false` | تفعيل ضغط الاستجابة |

## كيف يدير PRX خدمة ngrok

عند بدء النفق، يقوم PRX بتشغيل ngrok كعملية ابن:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

بعد ذلك يستعلم PRX واجهة ngrok المحلية (`http://127.0.0.1:4040/api/tunnels`) لاستخراج الرابط العام المعيّن. يتم تخزين هذا الرابط واستخدامه لتسجيل webhooks وإعداد القنوات.

### استخراج الرابط

يوفّر ngrok واجهة API محلية على المنفذ 4040. يقوم PRX بالاستعلام عنها مع مهلة زمنية:

```
GET http://localhost:4040/api/tunnels
```

الاستجابة تحتوي على الرابط العام:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

إذا لم تتوفر API خلال `startup_timeout_secs`، يعود PRX إلى تحليل stdout لاستخراج الرابط.

## قيود الخطة المجانية

تحتوي الخطة المجانية في ngrok على عدة قيود يجب الانتباه لها:

| القيد | الخطة المجانية | التأثير على PRX |
|------------|-----------|---------------|
| الأنفاق المتزامنة | 1 | يمكن تشغيل نسخة PRX واحدة فقط لكل حساب ngrok |
| الاتصالات في الدقيقة | 40 | قد يتم تقييد webhooks ذات الحركة العالية |
| النطاقات المخصصة | غير متاحة | يتغير الرابط عند كل إعادة تشغيل |
| قيود IP | غير متاحة | لا يمكن تقييد عناوين IP المصدر |
| عرض النطاق | محدود | قد يتم تقييد نقل الملفات الكبيرة |
| صفحة interstitial | تظهر في أول زيارة | قد تتعارض مع بعض مزودي webhook |

صفحة interstitial (صفحة تحذير المتصفح الخاصة بـ ngrok) لا تؤثر على حركة API/webhook، فهي تظهر فقط لطلبات المتصفح. ومع ذلك، قد يرفض بعض مزودي webhook الاستجابات التي تتضمنها. استخدم خطة مدفوعة أو خلفية مختلفة للإنتاج.

## لوحة فحص ngrok

عند `inspect = true` (القيمة الافتراضية)، يشغّل ngrok لوحة ويب محلية على `http://localhost:4040`. توفّر هذه اللوحة:

- **فاحص الطلبات** -- عرض جميع الطلبات الواردة مع الترويسات والمحتوى والاستجابة
- **إعادة التشغيل** -- إعادة تشغيل أي طلب لأغراض التصحيح
- **حالة النفق** -- صحة الاتصال والمنطقة والرابط العام

تعد هذه ميزة مهمة جدًا لتصحيح تكاملات webhook أثناء التطوير.

## اعتبارات أمنية

- **حماية auth token** -- يمنح رمز مصادقة ngrok صلاحية إنشاء الأنفاق ضمن حسابك. خزّنه في مدير الأسرار في PRX أو مرّره عبر متغير البيئة `NGROK_AUTHTOKEN`.
- **روابط الخطة المجانية عامة** -- أي شخص يملك الرابط يمكنه الوصول إلى وكيلك. استخدم `basic_auth` أو `ip_restrictions` (مدفوع) لتقييد الوصول.
- **تدوير الرابط** -- روابط الخطة المجانية تتغير بعد إعادة التشغيل. إذا احتفظ مزود webhook بالرابط القديم فسيفشل التسليم. استخدم نطاقات محجوزة أو خلفية مختلفة للحصول على رابط ثابت.
- **إنهاء TLS** -- يقوم ngrok بإنهاء TLS عند الحافة الخاصة به. وتنتقل الحركة بين ngrok وPRX المحلي عبر بنية ngrok التحتية.
- **فحص البيانات** -- تعرض لوحة الفحص في ngrok محتوى الطلب/الاستجابة. عطّلها في الإنتاج عبر `inspect = false` إذا كانت البيانات حساسة.

## نمط تكامل webhook

نمط شائع للتطوير: ابدأ PRX مع ngrok، سجّل رابط webhook، ثم اختبر:

```bash
# 1. Start PRX (tunnel starts automatically)
prx start

# 2. PRX logs the public URL
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. Register the webhook URL with your service
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. Inspect requests at http://localhost:4040
```

## مقارنة مع الخلفيات الأخرى

| الميزة | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|---------|-------|-------------------|------------------|
| وقت الإعداد | ثوانٍ | دقائق | دقائق |
| نطاق مخصص | مدفوع | مجاني (مع zone) | MagicDNS فقط |
| انعدام الثقة | لا | نعم (Access) | نعم (ACLs) |
| خطة مجانية | نعم (محدودة) | نعم | نعم (شخصي) |
| لوحة فحص | نعم | لا | لا |
| جاهز للإنتاج | الخطط المدفوعة | نعم | نعم |

## استكشاف الأخطاء وإصلاحها

| العرض | السبب | الحل |
|---------|-------|------------|
| "authentication failed" | auth token غير صالح أو مفقود | شغّل `ngrok config add-authtoken <token>` |
| لم يتم اكتشاف الرابط | واجهة ngrok API لا تستجيب على :4040 | تحقّق أن المنفذ 4040 غير مستخدم من عملية أخرى |
| "tunnel session limit" | الخطة المجانية تسمح بنفق واحد | أوقف جلسات ngrok الأخرى أو قم بالترقية |
| webhooks تعيد 502 | PRX gateway لا يستمع | تأكد من أن `local_addr` يطابق إعداد الـ gateway |
| ظهور صفحة interstitial | تحذير المتصفح في الخطة المجانية | استخدم `--domain` أو قم بالترقية لخطة مدفوعة |
