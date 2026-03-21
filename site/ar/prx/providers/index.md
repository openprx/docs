---
title: مزوّدو LLM
description: نظرة عامة على أكثر من 9 مزوّدين لـ LLM يدعمهم PRX، بما في ذلك مصفوفة القدرات والإعداد وسلاسل الرجوع والتوجيه.
---

# مزوّدو LLM

يرتبط PRX بنماذج اللغة الكبيرة عبر **المزوّدين** -- وهي واجهات خلفية قابلة للتركيب تنفّذ السمة `Provider`. يتولى كل مزوّد المصادقة، وتنسيق الطلبات، والبث، وتصنيف الأخطاء لواجهة LLM API محددة.

يوفّر PRX تسعة مزوّدين مدمجين، ونقطة نهاية متوافقة مع OpenAI لخدمات الجهات الخارجية، وبنية تحتية لسلاسل الرجوع والتوجيه الذكي.

## مصفوفة القدرات

| المزوّد | النماذج الأساسية | البث | الرؤية | استخدام الأدوات | OAuth | استضافة ذاتية |
|----------|-----------|-----------|--------|----------|-------|-------------|
| [Anthropic](/ar/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | نعم | نعم | نعم | نعم (Claude Code) | لا |
| [OpenAI](/ar/prx/providers/openai) | GPT-4o, o1, o3 | نعم | نعم | نعم | لا | لا |
| [Google Gemini](/ar/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | نعم | نعم | نعم | نعم (Gemini CLI) | لا |
| [OpenAI Codex](/ar/prx/providers/openai-codex) | Codex models | نعم | لا | نعم | نعم | لا |
| [GitHub Copilot](/ar/prx/providers/github-copilot) | Copilot Chat models | نعم | لا | نعم | نعم (Device Flow) | لا |
| [Ollama](/ar/prx/providers/ollama) | Llama 3, Mistral, Qwen, any GGUF | نعم | حسب النموذج | نعم | لا | نعم |
| [AWS Bedrock](/ar/prx/providers/aws-bedrock) | Claude, Titan, Llama | نعم | حسب النموذج | حسب النموذج | AWS IAM | لا |
| [GLM](/ar/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | نعم | حسب النموذج | حسب النموذج | نعم (Minimax/Qwen) | لا |
| [OpenRouter](/ar/prx/providers/openrouter) | 200+ model from multiple vendors | نعم | حسب النموذج | حسب النموذج | لا | لا |
| [Custom Compatible](/ar/prx/providers/custom-compatible) | أي API متوافق مع OpenAI | نعم | حسب نقطة النهاية | حسب نقطة النهاية | لا | نعم |

## إعداد سريع

يتم إعداد المزوّدين في `~/.config/openprx/config.toml` (أو `~/.openprx/config.toml`). كحد أدنى، اضبط المزوّد الافتراضي ومرّر مفتاح API:

```toml
# Select the default provider and model
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (can also be set via ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."
```

لمزوّدات الاستضافة الذاتية مثل Ollama، حدّد نقطة النهاية:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

يحل كل مزوّد مفتاح API من (بالترتيب):

1. الحقل `api_key` في `config.toml`
2. متغير بيئة خاص بالمزوّد (مثل `ANTHROPIC_API_KEY` و`OPENAI_API_KEY`)
3. متغير البيئة العام `API_KEY`

راجع [متغيرات البيئة](/ar/prx/config/environment) للاطلاع على القائمة الكاملة للمتغيرات المدعومة.

## سلاسل الرجوع عبر ReliableProvider

يلف PRX استدعاءات المزوّد داخل طبقة `ReliableProvider` التي توفر:

- **إعادة المحاولة تلقائيًا** مع تراجع أسي للأخطاء المؤقتة (5xx، وحدود المعدل 429، مهلات الشبكة)
- **سلاسل رجوع** -- عند فشل المزوّد الأساسي، يتم توجيه الطلبات تلقائيًا إلى المزوّد التالي في السلسلة
- **كشف الأخطاء غير القابلة لإعادة المحاولة** -- أخطاء العميل مثل مفاتيح API غير الصالحة (401/403) والنماذج غير المعروفة (404) تفشل مباشرة دون إهدار محاولات

اضبط الموثوقية في قسم `[reliability]`:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

عندما يُرجع المزوّد الأساسي (مثل Anthropic) خطأً مؤقتًا، يعيد PRX المحاولة حتى `max_retries` مع تراجع. وإذا استُنفدت كل المحاولات، ينتقل إلى أول مزوّد رجوع. تستمر السلسلة حتى استجابة ناجحة أو استنفاد كل المزوّدين.

### تصنيف الأخطاء

يصنّف ReliableProvider الأخطاء إلى فئتين:

- **قابلة لإعادة المحاولة**: HTTP 5xx، و429 (تحديد معدل)، و408 (مهلة)، وأخطاء الشبكة
- **غير قابلة لإعادة المحاولة**: HTTP 4xx (باستثناء 429/408)، مفاتيح API غير الصالحة، النماذج غير المعروفة، الاستجابات غير الصالحة

الأخطاء غير القابلة لإعادة المحاولة تتجاوز إعادة المحاولة وتنتقل مباشرة إلى المزوّد التالي، ما يتجنب زمن انتظار غير ضروري.

## تكامل الموجّه

لإعدادات متعددة النماذج المتقدمة، يدعم PRX موجّه LLM استدلالي يختار المزوّد والنموذج الأمثل لكل طلب بناءً على:

- **تقييم القدرات** -- مطابقة تعقيد الاستعلام مع نقاط قوة النموذج
- **تصنيف Elo** -- تتبع أداء النموذج بمرور الوقت
- **تحسين التكلفة** -- تفضيل النماذج الأرخص للاستعلامات البسيطة
- **وزن زمن الاستجابة** -- احتساب زمن الاستجابة ضمن القرار
- **توجيه دلالي KNN** -- استخدام تضمينات الاستعلامات التاريخية للتوجيه المبني على التشابه
- **تصعيد Automix** -- البدء بنموذج منخفض التكلفة ثم التصعيد إلى نموذج أعلى عند انخفاض الثقة

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

راجع [إعداد الموجّه](/ar/prx/router/) للتفاصيل الكاملة.

## صفحات المزوّدين

- [Anthropic (Claude)](/ar/prx/providers/anthropic)
- [OpenAI](/ar/prx/providers/openai)
- [Google Gemini](/ar/prx/providers/google-gemini)
- [OpenAI Codex](/ar/prx/providers/openai-codex)
- [GitHub Copilot](/ar/prx/providers/github-copilot)
- [Ollama](/ar/prx/providers/ollama)
- [AWS Bedrock](/ar/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/ar/prx/providers/glm)
- [OpenRouter](/ar/prx/providers/openrouter)
- [Custom Compatible Endpoint](/ar/prx/providers/custom-compatible)
