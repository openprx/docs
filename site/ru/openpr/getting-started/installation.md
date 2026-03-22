---
title: Установка
description: "Установка OpenPR с помощью Docker Compose, Podman или сборки из исходного кода с Rust и Node.js."
---

# Установка

OpenPR поддерживает три метода установки. Docker Compose — самый быстрый способ получить полностью рабочий экземпляр.

::: tip Рекомендуется
**Docker Compose** запускает все сервисы (API, фронтенд, воркер, MCP-сервер, PostgreSQL) одной командой. Не требует Rust-тулчейна или Node.js.
:::

## Предварительные требования

| Требование | Минимум | Примечания |
|-----------|---------|------------|
| Docker | 20.10+ | Или Podman 3.0+ с podman-compose |
| Docker Compose | 2.0+ | Включён в Docker Desktop |
| Rust (сборка из исходников) | 1.75.0 | Не нужен для установки через Docker |
| Node.js (сборка из исходников) | 20+ | Для сборки фронтенда SvelteKit |
| PostgreSQL (сборка из исходников) | 15+ | Docker-метод включает PostgreSQL |
| Дисковое пространство | 500 МБ | Образы + база данных |
| ОЗУ | 1 ГБ | 2 ГБ+ рекомендуется для продакшена |

## Метод 1: Docker Compose (рекомендуется)

Клонируйте репозиторий и запустите все сервисы:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

Запускается пять сервисов:

| Сервис | Контейнер | Порт | Описание |
|--------|-----------|------|----------|
| PostgreSQL | `openpr-postgres` | 5432 | База данных с авто-миграцией |
| API | `openpr-api` | 8081 (маппинг на 8080) | REST API-сервер |
| Worker | `openpr-worker` | — | Обработчик фоновых задач |
| MCP Server | `openpr-mcp-server` | 8090 | MCP-сервер инструментов |
| Frontend | `openpr-frontend` | 3000 | Веб-интерфейс SvelteKit |

Проверьте, что все сервисы запущены:

```bash
docker-compose ps
```

::: warning Первый пользователь
Первый зарегистрировавшийся пользователь автоматически получает роль **admin**. Убедитесь, что вы зарегистрируете аккаунт администратора до того, как поделитесь URL с другими.
:::

### Переменные окружения

Отредактируйте `.env` для настройки развёртывания:

```bash
# Database
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (измените в продакшене!)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# MCP Server
MCP_SERVER_PORT=8090
```

::: danger Безопасность
Всегда меняйте `JWT_SECRET` и пароли базы данных перед развёртыванием в продакшене. Используйте сильные случайные значения.
:::

## Метод 2: Podman

OpenPR работает с Podman как альтернативой Docker. Ключевое отличие в том, что Podman требует `--network=host` для сборки из-за DNS-резолюции:

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Собрать образы с доступом к сети
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Запустить сервисы
sudo podman-compose up -d
```

::: tip DNS Podman
Контейнер Nginx фронтенда использует `10.89.0.1` как DNS-резолвер (DNS сети Podman по умолчанию), а не `127.0.0.11` (Docker по умолчанию). Это уже настроено во включённой конфигурации Nginx.
:::

## Метод 3: Сборка из исходного кода

### Бэкенд

```bash
# Предварительные требования: Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Настроить
cp .env.example .env
# Отредактировать .env с вашей строкой подключения PostgreSQL

# Собрать все бинарные файлы
cargo build --release -p api -p worker -p mcp-server
```

Бинарные файлы находятся по адресам:
- `target/release/api` — REST API-сервер
- `target/release/worker` — Фоновый воркер
- `target/release/mcp-server` — MCP-сервер инструментов

### Фронтенд

```bash
cd frontend
npm install    # или: bun install
npm run build  # или: bun run build
```

Результат сборки находится в `frontend/build/`. Обслуживайте его через Nginx или любой сервер статических файлов.

### Настройка базы данных

Создайте базу данных и запустите миграции:

```bash
# Создать базу данных
createdb -U postgres openpr

# Миграции запускаются автоматически при первом запуске API
# Или применить вручную:
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... применить оставшиеся миграции по порядку
```

### Запуск сервисов

```bash
# Терминал 1: API-сервер
./target/release/api

# Терминал 2: Воркер
./target/release/worker

# Терминал 3: MCP-сервер
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## Проверка установки

После запуска всех сервисов проверьте каждый эндпоинт:

```bash
# Проверка работоспособности API
curl http://localhost:8080/health

# Проверка работоспособности MCP-сервера
curl http://localhost:8090/health

# Фронтенд
curl -s http://localhost:3000 | head -5
```

Откройте http://localhost:3000 в браузере для доступа к веб-интерфейсу.

## Удаление

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v удаляет тома (данные базы данных)
docker rmi $(docker images 'openpr*' -q)
```

### Сборка из исходников

```bash
# Остановить запущенные сервисы (Ctrl+C в каждом терминале)
# Удалить бинарные файлы
rm -f target/release/api target/release/worker target/release/mcp-server

# Удалить базу данных (опционально)
dropdb -U postgres openpr
```

## Следующие шаги

- [Быстрый старт](./quickstart) — создание первого рабочего пространства и проекта за 5 минут
- [Docker-развёртывание](../deployment/docker) — конфигурация Docker для продакшена
- [Продакшен-развёртывание](../deployment/production) — Caddy, PostgreSQL и укрепление безопасности
