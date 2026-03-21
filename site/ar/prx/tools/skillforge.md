---
title: Skillforge
description: مسار آلي لاكتشاف المهارات وتقييمها ودمجها لتوسيع قدرات وكلاء PRX.
---

# Skillforge

Skillforge هو المسار الآلي في PRX لاكتشاف المهارات الجديدة (الأدوات) من مصادر خارجية وتقييمها ودمجها. بدل إعداد كل أداة يدويًا، يستطيع Skillforge استكشاف مستودعات GitHub وسجل Clawhub، ثم تقييم ملاءمة المهارة لاحتياجات وكيلك، ثم توليد manifest الدمج تلقائيًا.

## نظرة عامة

يتكوّن مسار Skillforge من ثلاث مراحل:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Scout      │────▶│   Evaluate   │────▶│  Integrate   │
│              │     │              │     │              │
│ Discover     │     │ Fitness      │     │ Manifest     │
│ skills from  │     │ scoring,     │     │ generation,  │
│ GitHub,      │     │ security     │     │ config       │
│ Clawhub      │     │ review       │     │ injection    │
└─────────────┘     └──────────────┘     └──────────────┘
```

| المرحلة | Trait | المسؤولية |
|-------|-------|----------------|
| **Scout** | `Scout` | اكتشاف المهارات المرشحة من المصادر المهيأة |
| **Evaluate** | `Evaluator` | تقييم كل مرشح من حيث الملاءمة والأمان والتوافق |
| **Integrate** | `Integrator` | توليد manifests وتسجيل المهارات في سجل الأدوات |

## المعمارية

يبنى Skillforge على ثلاثة async traits أساسية: `Scout` (لاكتشاف المرشحين المطابقين لـ `SearchCriteria`) و`Evaluator` (لتقييم الملاءمة والأمان) و`Integrator` (لتوليد manifests وتسجيل المهارات). يمكن أن يكون لكل trait عدة تطبيقات، ويشغّل المنسّق هذه المراحل بالتسلسل مع تصفية المرشحين في كل مرحلة.

## الإعداد

```toml
[skillforge]
enabled = true

# Automatic discovery: periodically scout for new skills.
auto_discover = false
discover_interval_hours = 24

# Minimum evaluation score (0.0-1.0) for a skill to be integrated.
min_fitness_score = 0.7

# Require manual approval before integrating discovered skills.
require_approval = true

# Maximum number of skills to evaluate per discovery run.
max_candidates = 20
```

### مصادر Scout

اضبط الأماكن التي يبحث فيها Skillforge عن المهارات:

```toml
[skillforge.sources.github]
enabled = true

# GitHub repositories to search.
# Supports org/user patterns and topic-based discovery.
search_topics = ["prx-skill", "mcp-server", "ai-tool"]
search_orgs = ["openprx", "modelcontextprotocol"]

# Rate limiting for GitHub API calls.
max_requests_per_hour = 30

# GitHub token for higher rate limits (optional).
# token = "${GITHUB_TOKEN}"

[skillforge.sources.clawhub]
enabled = true

# Clawhub registry endpoint.
registry_url = "https://registry.clawhub.dev"

# Categories to search.
categories = ["tools", "integrations", "automation"]
```

## مرحلة Scout

تكتشف مرحلة Scout المهارات المرشحة من المصادر المهيأة. كل مصدر يطبق `Scout` بطريقة مختلفة:

### GitHub Scout

يبحث في GitHub عن مستودعات تطابق الموضوعات أو المنظمات أو استعلامات البحث المضبوطة. ولكل مستودع مطابق يستخرج:

- بيانات المستودع (الاسم، الوصف، النجوم، آخر تحديث)
- محتوى README (لتحليل القدرات)
- ملفات manifest (`prx-skill.toml` و`mcp.json` و`package.json`)
- معلومات الترخيص

### Clawhub Scout

يستعلم واجهة Clawhub registry API عن المهارات المنشورة. يوفر Clawhub بيانات مهيكلة تشمل:

- اسم المهارة وإصدارها ووصفها
- مخططات الإدخال/الإخراج
- متطلبات الاعتماديات
- وسوم التوافق (إصدار PRX ونظام التشغيل وبيئة التشغيل)

### معايير البحث

```rust
pub struct SearchCriteria {
    /// Keywords describing the desired capability.
    pub keywords: Vec<String>,

    /// Required runtime: "native", "docker", "wasm", or "any".
    pub runtime: String,

    /// Minimum repository stars (GitHub only).
    pub min_stars: u32,

    /// Maximum age of last commit in days.
    pub max_age_days: u32,

