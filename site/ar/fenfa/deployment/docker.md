---
title: نشر Docker
description: "نشر Fenfa بـ Docker وDocker Compose. إعداد الحاوية والأجزاء وبنيات متعددة المعماريات وفحوصات الصحة."
---

# نشر Docker

يُشحن Fenfa كصورة Docker واحدة تشمل الثنائي Go مع الواجهة الأمامية المدمجة. لا يلزم وجود حاويات إضافية -- فقط ارفع أجزاءً للبيانات الدائمة.

## البدء السريع

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

أنشئ `docker-compose.yml`:

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

أنشئ ملف `.env` بجانب ملف Compose:

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

ابدأ الخدمة:

```bash
docker compose up -d
```

## الأجزاء (Volumes)

| نقطة التثبيت | الغرض | يلزم نسخه احتياطياً |
|-------------|-------|---------------------|
| `/data` | قاعدة بيانات SQLite | نعم |
| `/app/uploads` | الملفات الثنائية المرفوعة | نعم (ما لم تستخدم S3) |
| `/app/config.json` | ملف الإعداد (اختياري) | نعم |

::: warning ديمومة البيانات
بدون تثبيت الأجزاء، تُفقد جميع البيانات عند إعادة إنشاء الحاوية. ارفع دائماً `/data` و`/app/uploads` للاستخدام الإنتاجي.
:::

## استخدام ملف إعداد

ارفع ملف إعداد للتحكم الكامل:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## فحص الصحة

يعرض Fenfa نقطة نهاية صحة على `/healthz`:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

يشمل مثال Docker Compose أعلاه إعداد فحص الصحة. لمنظّمي الحاويات مثل Kubernetes أو Nomad، استخدم هذه النقطة لفحوصات الحياة والجاهزية.

## متعدد المعماريات

تدعم صورة Docker لـ Fenfa كلاً من `linux/amd64` و`linux/arm64`. يسحب Docker تلقائياً المعمارية الصحيحة لمضيفك.

لبناء صور متعددة المعماريات بنفسك:

```bash
./scripts/docker-build.sh
```

يستخدم هذا Docker Buildx لإنشاء صور لكلا المعماريتين.

## متطلبات الموارد

Fenfa خفيف الوزن:

| المورد | الحد الأدنى | الموصى به |
|--------|------------|----------|
| CPU | 1 نواة | 2 نواة |
| RAM | 64 ميغابايت | 256 ميغابايت |
| قرص | 100 ميغابايت (التطبيق) | يعتمد على الملفات المرفوعة |

قاعدة بيانات SQLite والثنائي Go لهما عبء ضئيل. يتوسّع استخدام الموارد أساساً مع تخزين الرفعات والاتصالات المتزامنة.

## السجلات

عرض سجلات الحاوية:

```bash
docker logs -f fenfa
```

يُسجّل Fenfa على stdout بتنسيق منظم، متوافق مع أدوات تجميع السجلات.

## التحديث

```bash
docker compose pull
docker compose up -d
```

::: tip تحديثات بدون توقف
يبدأ Fenfa بسرعة (أقل من ثانية). للتحديثات شبه الخالية من التوقف، استخدم فحص صحة الوكيل العكسي الذي يوجّه حركة المرور تلقائياً إلى الحاوية الجديدة بمجرد اجتياز فحص الصحة.
:::

## الخطوات التالية

- [النشر الإنتاجي](./production) -- الوكيل العكسي وTLS والأمان
- [مرجع الإعداد](../configuration/) -- جميع خيارات الإعداد
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات Docker الشائعة
