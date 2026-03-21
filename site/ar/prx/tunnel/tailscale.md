---
title: نفق Tailscale Funnel
description: عرّض وكيل PRX للإنترنت باستخدام Tailscale Funnel عبر شبكة Tailscale mesh الخاصة بك.
---

# نفق Tailscale Funnel

يتيح Tailscale Funnel لك تعريض نسخة PRX المحلية للإنترنت العام عبر بنية الترحيل في Tailscale. بخلاف النفق التقليدي الذي يتطلب شبكة حافة من طرف ثالث، يعتمد Funnel على شبكة Tailscale mesh لديك، ما يجعله خيارًا ممتازًا عندما تكون عقد PRX لديك تتواصل أصلًا عبر Tailscale.

## نظرة عامة

يوفّر Tailscale ميزتين متكاملتين لاتصال PRX:

| الميزة | النطاق | حالة الاستخدام |
|---------|-------|----------|
| **Tailscale Serve** | خاص (tailnet فقط) | تعريض PRX لأجهزة أخرى داخل شبكة Tailscale لديك |
| **Tailscale Funnel** | عام (الإنترنت) | تعريض PRX لخدمات وwebhooks خارجية |

يستخدم PRX خدمة Funnel لدخول webhooks، وServe للاتصال بين العقد داخل tailnet.

### كيف يعمل Funnel

```
External Service (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (your machine)      │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

تصل الحركة إلى اسم مضيف MagicDNS الخاص بك في Tailscale (مثل `prx-host.tailnet-name.ts.net`)، ثم تُوجّه عبر شبكة DERP في Tailscale باستخدام WireGuard، ثم تُمرر إلى PRX gateway المحلي.

## المتطلبات المسبقة

1. تثبيت Tailscale وإتمام المصادقة على الجهاز الذي يشغّل PRX
2. تفعيل Tailscale Funnel لشبكة tailnet لديك (يتطلب موافقة مسؤول)
3. يجب أن تملك عقدة Tailscale في هذا الجهاز صلاحية Funnel ضمن سياسة ACL

### تثبيت Tailscale

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authenticate
sudo tailscale up
```

### تفعيل Funnel في سياسة ACL

يجب السماح بـ Funnel صراحةً في سياسة ACL لشبكة tailnet. أضف ما يلي إلى ملف ACL في Tailscale (عبر لوحة الإدارة):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

هذا يمنح صلاحية Funnel لجميع الأعضاء. للتحكم الأدق، استبدل `autogroup:member` بمستخدمين أو وسوم محددة:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## الإعداد

### إعداد Funnel الأساسي

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exposes the service to the public internet.
# Set to false to use Serve (tailnet-only access).
funnel = true

# Port to expose via Funnel. Tailscale Funnel supports
# ports 443, 8443, and 10000.
port = 443

# HTTPS is mandatory for Funnel. Tailscale provisions
# a certificate automatically via Let's Encrypt.
```

### إعداد Tailnet-Only (Serve)

للاتصال الخاص بين العقد دون تعريض عام:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## مرجع الإعداد

| المعامل | النوع | الافتراضي | الوصف |
|-----------|------|---------|-------------|
| `funnel` | boolean | `true` | `true` لـ Funnel العام، و`false` لـ Serve داخل tailnet فقط |
| `port` | integer | `443` | المنفذ العام (يدعم Funnel المنافذ 443 و8443 و10000) |
| `tailscale_path` | string | `"tailscale"` | المسار إلى ملف `tailscale` التنفيذي |
| `hostname` | string | auto-detected | تجاوز اسم مضيف MagicDNS |
| `reset_on_stop` | boolean | `true` | إزالة إعداد Funnel/Serve عند توقف PRX |
| `background` | boolean | `true` | تشغيل `tailscale serve` في وضع الخلفية |

## كيف يدير PRX خدمة Tailscale

عند بدء النفق، ينفذ PRX:

```bash
# For Funnel (public)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# For Serve (private)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

يشغّل الخيار `--bg` خدمة serve/funnel في الخلفية داخل daemon `tailscaled`. لا يحتاج PRX إلى الإبقاء على عملية ابن قيد التشغيل، لأن `tailscaled` يتولى التمرير.

عند توقف PRX، ينظّف الإعداد عبر تنفيذ:

```bash
tailscale funnel --https=443 off
# or
tailscale serve --https=443 off
```

يتحكم في هذا السلوك المعامل `reset_on_stop`.

## الرابط العام

يتبع الرابط العام لـ Funnel نمط MagicDNS:

```
https://<machine-name>.<tailnet-name>.ts.net
```

على سبيل المثال، إذا كان اسم جهازك `prx-host` وكانت tailnet باسم `example`، فسيكون الرابط:

```
https://prx-host.example.ts.net
```

يكتشف PRX اسم المضيف هذا تلقائيًا عبر تحليل إخراج `tailscale status --json` ثم يبني الرابط العام الكامل.

## فحوصات الصحة

يراقب PRX نفق Tailscale عبر فحصين:

1. **حالة Tailscale daemon** -- يجب أن يبلّغ `tailscale status --json` أن العقدة متصلة
2. **إمكانية الوصول إلى Funnel** -- يجب أن يُرجع طلب HTTP GET إلى الرابط العام استجابة 2xx

إذا فشلت فحوصات الصحة، يحاول PRX إعادة إنشاء Funnel عبر تنفيذ أمر `tailscale funnel` مرة أخرى. وإذا كان `tailscaled` نفسه متوقفًا، يسجل PRX خطأً ويعطّل النفق حتى يتعافى الـ daemon.

## اعتبارات ACL

تتحكم ACLs في Tailscale بالأجهزة التي يمكنها التواصل، وبالأجهزة التي يمكنها استخدام Funnel. اعتبارات رئيسية لعمليات نشر PRX:

### تقييد Funnel على عقد PRX

قم بوسم أجهزة PRX لديك وقيد وصول Funnel:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### السماح بحركة المرور بين العقد

لعمليات نشر PRX الموزعة، اسمح بحركة المرور بين عقد PRX:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## استكشاف الأخطاء وإصلاحها

| العرض | السبب | الحل |
|---------|-------|------------|
| "Funnel not available" | سياسة ACL تفتقد funnel attr | أضف خاصية `funnel` إلى العقدة أو المستخدم في ACL |
| حالة "not connected" | `tailscaled` غير مشغل | شغّل Tailscale daemon: `sudo tailscale up` |
| خطأ شهادة | لم يكتمل نشر DNS | انتظر نشر MagicDNS (عادة أقل من دقيقة) |
| المنفذ مستخدم مسبقًا | Serve/Funnel آخر على نفس المنفذ | أزل الإعداد الحالي: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | PRX gateway لا يستمع | تأكد من أن `local_addr` يطابق عنوان استماع الـ gateway |

## صفحات ذات صلة

- [نظرة عامة على الأنفاق](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [إقران العقد](/ar/prx/nodes/pairing)
- [نظرة عامة على الأمان](/ar/prx/security/)
