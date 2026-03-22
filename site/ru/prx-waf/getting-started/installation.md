---
title: Установка
description: "Установка PRX-WAF с помощью Docker Compose, Cargo или сборки из исходного кода. Включает предварительные требования, примечания по платформам и проверку после установки."
---

# Установка

PRX-WAF поддерживает три метода установки. Выберите наиболее подходящий для вашего рабочего процесса.

::: tip Рекомендуется
**Docker Compose** — самый быстрый способ начать работу. Он запускает PRX-WAF, PostgreSQL и Admin UI одной командой.
:::

## Предварительные требования

| Требование | Минимум | Примечания |
|-----------|---------|------------|
| Операционная система | Linux (x86_64, aarch64), macOS (12+) | Windows через WSL2 |
| PostgreSQL | 16+ | Включён в Docker Compose |
| Rust (только для сборки из исходного кода) | 1.82.0 | Не нужен для установки через Docker |
| Node.js (только для сборки Admin UI) | 18+ | Не нужен для установки через Docker |
| Docker | 20.10+ | Или Podman 3.0+ |
| Дисковое пространство | 500 МБ | ~100 МБ бинарный файл + ~400 МБ данные PostgreSQL |
| ОЗУ | 512 МБ | 2 ГБ+ рекомендуется для продакшена |

## Метод 1: Docker Compose (рекомендуется)

Клонируйте репозиторий и запустите все сервисы с помощью Docker Compose:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Просмотрите и отредактируйте переменные окружения в docker-compose.yml
# (пароль базы данных, учётные данные администратора, порты прослушивания)
docker compose up -d
```

Запускается три контейнера:

| Контейнер | Порт | Описание |
|----------|------|----------|
| `prx-waf` | `80`, `443` | Reverse proxy (HTTP + HTTPS) |
| `prx-waf` | `9527` | Admin API + Vue 3 UI |
| `postgres` | `5432` | PostgreSQL 16 база данных |

Проверьте развёртывание:

```bash
# Проверить статус контейнеров
docker compose ps

# Проверить эндпоинт health
curl http://localhost:9527/health
```

Откройте Admin UI по адресу `http://localhost:9527` и войдите с учётными данными по умолчанию: `admin` / `admin`.

::: warning Смените пароль по умолчанию
Немедленно смените пароль администратора по умолчанию после первого входа. Перейдите в **Settings > Account** в Admin UI или используйте API.
:::

### Docker Compose с Podman

Если вы используете Podman вместо Docker:

```bash
podman-compose up -d --build
```

::: info DNS Podman
При использовании Podman адрес DNS-резолвера для межконтейнерного взаимодействия — `10.89.0.1` вместо Docker-овского `127.0.0.11`. Включённый `docker-compose.yml` обрабатывает это автоматически.
:::

## Метод 2: Установка через Cargo

Если у вас установлен Rust, вы можете установить PRX-WAF из репозитория:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

Бинарный файл находится в `target/release/prx-waf`. Скопируйте его в PATH:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Зависимости сборки
Сборка Cargo компилирует нативные зависимости. На Debian/Ubuntu может потребоваться:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
На macOS требуются Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

### Настройка базы данных

PRX-WAF требует базу данных PostgreSQL 16+:

```bash
# Создать базу данных и пользователя
createdb prx_waf
createuser prx_waf

# Запустить миграции
./target/release/prx-waf -c configs/default.toml migrate

# Создать пользователя admin по умолчанию (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### Запуск сервера

```bash
./target/release/prx-waf -c configs/default.toml run
```

Запускает reverse proxy на портах 80/443 и Admin API на порту 9527.

## Метод 3: Сборка из исходного кода (разработка)

Для разработки с живой перезагрузкой Admin UI:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Собрать Rust бэкенд
cargo build

# Собрать Admin UI
cd web/admin-ui
npm install
npm run build
cd ../..

# Запустить сервер разработки
cargo run -- -c configs/default.toml run
```

### Сборка Admin UI для продакшена

```bash
cd web/admin-ui
npm install
npm run build
```

Собранные файлы встраиваются в бинарный файл Rust во время компиляции и обслуживаются API-сервером.

## Сервис systemd

Для продакшен-развёртываний на серверах создайте сервис systemd:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## Проверка установки

После установки убедитесь, что PRX-WAF работает:

```bash
# Проверить эндпоинт health
curl http://localhost:9527/health

# Проверить Admin UI
curl -s http://localhost:9527 | head -5
```

Войдите в Admin UI по адресу `http://localhost:9527`, чтобы убедиться, что дашборд загружается корректно.

## Следующие шаги

- [Быстрый старт](./quickstart) — защита первого приложения за 5 минут
- [Конфигурация](../configuration/) — настройка PRX-WAF
- [Движок правил](../rules/) — понимание конвейера обнаружения
