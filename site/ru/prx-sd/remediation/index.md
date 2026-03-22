---
title: Реагирование на угрозы
description: "Настройка автоматического устранения угроз с политиками реагирования, очисткой механизмов persistence и сетевой изоляцией."
---

# Реагирование на угрозы

Движок устранения угроз PRX-SD обеспечивает автоматизированное реагирование на угрозы, выходящее за рамки простого обнаружения. При выявлении угрозы движок может принимать постепенные меры — от ведения журнала до полной сетевой изоляции — в зависимости от настроенной политики.

## Типы реагирования

| Действие | Описание | Обратимо | Требует root |
|----------|---------|----------|-------------|
| **Report** | Записать обнаружение и продолжить. Никаких действий с файлом. | Н/П | Нет |
| **Quarantine** | Зашифровать и переместить файл в хранилище карантина. | Да | Нет |
| **Block** | Запретить доступ/выполнение файла через fanotify (только Linux, только реальное время). | Да | Да |
| **Kill** | Завершить процесс, создавший или использующий вредоносный файл. | Нет | Да |
| **Clean** | Удалить вредоносное содержимое из файла, сохранив оригинал (например, удаление макросов из документов Office). | Частично | Нет |
| **Delete** | Безвозвратно удалить вредоносный файл с диска. | Нет | Нет |
| **Isolate** | Заблокировать весь сетевой доступ для машины с помощью правил брандмауэра. | Да | Да |
| **Blocklist** | Добавить хеш файла в локальный список блокировок для будущих сканирований. | Да | Нет |

## Настройка политики

### Использование команд sd policy

```bash
# Показать текущую политику
sd policy show

# Установить политику для вредоносных обнаружений
sd policy set on_malicious quarantine

# Установить политику для подозрительных обнаружений
sd policy set on_suspicious report

# Сбросить до значений по умолчанию
sd policy reset
```

### Пример вывода

```bash
sd policy show
```

```
Threat Response Policy
  on_malicious:    quarantine
  on_suspicious:   report
  blocklist_auto:  true
  notify_webhook:  true
  notify_email:    false
  clean_persistence: true
  network_isolate:   false
```

### Файл конфигурации

Установка политик в `~/.prx-sd/config.toml`:

```toml
[policy]
on_malicious = "quarantine"     # report | quarantine | block | kill | clean | delete
on_suspicious = "report"        # report | quarantine | block
blocklist_auto = true           # автоматически добавлять вредоносные хеши в локальный список блокировок
clean_persistence = true        # удалять механизмы persistence при вредоносном обнаружении
network_isolate = false         # включить сетевую изоляцию для критических угроз

[policy.notify]
webhook = true
email = false

[policy.escalation]
# Эскалировать до более сильного действия при повторном появлении той же угрозы
enabled = true
max_reappearances = 3
escalate_to = "delete"
```

::: tip
Политики `on_malicious` и `on_suspicious` принимают разные наборы действий. Деструктивные действия, такие как `kill` и `delete`, доступны только для `on_malicious`.
:::

## Очистка механизмов persistence

Когда `clean_persistence` включён, PRX-SD сканирует и удаляет механизмы persistence, которые могут быть установлены вредоносными программами. Это выполняется автоматически после помещения угрозы в карантин или её удаления.

### Точки persistence Linux

| Расположение | Техника | Действие по очистке |
|------------|---------|-------------------|
| `/etc/cron.d/`, `/var/spool/cron/` | Cron-задания | Удалить вредоносные записи cron |
| `/etc/systemd/system/` | Сервисы systemd | Отключить и удалить вредоносные юниты |
| `~/.config/systemd/user/` | Пользовательские сервисы systemd | Отключить и удалить |
| `~/.bashrc`, `~/.profile` | Внедрение в RC оболочки | Удалить внедрённые строки |
| `~/.ssh/authorized_keys` | Ключи SSH-бэкдора | Удалить несанкционированные ключи |
| `/etc/ld.so.preload` | Перехват LD_PRELOAD | Удалить вредоносные записи preload |
| `/etc/init.d/` | Сценарии инициализации SysV | Удалить вредоносные сценарии |

