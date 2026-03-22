---
title: التثبيت
description: "تشغيل Fenfa بـ Docker أو البناء من المصدر. خيارات الإعداد ومتغيرات البيئة والتحقق من التثبيت."
---

# التثبيت

## Docker (موصى به)

أسرع طريقة لتشغيل Fenfa:

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -e FENFA_ADMIN_TOKEN=your-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://your-domain.com \
  fenfa/fenfa:latest
```

## متغيرات البيئة

| المتغير | مطلوب | الوصف |
|---------|-------|-------|
| `FENFA_ADMIN_TOKEN` | نعم | رمز مصادقة الإدارة |
| `FENFA_UPLOAD_TOKEN` | نعم | رمز مصادقة رفع الملفات |
| `FENFA_PRIMARY_DOMAIN` | نعم لـ iOS | URL العام للمنشورات وروابط التنزيل |
| `FENFA_PORT` | لا | منفذ HTTP (الافتراضي: `8000`) |
| `FENFA_DATA_DIR` | لا | دليل SQLite (الافتراضي: `data`) |

::: warning أمان الرموز
غيّر دائماً الرموز الافتراضية (`dev-admin-token` و`dev-upload-token`) قبل النشر الإنتاجي. استخدم `openssl rand -hex 16` لإنشاء رموز آمنة.
:::

## Docker Compose

أنشئ ملف `docker-compose.yml`:

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

## البناء من المصدر

### المتطلبات الأساسية

- Go 1.21+
- Node.js 18+ و npm
- make (اختياري)

### خطوات البناء

```bash
# البناء بالكامل (الواجهة الأمامية + الثنائي)
make build

# أو يدوياً:

# بناء الواجهة العامة
cd web/front && npm ci && npm run build && cd ../..

# بناء لوحة الإدارة
cd web/admin && npm ci && npm run build && cd ../..

# بناء الثنائي Go (يضم الواجهة الأمامية)
go build -o fenfa ./cmd/fenfa
```

### تشغيل الثنائي

```bash
FENFA_ADMIN_TOKEN=admin-token \
FENFA_UPLOAD_TOKEN=upload-token \
FENFA_PRIMARY_DOMAIN=http://localhost:8000 \
./fenfa
```

## التحقق من التثبيت

تحقق من أن Fenfa يعمل:

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

افتح `http://localhost:8000` للوصول إلى لوحة الإدارة.

## الخطوات التالية

- [البدء السريع](./quickstart) -- إنشاء أول منتج وتحميل بناء
- [مرجع الإعداد](../configuration/) -- جميع خيارات الإعداد
- [النشر الإنتاجي](../deployment/production) -- إعداد HTTPS والأمان
