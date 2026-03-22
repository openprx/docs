---
title: Сканирование файлов и каталогов
description: "Полный справочник команды sd scan. Сканирование файлов и каталогов на вредоносные программы с помощью сопоставления хешей, правил YARA и эвристического анализа."
---

# Сканирование файлов и каталогов

Команда `sd scan` — основной способ проверки файлов и каталогов на вредоносные программы. Она запускает каждый файл через многоуровневый конвейер обнаружения — сопоставление хешей, правила YARA и эвристический анализ — и выдаёт вердикт для каждого файла.

## Базовое использование

Сканирование одного файла:

```bash
sd scan /path/to/file
```

Сканирование каталога (нерекурсивно по умолчанию):

```bash
sd scan /home/user/downloads
```

Рекурсивное сканирование каталога и всех подкаталогов:

```bash
sd scan /home --recursive
```

## Параметры команды

| Параметр | Сокр. | По умолчанию | Описание |
|----------|-------|-------------|----------|
| `--recursive` | `-r` | выкл. | Рекурсия в подкаталоги |
| `--json` | `-j` | выкл. | Вывод результатов в формате JSON |
| `--threads` | `-t` | ядра ЦП | Количество параллельных потоков сканирования |
| `--auto-quarantine` | `-q` | выкл. | Автоматически помещать обнаруженные угрозы в карантин |
| `--remediate` | | выкл. | Попытаться автоматически устранить угрозы (удалить/поместить в карантин согласно политике) |
| `--exclude` | `-e` | нет | Glob-паттерн для исключения файлов или каталогов |
| `--report` | | нет | Записать отчёт о сканировании по указанному пути |
| `--max-size-mb` | | 100 | Пропускать файлы крупнее указанного размера в мегабайтах |
| `--no-yara` | | выкл. | Пропустить сканирование по правилам YARA |
| `--no-heuristics` | | выкл. | Пропустить эвристический анализ |
| `--min-severity` | | `suspicious` | Минимальная серьёзность для отображения (`suspicious` или `malicious`) |

## Процесс обнаружения

Когда `sd scan` обрабатывает файл, он проходит через конвейер обнаружения по порядку:

```
File → Magic Number Detection → Determine File Type
  │
  ├─ Layer 1: SHA-256 Hash Lookup (LMDB)
  │   Hit → MALICIOUS (instant, ~1μs per file)
  │
  ├─ Layer 2: YARA-X Rule Scan (38,800+ rules)
  │   Hit → MALICIOUS with rule name
  │
  ├─ Layer 3: Heuristic Analysis (file-type-aware)
  │   Score ≥ 60 → MALICIOUS
  │   Score 30-59 → SUSPICIOUS
  │   Score < 30 → CLEAN
  │
  └─ Result Aggregation → highest severity wins
```

Конвейер выполняет короткое замыкание: при нахождении совпадения хеша YARA и эвристический анализ для этого файла пропускаются. Это делает сканирование больших каталогов быстрым — большинство чистых файлов разрешается на уровне хешей за микросекунды.

## Форматы вывода

### Удобочитаемый (по умолчанию)

```bash
sd scan /home/user/downloads --recursive
```

```
PRX-SD Scan Report
==================
Scanned: 3,421 files (1.2 GB)
Skipped: 14 files (exceeded max size)
Threats: 3 (2 malicious, 1 suspicious)

  [MALICIOUS] /home/user/downloads/invoice.exe
    Layer:   Hash match (SHA-256)
    Source:  MalwareBazaar
    Family:  Emotet
    SHA-256: e3b0c44298fc1c149afbf4c8996fb924...

  [MALICIOUS] /home/user/downloads/patch.scr
    Layer:   YARA rule
    Rule:    win_ransomware_lockbit3
    Source:  ReversingLabs

  [SUSPICIOUS] /home/user/downloads/updater.bin
    Layer:   Heuristic analysis
    Score:   42/100
    Findings:
      - High section entropy: 7.91 (packed)
      - Suspicious API imports: VirtualAllocEx, WriteProcessMemory
      - Non-standard PE timestamp

Duration: 5.8s (589 files/s)
```

### Вывод JSON