### Точки persistence macOS

| Расположение | Техника | Действие по очистке |
|------------|---------|-------------------|
| `~/Library/LaunchAgents/` | Плисты LaunchAgent | Выгрузить и удалить |
| `/Library/LaunchDaemons/` | Плисты LaunchDaemon | Выгрузить и удалить |
| `~/Library/Application Support/` | Элементы входа | Удалить вредоносные элементы |
| `/Library/StartupItems/` | Элементы запуска | Удалить |
| `~/.zshrc`, `~/.bash_profile` | Внедрение в RC оболочки | Удалить внедрённые строки |
| Keychain | Злоупотребление Keychain | Оповещение (без автоочистки) |

### Точки persistence Windows

| Расположение | Техника | Действие по очистке |
|------------|---------|-------------------|
| `HKCU\Software\Microsoft\Windows\CurrentVersion\Run` | Ключи Run реестра | Удалить вредоносные значения |
| `HKLM\SYSTEM\CurrentControlSet\Services` | Вредоносные сервисы | Остановить, отключить и удалить |
| Папка `Startup` | Ярлыки запуска | Удалить вредоносные ярлыки |
| Планировщик заданий | Запланированные задачи | Удалить вредоносные задачи |
| Подписки WMI | Потребители событий WMI | Удалить вредоносные подписки |

::: warning
Очистка persistence изменяет системные файлы конфигурации и записи реестра. После каждой операции проверяйте журнал очистки в `~/.prx-sd/remediation.log`, чтобы убедиться, что удалены только вредоносные записи.
:::

## Сетевая изоляция

Для критических угроз (активные программы-вымогатели, утечка данных) PRX-SD может изолировать машину от сети:

### Linux (iptables)

```bash
# PRX-SD добавляет эти правила автоматически при изоляции
 iptables -I OUTPUT -j DROP
iptables -I INPUT -j DROP
iptables -I OUTPUT -d 127.0.0.1 -j ACCEPT
iptables -I INPUT -s 127.0.0.1 -j ACCEPT
```

### macOS (pf)

```bash
# PRX-SD настраивает правила pf
echo "block all" | pfctl -f -
echo "pass on lo0" | pfctl -f -
pfctl -e
```

Снятие изоляции:

```bash
sd isolate lift
```

::: warning
Сетевая изоляция блокирует ВСЕ сетевые подключения, включая SSH. Убедитесь, что у вас есть физический или внеполосный консольный доступ перед включением автоматической сетевой изоляции.
:::

## Журнал устранения угроз

Все действия по устранению угроз записываются в `~/.prx-sd/remediation.log`:

```json
{
  "timestamp": "2026-03-21T10:15:32Z",
  "threat_id": "a1b2c3d4",
  "file": "/tmp/payload.exe",
  "detection": "Win_Trojan_AgentTesla",
  "severity": "malicious",
  "actions_taken": [
    {"action": "quarantine", "status": "success"},
    {"action": "blocklist", "status": "success"},
    {"action": "clean_persistence", "status": "success", "items_removed": 2}
  ]
}
```

## Примеры

```bash
# Установить агрессивную политику для серверов
sd policy set on_malicious kill
sd policy set on_suspicious quarantine

# Установить консервативную политику для рабочих станций
sd policy set on_malicious quarantine
sd policy set on_suspicious report

# Сканирование с явным устранением
sd scan /tmp --on-malicious delete --on-suspicious quarantine

# Проверить и снять сетевую изоляцию
sd isolate status
sd isolate lift

# Просмотреть историю устранения
sd remediation log --last 50
sd remediation log --json > remediation_export.json
```

## Следующие шаги

- [Управление карантином](/ru/prx-sd/quarantine/) — управление файлами в карантине
- [Защита от программ-вымогателей](/ru/prx-sd/realtime/ransomware) — специализированное реагирование на программы-вымогатели
- [Вебхук-оповещения](/ru/prx-sd/alerts/webhook) — уведомления о действиях по устранению
- [Email-оповещения](/ru/prx-sd/alerts/email) — email-уведомления об угрозах
