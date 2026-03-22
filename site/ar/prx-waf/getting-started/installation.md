---
title: التثبيت
description: "تثبيت PRX-WAF باستخدام Docker Compose أو Cargo أو البناء من المصدر. يتضمن المتطلبات الأولية وملاحظات المنصة والتحقق بعد التثبيت."
---

# التثبيت

يدعم PRX-WAF ثلاث طرق للتثبيت. اختر الطريقة الأنسب لسير عملك.

::: tip موصى به
**Docker Compose** هو أسرع طريقة للبدء. يُشغِّل PRX-WAF وPostgreSQL وواجهة المستخدم الإدارية بأمر واحد.
:::

## المتطلبات الأولية

| المتطلب | الحد الأدنى | ملاحظات |
|-------------|---------|-------|
| نظام التشغيل | Linux (x86_64, aarch64)، macOS (12+) | Windows عبر WSL2 |
| PostgreSQL | 16+ | مضمَّن في Docker Compose |
| Rust (البناء من المصدر فقط) | 1.82.0 | غير مطلوب لتثبيت Docker |
| Node.js (بناء واجهة المستخدم الإدارية فقط) | 18+ | غير مطلوب لتثبيت Docker |
| Docker | 20.10+ | أو Podman 3.0+ |
| مساحة القرص | 500 ميغابايت | ~100 ميغابايت ثنائي + ~400 ميغابايت بيانات PostgreSQL |
| الذاكرة العشوائية | 512 ميغابايت | يُنصح بـ 2 غيغابايت+ للإنتاج |

## الطريقة 1: Docker Compose (موصى به)

استنسخ المستودع وابدأ جميع الخدمات بـ Docker Compose:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# راجع وعدِّل متغيرات البيئة في docker-compose.yml
# (كلمة مرور قاعدة البيانات وبيانات اعتماد المسؤول ومنافذ الاستماع)
docker compose up -d
```

يُشغِّل هذا ثلاثة حاويات:

| الحاوية | المنفذ | الوصف |
|-----------|------|-------------|
| `prx-waf` | `80`، `443` | الوكيل العكسي (HTTP + HTTPS) |
| `prx-waf` | `9527` | واجهة برمجة الإدارة + واجهة Vue 3 |
| `postgres` | `5432` | قاعدة بيانات PostgreSQL 16 |

تحقق من النشر:

```bash
# تحقق من حالة الحاوية
docker compose ps

# تحقق من نقطة نهاية الصحة
curl http://localhost:9527/health
```

افتح واجهة المستخدم الإدارية على `http://localhost:9527` وسجِّل الدخول ببيانات الاعتماد الافتراضية: `admin` / `admin`.

::: warning تغيير كلمة المرور الافتراضية
غيِّر كلمة مرور المسؤول الافتراضية فور تسجيل الدخول الأول. انتقل إلى **الإعدادات > الحساب** في واجهة المستخدم الإدارية أو استخدم API.
:::

### Docker Compose مع Podman

إذا كنت تستخدم Podman بدلاً من Docker:

```bash
podman-compose up -d --build
```

::: info DNS في Podman
عند استخدام Podman، عنوان محلل DNS للاتصال بين الحاويات هو `10.89.0.1` بدلاً من `127.0.0.11` الخاص بـ Docker. يتعامل ملف `docker-compose.yml` المرفق مع هذا تلقائياً.
:::

## الطريقة 2: تثبيت Cargo

إذا كان لديك Rust مثبت، يمكنك تثبيت PRX-WAF من المستودع:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

الملف الثنائي موجود في `target/release/prx-waf`. انسخه إلى PATH:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning تبعيات البناء
يُجمِّع بناء Cargo التبعيات الأصلية. على Debian/Ubuntu قد تحتاج:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
على macOS، يلزم توافر Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

### إعداد قاعدة البيانات

يتطلب PRX-WAF قاعدة بيانات PostgreSQL 16+:

```bash
# إنشاء قاعدة البيانات والمستخدم
createdb prx_waf
createuser prx_waf

# تشغيل الترحيلات
./target/release/prx-waf -c configs/default.toml migrate

# إنشاء مستخدم المسؤول الافتراضي (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### بدء تشغيل الخادم

```bash
./target/release/prx-waf -c configs/default.toml run
```

يُشغِّل هذا الوكيل العكسي على المنفذين 80/443 وواجهة برمجة الإدارة على المنفذ 9527.

## الطريقة 3: البناء من المصدر (للتطوير)

للتطوير مع إعادة التحميل المباشر لواجهة المستخدم الإدارية:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# بناء الواجهة الخلفية بـ Rust
cargo build

# بناء واجهة المستخدم الإدارية
cd web/admin-ui
npm install
npm run build
cd ../..

# بدء تشغيل خادم التطوير
cargo run -- -c configs/default.toml run
```

### بناء واجهة المستخدم الإدارية للإنتاج

```bash
cd web/admin-ui
npm install
npm run build
```

تُضمَّن الملفات المبنية في الملف الثنائي بـ Rust في وقت التجميع وتُخدَّم بواسطة خادم API.

## خدمة systemd

للنشرات الإنتاجية على المعدن المجرد، أنشئ خدمة systemd:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## التحقق من التثبيت

بعد التثبيت، تحقق من تشغيل PRX-WAF:

```bash
# تحقق من نقطة نهاية الصحة
curl http://localhost:9527/health

# تحقق من واجهة المستخدم الإدارية
curl -s http://localhost:9527 | head -5
```

سجِّل الدخول إلى واجهة المستخدم الإدارية على `http://localhost:9527` للتحقق من تحميل لوحة التحكم بشكل صحيح.

## الخطوات التالية

- [البدء السريع](./quickstart) -- حماية تطبيقك الأول في 5 دقائق
- [الإعداد](../configuration/) -- تخصيص إعدادات PRX-WAF
- [محرك القواعد](../rules/) -- فهم خط أنابيب الكشف
