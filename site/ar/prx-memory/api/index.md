---
title: مرجع Rust API
description: مرجع واجهة برمجة مكتبة PRX-Memory بـ Rust لتضمين محرك الذاكرة في تطبيقات Rust الخاصة بك.
---

# مرجع Rust API

يُنظَّم PRX-Memory كمساحة عمل Rust تتضمن سبع حزم. كل حزمة توفر واجهة برمجية مركّزة يمكن استخدامها بشكل مستقل أو تأليفها معاً.

## نظرة عامة على الحزم

### prx-memory-core

البدائيات الجوهرية للنطاق: التقييم والتطور وتمثيل إدخال الذاكرة.

```toml
[dependencies]
prx-memory-core = "0.1"
```

الأنواع الرئيسية:
- هياكل إدخال الذاكرة مع النص والنطاق والوسوم والأهمية والبيانات الوصفية.
- بدائيات التقييم لترتيب الصلة.
- أنواع التطور لاختبار قبول التدريب/الاحتجاز.

### prx-memory-embed

تجريد مزوّد التضمين والمحوّلات.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

يوفر سمة غير متزامنة تنفّذها جميع مزودي التضمين:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

التطبيقات المدمجة:
- `OpenAiCompatibleProvider` -- أي واجهة برمجة تضمين متوافقة مع OpenAI
- `JinaProvider` -- تضمينات Jina AI
- `GeminiProvider` -- تضمينات Google Gemini

### prx-memory-rerank

تجريد مزوّد إعادة الترتيب والمحوّلات.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

يوفر سمة غير متزامنة لإعادة الترتيب:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

التطبيقات المدمجة:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

تجريد مزوّد موحد يؤلف التضمين وإعادة الترتيب.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

توفر هذه الحزمة نقطة دخول واحدة لإعداد مزودَي التضمين وإعادة الترتيب من متغيرات البيئة.

### prx-memory-skill

حمولات مهارات الحوكمة المدمجة لتوزيع موارد MCP.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

توفر تعريفات مهارات ثابتة وقوالب حمولة قابلة للاكتشاف من خلال بروتوكول موارد MCP.

### prx-memory-storage

محرك التخزين المستمر المحلي.

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

يوفر تطبيقات سمة التخزين لـ:
- التخزين القائم على ملفات JSON
- SQLite مع أعمدة المتجهات
- LanceDB (اختياري، خلف علامة ميزة)

### prx-memory-mcp

سطح خادم MCP الذي يجمع جميع الحزم الأخرى في خادم قابل للتشغيل.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

عادةً لا تُستخدم هذه الحزمة كاعتمادية مكتبة -- إنها توفر ثنائي `prx-memoryd`.

## معالجة الأخطاء

تستخدم جميع الحزم `thiserror` لتعدادات أخطاء مكتوبة. تتشعب الأخطاء باستخدام المعامل `?` ولا تُحوَّل أبداً إلى حالات ذعر في كود الإنتاج.

```rust
// Example error pattern
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EmbedError {
    #[error("API request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("API key not configured")]
    MissingApiKey,
    #[error("Unexpected response: {0}")]
    Response(String),
}
```

## التزامن

- تستخدم mutex المتزامنة `parking_lot::Mutex` (بدون تسمم).
- تستخدم mutex غير المتزامنة `tokio::sync::Mutex`.
- `std::sync::Mutex` محظور في كود الإنتاج.
- البيانات غير القابلة للتغيير المشتركة تستخدم `Arc<str>` أو `Arc<T>`.

## الاعتماديات

جميع طلبات الشبكة تستخدم `reqwest` مع `rustls-tls` (لا اعتمادية على OpenSSL). تستخدم التسلسل `serde` و`serde_json`.

## الخطوات التالية

- [نماذج التضمين](../embedding/models) -- الإعداد الخاص بالمزوّد
- [واجهات التخزين](../storage/) -- تطبيقات سمة التخزين
- [مرجع الإعداد](../configuration/) -- مرجع متغيرات البيئة
