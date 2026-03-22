---
title: Docker-развёртывание
description: "Развертывайте OpenPR с Docker Compose или Podman. Включает конфигурацию сервисов, сеть, тома и проверки работоспособности."
---

# Docker-развёртывание

OpenPR предоставляет `docker-compose.yml`, который запускает все необходимые сервисы одной командой.

## Быстрый старт

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Отредактируйте .env с продакшен-значениями
docker-compose up -d
```

## Архитектура сервисов

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

    USER["Пользователи<br/>Браузер"] -->|":3000"| FE
    AIBOT["AI-ассистенты"] -->|":8090"| MCP
```

## Сервисы

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

Миграции в директории `migrations/` автоматически выполняются при первом запуске через механизм PostgreSQL `docker-entrypoint-initdb.d`.

### API-сервер

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

### Воркер

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

У воркера нет открытых портов — он подключается к PostgreSQL напрямую для обработки фоновых задач.

### MCP-сервер

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

### Фронтенд

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

## Тома

| Том | Назначение |
|-----|-----------|
| `pgdata` | Постоянное хранение данных PostgreSQL |
| `./uploads` | Хранение загруженных файлов |
| `./migrations` | Скрипты миграции базы данных |

## Проверки работоспособности

Все сервисы включают проверки работоспособности:

| Сервис | Проверка | Интервал |
|--------|---------|---------|
| PostgreSQL | `pg_isready` | 5с |
| API | `curl /health` | 10с |
| MCP Server | `curl /health` | 10с |
| Frontend | `wget /health` | 30с |

## Общие операции

```bash
# Просмотр логов
docker-compose logs -f api
docker-compose logs -f mcp-server

# Перезапуск сервиса
docker-compose restart api

# Пересборка и перезапуск
docker-compose up -d --build api

# Остановка всех сервисов
docker-compose down

# Остановка и удаление томов (ВНИМАНИЕ: удаляет базу данных)
docker-compose down -v

# Подключение к базе данных
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Для пользователей Podman ключевые отличия:

1. Сборка с `--network=host` для доступа к DNS:
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. Nginx фронтенда использует `10.89.0.1` как DNS-резолвер (по умолчанию Podman) вместо `127.0.0.11` (по умолчанию Docker).

3. Используйте `sudo podman-compose` вместо `docker-compose`.

## Следующие шаги

- [Продакшен-развёртывание](./production) — обратный прокси Caddy, HTTPS и безопасность
- [Конфигурация](../configuration/) — справочник переменных окружения
- [Устранение неполадок](../troubleshooting/) — распространённые проблемы Docker
