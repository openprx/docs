---
title: التثبيت
description: "تثبيت PRX-Memory من المصدر باستخدام Cargo، أو بناء ثنائي الخادم لوسائل نقل stdio وHTTP."
---

# التثبيت

يُوزَّع PRX-Memory كمساحة عمل Rust. المنتج الأساسي هو ثنائي الخادم `prx-memoryd` من حزمة `prx-memory-mcp`.

::: tip موصى به
البناء من المصدر يمنحك أحدث الميزات ويتيح لك تفعيل واجهات التخزين الاختيارية مثل LanceDB.
:::

## المتطلبات الأساسية

| المتطلب | الحد الأدنى | ملاحظات |
|---------|------------|---------|
| Rust | سلسلة أدوات مستقرة | التثبيت عبر [rustup](https://rustup.rs/) |
| نظام التشغيل | Linux، macOS، Windows (WSL2) | أي منصة يدعمها Rust |
| Git | 2.30+ | لاستنساخ المستودع |
| مساحة القرص | 100 ميغابايت | الثنائي + الاعتماديات |
| الذاكرة العشوائية | 256 ميغابايت | يُوصى بالمزيد لقواعد بيانات الذاكرة الكبيرة |

## الطريقة 1: البناء من المصدر (موصى به)

استنسخ المستودع وابنه في وضع الإصدار:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

الثنائي موجود في `target/release/prx-memoryd`. انسخه إلى PATH:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### خيارات البناء

| علامة الميزة | الافتراضي | الوصف |
|-------------|----------|-------|
| `lancedb-backend` | معطل | واجهة تخزين LanceDB المتجهية |

للبناء مع دعم LanceDB:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning اعتماديات البناء
على Debian/Ubuntu قد تحتاج إلى:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
على macOS، يلزم توفر أدوات سطر أوامر Xcode:
```bash
xcode-select --install
```
:::

## الطريقة 2: تثبيت Cargo

إذا كان Rust مثبتاً، يمكنك التثبيت مباشرةً:

```bash
cargo install prx-memory-mcp
```

يجمع هذا من المصدر ويضع ثنائي `prx-memoryd` في `~/.cargo/bin/`.

## الطريقة 3: الاستخدام كمكتبة

لاستخدام حزم PRX-Memory كاعتماديات في مشروع Rust الخاص بك، أضفها إلى `Cargo.toml`:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## التحقق من التثبيت

بعد البناء، تحقق من تشغيل الثنائي:

```bash
prx-memoryd --help
```

اختبر جلسة stdio أساسية:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

اختبر جلسة HTTP:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

افحص نقطة نهاية الصحة:

```bash
curl -sS http://127.0.0.1:8787/health
```

## إعداد التطوير

للتطوير والاختبار، استخدم سير عمل Rust القياسي:

```bash
# Format
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Test
cargo test --all-targets --all-features

# Check (fast feedback)
cargo check --all-targets --all-features
```

## إلغاء التثبيت

```bash
# Remove the binary
sudo rm /usr/local/bin/prx-memoryd
# Or if installed via Cargo
cargo uninstall prx-memory-mcp

# Remove data files
rm -rf ./data/memory-db.json
```

## الخطوات التالية

- [البدء السريع](./quickstart) -- تشغيل PRX-Memory في 5 دقائق
- [الإعداد](../configuration/) -- جميع متغيرات البيئة والملفات الشخصية
- [تكامل MCP](../mcp/) -- الاتصال بعميل MCP الخاص بك
