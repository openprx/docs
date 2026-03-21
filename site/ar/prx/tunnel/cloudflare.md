---
title: نفق Cloudflare
description: دمج PRX مع Cloudflare Tunnel لتوفير دخول وفق نموذج انعدام الثقة باستخدام cloudflared.
---

# نفق Cloudflare

يوفر Cloudflare Tunnel (المعروف سابقًا باسم Argo Tunnel) اتصالًا مشفرًا وصادرًا فقط من نسخة PRX الخاصة بك إلى شبكة الحافة الخاصة بـ Cloudflare. لا حاجة إلى IP عام أو فتح منافذ في الجدار الناري أو إعداد port forwarding. تقوم Cloudflare بإنهاء TLS وتوجيه الحركة إلى وكيلك المحلي عبر النفق.

## نظرة عامة

يُعد Cloudflare Tunnel الخيار الموصى به لعمليات نشر PRX الإنتاجية لأنه يوفر:

- **وصولًا وفق انعدام الثقة** -- التكامل مع Cloudflare Access لفرض التحقق من الهوية قبل الوصول إلى وكيلك
- **نطاقات مخصصة** -- استخدام نطاقك الخاص مع شهادات HTTPS تلقائية
- **حماية من DDoS** -- تمر الحركة عبر شبكة Cloudflare مما يحمي المصدر لديك
- **اعتمادية عالية** -- تحافظ Cloudflare على عدة اتصالات حافة لتحقيق التكرار
- **خطة مجانية** -- يتوفر Cloudflare Tunnels ضمن الخطة المجانية

## المتطلبات المسبقة

1. حساب Cloudflare (الخطة المجانية كافية)
2. تثبيت CLI `cloudflared` على الجهاز الذي يشغّل PRX
3. إضافة نطاق إلى حساب Cloudflare الخاص بك (للأنفاق المسماة)

### تثبيت cloudflared

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary download (all platforms)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## الإعداد

### Quick Tunnel (لا يتطلب نطاقًا)

أبسط إعداد يستخدم quick tunnel من Cloudflare، والذي يعيّن نطاقًا فرعيًا عشوائيًا `*.trycloudflare.com`. لا حاجة إلى إعدادات في حساب Cloudflare بخلاف تثبيت `cloudflared`:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick tunnel mode: no token, no named tunnel.
# A random trycloudflare.com URL is assigned on each start.
mode = "quick"
```

تعد quick tunnels مثالية للتطوير والاختبار. يتغير الرابط عند كل إعادة تشغيل، لذلك ستحتاج إلى تحديث تسجيلات webhook وفقًا لذلك.

### Named Tunnel (نطاق ثابت)

للإنتاج، استخدم نفقًا مسمى مع اسم مضيف ثابت:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# The tunnel token obtained from `cloudflared tunnel create`.
# Can also be set via CLOUDFLARE_TUNNEL_TOKEN environment variable.
token = "eyJhIjoiNjY..."

# The public hostname that routes to this tunnel.
# Must be configured in the Cloudflare dashboard or via cloudflared CLI.
hostname = "agent.example.com"
```

### إنشاء Named Tunnel

```bash
# 1. Authenticate cloudflared with your Cloudflare account
cloudflared tunnel login

# 2. Create a named tunnel
cloudflared tunnel create prx-agent
# Output: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. Create a DNS record pointing to the tunnel
cloudflared tunnel route dns prx-agent agent.example.com

# 4. Get the tunnel token (for config.toml)
cloudflared tunnel token prx-agent
# Output: eyJhIjoiNjY...
```

## مرجع الإعداد

