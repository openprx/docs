---
title: Tailscale Funnel
description: Предоставление доступа к агенту PRX из интернета через Tailscale Funnel поверх вашей mesh-сети Tailscale.
---

# Tailscale Funnel

Tailscale Funnel позволяет открыть ваш локальный экземпляр PRX для публичного интернета через ретрансляционную инфраструктуру Tailscale. В отличие от традиционного туннеля, требующего стороннюю граничную сеть, Funnel использует вашу существующую mesh-сеть Tailscale -- что делает его отличным выбором, когда узлы PRX уже взаимодействуют через Tailscale.

## Обзор

Tailscale предоставляет две дополняющие друг друга функции для подключения PRX:

| Функция | Область | Сценарий использования |
|---------|---------|----------------------|
| **Tailscale Serve** | Приватная (только tailnet) | Предоставление PRX другим устройствам в вашей сети Tailscale |
| **Tailscale Funnel** | Публичная (интернет) | Предоставление PRX внешним вебхукам и сервисам |

PRX использует Funnel для входящего трафика вебхуков и Serve для межузловой коммуникации внутри tailnet.

### Как работает Funnel

```
External Service (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (your machine)      │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

Трафик приходит на ваше имя хоста MagicDNS (напр., `prx-host.tailnet-name.ts.net`), маршрутизируется через сеть DERP-ретрансляторов Tailscale по WireGuard и перенаправляется на локальный шлюз PRX.

## Предварительные требования

1. Tailscale установлен и аутентифицирован на машине с PRX
2. Tailscale Funnel включён для вашего tailnet (требуется одобрение администратора)
3. Узел Tailscale машины должен иметь возможность Funnel в политике ACL

### Установка Tailscale

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authenticate
sudo tailscale up
```

### Включение Funnel в политике ACL

Funnel должен быть явно разрешён в политике ACL вашего tailnet. Добавьте следующее в файл ACL Tailscale (через консоль администратора):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

Это предоставляет возможность Funnel всем участникам. Для более строгого контроля замените `autogroup:member` на конкретных пользователей или теги:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## Конфигурация

### Базовая настройка Funnel

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exposes the service to the public internet.
# Set to false to use Serve (tailnet-only access).
funnel = true

# Port to expose via Funnel. Tailscale Funnel supports
# ports 443, 8443, and 10000.
port = 443

# HTTPS is mandatory for Funnel. Tailscale provisions
# a certificate automatically via Let's Encrypt.
```

### Настройка только для tailnet (Serve)

Для приватной межузловой коммуникации без публичного доступа:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## Справочник конфигурации

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|----------|
| `funnel` | boolean | `true` | `true` для публичного Funnel, `false` для Serve (только tailnet) |
| `port` | integer | `443` | Публичный порт (Funnel поддерживает 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | Путь к бинарнику CLI `tailscale` |
| `hostname` | string | автоопределение | Переопределение имени хоста MagicDNS |
| `reset_on_stop` | boolean | `true` | Удалять конфигурацию Funnel/Serve при остановке PRX |
| `background` | boolean | `true` | Запускать `tailscale serve` в фоновом режиме |

## Как PRX управляет Tailscale

При запуске туннеля PRX выполняет:

```bash
# For Funnel (public)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# For Serve (private)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

Флаг `--bg` запускает serve/funnel в фоновом режиме внутри демона `tailscaled`. PRX не нужно поддерживать дочерний процесс -- `tailscaled` обрабатывает перенаправление.

При остановке PRX выполняет очистку:

```bash
tailscale funnel --https=443 off
# or
tailscale serve --https=443 off
```

Это поведение управляется параметром `reset_on_stop`.

## Публичный URL

Публичный URL для Funnel следует паттерну MagicDNS:

```
https://<machine-name>.<tailnet-name>.ts.net
```

Например, если ваша машина называется `prx-host`, а tailnet -- `example`, URL будет:

```
https://prx-host.example.ts.net
```

PRX автоматически определяет это имя хоста, парся вывод `tailscale status --json`, и формирует полный публичный URL.

## Проверки состояния

PRX мониторит туннель Tailscale двумя проверками:

1. **Статус демона Tailscale** -- `tailscale status --json` должен сообщать, что узел подключён
2. **Доступность Funnel** -- HTTP GET на публичный URL должен возвращать ответ 2xx

При неудачных проверках состояния PRX пытается переустановить Funnel повторным запуском команды `tailscale funnel`. Если сам `tailscaled` недоступен, PRX записывает ошибку и отключает туннель до восстановления демона.

## Особенности ACL

ACL Tailscale управляют тем, какие устройства могут взаимодействовать и какие могут использовать Funnel. Ключевые моменты для развёртываний PRX:

### Ограничение Funnel для узлов PRX

Отметьте машины PRX тегами и ограничьте доступ к Funnel:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### Разрешение межузлового трафика

Для распределённых развёртываний PRX разрешите трафик между узлами PRX:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## Устранение неполадок

| Симптом | Причина | Решение |
|---------|---------|---------|
| "Funnel not available" | В политике ACL отсутствует атрибут funnel | Добавьте атрибут `funnel` для узла или пользователя в ACL |
| Статус "not connected" | `tailscaled` не запущен | Запустите демон Tailscale: `sudo tailscale up` |
| Ошибка сертификата | DNS не распространён | Дождитесь распространения MagicDNS (обычно < 1 минуты) |
| Порт уже используется | Другой Serve/Funnel на том же порту | Удалите существующий: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | Шлюз PRX не прослушивает | Убедитесь, что `local_addr` совпадает с адресом прослушивания вашего шлюза |

## Связанные страницы

- [Обзор туннелей](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [Сопряжение узлов](/ru/prx/nodes/pairing)
- [Обзор безопасности](/ru/prx/security/)
