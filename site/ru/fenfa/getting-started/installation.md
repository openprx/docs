---
title: Установка
description: Запуск Fenfa через Docker, Docker Compose или сборку из исходников. Включает настройку хранилища и конфигурацию переменных окружения.
---

# Установка

Fenfa распространяется в виде единого Docker-образа и как самостоятельный бинарник. Рекомендуемый способ — Docker.

## Docker (рекомендуется)

### Быстрый запуск

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  fenfa/fenfa:latest
```

Откройте `http://localhost:8000/admin` для доступа к панели управления.

### Docker Compose

Создайте файл `docker-compose.yml`:

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    ports:
      - "8000:8000"
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    restart: unless-stopped
```

Запустите:

```bash
docker compose up -d
```

## Сборка из исходников

### Предварительные требования

| Инструмент | Версия | Описание |
|------------|--------|----------|
| Go | 1.22+ | Компилятор Go |
| Node.js | 18+ | Сборка фронтенда |
| pnpm | 8+ | Менеджер пакетов Node |

### Шаги сборки

```bash
# Клонировать репозиторий
git clone https://github.com/openprx/fenfa.git
cd fenfa

# Собрать фронтенд
cd frontend
pnpm install
pnpm build
cd ..

# Собрать бинарник (со встроенным фронтендом)
go build -o fenfa ./cmd/fenfa

# Запустить
FENFA_ADMIN_TOKEN=secret FENFA_UPLOAD_TOKEN=upload-secret ./fenfa
```

## Тома и хранилище

| Путь в контейнере | Описание | Требуется ли |
|-------------------|----------|:------------:|
| `/data` | SQLite база данных | Да |
| `/app/uploads` | Загруженные файлы (без S3) | Без S3 |

::: warning Постоянство данных
Обязательно монтируйте том `/data`. Без него база данных будет удалена при перезапуске контейнера.
:::

## Первоначальная настройка

После запуска установите необходимые переменные окружения:

```bash
# Обязательные
FENFA_ADMIN_TOKEN=<случайная-строка>       # Для операций администратора
FENFA_UPLOAD_TOKEN=<случайная-строка>      # Для загрузки артефактов CI/CD
FENFA_PRIMARY_DOMAIN=https://dist.example.com  # Публичный URL (для iOS OTA)

# Опциональные
FENFA_PORT=8000                            # По умолчанию: 8000
FENFA_DATA_DIR=/data                       # По умолчанию: /data
```

Полный список параметров конфигурации см. в разделе [Конфигурация](../configuration/).

## Следующие шаги

- [Быстрый старт](./quickstart) — загрузка первого приложения
- [Конфигурация](../configuration/) — все переменные окружения
- [Деплой](../deployment/docker) — продакшн с обратным прокси
