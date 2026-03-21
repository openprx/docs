---
title: متغيرات البيئة
description: متغيرات البيئة لإعدادات PRX -- مفاتيح API والمسارات وتجاوزات وقت التشغيل.
---

# متغيرات البيئة

يقرأ PRX متغيرات البيئة لمفاتيح API ومسارات الإعدادات وتجاوزات وقت التشغيل. تأخذ متغيرات البيئة الأولوية على القيم في `config.toml` للحقول الحساسة أمنيًا مثل مفاتيح API.

## مسارات الإعدادات

| المتغير | القيمة الافتراضية | الوصف |
|---------|-------------------|-------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | تجاوز مجلد الإعدادات. يبحث PRX عن `config.toml` و`config.d/` داخل هذا المجلد |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | تجاوز مجلد مساحة العمل (الذاكرة، الجلسات، البيانات) |

عند تعيين `OPENPRX_CONFIG_DIR`، يأخذ الأولوية على `OPENPRX_WORKSPACE` وعلامة مساحة العمل النشطة.

ترتيب تحديد مجلد الإعدادات:

1. `OPENPRX_CONFIG_DIR` (الأولوية الأعلى)
2. `OPENPRX_WORKSPACE`
3. علامة مساحة العمل النشطة (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (الافتراضي)

## مفاتيح API للمزودين

لكل مزود متغير بيئة مخصص. يتحقق PRX منها قبل الرجوع إلى حقل `api_key` في `config.toml`.

### المزودون الأساسيون

| المتغير | المزود |
|---------|--------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini (بديل) |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama (عادة غير مطلوب) |
| `GLM_API_KEY` | Zhipu GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### رموز OAuth

بعض المزودين يدعمون مصادقة OAuth بالإضافة إلى (أو بدلاً من) مفاتيح API:

| المتغير | المزود | الوصف |
|---------|--------|-------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | رمز OAuth لـ Claude Code |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | رمز وصول Claude Code (بديل) |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | رمز تحديث Claude Code للتجديد التلقائي |
| `MINIMAX_OAUTH_TOKEN` | Minimax | رمز وصول OAuth لـ Minimax |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | رمز تحديث OAuth لـ Minimax |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | تجاوز معرّف عميل OAuth |
| `MINIMAX_OAUTH_REGION` | Minimax | منطقة OAuth (`global` أو `cn`) |
| `QWEN_OAUTH_TOKEN` | Qwen | رمز وصول OAuth لـ Qwen |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | رمز تحديث OAuth لـ Qwen |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | تجاوز معرّف عميل OAuth لـ Qwen |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | تجاوز عنوان URL لمورد OAuth لـ Qwen |

### المزودون المتوافقون / الطرف الثالث

| المتغير | المزود |
|---------|--------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### الاحتياطي

| المتغير | الوصف |
|---------|-------|
| `API_KEY` | احتياطي عام يُستخدم عند عدم تعيين متغير خاص بالمزود |

## متغيرات الأدوات والقنوات

| المتغير | الوصف |
|---------|-------|
| `BRAVE_API_KEY` | مفتاح API لـ Brave Search (لـ `[web_search]` مع `provider = "brave"`) |
| `GITHUB_TOKEN` | رمز وصول شخصي لـ GitHub (يُستخدم من قبل المهارات والتكاملات) |
| `GOOGLE_APPLICATION_CREDENTIALS` | مسار ملف ADC لـ Google Cloud (Gemini عبر حساب الخدمة) |

## متغيرات وقت التشغيل

| المتغير | الوصف |
|---------|-------|
| `OPENPRX_VERSION` | تجاوز سلسلة الإصدار المُبلغ عنها |
| `OPENPRX_AUTOSTART_CHANNELS` | عيّن إلى `"1"` لبدء مستمعي القنوات تلقائيًا عند الإقلاع |
| `OPENPRX_EVOLUTION_CONFIG` | تجاوز مسار إعدادات التطور |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | تفعيل تسجيل تصحيح التطور الخام |

## استبدال المتغيرات في الإعدادات

لا يوسّع PRX بنية `${VAR_NAME}` أصليًا داخل `config.toml`. ومع ذلك، يمكنك تحقيق استبدال متغيرات البيئة من خلال هذه الطرق:

### 1. استخدام متغيرات البيئة مباشرة

بالنسبة لمفاتيح API، يتحقق PRX تلقائيًا من متغير البيئة المقابل. لا تحتاج لإشارتها في ملف الإعدادات:

```toml
# لا حاجة لـ api_key -- يتحقق PRX من ANTHROPIC_API_KEY تلقائيًا
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. استخدام غلاف صدفة

أنشئ `config.toml` من قالب باستخدام `envsubst` أو ما شابه:

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. استخدام إعدادات مقسّمة مع الأسرار

احتفظ بالأسرار في ملف منفصل يُنشأ من متغيرات البيئة وقت النشر:

```bash
# إنشاء جزء الأسرار
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## دعم ملفات `.env`

لا يحمّل PRX ملفات `.env` تلقائيًا. إذا كنت تحتاج دعم ملفات `.env`، استخدم إحدى هذه الطرق:

### مع systemd

أضف `EnvironmentFile` إلى وحدة الخدمة:

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### مع غلاف صدفة

حمّل ملف `.env` قبل تشغيل PRX:

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### مع direnv

إذا كنت تستخدم [direnv](https://direnv.net/)، ضع ملف `.envrc` في مجلد العمل:

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## توصيات الأمان

- **لا تضع مفاتيح API أبدًا** في نظام التحكم بالإصدارات. استخدم متغيرات البيئة أو الأسرار المشفرة.
- يشفّر نظام `[secrets]` في PRX الحقول الحساسة في `config.toml` باستخدام ChaCha20-Poly1305. فعّله بـ `[secrets] encrypt = true` (مفعّل افتراضيًا).
- يستبعد `.dockerignore` المرفق مع PRX ملفات `.env` و`.env.*` من بناء الحاويات.
- تحجب سجلات التدقيق مفاتيح API والرموز تلقائيًا.
- عند استخدام `OPENPRX_CONFIG_DIR` للإشارة إلى مجلد مشترك، تأكد من الصلاحيات المناسبة (`chmod 600 config.toml`).
