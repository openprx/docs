---
title: استكشاف الأخطاء وإصلاحها
description: "حلول للمشكلات الشائعة في OpenPR-Webhook بما فيها أخطاء المصادقة وتصفية الأحداث وفشل اتصال النفق وأخطاء تنفيذ CLI."
---

# استكشاف الأخطاء وإصلاحها

## المشكلات الشائعة

### 401 Unauthorized عند POST لـ Webhook

**العرض:** جميع طلبات webhook تُعيد HTTP 401.

**الأسباب:**

1. **رأس التوقيع مفقود.** يجب أن يتضمن الطلب إما `X-Webhook-Signature` أو `X-OpenPR-Signature` بالتنسيق `sha256={hex-digest}`.

2. **سر خاطئ.** يجب أن يتطابق ملخص HMAC-SHA256 مع أحد الأسرار في `security.webhook_secrets`. تحقق من أن الجانب المرسِل والمستقبِل يستخدمان نفس سلسلة السر.

3. **عدم تطابق الجسم.** التوقيع محسوب على جسم الطلب الخام. إذا عدّل وكيل أو middleware الجسم (مثل إعادة ترميز JSON)، لن يتطابق التوقيع.

**التصحيح:**

```bash
# Enable debug logging
RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml

# Temporarily allow unsigned requests for testing
# (config.toml)
[security]
allow_unsigned = true
```

### الحدث مُتجاهَل (not_bot_task)

**العرض:** الاستجابة هي `{"status": "ignored", "reason": "not_bot_task"}`.

**السبب:** حمولة webhook لا تحتوي على `bot_context.is_bot_task = true`. يُعالج OpenPR-Webhook فقط الأحداث المُعلَّمة صراحةً كمهام بوت.

**الإصلاح:** تأكد من إعداد منصة OpenPR لتضمين سياق البوت في حمولات webhook:

```json
{
  "event": "issue.updated",
  "bot_context": {
    "is_bot_task": true,
    "bot_name": "my-agent",
    "bot_agent_type": "cli"
  },
  "data": { ... }
}
```

### لا يوجد وكيل

**العرض:** الاستجابة هي `{"status": "no_agent", "bot_name": "..."}`.

**السبب:** لا يتطابق أي وكيل مُعيَّن مع `bot_name` أو `bot_agent_type` من الحمولة.

**الإصلاح:**

1. تحقق من إعداد وكيل بـ `id` أو `name` يطابق قيمة `bot_name`
2. تحقق من أن `agent_type` للوكيل يطابق `bot_agent_type`
3. مطابقة اسم الوكيل بدون حساسية لحالة الأحرف، لكن مطابقة `id` دقيقة

### وكيل CLI يُعيد "disabled"

**العرض:** إرسال CLI يُعيد `"cli disabled by feature flag or safe mode"`.

**الأسباب:**

1. `features.cli_enabled` غير مضبوط على `true`
2. متغير البيئة `OPENPR_WEBHOOK_SAFE_MODE` مضبوط

**الإصلاح:**

```toml
[features]
cli_enabled = true
```

وتحقق من أن الوضع الآمن غير فعّال:

```bash
echo $OPENPR_WEBHOOK_SAFE_MODE
# Should be empty or unset
```

### منفذ CLI "not allowed"

**العرض:** رسالة خطأ `"executor not allowed: {name}"`.

**السبب:** حقل `executor` في إعداد وكيل CLI يحتوي على قيمة غير موجودة في القائمة البيضاء.

**المنفذون المسموح بهم:**
- `codex`
- `claude-code`
- `opencode`

أي قيمة أخرى مرفوضة لأسباب أمنية.

### فشل النفق في الاتصال

**العرض:** رسائل السجل تُظهر `tunnel connect failed: ...` بشكل متكرر.

**الأسباب:**

1. **URL غير صالح.** يجب أن يبدأ URL النفق بـ `wss://` أو `ws://`.
2. **مشكلة شبكة.** تحقق من إمكانية الوصول إلى خادم طائرة التحكم.
3. **فشل المصادقة.** تحقق من صحة `tunnel.auth_token`.
4. **حقول مطلوبة مفقودة.** يجب أن يكون كل من `tunnel.agent_id` و`tunnel.auth_token` غير فارغَين.

