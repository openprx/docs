---
title: سيجنال
description: اربط PRX بـ Signal عبر signal-cli
---

# سيجنال

> اربط PRX بـ Signal باستخدام JSON-RPC وSSE API من signal-cli daemon للمراسلة المشفرة في الرسائل الخاصة والمجموعات.

## المتطلبات المسبقة

- رقم هاتف مسجّل في Signal
- تثبيت [signal-cli](https://github.com/AsamK/signal-cli) وتسجيله
- تشغيل signal-cli في وضع daemon مع تفعيل HTTP API

## الإعداد السريع

### 1. تثبيت وتسجيل signal-cli

```bash
# Install signal-cli (see https://github.com/AsamK/signal-cli for latest)
# Register your phone number
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. تشغيل signal-cli Daemon

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. التهيئة

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. التحقق

```bash
prx channel doctor signal
```

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `http_url` | `String` | *required* | Base URL لخدمة signal-cli HTTP daemon (مثل `"http://127.0.0.1:8686"`) |
| `account` | `String` | *required* | رقم هاتف E.164 لحساب signal-cli (مثل `"+1234567890"`) |
| `group_id` | `String` | `null` | تصفية الرسائل حسب المجموعة. `null` = قبول الكل (رسائل مباشرة ومجموعات). `"dm"` = الرسائل المباشرة فقط. Group ID محدد = تلك المجموعة فقط |
| `allowed_from` | `[String]` | `[]` | أرقام هواتف المرسلين المسموح بها بصيغة E.164. القيمة `"*"` = السماح للجميع |
| `ignore_attachments` | `bool` | `false` | تخطي الرسائل التي تحتوي على مرفقات فقط (بدون نص) |
| `ignore_stories` | `bool` | `false` | تخطي رسائل القصص الواردة |

## الميزات

- **تشفير طرفي** -- كل الرسائل مشفرة عبر Signal Protocol
- **دعم الرسائل الخاصة والمجموعات** -- التعامل مع الرسائل المباشرة ومحادثات المجموعات
- **تدفق أحداث SSE** -- الاستماع عبر Server-Sent Events على `/api/v1/events` للتسليم الفوري
- **إرسال عبر JSON-RPC** -- إرسال الردود عبر JSON-RPC على `/api/v1/rpc`
- **تصفية مرنة للمجموعات** -- قبول كل الرسائل، أو الرسائل المباشرة فقط، أو مجموعة محددة
- **معالجة المرفقات** -- معالجة الرسائل ذات المرفقات فقط أو تخطيها اختياريًا

## القيود

- يتطلب تشغيل signal-cli كعملية daemon منفصلة
- يجب أن يكون signal-cli مسجلاً ومؤكداً برقم هاتف صالح
- كل instance من signal-cli يدعم رقم هاتف واحد
- إرسال رسائل المجموعات يتطلب أن يكون حساب signal-cli عضوًا في المجموعة
- signal-cli تطبيق Java وله متطلبات موارد خاصة به

## استكشاف الأخطاء وإصلاحها

### تعذر الاتصال بـ signal-cli
- تحقق من عمل signal-cli daemon: `curl http://127.0.0.1:8686/api/v1/about`
- افحص أن `http_url` يطابق عنوان الربط والمنفذ في daemon
- تأكد من عدم وجود قواعد جدار ناري تمنع الاتصال

### يتم تجاهل رسائل المجموعات
- افحص مرشح `group_id` -- إذا كان `"dm"` فسيتم استبعاد رسائل المجموعات
- إذا كان مضبوطًا على Group ID محدد، ستُقبل رسائل تلك المجموعة فقط
- اضبط `group_id` على `null` (أو احذفه) لقبول كل الرسائل

### يتم تخطي الرسائل ذات المرفقات فقط
- هذا سلوك متوقع عند `ignore_attachments = true`
- اضبط `ignore_attachments = false` لمعالجة هذه الرسائل
