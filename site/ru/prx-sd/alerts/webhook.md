---
title: Вебхук-оповещения
description: "Настройка вебхук-уведомлений об обнаружениях угроз, событиях карантина и результатах сканирования в PRX-SD."
---

# Вебхук-оповещения

PRX-SD может отправлять уведомления в реальном времени на вебхук-эндпоинты при обнаружении угроз, помещении файлов в карантин или завершении сканирований. Вебхуки интегрируются со Slack, Discord, Microsoft Teams, PagerDuty или любой пользовательской HTTP-конечной точкой.

## Использование

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### Подкоманды

| Подкоманда | Описание |
|-----------|----------|
| `add` | Зарегистрировать новую вебхук-конечную точку |
| `remove` | Удалить зарегистрированный вебхук |
| `list` | Список всех зарегистрированных вебхуков |
| `test` | Отправить тестовое уведомление на вебхук |

## Добавление вебхуков

```bash
sd webhook add [OPTIONS] <URL>
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|-------------|----------|
| `--format` | `-f` | `generic` | Формат пейлоада: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | авто | Читаемое название для этого вебхука |
| `--events` | `-e` | все | События для уведомления через запятую |
| `--secret` | `-s` | | Секрет подписи HMAC-SHA256 для верификации пейлоада |
| `--min-severity` | | `suspicious` | Минимальная серьёзность для активации: `suspicious`, `malicious` |

### Поддерживаемые события

| Событие | Описание |
|---------|----------|
| `threat_detected` | Обнаружен вредоносный или подозрительный файл |
| `file_quarantined` | Файл помещён в карантин |
| `scan_completed` | Задание сканирования завершено |
| `update_completed` | Обновление сигнатур завершено |
| `ransomware_alert` | Обнаружено поведение программы-вымогателя |
| `daemon_status` | Демон запущен, остановлен или обнаружил ошибку |

### Примеры

```bash
# Добавить вебхук Slack
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Добавить вебхук Discord
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Добавить общий вебхук с подписью HMAC
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Добавить вебхук только для критических оповещений
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Список вебхуков

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## Удаление вебхуков

```bash
# Удалить по имени
sd webhook remove security-alerts

# Удалить по URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Тестирование вебхуков

Отправьте тестовое уведомление для проверки подключения:

```bash
# Тестировать конкретный вебхук
sd webhook test security-alerts

# Тестировать все вебхуки
sd webhook test --all
```

Тест отправляет пример пейлоада об обнаружении угрозы, чтобы вы могли проверить форматирование и доставку.

## Форматы пейлоадов

### Общий формат

По умолчанию формат `generic` отправляет JSON-пейлоад через HTTP POST:

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

Заголовки, включаемые в общие пейлоады:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Формат Slack

Вебхуки Slack получают форматированное сообщение с цветовой кодировкой серьёзности:

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Формат Discord

Вебхуки Discord используют формат embeds:

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## Файл конфигурации

Вебхуки также можно настроить в `~/.prx-sd/config.toml`:

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Секреты вебхуков хранятся в зашифрованном виде в файле конфигурации. Используйте `sd webhook add --secret` для их безопасной установки вместо прямого редактирования файла конфигурации.
:::

## Поведение при повторных попытках

Неудачные доставки вебхуков повторяются с экспоненциальной задержкой:

| Попытка | Задержка |
|---------|---------|
| 1-я попытка | 5 секунд |
| 2-я попытка | 30 секунд |
| 3-я попытка | 5 минут |
| 4-я попытка | 30 минут |
| (отказ) | Событие записывается как недоставленное |

## Следующие шаги

- [Email-оповещения](./email) — настройка email-уведомлений
- [Запланированные сканирования](./schedule) — настройка регулярных заданий сканирования
- [Реагирование на угрозы](/ru/prx-sd/remediation/) — настройка автоматического устранения угроз
- [Демон](/ru/prx-sd/realtime/daemon) — фоновый мониторинг с оповещениями