**التصحيح:**

```bash
# Test WebSocket connectivity manually
# (requires wscat or websocat)
wscat -c wss://control.example.com/ws -H "Authorization: Bearer your-token"
```

### النفق يعيد الاتصال باستمرار

**العرض:** السجلات تُظهر `tunnel disconnected, reconnecting in Ns` في حلقة.

**السلوك الطبيعي:** يعيد النفق الاتصال تلقائياً مع تراجع أسي (حتى `tunnel_reconnect_backoff_max_secs`). تحقق من سجلات طائرة التحكم لسبب الانقطاع.

**الضبط:**

```toml
[tunnel]
reconnect_secs = 3        # Base retry interval
heartbeat_secs = 20       # Keep-alive interval

[runtime]
tunnel_reconnect_backoff_max_secs = 120  # Max backoff
```

### فشل استدعاءات الرجوع

**العرض:** السجلات تُظهر `start callback failed: ...` أو `final callback failed: ...`.

**الأسباب:**

1. **callback_enabled هو false.** تتطلب استدعاءات الرجوع `features.callback_enabled = true`.
2. **callback_url غير صالح.** تحقق من إمكانية الوصول إلى URL.
3. **فشل المصادقة.** إذا كانت نقطة نهاية استدعاء الرجوع تتطلب مصادقة، اضبط `callback_token`.
4. **مهلة.** المهلة الافتراضية لـ HTTP هي 15 ثانية. زِد بـ `runtime.http_timeout_secs`.

### أخطاء تنفيذ OpenClaw/وكيل مخصص

**العرض:** الاستجابة تحتوي على `exec_error: ...` أو `error: ...`.

**الأسباب:**

1. **الثنائي غير موجود.** تحقق من وجود مسار `command` وقابليته للتنفيذ.
2. **رفض الإذن.** يجب أن تكون لعملية openpr-webhook إذن التنفيذ.
3. **اعتماديات مفقودة.** قد تتطلب أداة CLI برامج أو مكتبات أخرى.

**التصحيح:**

```bash
# Test the command manually
/usr/local/bin/openclaw --channel signal --target "+1234567890" --message "test"
```

## قائمة فحص التشخيص

1. **فحص صحة الخدمة:**
   ```bash
   curl http://localhost:9000/health
   # Should return: ok
   ```

2. **فحص الوكلاء المحمَّلين:**
   ابحث في سجل بدء التشغيل عن `Loaded N agent(s)`.

3. **تفعيل سجل التصحيح:**
   ```bash
   RUST_LOG=openpr_webhook=debug ./openpr-webhook config.toml
   ```

4. **التحقق من التوقيع يدوياً:**
   ```bash
   echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

5. **الاختبار بطلبات غير موقعة (التطوير فقط):**
   ```toml
   [security]
   allow_unsigned = true
   ```

6. **فحص حالة الوضع الآمن:**
   ```bash
   # If set, tunnel/cli/callback are force-disabled
   echo $OPENPR_WEBHOOK_SAFE_MODE
   ```

## مرجع رسائل السجل

| مستوى السجل | الرسالة | المعنى |
|------------|---------|-------|
| INFO | `Loaded N agent(s)` | الإعداد محمَّل بنجاح |
| INFO | `openpr-webhook listening on ...` | الخادم بدأ |
| INFO | `Received webhook event: ...` | الحدث الوارد مُحلَّل |
| INFO | `Dispatching to agent: ...` | الوكيل مطابَق، جاري الإرسال |
| INFO | `tunnel connected: ...` | نفق WSS مُنشأ |
| WARN | `Invalid webhook signature` | فشل التحقق من التوقيع |
| WARN | `No agent for bot_name=...` | لم يُعثر على وكيل مطابق |
| WARN | `tunnel disconnected, reconnecting` | انقطع اتصال النفق |
| WARN | `tunnel using insecure ws:// transport` | لا يستخدم TLS |
| ERROR | `tunnel connect failed: ...` | خطأ اتصال WebSocket |
| ERROR | `openclaw failed: ...` | أمر OpenClaw أعاد قيمة غير صفر |
