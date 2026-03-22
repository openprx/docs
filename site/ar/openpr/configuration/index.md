---
title: مرجع الإعداد
description: "مرجع كامل لجميع متغيرات البيئة وخيارات إعداد OpenPR لخادم API والعامل وخادم MCP والواجهة الأمامية وقاعدة البيانات."
---

# مرجع الإعداد

يُهيَّأ OpenPR من خلال متغيرات البيئة. تقرأ جميع الخدمات من نفس ملف `.env` عند استخدام Docker Compose، أو متغيرات البيئة الفردية عند التشغيل المباشر.

## خادم API

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `APP_NAME` | `api` | معرف التطبيق للسجل |
| `BIND_ADDR` | `0.0.0.0:8080` | العنوان والمنفذ الذي يستمع إليه API |
| `DATABASE_URL` | -- | سلسلة اتصال PostgreSQL |
| `JWT_SECRET` | `change-me-in-production` | المفتاح السري لتوقيع رموز JWT |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 يوم) | مدة حياة رمز الوصول بالثواني |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 أيام) | مدة حياة رمز التحديث بالثواني |
| `RUST_LOG` | `info` | مستوى السجل (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | دليل رفع الملفات |

::: danger أمان
غيِّر دائماً `JWT_SECRET` إلى قيمة قوية وعشوائية في الإنتاج. استخدم على الأقل 32 حرفاً من البيانات العشوائية:
```bash
openssl rand -hex 32
```
:::

## قاعدة البيانات

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `DATABASE_URL` | -- | سلسلة اتصال PostgreSQL الكاملة |
| `POSTGRES_DB` | `openpr` | اسم قاعدة البيانات |
| `POSTGRES_USER` | `openpr` | مستخدم قاعدة البيانات |
| `POSTGRES_PASSWORD` | `openpr` | كلمة مرور قاعدة البيانات |

تنسيق سلسلة الاتصال:

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
عند استخدام Docker Compose، تُسمى خدمة قاعدة البيانات `postgres`، لذا سلسلة الاتصال هي:
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## العامل

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `APP_NAME` | `worker` | معرف التطبيق |
| `DATABASE_URL` | -- | سلسلة اتصال PostgreSQL |
| `JWT_SECRET` | -- | يجب أن يطابق قيمة خادم API |
| `RUST_LOG` | `info` | مستوى السجل |

يعالج العامل مهام الخلفية من جدولي `job_queue` و`scheduled_jobs`.

## خادم MCP

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `APP_NAME` | `mcp-server` | معرف التطبيق |
| `OPENPR_API_URL` | -- | رابط خادم API (بما فيه الوكيل إن وجد) |
| `OPENPR_BOT_TOKEN` | -- | رمز البوت بادئة `opr_` |
| `OPENPR_WORKSPACE_ID` | -- | UUID مساحة العمل الافتراضية |
| `DATABASE_URL` | -- | سلسلة اتصال PostgreSQL |
| `JWT_SECRET` | -- | يجب أن يطابق قيمة خادم API |
| `DEFAULT_AUTHOR_ID` | -- | UUID المؤلف الاحتياطي لعمليات MCP |
| `RUST_LOG` | `info` | مستوى السجل |

### خيارات نقل MCP

يقبل ثنائي خادم MCP وسيطات سطر الأوامر:

```bash
# HTTP mode (default)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# stdio mode (for Claude Desktop, Codex)
mcp-server --transport stdio

# Subcommand form
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## الواجهة الأمامية

| المتغير | الافتراضي | الوصف |
|---------|----------|-------|
| `VITE_API_URL` | `http://localhost:8080` | رابط خادم API لاتصال الواجهة الأمامية |

::: tip الوكيل العكسي
في الإنتاج مع وكيل عكسي (Caddy/Nginx)، يجب أن يشير `VITE_API_URL` إلى رابط الوكيل الذي يوجه إلى خادم API.
:::

## منافذ Docker Compose

| الخدمة | المنفذ الداخلي | المنفذ الخارجي | الغرض |
|--------|--------------|--------------|-------|
| PostgreSQL | 5432 | 5432 | قاعدة البيانات |
| API | 8080 | 8081 | REST API |
| Worker | -- | -- | مهام الخلفية (بلا منفذ) |
| خادم MCP | 8090 | 8090 | أدوات MCP |
| الواجهة الأمامية | 80 | 3000 | واجهة الويب |

## مثال ملف .env

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGE IN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# API Server
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

## مستويات السجل

يستخدم OpenPR حزمة `tracing` للتسجيل المهيكل. اضبط `RUST_LOG` للتحكم في التفصيل:

| المستوى | الوصف |
|---------|-------|
| `error` | الأخطاء فقط |
| `warn` | الأخطاء والتحذيرات |
| `info` | رسائل التشغيل العادية (الافتراضي) |
| `debug` | معلومات تصحيح مفصلة |
| `trace` | تفصيلي جداً، يشمل جميع العمليات الداخلية |

التصفية لكل وحدة مدعومة:

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## الخطوات التالية

- [نشر Docker](../deployment/docker) -- إعداد Docker Compose
- [نشر الإنتاج](../deployment/production) -- Caddy والأمان والتوسع
- [التثبيت](../getting-started/installation) -- البدء
