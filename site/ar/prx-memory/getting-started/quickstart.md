---
title: البدء السريع
description: "تشغيل PRX-Memory في 5 دقائق مع نقل stdio أو HTTP، وتخزين أول ذاكرة، واسترجاعها بالبحث الدلالي."
---

# البدء السريع

يرشدك هذا الدليل خلال بناء PRX-Memory وتشغيل الخادم وإجراء أول عمليات التخزين والاسترجاع.

## 1. بناء الخادم

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. بدء تشغيل الخادم

### الخيار أ: نقل stdio

للتكامل المباشر مع عميل MCP:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### الخيار ب: نقل HTTP

للوصول عبر الشبكة مع فحوصات الصحة والمقاييس:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

تحقق من تشغيل الخادم:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. إعداد عميل MCP

أضف PRX-Memory إلى إعداد عميل MCP الخاص بك. على سبيل المثال، في Claude Code أو Codex:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
استبدل `/path/to/prx-memory` بالمسار الفعلي حيث استنسخت المستودع.
:::

## 4. تخزين ذاكرة

أرسل طلب أداة `memory_store` عبر عميل MCP الخاص بك أو مباشرةً عبر JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. استرجاع الذكريات

استرجع الذكريات ذات الصلة باستخدام `memory_recall`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

يعيد النظام الذكريات مرتبةً حسب الصلة باستخدام مزيج من المطابقة المعجمية ودرجات الأهمية والحداثة.

## 6. تفعيل البحث الدلالي (اختياري)

للاسترجاع الدلالي القائم على المتجهات، اضبط مزوّد التضمين:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

مع تفعيل التضمين، تستخدم استعلامات الاسترجاع التشابه المتجهي بالإضافة إلى المطابقة المعجمية، مما يحسن جودة الاسترجاع بشكل كبير للاستعلامات باللغة الطبيعية.

## 7. تفعيل إعادة الترتيب (اختياري)

أضف معيد ترتيب لتحسين دقة الاسترجاع أكثر:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## أدوات MCP المتاحة

| الأداة | الوصف |
|--------|-------|
| `memory_store` | تخزين إدخال ذاكرة جديد |
| `memory_recall` | استرجاع الذكريات بالاستعلام |
| `memory_update` | تحديث ذاكرة موجودة |
| `memory_forget` | حذف إدخال ذاكرة |
| `memory_export` | تصدير جميع الذكريات |
| `memory_import` | استيراد الذكريات من التصدير |
| `memory_migrate` | ترحيل تنسيق التخزين |
| `memory_reembed` | إعادة تضمين الذكريات بنموذج جديد |
| `memory_compact` | ضغط التخزين وتحسينه |
| `memory_evolve` | تطوير الذاكرة مع التحقق بالاحتجاز |
| `memory_skill_manifest` | اكتشاف المهارات المتاحة |

## الخطوات التالية

- [محرك التضمين](../embedding/) -- استكشاف مزودي التضمين ومعالجة الدفعات
- [إعادة الترتيب](../reranking/) -- إعداد إعادة الترتيب في المرحلة الثانية
- [واجهات التخزين](../storage/) -- الاختيار بين تخزين JSON وSQLite
- [مرجع الإعداد](../configuration/) -- جميع متغيرات البيئة