```bash
sd scan /path --recursive --json
```

```json
{
  "scan_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-03-21T14:30:00Z",
  "files_scanned": 3421,
  "files_skipped": 14,
  "total_bytes": 1288490188,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
      "md5": "d41d8cd98f00b204e9800998ecf8427e"
    }
  ],
  "duration_ms": 5800,
  "throughput_files_per_sec": 589
}
```

### Файл отчёта

Запись результатов в файл для архивирования:

```bash
sd scan /srv/web --recursive --report /var/log/prx-sd/scan-report.json
```

## Паттерны исключений

Используйте `--exclude` для пропуска файлов или каталогов, соответствующих glob-паттернам. Можно указать несколько паттернов:

```bash
sd scan /home --recursive \
  --exclude "*.log" \
  --exclude "node_modules/**" \
  --exclude ".git/**" \
  --exclude "/home/user/VMs/**"
```

::: tip Производительность
Исключение больших каталогов, таких как `node_modules`, `.git` и образы виртуальных машин, значительно улучшает скорость сканирования.
:::

## Автокарантин

Флаг `--auto-quarantine` перемещает обнаруженные угрозы в хранилище карантина во время сканирования:

```bash
sd scan /tmp --recursive --auto-quarantine
```

```
[MALICIOUS] /tmp/dropper.exe → Quarantined (QR-20260321-007)
```

Файлы, помещённые в карантин, зашифрованы AES-256 и хранятся в `~/.local/share/prx-sd/quarantine/`. Их нельзя случайно выполнить. Подробнее см. в [документации по карантину](../quarantine/).

## Примеры сценариев

### Сканирование в конвейере CI/CD

Сканирование артефактов сборки перед развёртыванием:

```bash
sd scan ./dist --recursive --json --min-severity suspicious
```

Используйте код выхода для автоматизации: `0` = чисто, `1` = угрозы найдены, `2` = ошибка сканирования.

### Ежедневное сканирование веб-сервера

Планирование ночного сканирования веб-доступных каталогов:

```bash
sd scan /var/www /srv/uploads --recursive \
  --auto-quarantine \
  --report /var/log/prx-sd/daily-$(date +%Y%m%d).json \
  --exclude "*.log"
```

### Криминалистическое расследование

Сканирование образа диска, смонтированного в режиме только для чтения:

```bash
sudo mount -o ro /dev/sdb1 /mnt/evidence
sd scan /mnt/evidence --recursive --json --threads 1 --max-size-mb 500
```

::: warning Крупные сканирования
При сканировании миллионов файлов используйте `--threads` для управления использованием ресурсов и `--max-size-mb` для пропуска очень больших файлов, которые могут замедлить сканирование.
:::

### Быстрая проверка домашнего каталога

Быстрое сканирование распространённых мест угроз:

```bash
sd scan ~/Downloads ~/Desktop /tmp --recursive
```

## Настройка производительности

| Файлов | Приблизительное время | Примечания |
|--------|----------------------|------------|
| 1 000 | < 1 секунды | Уровень хешей разрешает большинство файлов |
| 10 000 | 2-5 секунд | Правила YARA добавляют ~0,3 мс на файл |
| 100 000 | 20-60 секунд | Зависит от размеров и типов файлов |
| 1 000 000+ | 5-15 минут | Используйте `--threads` и `--exclude` |

Факторы, влияющие на скорость сканирования:

- **Дисковый ввод/вывод** — SSD в 5-10 раз быстрее HDD для случайного чтения
- **Распределение размеров файлов** — Много маленьких файлов быстрее нескольких больших
- **Уровни обнаружения** — Сканирование только по хешам (`--no-yara --no-heuristics`) самое быстрое
- **Количество потоков** — Больше потоков помогает на многоядерных системах с быстрым хранилищем

## Следующие шаги

- [Сканирование памяти](./memory-scan) — сканирование памяти запущенных процессов
- [Обнаружение руткитов](./rootkit) — проверка на угрозы уровня ядра
- [Сканирование USB](./usb-scan) — сканирование съёмных носителей
- [Движок обнаружения](../detection/) — как работает каждый уровень обнаружения
