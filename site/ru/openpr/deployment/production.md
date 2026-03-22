---
title: Продакшен-развёртывание
description: "Развертывайте OpenPR в продакшене с обратным прокси Caddy, автоматическим HTTPS, защитой PostgreSQL и лучшими практиками безопасности."
---

# Продакшен-развёртывание

Это руководство охватывает развёртывание OpenPR в продакшен-среде с HTTPS, обратным прокси, защитой базы данных и лучшими практиками безопасности.

## Архитектура

```mermaid
graph LR
    INTERNET["Интернет<br/>:443"] --> CADDY["Caddy<br/>Авто HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## Предварительные требования

- Сервер минимум с 2 CPU-ядрами и 2 ГБ ОЗУ
- Доменное имя, указывающее на IP-адрес вашего сервера
- Docker и Docker Compose (или Podman)

## Шаг 1: Конфигурация окружения

Создайте продакшен файл `.env`:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger Секреты
Никогда не коммитьте файлы `.env` в систему контроля версий. Используйте `chmod 600 .env` для ограничения прав доступа к файлу.
:::

## Шаг 2: Настройка Caddy

Установите Caddy на хост-систему:

```bash
sudo apt install -y caddy
```

Настройте Caddyfile:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy автоматически получает и обновляет TLS-сертификаты Let's Encrypt.

Запустите Caddy:

```bash
sudo systemctl enable --now caddy
```

::: tip Альтернатива: Nginx
Если вы предпочитаете Nginx, настройте его с проксированием на порт 3000 и используйте certbot для TLS-сертификатов.
:::

## Шаг 3: Развёртывание с Docker Compose

```bash
cd /opt/openpr
docker-compose up -d
```

Убедитесь, что все сервисы работают корректно:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## Шаг 4: Создание аккаунта администратора

Откройте `https://your-domain.example.com` в браузере и зарегистрируйте аккаунт администратора.

::: warning Первый пользователь
Первый зарегистрированный пользователь становится администратором. Зарегистрируйте аккаунт администратора до того, как поделитесь URL.
:::

## Контрольный список безопасности

### Аутентификация

- [ ] Измените `JWT_SECRET` на случайное значение из 32+ символов
- [ ] Установите подходящие значения TTL токенов (короче для access, длиннее для refresh)
- [ ] Создайте аккаунт администратора сразу после развёртывания

### База данных

- [ ] Используйте надёжный пароль для PostgreSQL
- [ ] Не открывайте порт PostgreSQL (5432) в интернет
- [ ] Включите SSL для подключений PostgreSQL (если база данных удалённая)
- [ ] Настройте регулярное резервное копирование базы данных

### Сеть

- [ ] Используйте Caddy или Nginx с HTTPS (TLS 1.3)
- [ ] Открывайте только порты 443 (HTTPS) и опционально 8090 (MCP) в интернет
- [ ] Используйте фаервол (ufw, iptables) для ограничения доступа
- [ ] Рассмотрите ограничение доступа к MCP-серверу для известных IP-диапазонов

### Приложение

- [ ] Установите `RUST_LOG=info` (не debug или trace в продакшене)
- [ ] Мониторьте использование диска для директории загрузок
- [ ] Настройте ротацию логов для логов контейнеров

## Резервное копирование базы данных

Настройте автоматическое резервное копирование PostgreSQL:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Добавьте в cron:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## Мониторинг

### Проверки работоспособности

Мониторьте эндпоинты работоспособности сервисов:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### Мониторинг логов

```bash
# Следить за всеми логами
docker-compose logs -f

# Следить за конкретным сервисом
docker-compose logs -f api --tail=100
```

## Соображения масштабирования

- **API-сервер**: Может запускать несколько реплик за балансировщиком нагрузки. Все экземпляры подключаются к одной базе данных PostgreSQL.
- **Воркер**: Запускайте один экземпляр во избежание дублированной обработки задач.
- **MCP-сервер**: Может запускать несколько реплик. Каждый экземпляр не имеет состояния.
- **PostgreSQL**: Для высокой доступности рассмотрите репликацию PostgreSQL или управляемый сервис базы данных.

## Обновление

Для обновления OpenPR:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

Миграции базы данных применяются автоматически при запуске API-сервера.

## Следующие шаги

- [Docker-развёртывание](./docker) — справочник Docker Compose
- [Конфигурация](../configuration/) — справочник переменных окружения
- [Устранение неполадок](../troubleshooting/) — распространённые проблемы продакшена
