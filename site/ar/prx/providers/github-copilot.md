---
title: GitHub Copilot
description: تهيئة GitHub Copilot كمزوّد LLM في PRX
---

# GitHub Copilot

> الوصول إلى نماذج GitHub Copilot Chat عبر Copilot API مع مصادقة OAuth بتدفق رمز الجهاز تلقائيًا وإدارة الرموز.

## المتطلبات المسبقة

- حساب GitHub مع اشتراك فعّال **Copilot Individual** أو **Copilot Business** أو **Copilot Enterprise**
- اختياريًا، رمز وصول شخصي من GitHub (وإلا سيُستخدم تسجيل الدخول التفاعلي بتدفق الجهاز)

## إعداد سريع

### 1. المصادقة

عند أول استخدام، سيطلب PRX المصادقة عبر device code flow الخاص بـ GitHub:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

بدلًا من ذلك، يمكنك تمرير رمز GitHub مباشرة:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. الإعداد

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

يوفر GitHub Copilot الوصول إلى مجموعة منتقاة من النماذج. تعتمد النماذج المتاحة على مستوى اشتراك Copilot لديك:

| النموذج | السياق | الرؤية | استخدام الأدوات | ملاحظات |
|-------|---------|--------|----------|-------|
| `gpt-4o` | 128K | نعم | نعم | نموذج Copilot الافتراضي |
| `gpt-4o-mini` | 128K | نعم | نعم | أسرع وأوفر تكلفة |
| `claude-sonnet-4` | 200K | نعم | نعم | متاح في Copilot Enterprise |
| `o3-mini` | 128K | لا | نعم | نموذج استدلال |

قد يختلف توفر النماذج بحسب خطة GitHub Copilot لديك وعروض النماذج الحالية في GitHub.

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `api_key` | string | اختياري | رمز وصول شخصي من GitHub ‏(`ghp_...` أو `gho_...`) |
| `model` | string | `gpt-4o` | النموذج الافتراضي للاستخدام |

## الميزات

### مصادقة دون إعداد مسبق

ينفذ مزود Copilot نفس OAuth device-code flow المستخدم في إضافة Copilot داخل VS Code:

1. **طلب رمز الجهاز**: يطلب PRX رمز جهاز من GitHub
2. **تفويض المستخدم**: تزور `github.com/login/device` وتدخل الرمز
3. **تبادل الرمز**: يتم استبدال رمز GitHub OAuth بمفتاح Copilot API قصير العمر
4. **تخزين مؤقت تلقائي**: تُخزَّن الرموز في `~/.config/openprx/copilot/` بصلاحيات ملفات آمنة (0600)
5. **تحديث تلقائي**: مفاتيح Copilot API المنتهية يتم إعادة تبادلها تلقائيًا دون إعادة المصادقة

### تخزين آمن للرموز

تُخزّن الرموز بمعايير أمان صارمة:
- المجلد: `~/.config/openprx/copilot/` بصلاحيات 0700
- الملفات: `access-token` و`api-key.json` بصلاحيات 0600
- على الأنظمة غير Unix، يُستخدم إنشاء الملفات القياسي

### نقطة نهاية API ديناميكية

استجابة مفتاح Copilot API تتضمن الحقل `endpoints.api` الذي يحدد نقطة نهاية API الفعلية. يحترم PRX ذلك، مع الرجوع إلى `https://api.githubcopilot.com` عندما لا تكون نقطة النهاية محددة.

### الاستدعاء الأصلي للأدوات

تُرسل الأدوات بصيغة متوافقة مع OpenAI عبر Copilot Chat Completions API ‏(`/chat/completions`). يدعم المزوّد `tool_choice: "auto"` للاختيار التلقائي للأدوات.

### ترويسات المحرر

تتضمن الطلبات ترويسات تعريف محرر Copilot القياسية:
- `Editor-Version: vscode/1.85.1`
- `Editor-Plugin-Version: copilot/1.155.0`
- `User-Agent: GithubCopilot/1.155.0`

## استكشاف الأخطاء وإصلاحها

### "Failed to get Copilot API key (401/403)"

قد يكون رمز GitHub OAuth منتهيًا أو اشتراك Copilot غير نشط:
- تأكد أن حساب GitHub لديك يملك اشتراك Copilot فعّال
- يقوم PRX تلقائيًا بمسح رمز الوصول المخزّن عند 401/403 وسيطلب تسجيل الدخول بتدفق الجهاز مجددًا

### "Timed out waiting for GitHub authorization"

تدفق رمز الجهاز له مهلة 15 دقيقة. إذا انتهت:
- شغّل أمر PRX مرة أخرى للحصول على رمز جديد
- تأكد من زيارة الرابط الصحيح وإدخال الرمز المعروض كما هو

### "GitHub device authorization expired"

انتهت صلاحية رمز الجهاز. أعد تنفيذ الأمر لبدء تدفق تفويض جديد.

### النماذج غير متاحة

تعتمد النماذج المتاحة على مستوى اشتراك Copilot لديك:
- **Copilot Individual**: GPT-4o، GPT-4o-mini
- **Copilot Business/Enterprise**: قد تتضمن نماذج إضافية مثل Claude

تحقق من اشتراكك على [github.com/settings/copilot](https://github.com/settings/copilot).

### تحديد المعدل

لدى GitHub Copilot حدود معدل خاصة به منفصلة عن OpenAI. إذا واجهت تحديد معدل، استخدم `fallback_providers` في إعداد PRX للرجوع إلى مزوّد آخر.
