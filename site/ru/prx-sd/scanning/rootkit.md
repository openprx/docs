---
title: Обнаружение руткитов
description: "Обнаружение руткитов ядра и пользовательского пространства на Linux с помощью sd check-rootkit: проверка скрытых процессов, модулей ядра, перехватов системных вызовов и другого."
---

# Обнаружение руткитов

Команда `sd check-rootkit` выполняет глубокую проверку целостности системы для обнаружения как руткитов уровня ядра, так и пользовательского пространства. Руткиты являются одними из наиболее опасных типов вредоносных программ, поскольку они скрывают своё присутствие от стандартных системных инструментов, делая их невидимыми для обычных файловых сканеров.

::: warning Требования
- **Требуются привилегии root** — Обнаружение руткитов читает структуры данных ядра и внутренние компоненты системы.
- **Только Linux** — Эта функция полагается на `/proc`, `/sys` и специфичные для Linux интерфейсы ядра.
:::

## Что обнаруживается

PRX-SD проверяет наличие руткитов по нескольким векторам:

### Проверки уровня ядра

| Проверка | Описание |
|----------|---------|
| Скрытые модули ядра | Сравнение загруженных модулей из `/proc/modules` с записями sysfs для поиска расхождений |
| Перехваты таблицы системных вызовов | Проверка записей таблицы syscall по известным символам ядра |
| Несоответствия `/proc` | Обнаружение процессов, скрытых от `/proc`, но видимых через другие интерфейсы |
| Подмена символов ядра | Проверка на изменённые указатели функций в ключевых структурах ядра |
| Таблица дескрипторов прерываний | Проверка записей IDT на неожиданные изменения |

### Проверки пользовательского пространства

| Проверка | Описание |
|----------|---------|
| Скрытые процессы | Перекрёстная проверка результатов `readdir(/proc)` с брутфорс-перечислением PID |
| Внедрение LD_PRELOAD | Проверка вредоносных общих библиотек, загруженных через `LD_PRELOAD` или `/etc/ld.so.preload` |
| Замена бинарных файлов | Проверка целостности критических системных бинарников (`ls`, `ps`, `netstat`, `ss`, `lsof`) |
| Скрытые файлы | Обнаружение файлов, скрытых путём перехвата syscall `getdents` |
| Подозрительные cron-записи | Сканирование crontab на обфусцированные или закодированные команды |
| Подмена сервисов systemd | Проверка на несанкционированные или изменённые юниты systemd |
| SSH-бэкдоры | Поиск несанкционированных SSH-ключей, изменённого `sshd_config` или заражённых бинарников `sshd` |
| Сетевые слушатели | Идентификация скрытых сетевых сокетов, не отображаемых `ss`/`netstat` |

## Базовое использование

Запуск полной проверки на руткиты:

```bash
sudo sd check-rootkit
```

Пример вывода:

```
PRX-SD Rootkit Check
====================
System: Linux 6.12.48 x86_64
Checks: 14 performed

Kernel Checks:
  [PASS] Kernel module list consistency
  [PASS] System call table integrity
  [PASS] /proc filesystem consistency
  [PASS] Kernel symbol verification
  [PASS] Interrupt descriptor table

Userspace Checks:
  [PASS] Hidden process detection
  [WARN] LD_PRELOAD check
    /etc/ld.so.preload exists with entry: /usr/lib/libfakeroot.so
  [PASS] Critical binary integrity
  [PASS] Hidden file detection
  [PASS] Cron entry audit
  [PASS] Systemd service audit
  [PASS] SSH configuration check
  [PASS] Network listener verification
  [PASS] /dev suspicious entries

Summary: 13 passed, 1 warning, 0 critical
```

## Параметры команды

| Параметр | Сокр. | По умолчанию | Описание |
|----------|-------|-------------|----------|
| `--json` | `-j` | выкл. | Вывод результатов в формате JSON |
| `--kernel-only` | | выкл. | Запускать только проверки уровня ядра |
| `--userspace-only` | | выкл. | Запускать только проверки пользовательского пространства |
| `--baseline` | | нет | Путь к файлу базовой линии для сравнения |
| `--save-baseline` | | нет | Сохранить текущее состояние как базовую линию |

## Сравнение с базовой линией

Для постоянного мониторинга создайте базовую линию известного чистого состояния системы и сравнивайте с ней при последующих проверках:

```bash
# Создать базовую линию на заведомо чистой системе
sudo sd check-rootkit --save-baseline /etc/prx-sd/rootkit-baseline.json

# Последующие проверки сравниваются с базовой линией
sudo sd check-rootkit --baseline /etc/prx-sd/rootkit-baseline.json
```

Базовая линия записывает списки модулей ядра, хеши таблицы syscall, контрольные суммы критических бинарников и состояния сетевых слушателей. Любое отклонение вызывает оповещение.

## Вывод JSON

```bash
sudo sd check-rootkit --json
```

```json
{
  "timestamp": "2026-03-21T16:00:00Z",
  "system": {
    "kernel": "6.12.48",
    "arch": "x86_64",
    "hostname": "web-server-01"
  },
  "checks": [
    {
      "name": "kernel_modules",
      "category": "kernel",
      "status": "pass",
      "details": "142 modules, all consistent"
    },
    {
      "name": "ld_preload",
      "category": "userspace",
      "status": "warning",
      "details": "/etc/ld.so.preload contains: /usr/lib/libfakeroot.so",
      "recommendation": "Verify this entry is expected. Remove if unauthorized."
    }
  ],
  "summary": {
    "total": 14,
    "passed": 13,
    "warnings": 1,
    "critical": 0
  }
}
```

## Пример: Обнаружение руткита модуля ядра

Когда руткит скрывает модуль ядра, `sd check-rootkit` обнаруживает несоответствие:

```
Kernel Checks:
  [CRITICAL] Kernel module list consistency
    Module found in /sys/module/ but missing from /proc/modules:
      - syskit (size: 45056, loaded at: 0xffffffffc0a00000)
    This is a strong indicator of a hidden kernel module rootkit.
    Recommendation: Boot from trusted media and investigate.
```

::: warning Критические результаты
Результат `CRITICAL` от проверщика руткитов должен рассматриваться как серьёзный инцидент безопасности. Не пытайтесь проводить устранение на потенциально скомпрометированной системе. Вместо этого изолируйте машину и проведите расследование с доверенного носителя.
:::

## Планирование регулярных проверок

Добавьте проверки на руткиты в ваш регламент мониторинга:

```bash
# Cron: проверка каждые 4 часа
0 */4 * * * root /usr/local/bin/sd check-rootkit --json >> /var/log/prx-sd/rootkit-check.log 2>&1
```

## Следующие шаги

- [Сканирование памяти](./memory-scan) — обнаружение угроз в памяти запущенных процессов
- [Сканирование файлов и каталогов](./file-scan) — традиционное файловое сканирование
- [Сканирование USB](./usb-scan) — сканирование съёмных носителей при подключении
- [Движок обнаружения](../detection/) — обзор всех уровней обнаружения
