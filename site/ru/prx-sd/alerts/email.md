---
title: Email-оповещения
description: "Настройка email-уведомлений об обнаружениях угроз и результатах сканирования в PRX-SD."
---

# Email-оповещения

PRX-SD может отправлять email-уведомления при обнаружении угроз, завершении сканирования или возникновении критических событий. Email-оповещения дополняют вебхуки для сред, где email является основным каналом коммуникации, или для уведомления дежурного персонала.

## Использование

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### Подкоманды

| Подкоманда | Описание |
|-----------|----------|
| `configure` | Настроить SMTP-сервер и параметры получателей |
| `test` | Отправить тестовый email для проверки конфигурации |
| `send` | Вручную отправить email-оповещение |
| `status` | Показать текущий статус конфигурации email |

## Настройка email

### Интерактивная настройка

```bash
sd email-alert configure
```

Интерактивный мастер запрашивает:

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### Настройка через командную строку

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### Файл конфигурации

Настройки email хранятся в `~/.prx-sd/config.toml`:

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Для Gmail используйте пароль приложения вместо пароля от аккаунта. Перейдите в Аккаунт Google > Безопасность > Двухэтапная аутентификация > Пароли приложений для его создания.
:::

## Тестирование email

Отправьте тестовый email для проверки конфигурации:

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## Отправка оповещений вручную

Инициировать email-оповещение вручную (полезно для тестирования интеграций или пересылки результатов):

```bash
# Отправить оповещение о конкретном файле
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Отправить сводку по сканированию
sd email-alert send --scan-report /tmp/scan-results.json
```

## Содержание email

### Email об обнаружении угрозы

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### Email с итогами сканирования

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## Поддерживаемые события

| Событие | По умолчанию включено | Описание |
|---------|----------------------|----------|
| `threat_detected` | Да | Обнаружен вредоносный или подозрительный файл |
| `ransomware_alert` | Да | Обнаружено поведение программы-вымогателя |
| `scan_completed` | Нет | Задание сканирования завершено (только если найдены угрозы) |
| `update_completed` | Нет | Обновление сигнатур завершено |
| `update_failed` | Да | Обновление сигнатур завершилось с ошибкой |
| `daemon_error` | Да | Демон обнаружил критическую ошибку |

Настройте, какие события вызывают отправку email:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Ограничение частоты

Для предотвращения спама по email во время крупных вспышек:

```toml
[email.rate_limit]
max_per_hour = 10            # Максимальное количество email в час
digest_mode = true           # Объединять несколько оповещений в один email
digest_interval_mins = 15    # Временное окно пакетного дайджеста
```

Когда включён `digest_mode`, оповещения в пределах временного окна дайджеста объединяются в один сводный email вместо отдельных уведомлений.

## Проверка статуса

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## Следующие шаги

- [Вебхук-оповещения](./webhook) — уведомления через вебхук в реальном времени
- [Запланированные сканирования](./schedule) — автоматизация регулярных сканирований
- [Реагирование на угрозы](/ru/prx-sd/remediation/) — политики автоматического устранения угроз
- [Демон](/ru/prx-sd/realtime/daemon) — фоновая защита с оповещениями
