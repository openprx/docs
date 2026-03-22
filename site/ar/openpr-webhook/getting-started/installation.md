---
title: التثبيت
description: "بناء وتثبيت OpenPR-Webhook من المصدر. المتطلبات الأولية والاعتماديات وتشغيل الخدمة وفحص الصحة وإعداد systemd."
---

# التثبيت

## المتطلبات الأولية

- سلسلة أدوات Rust (إصدار 2021 أو أحدث)
- نسخة OpenPR تعمل ويمكنها إرسال أحداث webhook

## البناء من المصدر

استنسخ المستودع وابنه في وضع الإصدار:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

الثنائي مُنتَج في `target/release/openpr-webhook`.

## الاعتماديات

OpenPR-Webhook مبني على المكتبات الأساسية التالية:

| الحزمة | الغرض |
|--------|-------|
| `axum` 0.8 | إطار عمل خادم HTTP |
| `tokio` 1 | بيئة تشغيل غير متزامنة |
| `reqwest` 0.12 | عميل HTTP لإعادة توجيه webhook والاستدعاءات |
| `hmac` + `sha2` | التحقق من توقيع HMAC-SHA256 |
| `toml` 0.8 | تحليل الإعداد |
| `tokio-tungstenite` 0.28 | عميل WebSocket لوضع النفق |
| `tracing` | السجل المهيكل |

## ملف الإعداد

أنشئ ملف `config.toml`. تحمّل الخدمة هذا الملف عند بدء التشغيل. راجع [مرجع الإعداد](../configuration/index.md) للمخطط الكامل.

مثال بسيط:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## التشغيل

```bash
# Default: loads config.toml from the current directory
./target/release/openpr-webhook

# Specify a custom config path
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## السجل

يُتحكم في السجل بمتغير البيئة `RUST_LOG`. المستوى الافتراضي هو `openpr_webhook=info`.

```bash
# Debug logging
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-level logging (very verbose)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## فحص الصحة

تكشف الخدمة نقطة نهاية `GET /health` تُعيد `ok` عندما يكون الخادم يعمل:

```bash
curl http://localhost:9000/health
# ok
```

## خدمة Systemd (اختياري)

لنشر الإنتاج على Linux:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## الخطوات التالية

- [البدء السريع](quickstart.md) -- إعداد أول وكيل واختباره من البداية إلى النهاية
- [مرجع الإعداد](../configuration/index.md) -- توثيق مخطط TOML الكامل
