---
title: استكشاف الأخطاء وإصلاحها
description: "المشكلات الشائعة في PRX-Memory وحلولها للإعداد والتضمين وإعادة الترتيب والتخزين وتكامل MCP."
---

# استكشاف الأخطاء وإصلاحها

تغطي هذه الصفحة المشكلات الشائعة التي تواجهها عند تشغيل PRX-Memory، مع أسبابها وحلولها.

## مشكلات الإعداد

### "PRX_EMBED_API_KEY is not configured"

**السبب:** طُلب استدعاء دلالي بعيد ولكن لم يُضبط مفتاح API للتضمين.

**الحل:** اضبط مزوّد التضمين ومفتاح API:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

أو استخدم مفتاحاً احتياطياً خاصاً بالمزوّد:

```bash
JINA_API_KEY=your_api_key
```

::: tip
إذا لم تحتج إلى البحث الدلالي، يعمل PRX-Memory بدون إعداد تضمين باستخدام المطابقة المعجمية فقط.
:::

### "Unsupported rerank provider"

**السبب:** يحتوي متغير `PRX_RERANK_PROVIDER` على قيمة غير معروفة.

**الحل:** استخدم إحدى القيم المدعومة:

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**السبب:** يحتوي متغير `PRX_EMBED_PROVIDER` على قيمة غير معروفة.

**الحل:** استخدم إحدى القيم المدعومة:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## مشكلات الجلسة

### "session_expired"

**السبب:** تجاوزت جلسة بث HTTP مدة TTL دون تجديد.

**الحل:** إما جدّد الجلسة قبل انتهاء الصلاحية أو زد مدة TTL:

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## مشكلات التخزين

### ملف قاعدة البيانات غير موجود

**السبب:** المسار المحدد في `PRX_MEMORY_DB` غير موجود أو غير قابل للكتابة.

**الحل:** تأكد من وجود الدليل وصحة المسار:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
استخدم مسارات مطلقة لتجنب مشكلات تغيير دليل العمل.
:::

### قاعدة بيانات JSON الكبيرة بطيئة في التحميل

**السبب:** تحمّل واجهة JSON الملف بأكمله في الذاكرة عند بدء التشغيل. لقواعد البيانات التي تتجاوز 10,000 إدخال، يمكن أن يكون هذا بطيئاً.

**الحل:** انتقل إلى واجهة SQLite:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

استخدم أداة `memory_migrate` لنقل البيانات الموجودة.

## مشكلات المراقبة

### تنبيه تجاوز الكثافة العددية للمقاييس

**السبب:** عدد كبير جداً من قيم التسميات المتميزة في أبعاد نطاق الاسترجاع أو الفئة أو مزوّد إعادة الترتيب.

**الحل:** زد حدود الكثافة العددية أو طبّع مدخلاتك:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

عند تجاوز الحدود، تُسقَط قيم التسميات الجديدة بصمت وتُحسَب في `prx_memory_metrics_label_overflow_total`.

### عتبات التنبيه حساسة للغاية

**السبب:** قد تثير العتبات الافتراضية إيجابيات كاذبة أثناء النشر الأولي.

**الحل:** اضبط العتبات بناءً على معدلات الأخطاء المتوقعة:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## مشكلات البناء

### ميزة LanceDB غير متاحة

**السبب:** لم تُفعَّل علامة الميزة `lancedb-backend` وقت الترجمة.

**الحل:** أعد البناء مع علامة الميزة:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### أخطاء التجميع على Linux

**السبب:** اعتماديات نظام مفقودة لبناء الكود الأصلي.

**الحل:** ثبّت اعتماديات البناء:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## فحص الصحة

استخدم نقطة نهاية صحة HTTP للتحقق من تشغيل الخادم بشكل صحيح:

```bash
curl -sS http://127.0.0.1:8787/health
```

تحقق من المقاييس للحالة التشغيلية:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## أوامر التحقق

شغّل مجموعة التحقق الكاملة للتحقق من التثبيت:

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## الحصول على المساعدة

- **المستودع:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **المشكلات:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **التوثيق:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
