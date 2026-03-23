---
title: Быстрый старт
description: "Запустите PRX-SD для проверки на вредоносные программы за 5 минут: установка, обновление сигнатур, сканирование файлов, просмотр результатов и включение мониторинга в реальном времени."
---

# Быстрый старт

Это руководство позволит вам выполнить первое сканирование на вредоносные программы менее чем за 5 минут. После его выполнения у вас будет установлен PRX-SD, обновлены сигнатуры и запущен мониторинг в реальном времени.

::: tip Требования
Вам нужна система Linux или macOS с установленным `curl`. Для других методов и деталей платформ см. [руководство по установке](./installation).
:::

## Шаг 1: Установка PRX-SD

Скачайте и установите последний выпуск с помощью скрипта установки:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Проверьте установку:

```bash
sd --version
```

Вы должны увидеть вывод вида:

```
prx-sd 0.5.0
```

## Шаг 2: Обновление базы данных сигнатур

PRX-SD поставляется со встроенным списком блокировок, но для полной защиты необходимо скачать последние данные разведки угроз. Команда `update` получает хеш-сигнатуры и правила YARA из всех настроенных источников:

```bash
sd update
```

Ожидаемый вывод:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip Полное обновление
Чтобы включить полную базу данных VirusShare (20 млн+ хешей MD5), запустите:
```bash
sd update --full
```
Это займёт больше времени, но обеспечивает максимальное покрытие хешами.
:::

## Шаг 3: Сканирование файла или каталога

Сканирование одного подозрительного файла:

```bash
sd scan /path/to/suspicious_file
```

Рекурсивное сканирование всего каталога:

```bash
sd scan /home --recursive
```

Пример вывода для чистого каталога:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

Пример вывода при обнаружении угроз:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## Шаг 4: Просмотр результатов и принятие мер

Для получения подробного JSON-отчёта, подходящего для автоматизации или приёма логов:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

Для автоматического помещения обнаруженных угроз в карантин во время сканирования:

```bash
sd scan /home --recursive --auto-quarantine
```

Файлы, помещённые в карантин, перемещаются в защищённый зашифрованный каталог. Вы можете просматривать их и восстанавливать:

```bash
# Список файлов в карантине
sd quarantine list

# Восстановить файл по его ID карантина
sd quarantine restore QR-20260321-001
```

::: warning Карантин
Файлы в карантине зашифрованы и не могут быть случайно выполнены. Используйте `sd quarantine restore` только если вы уверены, что файл является ложным срабатыванием.
:::

## Шаг 5: Включение мониторинга в реальном времени

Запустите монитор реального времени для наблюдения за каталогами на предмет новых или изменённых файлов:

```bash
sd monitor /home /tmp /var/www
```

Монитор работает на переднем плане и сканирует файлы при их создании или изменении:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

Для запуска монитора как фонового сервиса:

```bash
# Установить и запустить сервис systemd
sd service install
sd service start

# Проверить статус сервиса
sd service status
```

## Итоговое состояние системы

После выполнения этих шагов ваша система имеет:

| Компонент | Статус |
|-----------|--------|
| Бинарный файл `sd` | Установлен в PATH |
| База хешей | 28 000+ хешей SHA-256/MD5 в LMDB |
| Правила YARA | 38 800+ правил из 8 источников |
| Монитор реального времени | Отслеживает указанные каталоги |

## Следующие шаги

- [Сканирование файлов и каталогов](../scanning/file-scan) — изучите все параметры `sd scan`, включая потоки, исключения и ограничения размера
- [Сканирование памяти](../scanning/memory-scan) — сканирование памяти запущенных процессов для обнаружения угроз в памяти
- [Обнаружение руткитов](../scanning/rootkit) — проверка на руткиты ядра и пользовательского пространства
- [Движок обнаружения](../detection/) — понимание работы многоуровневого конвейера
- [Правила YARA](../detection/yara-rules) — узнайте об источниках правил и пользовательских правилах
