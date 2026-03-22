---
title: Продакшн деплой
description: "Продакшн деплой Fenfa: настройка Caddy и Nginx как обратного прокси, чеклист безопасности, стратегия резервного копирования и полный пример docker-compose."
---

# Продакшн деплой

Это руководство описывает продакшн-деплой Fenfa с правильно настроенным HTTPS, обратным прокси и резервным копированием.

## Обратный прокси

### Caddy (рекомендуется)

Caddy автоматически получает и обновляет TLS-сертификаты от Let's Encrypt:

```
# /etc/caddy/Caddyfile
dist.example.com {
    reverse_proxy localhost:8000
}
```

Перезапустите Caddy:

```bash
sudo systemctl reload caddy
```

### Nginx

```nginx
server {
    listen 80;
    server_name dist.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dist.example.com;

    ssl_certificate /etc/letsencrypt/live/dist.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dist.example.com/privkey.pem;

    # Разрешить большие загрузки файлов
    client_max_body_size 2G;

    # Отключить буферизацию для лучшей работы со стримингом
    proxy_request_buffering off;
    proxy_buffering off;

    # Увеличить таймауты для больших файлов
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Для Nginx получите сертификаты через Certbot:

```bash
sudo certbot --nginx -d dist.example.com
```

## Чеклист безопасности

- [ ] `FENFA_PRIMARY_DOMAIN` установлен в корректный публичный HTTPS URL
- [ ] `FENFA_ADMIN_TOKEN` — криптографически случайная строка (минимум 32 символа)
- [ ] `FENFA_UPLOAD_TOKEN` — отдельный токен, не совпадающий с admin token
- [ ] Порт 8000 привязан только к `127.0.0.1` (не `0.0.0.0`)
- [ ] TLS-сертификат действителен и автоматически обновляется
- [ ] Тома для данных и uploads монтированы (не хранятся внутри контейнера)
- [ ] Настроено резервное копирование базы данных (см. ниже)

## Стратегия резервного копирования

### Скрипт резервного копирования базы данных

```bash
#!/bin/bash
# /opt/scripts/backup-fenfa.sh

BACKUP_DIR=/backups/fenfa
DB_PATH=/opt/fenfa/data/fenfa.db
DATE=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=30

mkdir -p "${BACKUP_DIR}"

# SQLite онлайн-резервная копия
sqlite3 "${DB_PATH}" ".backup '${BACKUP_DIR}/fenfa-${DATE}.db'"

# Удалить старые резервные копии
find "${BACKUP_DIR}" -name "fenfa-*.db" -mtime +${KEEP_DAYS} -delete

echo "Backup completed: ${BACKUP_DIR}/fenfa-${DATE}.db"
```

Добавьте в cron:

```bash
# Ежедневное резервное копирование в 02:00
0 2 * * * /opt/scripts/backup-fenfa.sh >> /var/log/fenfa-backup.log 2>&1
```

### Резервное копирование файлов

Если используется локальное хранилище (не S3), регулярно создавайте резервные копии директории uploads:

```bash
rsync -av /opt/fenfa/uploads/ /backups/fenfa/uploads/
```

При использовании S3 — резервирование файлов обеспечивается S3.

## Полный docker-compose для продакшн

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    ports:
      - "127.0.0.1:8000:8000"
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN}
      # Опционально: S3
      # FENFA_S3_ENDPOINT: ${FENFA_S3_ENDPOINT}
      # FENFA_S3_BUCKET: ${FENFA_S3_BUCKET}
      # FENFA_S3_REGION: ${FENFA_S3_REGION}
      # FENFA_S3_ACCESS_KEY: ${FENFA_S3_ACCESS_KEY}
      # FENFA_S3_SECRET_KEY: ${FENFA_S3_SECRET_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Следующие шаги

- [Устранение неполадок](../troubleshooting/) — частые проблемы продакшн-деплоя
- [Конфигурация](../configuration/) — полный список переменных окружения
