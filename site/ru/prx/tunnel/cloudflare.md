---
title: Cloudflare Tunnel
description: Интеграция PRX с Cloudflare Tunnel для входящего трафика с нулевым доверием через cloudflared.
---

# Cloudflare Tunnel

Cloudflare Tunnel (ранее Argo Tunnel) создаёт зашифрованное исходящее соединение от вашего экземпляра PRX к граничной сети Cloudflare. Не требуется публичный IP, открытые порты файрвола или проброс портов. Cloudflare терминирует TLS и маршрутизирует трафик к вашему локальному агенту через туннель.

## Обзор

Cloudflare Tunnel -- рекомендуемый бэкенд для продакшн-развёртываний PRX, поскольку обеспечивает:

- **Доступ с нулевым доверием** -- интеграция с Cloudflare Access для требования подтверждения личности перед доступом к агенту
- **Собственные домены** -- использование вашего домена с автоматическими HTTPS-сертификатами
- **Защита от DDoS** -- трафик проходит через сеть Cloudflare, защищая ваш origin-сервер
- **Высокая надёжность** -- Cloudflare поддерживает множество граничных соединений для отказоустойчивости
- **Бесплатный план** -- Cloudflare Tunnels доступны на бесплатном плане

## Предварительные требования

1. Аккаунт Cloudflare (достаточно бесплатного плана)
2. CLI `cloudflared`, установленный на машине с PRX
3. Домен, добавленный в ваш аккаунт Cloudflare (для именованных туннелей)

### Установка cloudflared

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary download (all platforms)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## Конфигурация

### Быстрый туннель (без домена)

Простейшая настройка использует быстрый туннель Cloudflare, который назначает случайный поддомен `*.trycloudflare.com`. Настройка аккаунта Cloudflare не требуется -- достаточно установить `cloudflared`:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick tunnel mode: no token, no named tunnel.
# A random trycloudflare.com URL is assigned on each start.
mode = "quick"
```

Быстрые туннели идеальны для разработки и тестирования. URL меняется при каждом перезапуске, поэтому потребуется обновлять регистрации вебхуков.

### Именованный туннель (постоянный домен)

Для продакшна используйте именованный туннель со стабильным именем хоста:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# The tunnel token obtained from `cloudflared tunnel create`.
# Can also be set via CLOUDFLARE_TUNNEL_TOKEN environment variable.
token = "eyJhIjoiNjY..."

# The public hostname that routes to this tunnel.
# Must be configured in the Cloudflare dashboard or via cloudflared CLI.
hostname = "agent.example.com"
```

### Создание именованного туннеля

```bash
# 1. Authenticate cloudflared with your Cloudflare account
cloudflared tunnel login

# 2. Create a named tunnel
cloudflared tunnel create prx-agent
# Output: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. Create a DNS record pointing to the tunnel
cloudflared tunnel route dns prx-agent agent.example.com

# 4. Get the tunnel token (for config.toml)
cloudflared tunnel token prx-agent
# Output: eyJhIjoiNjY...
```

## Справочник конфигурации

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `mode` | string | `"quick"` | `"quick"` для случайных URL, `"named"` для постоянных имён хостов |
| `token` | string | -- | Токен именованного туннеля (обязателен для `mode = "named"`) |
| `hostname` | string | -- | Публичное имя хоста для именованного туннеля |
| `cloudflared_path` | string | `"cloudflared"` | Путь к бинарнику `cloudflared` |
| `protocol` | string | `"auto"` | Транспортный протокол: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | Версия IP для граничных соединений: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | Количество повторных попыток подключения |
| `grace_period_secs` | integer | `30` | Секунды ожидания перед завершением активных соединений |
| `metrics_port` | integer | -- | Если задан, порт для метрик `cloudflared` |
| `log_level` | string | `"info"` | Уровень журнала `cloudflared`: `"debug"`, `"info"`, `"warn"`, `"error"` |

## Zero-Trust Access

Cloudflare Access добавляет уровень идентификации перед вашим туннелем. Пользователи должны пройти аутентификацию (через SSO, email OTP или сервисные токены) перед доступом к экземпляру PRX.

### Настройка политик Access

1. Перейдите в панель управления Cloudflare Zero Trust
2. Создайте приложение Access для имени хоста вашего туннеля
3. Добавьте политику Access с требуемыми условиями идентификации

```
Cloudflare Access Policy Example:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

Сервисные токены полезны для автоматических отправителей вебхуков (GitHub, Slack), которые не могут выполнять интерактивную аутентификацию. Настройте токен в заголовках провайдера вебхуков:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## Проверки состояния

PRX мониторит состояние Cloudflare Tunnel следующим образом:

1. Проверка, что дочерний процесс `cloudflared` запущен
2. Отправка HTTP GET на публичный URL и проверка ответа 2xx
3. Парсинг метрик `cloudflared` (если настроен `metrics_port`) для статуса соединения

Если туннель становится нездоровым, PRX записывает предупреждение и пытается перезапустить `cloudflared`. Перезапуск использует стратегию экспоненциального отката: 5 с, 10 с, 20 с, 40 с, до максимума 5 минут между попытками.

## Журналы и отладка

Stdout и stderr `cloudflared` перехватываются `TunnelProcess` и записываются в журнал PRX на уровне `DEBUG`. Для увеличения детализации:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

Распространённые сообщения журнала и их значения:

| Сообщение журнала | Значение |
|-------------------|----------|
| `Connection registered` | Туннель установлен к граничному узлу Cloudflare |
| `Retrying connection` | Граничное соединение разорвано, попытка переподключения |
| `Serve tunnel error` | Фатальная ошибка, туннель будет перезапущен |
| `Registered DNS record` | DNS-запись успешно создана |

## Пример: полная продакшн-настройка

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# Set the token via environment variable
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# Start PRX -- tunnel starts automatically
prx start
```

## Замечания по безопасности

- Токен туннеля предоставляет полный доступ к именованному туннелю. Храните его в менеджере секретов PRX или передавайте через переменную окружения. Никогда не фиксируйте в системе контроля версий.
- Быстрые туннели не поддерживают политики Access. Используйте именованные туннели для продакшна.
- `cloudflared` запускается как дочерний процесс с теми же правами, что и PRX. Рассмотрите запуск PRX под выделённой сервисной учётной записью с минимальными привилегиями.
- Весь трафик между `cloudflared` и граничной сетью Cloudflare зашифрован TLS 1.3 или QUIC.

## Связанные страницы

- [Обзор туннелей](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Обзор безопасности](/ru/prx/security/)
- [Управление секретами](/ru/prx/security/secrets)
