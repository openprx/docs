---
title: التثبيت
description: تثبيت PRX-SD على لينكس أو ماك أو إس أو ويندوز WSL2 باستخدام سكريبت التثبيت أو Cargo أو البناء من المصدر أو Docker.
---

# التثبيت

يدعم PRX-SD أربع طرق للتثبيت. اختر الطريقة الأنسب لسير عملك.

::: tip موصى به
**سكريبت التثبيت** هو أسرع طريقة للبدء. يكشف منصتك ويُنزّل الملف الثنائي الصحيح ويضعه في مسار PATH.
:::

## المتطلبات المسبقة

| المتطلب | الحد الأدنى | ملاحظات |
|-------------|---------|-------|
| نظام التشغيل | لينكس (x86_64، aarch64)، ماك أو إس (12+)، ويندوز (WSL2) | لينكس الأصلي غير مدعوم |
| مساحة القرص | 200 MB | ~50 MB ملف ثنائي + ~150 MB قاعدة بيانات التوقيعات |
| الذاكرة العشوائية | 512 MB | يُوصى بـ 2 GB+ لفحص الأدلة الكبيرة |
| Rust (للبناء من المصدر فقط) | 1.85.0 | غير مطلوب للسكريبت أو تثبيت Docker |
| Git (للبناء من المصدر فقط) | 2.30+ | لاستنساخ المستودع |
| Docker (لـ Docker فقط) | 20.10+ | أو Podman 3.0+ |

## الطريقة 1: سكريبت التثبيت (موصى به)

يُنزّل سكريبت التثبيت أحدث إصدار ثنائي لمنصتك ويضعه في `/usr/local/bin`.

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

لتثبيت إصدار محدد:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash -s -- --version 0.5.0
```

يدعم السكريبت متغيرات البيئة التالية:

| المتغير | الافتراضي | الوصف |
|----------|---------|-------------|
| `INSTALL_DIR` | `/usr/local/bin` | دليل التثبيت المخصص |
| `VERSION` | `latest` | إصدار محدد |
| `ARCH` | يُكشف تلقائياً | تجاوز المعمارية (`x86_64`، `aarch64`) |

## الطريقة 2: تثبيت Cargo

إذا كان Rust مثبتاً، يمكنك التثبيت مباشرةً من crates.io:

```bash
cargo install prx-sd
```

هذا يُجمع من المصدر ويضع الملف الثنائي `sd` في `~/.cargo/bin/`.

::: warning تبعيات البناء
يُجمع تثبيت Cargo تبعيات أصلية. على Debian/Ubuntu قد تحتاج إلى:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
على ماك أو إس، يلزم وجود Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

## الطريقة 3: البناء من المصدر

استنسخ المستودع وابنه في وضع الإصدار:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

الملف الثنائي موجود في `target/release/sd`. انسخه إلى مسار PATH:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### خيارات البناء

| علم الميزة | الافتراضي | الوصف |
|-------------|---------|-------------|
| `yara` | مفعّل | محرك قواعد YARA-X |
| `ml` | معطّل | محرك استنتاج ONNX للتعلم الآلي |
| `gui` | معطّل | واجهة رسومية Tauri + Vue 3 |
| `virustotal` | معطّل | تكامل VirusTotal API |

للبناء مع دعم استنتاج التعلم الآلي:

```bash
cargo build --release --features ml
```

لبناء واجهة المستخدم الرسومية:

```bash
cargo build --release --features gui
```

## الطريقة 4: Docker

اسحب صورة Docker الرسمية:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

شغّل فحصاً بتثبيت دليل الهدف:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

للمراقبة في الوقت الفعلي، شغّل كوحيد خدمة:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
يتوفر ملف `docker-compose.yml` في جذر المستودع لعمليات النشر الإنتاجية مع تحديثات تلقائية للتوقيعات.
:::

## ملاحظات المنصة

### لينكس

يعمل PRX-SD على أي توزيعة لينكس حديثة. للمراقبة في الوقت الفعلي، يُستخدم نظام الفرعي `inotify`. قد تحتاج إلى زيادة حد المراقبة لشجرات الأدلة الكبيرة:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

يتطلب كشف Rootkit وفحص الذاكرة صلاحيات الجذر.

### ماك أو إس

يستخدم PRX-SD FSEvents للمراقبة في الوقت الفعلي على ماك أو إس. كلٌّ من Apple Silicon (aarch64) وIntel (x86_64) مدعومان. يكشف سكريبت التثبيت معماريتك تلقائياً.

::: warning macOS Gatekeeper
إذا حجب macOS الملف الثنائي، أزل سمة الحجر الصحي:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### ويندوز (WSL2)

يعمل PRX-SD داخل WSL2 باستخدام الملف الثنائي للينكس. ثبّت WSL2 مع توزيعة لينكس أولاً، ثم اتبع خطوات تثبيت لينكس. دعم ويندوز الأصلي مخطط لإصدار مستقبلي.

## التحقق من التثبيت

بعد التثبيت، تحقق من عمل `sd`:

```bash
sd --version
```

المخرجات المتوقعة:

```
prx-sd 0.5.0
```

تحقق من حالة النظام الكاملة بما فيها قاعدة بيانات التوقيعات:

```bash
sd info
```

يعرض هذا الإصدار المثبت وعدد التوقيعات وعدد قواعد YARA ومسارات قاعدة البيانات.

## إلغاء التثبيت

### سكريبت / تثبيت Cargo

```bash
# إزالة الملف الثنائي
sudo rm /usr/local/bin/sd
# أو إذا ثُبِّت عبر Cargo
cargo uninstall prx-sd

# إزالة قاعدة بيانات التوقيعات والإعدادات
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## الخطوات التالية

- [البداية السريعة](./quickstart) -- ابدأ الفحص في 5 دقائق
- [فحص الملفات والأدلة](../scanning/file-scan) -- مرجع كامل لأمر `sd scan`
- [نظرة عامة على محرك الكشف](../detection/) -- فهم خط الأنابيب متعدد الطبقات
