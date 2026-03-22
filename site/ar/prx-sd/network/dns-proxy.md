---
title: وكيل DNS
description: تشغيل وكيل DNS محلي يجمع تصفية adblock وموجات نطاق IOC وقوائم الحظر المخصصة في محلل واحد مع تسجيل استعلامات كامل.
---

# وكيل DNS

يبدأ الأمر `sd dns-proxy` خادم وكيل DNS محلي يعترض استعلامات DNS ويُصفِّيها عبر ثلاثة محركات قبل إعادة التوجيه إلى محلل المنبع:

1. **محرك Adblock** -- يحظر الإعلانات والمتتبعات والنطاقات الضارة من قوائم التصفية
2. **موجة نطاق IOC** -- يحظر النطاقات من مؤشرات اختراق استخبارات التهديدات
3. **قائمة حظر DNS المخصصة** -- يحظر النطاقات من القوائم المعرَّفة من قِبل المستخدم

الاستعلامات التي تطابق أي مرشح تُجاب بـ `0.0.0.0` (NXDOMAIN). جميع الاستعلامات الأخرى تُعاد إلى خادم DNS المنبع المُهيَّأ. كل استعلام وحالة تحليله مُسجَّلان في ملف JSONL.

## بدء سريع

```bash
# بدء وكيل DNS بالإعدادات الافتراضية (استماع 127.0.0.1:53، منبع 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
يستمع الوكيل على المنفذ 53 افتراضياً، الذي يتطلب صلاحيات الجذر. للاختبار غير المتميز، استخدم منفذاً عالياً مثل `--listen 127.0.0.1:5353`.
:::

## خيارات الأمر

```bash
sd dns-proxy [OPTIONS]
```

| الخيار | الافتراضي | الوصف |
|--------|---------|-------------|
| `--listen` | `127.0.0.1:53` | العنوان والمنفذ للاستماع عليهما |
| `--upstream` | `8.8.8.8:53` | خادم DNS المنبع لإعادة توجيه الاستعلامات غير المحظورة إليه |
| `--log-path` | `/tmp/prx-sd-dns.log` | مسار ملف سجل استعلام JSONL |

## أمثلة الاستخدام

### الاستخدام الأساسي

بدء الوكيل على العنوان الافتراضي مع Google DNS كمنبع:

```bash
sudo sd dns-proxy
```

المخرجات:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### عنوان استماع ومنبع مخصصان

استخدام Cloudflare DNS كمنبع والاستماع على منفذ مخصص:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### مسار سجل مخصص

كتابة سجلات الاستعلام إلى موقع محدد:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### الدمج مع Adblock

يُحمِّل وكيل DNS تلقائياً قوائم تصفية adblock من `~/.prx-sd/adblock/`. للحصول على أفضل تغطية:

```bash
# الخطوة 1: تمكين ومزامنة قوائم adblock
sudo sd adblock enable
sd adblock sync

# الخطوة 2: بدء وكيل DNS (يلتقط قواعد adblock تلقائياً)
sudo sd dns-proxy
```

يقرأ الوكيل نفس قوائم التصفية المؤقتة المستخدمة من قِبل `sd adblock`. أي قوائم مُضافة عبر `sd adblock add` تُتاح تلقائياً للوكيل بعد إعادة تشغيله.

## تهيئة نظامك لاستخدام الوكيل

### لينكس (systemd-resolved)

تحرير `/etc/systemd/resolved.conf`:

```ini
[Resolve]
DNS=127.0.0.1
```

ثم إعادة التشغيل:

```bash
sudo systemctl restart systemd-resolved
```

### لينكس (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

للعودة إلى الإعدادات الافتراضية:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
إعادة توجيه جميع حركة مرور DNS إلى الوكيل المحلي تعني أنه إذا توقف الوكيل، سيفشل تحليل DNS حتى تُعيد الإعدادات الأصلية أو تُعيد تشغيل الوكيل.
:::

## تنسيق السجل

يكتب وكيل DNS تنسيق JSONL (كائن JSON واحد لكل سطر) إلى مسار السجل المُهيَّأ. كل إدخال يحتوي على:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| الحقل | الوصف |
|-------|-------------|
| `timestamp` | الطابع الزمني ISO 8601 للاستعلام |
| `query` | اسم النطاق المُستعلَم عنه |
| `type` | نوع سجل DNS (A، AAAA، CNAME، إلخ) |
| `action` | `blocked` أو `forwarded` |
| `filter` | المرشح الذي تطابق: `adblock`، `ioc`، `blocklist`، أو `null` |
| `upstream_ms` | وقت الذهاب والعودة إلى DNS المنبع (null إذا كان محظوراً) |

## البنية المعمارية

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## التشغيل كخدمة

لتشغيل وكيل DNS كخدمة systemd مستمرة:

```bash
# إنشاء ملف وحدة systemd
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# تمكين والبدء
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
لتجربة خلفية مُدارة بالكامل، فكِّر في استخدام `sd daemon` بدلاً من ذلك، الذي يجمع بين مراقبة الملفات في الوقت الفعلي وتحديثات التوقيعات التلقائية ويمكن توسيعه ليشمل وظيفة وكيل DNS.
:::

## الخطوات التالية

- تهيئة [قوائم تصفية Adblock](./adblock) للحظر الشامل للنطاقات
- إعداد [المراقبة في الوقت الفعلي](../realtime/) لحماية نظام الملفات جنباً إلى جنب مع تصفية DNS
- مراجعة [مرجع الإعدادات](../configuration/reference) لإعدادات الوكيل ذات الصلة