| المعامل | النوع | الافتراضي | الوصف |
|-----------|------|---------|-------------|
| `mode` | string | `"quick"` | `"quick"` لعناوين عشوائية، و`"named"` لأسماء مضيف ثابتة |
| `token` | string | -- | رمز النفق المسمى (مطلوب عند `mode = "named"`) |
| `hostname` | string | -- | اسم المضيف العام للنفق المسمى |
| `cloudflared_path` | string | `"cloudflared"` | المسار إلى ملف `cloudflared` التنفيذي |
| `protocol` | string | `"auto"` | بروتوكول النقل: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | إصدار IP لاتصالات الحافة: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | عدد محاولات إعادة الاتصال قبل التوقف |
| `grace_period_secs` | integer | `30` | عدد الثواني قبل إغلاق الاتصالات النشطة |
| `metrics_port` | integer | -- | عند تعيينه، يعرّض مقاييس `cloudflared` على هذا المنفذ |
| `log_level` | string | `"info"` | مستوى سجل `cloudflared`: `"debug"`, `"info"`, `"warn"`, `"error"` |

## وصول انعدام الثقة

يضيف Cloudflare Access طبقة هوية أمام النفق. يجب على المستخدمين المصادقة (عبر SSO أو OTP بالبريد أو service tokens) قبل الوصول إلى نسخة PRX.

### إعداد سياسات الوصول

1. انتقل إلى لوحة Cloudflare Zero Trust
2. أنشئ Access Application لاسم مضيف النفق
3. أضف Access Policy بمتطلبات الهوية المناسبة

```
Cloudflare Access Policy Example:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

تعد service tokens مفيدة لمرسلي webhook الآليين (مثل GitHub وSlack) الذين لا يمكنهم تنفيذ مصادقة تفاعلية. قم بضبط الرمز في ترويسات مزوّد webhook:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## فحوصات الصحة

يراقب PRX صحة Cloudflare Tunnel عبر:

1. التحقق من أن عملية الابن `cloudflared` تعمل
2. إرسال طلب HTTP GET إلى الرابط العام والتحقق من استجابة 2xx
3. تحليل مقاييس `cloudflared` (إذا تم ضبط `metrics_port`) لحالة الاتصال

إذا أصبح النفق غير سليم، يسجل PRX تحذيرًا ويحاول إعادة تشغيل `cloudflared`. تتبع الإعادة استراتيجية exponential backoff: 5s ثم 10s ثم 20s ثم 40s، حتى حد أقصى 5 دقائق بين المحاولات.

## السجلات والتصحيح

يتم التقاط stdout وstderr الخاصين بـ `cloudflared` بواسطة `TunnelProcess` وكتابتهما في سجل PRX بمستوى `DEBUG`. لزيادة مستوى التفاصيل:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

رسائل السجل الشائعة ومعانيها:

| رسالة السجل | المعنى |
|-------------|---------|
| `Connection registered` | تم إنشاء النفق إلى حافة Cloudflare |
| `Retrying connection` | انقطع اتصال الحافة، جارٍ إعادة المحاولة |
| `Serve tunnel error` | خطأ قاتل، سيُعاد تشغيل النفق |
| `Registered DNS record` | تم إنشاء مسار DNS بنجاح |

## مثال: إعداد إنتاجي كامل

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# Set the token via environment variable
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# Start PRX -- tunnel starts automatically
prx start
```

## ملاحظات أمنية

- يمنح رمز النفق وصولًا كاملاً إلى النفق المسمى. خزّنه في مدير الأسرار في PRX أو مرّره عبر متغير بيئة. لا تقم بإيداعه في نظام إدارة الإصدارات.
- لا تدعم quick tunnels سياسات Access. استخدم named tunnels في بيئات الإنتاج.
- تعمل `cloudflared` كعملية ابن بنفس صلاحيات المستخدم الخاصة بـ PRX. فكّر في تشغيل PRX بحساب خدمة مخصص وبأقل صلاحيات ممكنة.
- كل الحركة بين `cloudflared` وحافة Cloudflare مشفرة باستخدام TLS 1.3 أو QUIC.

## صفحات ذات صلة

- [نظرة عامة على الأنفاق](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [نظرة عامة على الأمان](/ar/prx/security/)
- [إدارة الأسرار](/ar/prx/security/secrets)