    /// Required license types (e.g., "MIT", "Apache-2.0").
    pub licenses: Vec<String>,
}
```

## مرحلة Evaluate

يمر كل مرشح عبر Evaluator الذي ينتج درجة ملاءمة وتقييمًا أمنيًا:

### معايير التقييم

| المعيار | الوزن | الوصف |
|-----------|--------|-------------|
| **الملاءمة** | 30% | مدى تطابق المهارة مع معايير البحث |
| **الجودة** | 25% | إشارات جودة الكود: اختبارات، CI، توثيق |
| **الأمان** | 25% | توافق التراخيص، تدقيق الاعتماديات، عدم وجود أنماط غير آمنة |
| **الصيانة** | 10% | حداثة الالتزامات، نشاط المشرفين، زمن الاستجابة للمشكلات |
| **التوافق** | 10% | توافق إصدار PRX وتلبية متطلبات runtime |

### فحوص الأمان

ينفذ المقيم تحليلًا أمنيًا آليًا: فحص توافق التراخيص، وتدقيق ثغرات الاعتماديات، واكتشاف أنماط كود خطرة (استدعاءات الشبكة، وصول نظام الملفات، `eval`)، والتحقق من توافق sandbox.

تحتوي بنية `Evaluation` على `fitness_score` الكلي (من 0.0 إلى 1.0)، ودرجات فرعية لكل معيار، وحالة أمان `security_status` (`safe`/`caution`/`blocked`)، وملخص مقروء، وقائمة بالمخاوف.

## مرحلة Integrate

المهارات التي تتجاوز حد التقييم تنتقل إلى مرحلة الدمج:

### توليد Manifest

يولّد Integrator ملف `Manifest` يصف طريقة تثبيت المهارة وتسجيلها:

```toml
# Generated manifest: ~/.local/share/openprx/skills/web-scraper/manifest.toml
[skill]
name = "web-scraper"
version = "1.2.0"
source = "github:example/web-scraper"
runtime = "docker"
fitness_score = 0.85
integrated_at = "2026-03-21T10:30:00Z"

[skill.tool]
name = "web_scrape"
description = "Scrape and extract structured data from web pages."

[skill.tool.parameters]
url = { type = "string", required = true, description = "URL to scrape" }
selector = { type = "string", required = false, description = "CSS selector" }
format = { type = "string", required = false, default = "text", description = "Output format" }

[skill.runtime]
image = "example/web-scraper:1.2.0"
network = "restricted"
timeout_secs = 30
```

### التسجيل

بعد توليد الـ manifest، تُسجَّل المهارة في سجل أدوات PRX. إذا كانت `require_approval = true` يتم وضع manifest للمراجعة قبل الاعتماد:

```bash
# List pending skill integrations
prx skillforge pending

# Review a pending skill
prx skillforge review web-scraper

# Approve integration
prx skillforge approve web-scraper

# Reject integration
prx skillforge reject web-scraper --reason "Security concerns"
```

## أوامر CLI

```bash
# Manually trigger a discovery run
prx skillforge discover

# Discover with specific keywords
prx skillforge discover --keywords "web scraping" "data extraction"

# Evaluate a specific repository
prx skillforge evaluate github:example/web-scraper

# List all integrated skills
prx skillforge list

# Show skill details
prx skillforge info web-scraper

# Remove an integrated skill
prx skillforge remove web-scraper

# Re-evaluate all integrated skills (check for updates, security issues)
prx skillforge audit
```

## التكامل مع التطور الذاتي

يتكامل Skillforge مع [مسار التطور الذاتي](/ar/prx/self-evolution/). عندما يكتشف الوكيل فجوة في القدرات، يمكنه تشغيل اكتشاف تلقائيًا، ثم تقييم ودمج المهارة المناسبة (عند الموافقة) للجولات التالية.

## ملاحظات الأمان

- **بوابات الموافقة**: اضبط `require_approval = true` دائمًا في الإنتاج. الدمج الآلي لكود غير موثوق يمثل خطرًا أمنيًا.
- **فرض sandbox**: المهارات المدمجة تعمل تحت نفس قيود sandbox المطبقة على الأدوات المدمجة.
- **الثقة بالمصدر**: فعّل فقط مصادر Scout التي تثق بها. بحث GitHub العام قد يعيد مستودعات خبيثة.
- **مراجعة manifest**: راجع manifests المولدة قبل الاعتماد، خصوصًا `runtime` و`network` و`timeout_secs`.
- **أثر تدقيقي**: جميع عمليات Skillforge تُسجّل في سجل النشاط لأغراض الامتثال.

## صفحات مرتبطة

- [نظرة عامة على الأدوات](/ar/prx/tools/)
- [مسار التطور الذاتي](/ar/prx/self-evolution/pipeline)
- [محرك سياسة الأمان](/ar/prx/security/policy-engine)
- [بيئات التشغيل](/ar/prx/agent/runtime-backends)
- [تكامل MCP](/ar/prx/tools/mcp)
