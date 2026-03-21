---
title: GLM (Zhipu AI)
description: تهيئة GLM ومزوّدي الذكاء الاصطناعي الصينيين المرتبطين به (Minimax وMoonshot وQwen وZ.AI) في PRX
---

# GLM (Zhipu AI)

> الوصول إلى نماذج Zhipu GLM وعائلة من مزودي الذكاء الاصطناعي الصينيين عبر إعداد موحّد. يتضمن أسماء مستعارة لـ Minimax وMoonshot ‏(Kimi) وQwen ‏(DashScope) وZ.AI.

## المتطلبات المسبقة

- مفتاح Zhipu AI API من [open.bigmodel.cn](https://open.bigmodel.cn/) (لنماذج GLM)، **أو**
- مفاتيح API للمزوّد المحدد الذي تريد استخدامه (Minimax، Moonshot، Qwen، إلخ)

## إعداد سريع

### 1. الحصول على مفتاح API

1. سجّل في [open.bigmodel.cn](https://open.bigmodel.cn/)
2. انتقل إلى قسم API Keys
3. أنشئ مفتاحًا جديدًا (الصيغة: `id.secret`)

### 2. الإعداد

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

أو اضبط متغير البيئة:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

### نماذج GLM

| Model | Context | Vision | Tool Use | Notes |
|-------|---------|--------|----------|-------|
| `glm-4-plus` | 128K | Yes | Yes | Most capable GLM model |
| `glm-4` | 128K | Yes | Yes | Standard GLM-4 |
| `glm-4-flash` | 128K | Yes | Yes | Fast and cost-effective |
| `glm-4v` | 128K | Yes | Yes | Vision-optimized |

### المزوّدات ذات الأسماء المستعارة

يدعم PRX أيضًا هؤلاء المزوّدين كأسماء مستعارة يتم توجيهها عبر الواجهة المتوافقة مع OpenAI:

| Provider | Alias Names | Base URL | Key Models |
|----------|-------------|----------|------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (intl), `api.minimaxi.com/v1` (CN) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (intl), `api.moonshot.cn/v1` (CN) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (CN), `dashscope-intl.aliyuncs.com` (intl) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (global), `open.bigmodel.cn/api/coding/paas/v4` (CN) | Z.AI coding models |

## مرجع الإعدادات

### GLM (المزوّد الأصلي)

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | مطلوب | مفتاح GLM API بصيغة `id.secret` |
| `model` | string | مطلوب | اسم نموذج GLM |

### المزوّدات ذات الأسماء المستعارة (متوافقة مع OpenAI)

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | مطلوب | مفتاح API خاص بالمزوّد |
| `api_url` | string | auto-detected | تجاوز عنوان الأساس الافتراضي |
| `model` | string | مطلوب | اسم النموذج |

## الميزات

### مصادقة JWT

يستخدم GLM مصادقة JWT بدل مفاتيح API النصية. يقوم PRX تلقائيًا بما يلي:

1. يقسم مفتاح API إلى جزأي `id` و`secret`
2. ينشئ رمز JWT يحتوي على:
   - Header: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - Payload: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - Signature: HMAC-SHA256 باستخدام المفتاح السري
3. يخزن JWT مؤقتًا لمدة 3 دقائق (تنتهي صلاحيته بعد 3.5 دقائق)
4. يرسله كـ `Authorization: Bearer <jwt>`

### نقاط نهاية حسب المنطقة

توفّر معظم المزوّدات ذات الأسماء المستعارة نقاط نهاية دولية وأخرى للصين القارية:

```toml
# International (default for most)
provider = "moonshot-intl"

# China mainland
provider = "moonshot-cn"

# Explicit regional variants
provider = "qwen-us"      # US region
provider = "qwen-intl"    # International
provider = "qwen-cn"      # China mainland
```

### دعم Minimax OAuth

يدعم Minimax مصادقة رمز OAuth:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

اضبط `provider = "minimax-oauth"` أو `provider = "minimax-oauth-cn"` لاستخدام OAuth بدل مصادقة مفتاح API.

### أوضاع Qwen OAuth والبرمجة

يوفّر Qwen أوضاع وصول إضافية:

- **Qwen OAuth**: `provider = "qwen-oauth"` أو `provider = "qwen-code"` للوصول عبر OAuth
- **Qwen Coding**: `provider = "qwen-coding"` أو `provider = "dashscope-coding"` لنقطة نهاية API المتخصصة بالبرمجة

## مرجع الأسماء المستعارة للمزوّد

| Alias | Resolves To | Endpoint |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (global) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (CN) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (intl) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (CN) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (CN) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (intl) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (CN) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (intl) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (global) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (CN) | `open.bigmodel.cn/api/coding/paas/v4` |

## استكشاف الأخطاء وإصلاحها

### "GLM API key not set or invalid format"

يجب أن يكون مفتاح GLM API بصيغة `id.secret` (يحتوي على نقطة واحدة تمامًا). تحقّق من صيغة المفتاح:
```
abc123.secretXYZ  # correct
abc123secretXYZ   # wrong - missing dot
```

### فشل إنشاء JWT

تأكد أن ساعة النظام دقيقة. رموز JWT تتضمن طابعًا زمنيًا وتنتهي صلاحيتها بعد 3.5 دقائق.

### MiniMax "role: system" rejected

لا يقبل MiniMax رسائل `role: system`. يقوم PRX تلقائيًا بدمج محتوى رسالة النظام في أول رسالة مستخدم عند استخدام مزودات MiniMax.

### مهلة Qwen/DashScope

تتطلب DashScope API في Qwen استخدام HTTP/1.1 (وليس HTTP/2). يفرض PRX تلقائيًا HTTP/1.1 لنقاط نهاية DashScope. إذا واجهت مهلات، تأكد أن الشبكة تسمح باتصالات HTTP/1.1.

### أخطاء نقاط النهاية الإقليمية

إذا ظهرت أخطاء اتصال، جرّب التبديل بين نقاط النهاية الإقليمية:
- مستخدمو الصين: استخدم متغيرات `*-cn`
- المستخدمون الدوليون: استخدم متغيرات `*-intl` أو المتغيرات الأساسية
- المستخدمون في الولايات المتحدة: جرّب `qwen-us` مع Qwen
