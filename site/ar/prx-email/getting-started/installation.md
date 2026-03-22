---
title: التثبيت
description: "تثبيت PRX-Email من المصدر أو إضافته كاعتمادية Cargo أو بناء مكوّن WASM لتكامل وقت تشغيل PRX."
---

# التثبيت

يمكن استخدام PRX-Email كاعتمادية مكتبة Rust أو بناؤه من المصدر للاستخدام المستقل أو تترجمته كمكوّن WASM لوقت تشغيل PRX.

::: tip موصى به
لمعظم المستخدمين، إضافة PRX-Email كـ **اعتمادية Cargo** هي أسرع طريقة لتكامل قدرات البريد الإلكتروني في مشروع Rust الخاص بك.
:::

## المتطلبات الأساسية

| المتطلب | الحد الأدنى | ملاحظات |
|---------|------------|---------|
| Rust | 1.85.0 (إصدار 2024) | مطلوب لجميع طرق التثبيت |
| Git | 2.30+ | لاستنساخ المستودع |
| SQLite | مدمج | مشمول عبر ميزة `rusqlite` المدمجة؛ لا حاجة لـ SQLite على النظام |
| هدف `wasm32-wasip1` | أحدث | مطلوب فقط لتترجمة مكوّن WASM |

## الطريقة 1: اعتمادية Cargo (موصى به)

أضف PRX-Email إلى `Cargo.toml` الخاص بمشروعك:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

يسحب هذا المكتبة وجميع الاعتماديات بما فيها `rusqlite` (SQLite مدمج) و`imap` و`lettre` و`mail-parser`.

::: warning اعتماديات البناء
تُترجم ميزة `rusqlite` المدمجة SQLite من مصدر C. على Debian/Ubuntu قد تحتاج إلى:
```bash
sudo apt install -y build-essential pkg-config
```
على macOS، يلزم توفر أدوات سطر أوامر Xcode:
```bash
xcode-select --install
```
:::

## الطريقة 2: البناء من المصدر

استنسخ المستودع وابنه في وضع الإصدار:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

شغّل مجموعة الاختبارات للتحقق من أن كل شيء يعمل:

```bash
cargo test
```

شغّل clippy للتحقق من التنميط:

```bash
cargo clippy -- -D warnings
```

## الطريقة 3: مكوّن WASM

يتيح مكوّن WASM تشغيل PRX-Email داخل وقت تشغيل PRX كوحدة WebAssembly في بيئة آمنة. يستخدم المكوّن WIT (أنواع واجهة WebAssembly) لتعريف واجهات استدعاء المضيف.

### بناء مكوّن WASM

```bash
cd prx_email

# Add the WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

يقع المكوّن المُترجم في `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

بدلاً من ذلك، استخدم سكريبت البناء:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### إعداد المكوّن

يتضمن مكوّن WASM مانيفست `plugin.toml` في دليل `wasm-plugin/` يحدد بيانات المكوّن الوصفية وقدراته.

### مفتاح أمان الشبكة

بشكل افتراضي، يعمل مكوّن WASM مع **تعطيل عمليات الشبكة الحقيقية**. لتفعيل اتصالات IMAP/SMTP الفعلية من سياق WASM:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

عند التعطيل، تعيد العمليات المعتمدة على الشبكة (`email.sync` و`email.send` و`email.reply`) خطأ محكوماً مع تلميح الحارس. هذا إجراء أمني لمنع الوصول غير المقصود للشبكة من المكوّنات في البيئة الآمنة.

## الاعتماديات

يستخدم PRX-Email الاعتماديات الرئيسية التالية:

| الحزمة | الإصدار | الغرض |
|--------|---------|-------|
| `rusqlite` | 0.31 | قاعدة بيانات SQLite مع تترجمة C مدمجة |
| `imap` | 2.4 | عميل IMAP لمزامنة صندوق الوارد |
| `lettre` | 0.11 | عميل SMTP لإرسال البريد الإلكتروني |
| `mail-parser` | 0.10 | تحليل رسائل MIME |
| `rustls` | 0.23 | TLS لاتصالات IMAP |
| `rustls-connector` | 0.20 | غلاف تيار TLS |
| `serde` / `serde_json` | 1.0 | التسلسل للنماذج واستجابات API |
| `sha2` | 0.10 | SHA-256 لمعرفات الرسائل الاحتياطية |
| `base64` | 0.22 | ترميز base64 للمرفقات |
| `thiserror` | 1.0 | اشتقاق نوع الخطأ |

جميع اتصالات TLS تستخدم `rustls` (Rust النقي) -- لا اعتمادية على OpenSSL.

## التحقق من التثبيت

بعد البناء، تحقق من أن المكتبة تُترجم وتجتاز الاختبارات:

```bash
cargo check
cargo test
```

المخرج المتوقع:

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## الخطوات التالية

- [البدء السريع](./quickstart) -- إعداد أول حساب بريد إلكتروني وإرسال رسالة
- [إدارة الحسابات](../accounts/) -- إعداد IMAP وSMTP وOAuth
- [مكوّنات WASM](../plugins/) -- تعرف على واجهة مكوّن WASM
