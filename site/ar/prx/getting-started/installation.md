---
title: التثبيت
description: تثبيت PRX على Linux أو macOS أو Windows WSL2 باستخدام سكربت التثبيت أو Cargo أو البناء من المصدر أو Docker.
---

# التثبيت

يُوزَّع PRX كملف تنفيذي ثابت واحد يسمى `prx`. اختر طريقة التثبيت التي تناسب سير عملك.

## المتطلبات الأساسية

قبل تثبيت PRX، تأكد من أن نظامك يستوفي هذه المتطلبات:

| المتطلب | التفاصيل |
|---------|----------|
| **نظام التشغيل** | Linux (x86_64, aarch64)، macOS (Apple Silicon, Intel)، أو Windows عبر WSL2 |
| **Rust** | 1.92.0+ (إصدار 2024) -- مطلوب فقط للتثبيت عبر Cargo أو البناء من المصدر |
| **حزم النظام** | `pkg-config` (Linux، للبناء من المصدر فقط) |
| **مساحة القرص** | ~50 ميجابايت للملف التنفيذي، ~200 ميجابايت مع بيئة تشغيل إضافات WASM |
| **الذاكرة العشوائية** | 64 ميجابايت كحد أدنى للخادم (بدون استدلال النماذج اللغوية) |

::: tip
إذا استخدمت سكربت التثبيت أو Docker، لا تحتاج لتثبيت Rust على نظامك.
:::

## الطريقة 1: سكربت التثبيت (موصى بها)

أسرع طريقة للبدء. يكتشف السكربت نظام التشغيل والبنية تلقائيًا، ويحمّل أحدث إصدار من الملف التنفيذي، ويضعه في مسار `PATH` الخاص بك.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

يثبّت السكربت `prx` في `~/.local/bin/` افتراضيًا. تأكد من أن هذا المجلد موجود في مسار `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

لتثبيت إصدار محدد:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

للتثبيت في مجلد مخصص:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## الطريقة 2: التثبيت عبر Cargo

إذا كانت أدوات Rust مثبتة لديك، يمكنك تثبيت PRX مباشرة من crates.io:

```bash
cargo install openprx
```

يبني هذا الأمر الملف التنفيذي بنمط الإصدار مع الميزات الافتراضية ويضعه في `~/.cargo/bin/prx`.

للتثبيت مع جميع الميزات الاختيارية (تشفير Matrix من طرف لطرف، WhatsApp Web، إلخ):

```bash
cargo install openprx --all-features
```

::: info رايات الميزات
يستخدم PRX رايات ميزات Cargo لدعم القنوات الاختيارية:

| الميزة | الوصف |
|--------|-------|
| `channel-matrix` | قناة Matrix مع دعم التشفير من طرف لطرف |
| `whatsapp-web` | قناة WhatsApp Web متعددة الأجهزة |
| **الافتراضي** | جميع القنوات المستقرة مفعّلة |
:::

## الطريقة 3: البناء من المصدر

للتطوير أو لتشغيل أحدث كود لم يُصدر بعد:

```bash
# استنساخ المستودع
git clone https://github.com/openprx/prx.git
cd prx

# بناء الملف التنفيذي بنمط الإصدار
cargo build --release

# الملف التنفيذي موجود في target/release/prx
./target/release/prx --version
```

للبناء مع جميع الميزات:

```bash
cargo build --release --all-features
```

لتثبيت الملف التنفيذي المبني محليًا في مجلد Cargo:

```bash
cargo install --path .
```

### بناء التطوير

لتكرار أسرع أثناء التطوير، استخدم بناء التصحيح:

```bash
cargo build
./target/debug/prx --version
```

::: warning
بناء التصحيح أبطأ بشكل ملحوظ أثناء التشغيل. استخدم دائمًا `--release` للإنتاج أو قياس الأداء.
:::

## الطريقة 4: Docker

شغّل PRX كحاوية دون الحاجة لتثبيت محلي:

```bash
docker pull ghcr.io/openprx/prx:latest
```

التشغيل مع ربط مجلد الإعدادات:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

أو باستخدام Docker Compose:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
عند التشغيل في Docker، عيّن مفاتيح API للنماذج اللغوية عبر متغيرات البيئة أو اربط ملف إعدادات. راجع [الإعدادات](../config/) للتفاصيل.
:::

## التحقق من التثبيت

بعد التثبيت، تحقق من أن PRX يعمل:

```bash
prx --version
```

المخرج المتوقع:

```
prx 0.3.0
```

شغّل فحص السلامة:

```bash
prx doctor
```

يتحقق هذا من أدوات Rust (إن كانت مثبتة)، واعتماديات النظام، وصحة ملف الإعدادات، والاتصال بمزودي النماذج اللغوية.

## ملاحظات خاصة بالمنصات

### Linux

يعمل PRX على أي توزيعة Linux حديثة (نواة 4.18+). الملف التنفيذي مربوط بشكل ثابت مع `rustls` لـ TLS، لذا لا حاجة لتثبيت OpenSSL.

لميزات صندوق الرمل، قد تحتاج حزمًا إضافية:

```bash
# واجهة صندوق رمل Firejail
sudo apt install firejail

# واجهة صندوق رمل Bubblewrap
sudo apt install bubblewrap

# واجهة صندوق رمل Docker (يتطلب خادم Docker)
sudo apt install docker.io
```

### macOS

يعمل PRX بشكل أصلي على أجهزة Mac بمعالج Apple Silicon (aarch64) وIntel (x86_64). قناة iMessage متاحة فقط على macOS.

إذا كنت تبني من المصدر، تأكد من تثبيت أدوات سطر أوامر Xcode:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX مدعوم على Windows من خلال WSL2. ثبّت توزيعة Linux (يُنصح بـ Ubuntu) واتبع تعليمات Linux داخل بيئة WSL2.

```powershell
# من PowerShell (تثبيت WSL2 مع Ubuntu)
wsl --install -d Ubuntu
```

ثم داخل WSL2:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
الدعم الأصلي لـ Windows غير متاح حاليًا. يوفر WSL2 أداءً قريبًا من Linux الأصلي وهو النهج الموصى به.
:::

## إلغاء التثبيت

لإزالة PRX:

```bash
# إذا ثُبّت عبر سكربت التثبيت
rm ~/.local/bin/prx

# إذا ثُبّت عبر Cargo
cargo uninstall openprx

# إزالة الإعدادات والبيانات (اختياري)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## الخطوات التالية

- [البدء السريع](./quickstart) -- تشغيل PRX في 5 دقائق
- [معالج الإعداد الأولي](./onboarding) -- إعداد مزود النماذج اللغوية
- [الإعدادات](../config/) -- مرجع الإعدادات الكامل
