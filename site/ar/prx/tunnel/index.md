---
title: الأنفاق وتجاوز NAT
description: نظرة عامة على نظام الأنفاق في PRX لعرض نسخ الوكيل المحلية أمام webhooks والقنوات والخدمات الخارجية.
---

# الأنفاق وتجاوز NAT

غالبًا ما تحتاج وكلاء PRX إلى استقبال اتصالات واردة مثل webhook callbacks من GitHub، أو تحديثات Telegram، أو أحداث Slack، أو الاتصال بين العقد. عند التشغيل خلف NAT أو جدار ناري، يوفّر نظام الأنفاق دخولًا تلقائيًا عبر إنشاء اتصال صادر إلى مزوّد الأنفاق وربط عنوان URL عام بنسخة PRX المحلية.

## لماذا الأنفاق مهمة

تتطلب العديد من ميزات PRX نقطة نهاية يمكن الوصول إليها علنًا:

- **قنوات webhook** -- تقوم Telegram وDiscord وSlack وGitHub بإرسال الأحداث إلى URL تقدمه أنت. بدون نقطة نهاية عامة، لا يمكن لهذه القنوات تسليم الرسائل إلى وكيلك.
- **OAuth2 callbacks** -- تدفقات مصادقة المزوّد تعيد توجيه المتصفح إلى عنوان محلي. تجعل الأنفاق هذا يعمل حتى عندما يكون PRX على شبكة خاصة.
- **الاتصال بين العقد** -- تحتاج عمليات نشر PRX الموزعة إلى وصول العقد إلى بعضها البعض. تربط الأنفاق العقد عبر شبكات مختلفة.
- **استضافة MCP server** -- عندما يعمل PRX كخادم MCP لعملاء خارجيين، يوفّر النفق نقطة النهاية العامة.

## الخلفيات المدعومة

يوفّر PRX أربع خلفيات للأنفاق مع خيار تعطيل:

| الخلفية | المزوّد | خطة مجانية | نطاق مخصص | يتطلب مصادقة | انعدام الثقة |
|---------|----------|-----------|---------------|---------------|------------|
| [Cloudflare Tunnel](./cloudflare) | Cloudflare | نعم | نعم (مع zone) | نعم (`cloudflared`) | نعم |
| [Tailscale Funnel](./tailscale) | Tailscale | نعم (شخصي) | عبر MagicDNS | نعم (حساب Tailscale) | نعم |
| [ngrok](./ngrok) | ngrok | نعم (محدود) | نعم (مدفوع) | نعم (auth token) | لا |
| Custom command | Any | حسب المزود | حسب المزود | حسب المزود | حسب المزود |
| None | -- | -- | -- | -- | -- |

## البنية

يعتمد نظام الأنفاق على `Tunnel` trait:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

كل خلفية تطبق هذا الـ trait. تتولى بنية `TunnelProcess` إدارة عملية الابن الأساسية (مثل `cloudflared` و`tailscale` و`ngrok`) بما في ذلك التشغيل، والتقاط stdout/stderr، والإيقاف الهادئ، وإعادة التشغيل التلقائي عند الفشل.

```
┌─────────────────────────────────────────────┐
│                PRX Gateway                   │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (local)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (child process)                 │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (outbound TLS)
┌─────────────────▼───────────────────────────┐
│         Tunnel Provider Edge Network         │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## الإعداد

قم بإعداد النفق في `config.toml`:

```toml
[tunnel]
# Backend selection: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Local address that the tunnel will forward traffic to.
# This should match your gateway listen address.
local_addr = "127.0.0.1:8080"

# Health check interval in seconds. The tunnel is restarted if
# the health check fails consecutively for `max_failures` times.
health_check_interval_secs = 30
max_failures = 3

# Auto-detect: if backend = "auto", PRX probes for available
# tunnel binaries in order: cloudflared, tailscale, ngrok.
# Falls back to "none" with a warning if nothing is found.
```

### إعدادات خاصة بكل خلفية

لكل خلفية قسم إعداد خاص بها. راجع صفحات الخلفيات المنفصلة للتفاصيل:

- [Cloudflare Tunnel](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### خلفية Custom Command

لمزودي الأنفاق غير المدعومين بشكل أصلي، استخدم خلفية `custom`:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# The command to run. Must accept traffic on local_addr and print
# the public URL to stdout within startup_timeout_secs.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: regex to extract the public URL from stdout.
# The first capture group is used as the URL.
url_pattern = "listening at (https?://[\\S]+)"
```

