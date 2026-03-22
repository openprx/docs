---
title: نشر Docker
description: "نشر OpenPR بـ Docker Compose أو Podman. يتضمن إعداد الخدمات والشبكات والمجلدات وفحوصات الصحة."
---

# نشر Docker

يوفر OpenPR ملف `docker-compose.yml` يشغّل جميع الخدمات المطلوبة بأمر واحد.

## البدء السريع

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Edit .env with production values
docker-compose up -d
```

## بنية الخدمات

```mermaid
graph LR
    subgraph Docker["Docker Network (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["API Server<br/>:8080"]
        WORKER["Worker"]
        MCP["MCP Server<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Users<br/>Browser"] -->|":3000"| FE
    AIBOT["AI Assistants"] -->|":8090"| MCP
```

## الخدمات

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

تُنفَّذ الترحيلات في دليل `migrations/` تلقائياً عند أول تشغيل عبر آلية PostgreSQL `docker-entrypoint-initdb.d`.

### خادم API

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### العامل

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

لا يملك العامل منافذ مكشوفة -- يتصل بـ PostgreSQL مباشرةً لمعالجة مهام الخلفية.

### خادم MCP

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### الواجهة الأمامية

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## المجلدات

| المجلد | الغرض |
|--------|-------|
| `pgdata` | استمرارية بيانات PostgreSQL |
| `./uploads` | تخزين رفع الملفات |
| `./migrations` | نصوص ترحيل قاعدة البيانات |

## فحوصات الصحة

جميع الخدمات تتضمن فحوصات صحة:

| الخدمة | الفحص | الفاصل الزمني |
|--------|-------|-------------|
| PostgreSQL | `pg_isready` | 5 ثوانٍ |
| API | `curl /health` | 10 ثوانٍ |
| خادم MCP | `curl /health` | 10 ثوانٍ |
| الواجهة الأمامية | `wget /health` | 30 ثانية |

## العمليات الشائعة

```bash
# View logs
docker-compose logs -f api
docker-compose logs -f mcp-server

# Restart a service
docker-compose restart api

# Rebuild and restart
docker-compose up -d --build api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Connect to database
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

لمستخدمي Podman، الاختلافات الرئيسية هي:

1. البناء بـ `--network=host` للوصول إلى DNS:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. يستخدم Nginx للواجهة الأمامية `10.89.0.1` كمحلل DNS (افتراضي Podman) بدلاً من `127.0.0.11` (افتراضي Docker).

3. استخدم `sudo podman-compose` بدلاً من `docker-compose`.

## الخطوات التالية

- [نشر الإنتاج](./production) -- وكيل عكسي Caddy وHTTPS والأمان
- [الإعداد](../configuration/) -- مرجع متغيرات البيئة
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات Docker الشائعة
