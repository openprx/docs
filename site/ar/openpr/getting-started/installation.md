---
title: التثبيت
description: "تثبيت OpenPR باستخدام Docker Compose أو Podman أو البناء من المصدر بـ Rust وNode.js."
---

# التثبيت

يدعم OpenPR ثلاث طرق للتثبيت. Docker Compose هو أسرع طريقة للحصول على نسخة عاملة بالكامل.

::: tip موصى به
**Docker Compose** يشغّل جميع الخدمات (API، الواجهة الأمامية، العامل، خادم MCP، PostgreSQL) بأمر واحد. لا حاجة لسلسلة أدوات Rust أو Node.js.
:::

## المتطلبات الأولية

| المتطلب | الحد الأدنى | ملاحظات |
|---------|------------|---------|
| Docker | 20.10+ | أو Podman 3.0+ مع podman-compose |
| Docker Compose | 2.0+ | مضمّن مع Docker Desktop |
| Rust (بناء من المصدر) | 1.75.0 | غير مطلوب لتثبيت Docker |
| Node.js (بناء من المصدر) | 20+ | لبناء واجهة SvelteKit الأمامية |
| PostgreSQL (بناء من المصدر) | 15+ | طريقة Docker تتضمن PostgreSQL |
| مساحة القرص | 500 MB | الصور + قاعدة البيانات |
| ذاكرة الوصول العشوائي | 1 GB | 2 GB+ موصى به للإنتاج |

## الطريقة الأولى: Docker Compose (موصى به)

استنسخ المستودع وابدأ جميع الخدمات:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

يبدأ هذا خمس خدمات:

| الخدمة | الحاوية | المنفذ | الوصف |
|--------|--------|-------|-------|
| PostgreSQL | `openpr-postgres` | 5432 | قاعدة البيانات مع الترحيل التلقائي |
| API | `openpr-api` | 8081 (خريطة إلى 8080) | خادم REST API |
| Worker | `openpr-worker` | -- | معالج مهام الخلفية |
| خادم MCP | `openpr-mcp-server` | 8090 | خادم أدوات MCP |
| الواجهة الأمامية | `openpr-frontend` | 3000 | واجهة SvelteKit |

تحقق من تشغيل جميع الخدمات:

```bash
docker-compose ps
```

::: warning أول مستخدم
أول مستخدم يسجل يصبح **مسؤولاً** تلقائياً. تأكد من تسجيل حساب المسؤول قبل مشاركة URL مع الآخرين.
:::

### متغيرات البيئة

حرِّر `.env` لتخصيص نشرك:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (change in production!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger أمان
غيِّر دائماً `JWT_SECRET` وكلمات مرور قاعدة البيانات قبل النشر للإنتاج. استخدم قيماً قوية وعشوائية.
:::

## الطريقة الثانية: Podman

يعمل OpenPR مع Podman كبديل لـ Docker. الفرق الرئيسي هو أن Podman يتطلب `--network=host` للبناء بسبب تحليل DNS:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Build images with network access
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Start services
sudo podman-compose up -d
```

::: tip DNS في Podman
تستخدم حاوية Nginx للواجهة الأمامية `10.89.0.1` كمحلل DNS (شبكة Podman الافتراضية)، وليس `127.0.0.11` (افتراضي Docker). هذا مُهيَّأ بالفعل في إعداد Nginx المضمّن.
:::

## الطريقة الثالثة: البناء من المصدر

### الخلفية

```bash
# Prerequisites: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configure
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Build all binaries
cargo build --release -p api -p worker -p mcp-server
```

توجد الملفات الثنائية في:
- `target/release/api` -- خادم REST API
- `target/release/worker` -- عامل الخلفية
- `target/release/mcp-server` -- خادم أدوات MCP

### الواجهة الأمامية

```bash
cd frontend
npm install    # or: bun install
npm run build  # or: bun run build
```

مخرجات البناء في `frontend/build/`. قدِّمها بـ Nginx أو أي خادم ملفات ثابت.

### إعداد قاعدة البيانات

أنشئ قاعدة البيانات وشغِّل الترحيلات:

```bash
# Create database
createdb -U postgres openpr

# Migrations run automatically on first API start
# Or apply manually:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... apply remaining migrations in order
```

### بدء الخدمات

```bash
# Terminal 1: API server
./target/release/api

# Terminal 2: Worker
./target/release/worker

# Terminal 3: MCP server
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## التحقق من التثبيت

بمجرد تشغيل جميع الخدمات، تحقق من كل نقطة نهاية:

```bash
# API health check
curl http://localhost:8080/health

# MCP server health
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

افتح http://localhost:3000 في متصفحك للوصول إلى واجهة الويب.

## إلغاء التثبيت

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v removes volumes (database data)
docker rmi $(docker images 'openpr*' -q)
```

### البناء من المصدر

```bash
# Stop running services (Ctrl+C in each terminal)
# Remove binaries
rm -f target/release/api target/release/worker target/release/mcp-server

# Drop database (optional)
dropdb -U postgres openpr
```

## الخطوات التالية

- [البدء السريع](./quickstart) -- أنشئ أول مساحة عمل ومشروع في 5 دقائق
- [نشر Docker](../deployment/docker) -- إعداد Docker للإنتاج
- [نشر الإنتاج](../deployment/production) -- Caddy وPostgreSQL وتصليب الأمان