## الاكتشاف التلقائي

عند `backend = "auto"`، يبحث PRX في `$PATH` عن ملفات الأنفاق التنفيذية بهذا الترتيب:

1. `cloudflared` -- مفضل لقدرات انعدام الثقة
2. `tailscale` -- مفضل للشبكات الخاصة المتشابكة
3. `ngrok` -- متوفر على نطاق واسع وسهل الإعداد

إذا لم يجد أيًا منها، يتم تعطيل النفق ويسجل PRX تحذيرًا. لن تعمل القنوات المعتمدة على webhook بدون نفق أو IP عام.

## دورة حياة TunnelProcess

تدير بنية `TunnelProcess` دورة حياة عملية الابن:

| المرحلة | الوصف |
|-------|-------------|
| **Spawn** | تشغيل ملف النفق التنفيذي بالوسائط المكوّنة |
| **URL extraction** | تحليل stdout لاستخراج الرابط العام (ضمن `startup_timeout_secs`) |
| **Monitoring** | فحوصات صحة دورية عبر HTTP GET إلى الرابط العام |
| **Restart** | عند فشل `max_failures` متتالية، يتم الإيقاف ثم إعادة التشغيل |
| **Shutdown** | إرسال SIGTERM، الانتظار 5 ثوانٍ، ثم SIGKILL إذا بقيت العملية تعمل |

## متغيرات البيئة

يمكن أيضًا ضبط إعدادات النفق عبر متغيرات البيئة، والتي لها أولوية على `config.toml`:

| المتغير | الوصف |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | تجاوز خلفية النفق |
| `PRX_TUNNEL_LOCAL_ADDR` | تجاوز عنوان التحويل المحلي |
| `PRX_TUNNEL_URL` | تخطّي تشغيل النفق واستخدام هذا الرابط مباشرة |
| `CLOUDFLARE_TUNNEL_TOKEN` | رمز Cloudflare Tunnel |
| `NGROK_AUTHTOKEN` | رمز مصادقة ngrok |

يُعد تعيين `PRX_TUNNEL_URL` مفيدًا عندما يكون لديك reverse proxy أو load balancer يعرّض PRX للعامة مسبقًا. عندها يتجاوز نظام الأنفاق إدارة العمليات ويستخدم الرابط المقدم مباشرة.

## اعتبارات أمنية

- **إنهاء TLS** -- تنهي جميع الخلفيات المدعومة TLS عند حافة المزوّد. وتنتقل الحركة بين المزوّد ونسخة PRX المحلية عبر نفق مشفر.
- **التحكم في الوصول** -- يدعم Cloudflare وTailscale سياسات وصول مبنية على الهوية. استخدمها عند تعريض نقاط نهاية حساسة.
- **تخزين بيانات الاعتماد** -- يتم تخزين رموز الأنفاق ومفاتيح المصادقة في مدير الأسرار في PRX. لا تقم بإيداعها في نظام إدارة الإصدارات.
- **عزل العمليات** -- يعمل `TunnelProcess` كعملية ابن منفصلة. ولا يشارك الذاكرة مع وقت تشغيل وكيل PRX.

## استكشاف الأخطاء وإصلاحها

| العرض | السبب | الحل |
|---------|-------|------------|
| يبدأ النفق لكن تفشل webhooks | لم يتم تمرير الرابط إلى إعدادات القناة | تحقّق من استخدام `tunnel.public_url` في القناة |
| النفق يعيد التشغيل باستمرار | فحص الصحة يصل إلى نقطة نهاية خاطئة | تأكد من أن `local_addr` يطابق عنوان استماع الـ gateway |
| خطأ "binary not found" | لم يتم تثبيت CLI الخاص بالنفق | ثبّت الملف التنفيذي المناسب (`cloudflared`, `tailscale`, `ngrok`) |
| مهلة أثناء استخراج الرابط | ملف النفق التنفيذي يستغرق وقتًا طويلًا لبدء التشغيل | زد قيمة `startup_timeout_secs` |

## صفحات ذات صلة

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [إعدادات Gateway](/ar/prx/gateway)
- [نظرة عامة على الأمان](/ar/prx/security/)
