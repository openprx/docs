---
title: Деплой через Docker
description: "Docker деплой Fenfa: Docker Compose с healthcheck, тома, multi-arch образы (amd64/arm64), мониторинг и управление контейнером."
---

# Деплой через Docker

Fenfa предоставляет официальный Docker-образ для простого деплоя.

## Docker Compose (рекомендуется)

Создайте файл `docker-compose.yml`:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    ports:
      - "127.0.0.1:8000:8000"   # Привязка только к localhost (обратный прокси снаружи)
    volumes:
      - ./data:/data             # Постоянное хранение базы данных
      - ./uploads:/app/uploads   # Постоянное хранение файлов (без S3)
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

Создайте файл `.env`:

```bash
FENFA_ADMIN_TOKEN=your-random-admin-token-here
FENFA_UPLOAD_TOKEN=your-random-upload-token-here
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

Запустите:

```bash
docker compose up -d
```

## Тома

| Том | Описание | Постоянный |
|-----|----------|:----------:|
| `/data` | SQLite база данных | Да (обязательно) |
| `/app/uploads` | Загруженные файлы | Да (без S3) |

::: warning Потеря данных
Не запускайте Fenfa без монтированных томов в продакшн-окружении. При удалении контейнера без томов все данные и файлы будут потеряны.
:::

## Multi-arch образы

Fenfa предоставляет образы для нескольких архитектур:

- `linux/amd64` — x86-64 серверы
- `linux/arm64` — ARM-серверы (AWS Graviton, Apple M-chips и т.д.)

Docker автоматически выбирает нужную архитектуру при использовании `latest`-тега.

## Управление контейнером

```bash
# Просмотр логов
docker compose logs -f fenfa

# Статус и здоровье
docker compose ps

# Перезапуск
docker compose restart fenfa

# Обновление до новой версии
docker compose pull
docker compose up -d

# Остановка
docker compose down
```

## Мониторинг здоровья

Fenfa предоставляет эндпоинт `/health`:

```bash
curl http://localhost:8000/health
# {"ok": true}
```

Используйте его в healthcheck-конфигурации Docker или внешних системах мониторинга.

## Следующие шаги

- [Продакшн деплой](./production) — обратный прокси, HTTPS, резервные копии
- [Конфигурация](../configuration/) — все переменные окружения
