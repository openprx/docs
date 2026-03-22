---
title: نظرة عامة على الإعداد
description: "كيفية عمل إعداد PRX-WAF. بنية ملف إعداد TOML وتجاوزات متغيرات البيئة والعلاقة بين الإعداد المستند إلى الملفات والمُخزَّن في قاعدة البيانات."
---

# الإعداد

يُهيَّأ PRX-WAF من خلال ملف TOML يُمرَّر عبر العلم `-c` / `--config`. المسار الافتراضي هو `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## مصادر الإعداد

يستخدم PRX-WAF طبقتين للإعداد:

| المصدر | النطاق | الوصف |
|--------|-------|-------------|
| ملف TOML | بدء تشغيل الخادم | منافذ الوكيل وعنوان URL لقاعدة البيانات والتخزين المؤقت وHTTP/3 والأمن والكتلة |
| قاعدة البيانات | وقت التشغيل | المضيفون والقواعد والشهادات والإضافات والأنفاق والإشعارات |

يحتوي ملف TOML على الإعدادات المطلوبة عند وقت البدء (المنافذ واتصال قاعدة البيانات وإعداد الكتلة). تُخزَّن إعدادات وقت التشغيل مثل المضيفين والقواعد في PostgreSQL وتُدار عبر واجهة المستخدم الإدارية أو REST API.

## بنية ملف الإعداد

ملف إعداد TOML لديه الأقسام التالية:

```toml
[proxy]          # Reverse proxy listener addresses
[api]            # Admin API listener address
[storage]        # PostgreSQL connection
[cache]          # Response cache settings
[http3]          # HTTP/3 QUIC settings
[security]       # Admin API security (IP allowlist, rate limit, CORS)
[rules]          # Rule engine settings (directory, hot-reload, sources)
[crowdsec]       # CrowdSec integration
[cluster]        # Cluster mode (optional)
```

### إعداد أدنى

إعداد أدنى للتطوير:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### إعداد الإنتاج

إعداد إنتاج مع جميع ميزات الأمن:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## إعداد المضيف

يمكن تعريف المضيفين في ملف TOML للنشرات الثابتة:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
للبيئات الديناميكية، أدِر المضيفين عبر واجهة المستخدم الإدارية أو REST API بدلاً من ملف TOML. المضيفون المخزَّنون في قاعدة البيانات لهم الأولوية على المضيفين المُعرَّفين في TOML.
:::

## ترحيلات قاعدة البيانات

يتضمن PRX-WAF 8 ملفات ترحيل تُنشئ مخطط قاعدة البيانات المطلوب:

```bash
# تشغيل الترحيلات
prx-waf -c configs/default.toml migrate

# إنشاء مستخدم المسؤول الافتراضي
prx-waf -c configs/default.toml seed-admin
```

الترحيلات خاملة الأثر وآمنة للتشغيل عدة مرات.

## بيئة Docker

في نشرات Docker، تُضبط قيم الإعداد عادةً في `docker-compose.yml`:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## الخطوات التالية

- [مرجع الإعداد](./reference) -- توثيق كل مفتاح TOML مع الأنواع والقيم الافتراضية
- [التثبيت](../getting-started/installation) -- الإعداد الأولي وترحيلات قاعدة البيانات
- [وضع الكتلة](../cluster/) -- إعداد خاص بالكتلة
