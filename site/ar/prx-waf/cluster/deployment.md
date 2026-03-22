---
title: نشر الكتلة
description: "دليل خطوة بخطوة لنشر كتلة PRX-WAF متعددة العقد. توليد الشهادات وإعداد العقد وDocker Compose والتحقق."
---

# نشر الكتلة

يرشدك هذا الدليل خلال نشر كتلة PRX-WAF من ثلاث عقد مع عقدة رئيسية واحدة وعقدتين عاملتين.

## المتطلبات الأولية

- ثلاثة خوادم (أو مضيفات Docker) مع اتصال شبكي على المنفذ UDP `16851`
- PostgreSQL 16+ متاحة من جميع العقد (مشتركة أو مُكررة)
- ملف PRX-WAF الثنائي مثبَّت على كل عقدة (أو صور Docker متاحة)

## الخطوة 1: توليد شهادات الكتلة

ولِّد شهادات CA وشهادات العقد باستخدام حاوية cert-init أو يدوياً بـ OpenSSL.

**باستخدام Docker Compose (موصى به):**

يتضمن المستودع ملف `docker-compose.cluster.yml` يتعامل مع توليد الشهادات:

```bash
# توليد الشهادات
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

يُنشئ هذا شهادات في مجلد مشترك:

```
cluster_certs/
├── cluster-ca.pem      # CA certificate
├── cluster-ca.key      # CA private key (main node only)
├── node-a.pem          # Main node certificate
├── node-a.key          # Main node private key
├── node-b.pem          # Worker node B certificate
├── node-b.key          # Worker node B private key
├── node-c.pem          # Worker node C certificate
└── node-c.key          # Worker node C private key
```

**باستخدام auto_generate:**

بديلاً، اضبط `auto_generate = true` على العقدة الرئيسية. ستستقبل العقد العاملة الشهادات خلال عملية الانضمام:

```toml
[cluster.crypto]
auto_generate = true
```

## الخطوة 2: إعداد العقدة الرئيسية

أنشئ `configs/cluster-node-a.toml`:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # Main has no seeds

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Main holds the CA key
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## الخطوة 3: إعداد العقد العاملة

أنشئ `configs/cluster-node-b.toml` (وبالمثل لـ node-c):

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # Points to the main node

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## الخطوة 4: بدء تشغيل الكتلة

**بـ Docker Compose:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**يدوياً:**

ابدأ العقد بالترتيب: قاعدة البيانات أولاً، ثم الرئيسية، ثم العمال:

```bash
# على كل عقدة
prx-waf -c /etc/prx-waf/config.toml run
```

## الخطوة 5: التحقق من الكتلة

تحقق من حالة الكتلة من أي عقدة:

```bash
# عبر واجهة المستخدم الإدارية -- انتقل إلى لوحة تحكم الكتلة

# عبر API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

الاستجابة المتوقعة:

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## التكامل مع موازن الحمل

ضع موازن حمل خارجي (مثل HAProxy أو Nginx أو LB سحابي) أمام الكتلة لتوزيع حركة العملاء عبر جميع العقد:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

كل عقدة تُعالج الحركة بشكل مستقل عبر خط أنابيب WAF. العقدة الرئيسية هي أيضاً عقدة معالجة حركة -- ليست مقيَّدة بمهام التنسيق فحسب.

::: tip
استخدم نقطة نهاية `/health` لفحوصات صحة موازن الحمل:
```
GET http://node-a/health → 200 OK
```
:::

## توسيع الكتلة

لإضافة عقدة عاملة جديدة:

1. ولِّد شهادة للعقدة الجديدة (أو استخدم `auto_generate`)
2. هيِّئ العقدة الجديدة بـ `seeds = ["node-a:16851"]`
3. ابدأ تشغيل العقدة -- ستنضم تلقائياً إلى الكتلة وتُزامن

لإزالة عقدة، توقف عنها ببساطة. سيكتشف فاحص صحة الكتلة المغادرة ويستبعدها من المزامنة.

## الخطوات التالية

- [نظرة عامة على وضع الكتلة](./index) -- تفاصيل البنية المعمارية والمزامنة
- [مرجع الإعداد](../configuration/reference) -- جميع مفاتيح إعداد الكتلة
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات نشر الكتلة الشائعة
