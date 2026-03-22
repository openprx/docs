---
title: تكامل MCP
description: "تكامل بروتوكول MCP في PRX-Memory، الأدوات المدعومة، الموارد، القوالب، وأوضاع النقل."
---

# تكامل MCP

PRX-Memory مبني كخادم MCP (Model Context Protocol) أصلي. يعرض عمليات الذاكرة كأدوات MCP، ومهارات الحوكمة كموارد MCP، وقوالب حمولة للتفاعلات الموحدة مع الذاكرة.

## أوضاع النقل

### stdio

يتواصل نقل stdio عبر المدخل/المخرج القياسي، مما يجعله مثالياً للتكامل المباشر مع عملاء MCP مثل Claude Code وCodex وOpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

يوفر نقل HTTP خادماً يمكن الوصول إليه عبر الشبكة مع نقاط نهاية تشغيلية إضافية.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

نقاط نهاية HTTP فقط:

| نقطة النهاية | الوصف |
|------------|-------|
| `GET /health` | فحص الصحة |
| `GET /metrics` | مقاييس Prometheus |
| `GET /metrics/summary` | ملخص مقاييس JSON |
| `POST /mcp/session/renew` | تجديد جلسة البث |

## إعداد عميل MCP

أضف PRX-Memory إلى ملف إعداد عميل MCP الخاص بك:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
استخدم مسارات مطلقة لكل من `command` و`PRX_MEMORY_DB` لتجنب مشكلات تحليل المسار.
:::

## أدوات MCP

يعرض PRX-Memory الأدوات التالية من خلال واجهة `tools/call` الخاصة بـ MCP:

### عمليات الذاكرة الجوهرية

| الأداة | الوصف |
|--------|-------|
| `memory_store` | تخزين إدخال ذاكرة جديد مع نص ونطاق ووسوم وبيانات وصفية |
| `memory_recall` | استرجاع الذكريات المطابقة لاستعلام باستخدام البحث المعجمي والمتجهي ومعاد الترتيب |
| `memory_update` | تحديث إدخال ذاكرة موجود |
| `memory_forget` | حذف إدخال ذاكرة بالمعرف |

### العمليات المجمعة

| الأداة | الوصف |
|--------|-------|
| `memory_export` | تصدير جميع الذكريات إلى تنسيق JSON قابل للنقل |
| `memory_import` | استيراد الذكريات من تصدير |
| `memory_migrate` | الترحيل بين واجهات التخزين |
| `memory_reembed` | إعادة تضمين جميع الذكريات بنموذج التضمين الحالي |
| `memory_compact` | ضغط التخزين وتحسينه |

### التطور

| الأداة | الوصف |
|--------|-------|
| `memory_evolve` | تطوير الذاكرة باستخدام قبول التدريب/الاحتجاز مع بوابات القيود |

### اكتشاف المهارات

| الأداة | الوصف |
|--------|-------|
| `memory_skill_manifest` | إعادة مانيفست المهارات لمهارات الحوكمة |

## موارد MCP

يعرض PRX-Memory حزم مهارات الحوكمة كموارد MCP:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

قراءة مورد محدد:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## قوالب الموارد

تساعد قوالب الحمولة العملاء على بناء عمليات ذاكرة موحدة:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

استخدام قالب لتوليد حمولة تخزين:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## جلسات البث

يدعم نقل HTTP أحداث Server-Sent (SSE) للاستجابات البث. الجلسات لها TTL قابل للتكوين:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

تجديد جلسة قبل انتهاء صلاحيتها:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## ملفات التوحيد الشخصية

يدعم PRX-Memory ملفَّين شخصيَّين للتوحيد يتحكمان في كيفية وسم الذكريات والتحقق منها:

| الملف الشخصي | الوصف |
|------------|-------|
| `zero-config` | قيود دنيا، يقبل أي وسوم ونطاقات (الافتراضي) |
| `governed` | تطبيع صارم للوسوم وحدود النسب وقيود الجودة |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## الخطوات التالية

- [البدء السريع](../getting-started/quickstart) -- أولى عمليات التخزين والاسترجاع
- [مرجع الإعداد](../configuration/) -- جميع متغيرات البيئة
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات MCP الشائعة
