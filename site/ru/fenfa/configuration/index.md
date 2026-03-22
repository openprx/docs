---
title: Конфигурация
description: "Конфигурация Fenfa через переменные окружения и config.json: токены, домен, S3-хранилище, порт, директории и настройки Apple Developer API."
---

# Конфигурация

Fenfa конфигурируется через переменные окружения или файл `config.json`. Переменные окружения имеют приоритет над файлом конфигурации.

## Переменные окружения

### Основные настройки

| Переменная | По умолчанию | Описание |
|-----------|-------------|----------|
| `FENFA_PORT` | `8000` | Порт HTTP-сервера |
| `FENFA_DATA_DIR` | `/data` | Директория для SQLite-базы данных |
| `FENFA_PRIMARY_DOMAIN` | `http://localhost:8000` | Публичный URL (используется в iOS-манифестах) |
| `FENFA_UPLOAD_DIR` | `/app/uploads` | Директория для хранения файлов (без S3) |

### Аутентификация

| Переменная | Описание |
|-----------|----------|
| `FENFA_ADMIN_TOKEN` | Токен для административных операций |
| `FENFA_UPLOAD_TOKEN` | Токен для загрузки артефактов CI/CD |

::: warning Безопасность токенов
Используйте криптографически случайные токены длиной не менее 32 символов. Храните их в секретах CI/CD, а не в коде.

```bash
# Генерация безопасного токена
openssl rand -hex 32
```
:::

### S3-совместимое хранилище

| Переменная | Описание |
|-----------|----------|
| `FENFA_S3_ENDPOINT` | URL эндпоинта S3 (например, `https://s3.amazonaws.com`) |
| `FENFA_S3_BUCKET` | Имя S3-бакета |
| `FENFA_S3_REGION` | Регион S3 (например, `us-east-1`) |
| `FENFA_S3_ACCESS_KEY` | AWS Access Key ID |
| `FENFA_S3_SECRET_KEY` | AWS Secret Access Key |

При установке `FENFA_S3_ENDPOINT` загруженные файлы хранятся в S3, а не локально.

## Файл config.json

Альтернативно, создайте файл `config.json`:

```json
{
  "port": 8000,
  "data_dir": "/data",
  "upload_dir": "/app/uploads",
  "primary_domain": "https://dist.example.com",
  "admin_token": "your-admin-token",
  "upload_token": "your-upload-token",
  "s3": {
    "endpoint": "https://s3.amazonaws.com",
    "bucket": "my-app-dist",
    "region": "us-east-1",
    "access_key": "AKIAIOSFODNN7EXAMPLE",
    "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  }
}
```

Укажите путь к файлу при запуске:

```bash
./fenfa --config /path/to/config.json
```

## Важность FENFA_PRIMARY_DOMAIN

`FENFA_PRIMARY_DOMAIN` используется для генерации ссылок в iOS-манифестах plist. Если он установлен неверно, iOS OTA-установка не будет работать.

- Должен начинаться с `https://` (iOS требует HTTPS)
- Должен быть полным публичным URL (без завершающего слэша)
- Примеры: `https://dist.example.com`, `https://apps.company.internal`

## Настройки S3 и CDN

Использование S3-совместимого хранилища (Cloudflare R2, MinIO, AWS S3):

```bash
# AWS S3
FENFA_S3_ENDPOINT=https://s3.amazonaws.com
FENFA_S3_BUCKET=my-dist-bucket
FENFA_S3_REGION=us-east-1
FENFA_S3_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
FENFA_S3_SECRET_KEY=...

# Cloudflare R2
FENFA_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
FENFA_S3_BUCKET=fenfa-dist
FENFA_S3_REGION=auto
FENFA_S3_ACCESS_KEY=<r2-access-key>
FENFA_S3_SECRET_KEY=<r2-secret-key>
```

## Следующие шаги

- [Деплой через Docker](../deployment/docker) — настройка контейнера
- [Продакшн деплой](../deployment/production) — обратный прокси, HTTPS, резервные копии
- [Admin API](../api/admin) — настройка Apple Developer API через API
