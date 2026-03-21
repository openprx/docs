---
title: تدفقات OAuth2
description: تدفقات مصادقة OAuth2 التي يدعمها PRX لتفويض مزوّدي LLM.
---

# تدفقات OAuth2

ينفذ PRX تدفقات تفويض OAuth2 للمزوّدين الذين يدعمون المصادقة عبر المتصفح. يتيح ذلك للمستخدمين المصادقة دون إدارة مفاتيح API يدويًا.

## التدفقات المدعومة

### Authorization Code Flow

يُستخدم من Anthropic (Claude Code) وGoogle Gemini CLI وMinimax:

1. يفتح PRX متصفحًا إلى عنوان التفويض الخاص بالمزوّد
2. يمنح المستخدم الإذن
3. يعيد المزوّد التوجيه إلى خادم callback المحلي لـ PRX
4. يستبدل PRX authorization code بـ access وrefresh tokens
5. يتم تخزين الرموز بأمان للاستخدام لاحقًا

### Device Code Flow

يُستخدم من GitHub Copilot:

1. يطلب PRX رمز جهاز من المزوّد
2. يزور المستخدم عنوان URL ويدخل رمز الجهاز
3. يجري PRX استطلاعًا لاكتمال التفويض
4. بعد التفويض، يتم استلام الرموز وتخزينها

## إدارة الرموز

يتعامل PRX تلقائيًا مع:

- التخزين المؤقت للرموز لتجنب التفويض المتكرر
- تدوير refresh token عند انتهاء صلاحية access token
- التخزين الآمن للرموز (مشفرة أثناء السكون)

## الإعدادات

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## أوامر CLI

```bash
prx auth login anthropic    # Start OAuth2 flow for Anthropic
prx auth login copilot      # Start device code flow for Copilot
prx auth status              # Show auth status for all providers
prx auth logout anthropic   # Revoke tokens for Anthropic
```

## صفحات ذات صلة

- [نظرة عامة على المصادقة](./)
- [ملفات تعريف المزوّد](./profiles)
