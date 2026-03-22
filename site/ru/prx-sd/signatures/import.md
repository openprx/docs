---
title: Импорт хешей
description: "Импорт пользовательских списков блокировок хешей и баз данных сигнатур ClamAV в PRX-SD."
---

# Импорт хешей

PRX-SD позволяет импортировать пользовательские списки блокировок хешей и базы данных сигнатур ClamAV для расширения охвата обнаружения с помощью собственной разведки угроз или организационных списков блокировок.

## Импорт пользовательских хешей

### Использование

```bash
sd import [OPTIONS] <FILE>
```

### Параметры

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|-------------|----------|
| `--format` | `-f` | автоопределение | Формат хеша: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | имя файла | Метка для импортируемого набора |
| `--replace` | | `false` | Заменить существующие записи с той же меткой |
| `--dry-run` | | `false` | Проверить файл без импорта |
| `--quiet` | `-q` | `false` | Подавить вывод прогресса |

### Поддерживаемые форматы файлов хешей

PRX-SD принимает несколько распространённых форматов:

**Простой список** — один хеш на строку:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**Хеш с меткой** — хеш, за которым следует пробел и необязательное описание:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**Формат CSV** — разделённый запятыми с заголовками:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**Строки комментариев** — строки, начинающиеся с `#`, игнорируются:

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
Формат хеша определяется автоматически по длине: 32 символа = MD5, 40 символов = SHA-1, 64 символа = SHA-256. Используйте `--format` для переопределения, если автоматическое определение не работает.
:::

### Примеры импорта

```bash
# Импортировать список блокировок SHA-256
sd import threat_hashes.txt

# Импортировать с явным форматом и меткой
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# Пробный запуск для проверки файла
sd import --dry-run suspicious_hashes.csv

# Заменить существующий набор импорта
sd import --replace --label "daily-feed" today_hashes.txt
```

### Вывод при импорте

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## Импорт баз данных ClamAV

### Использование

```bash
sd import-clamav [OPTIONS] <FILE>
```

### Параметры

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|-------------|----------|
| `--type` | `-t` | автоопределение | Тип базы данных: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | Подавить вывод прогресса |

### Поддерживаемые форматы ClamAV

| Формат | Расширение | Описание |
|--------|-----------|----------|
| **CVD** | `.cvd` | ClamAV Virus Database (сжатая, подписанная) |
| **CLD** | `.cld` | ClamAV Local Database (инкрементальные обновления) |
| **HDB** | `.hdb` | База данных MD5-хешей (обычный текст) |
| **HSB** | `.hsb` | База данных SHA-256 хешей (обычный текст) |
| **NDB** | `.ndb` | Расширенный формат сигнатур (на основе тела) |

::: warning
Файлы CVD/CLD могут быть очень большими. Только файл `main.cvd` содержит более 6 миллионов сигнатур и требует около 300 МБ дискового пространства после импорта.
:::

### Примеры импорта ClamAV

```bash
# Импортировать основную базу данных ClamAV
sd import-clamav /var/lib/clamav/main.cvd

# Импортировать базу данных ежедневных обновлений
sd import-clamav /var/lib/clamav/daily.cvd

# Импортировать базу данных хешей в виде обычного текста
sd import-clamav custom_sigs.hdb

# Импортировать базу данных хешей SHA-256
sd import-clamav my_hashes.hsb
```

### Настройка интеграции с ClamAV

Для использования сигнатур ClamAV с PRX-SD:

1. Установите freshclam (обновлятель ClamAV):

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. Загрузите базы данных:

```bash
sudo freshclam
```

3. Импортируйте в PRX-SD:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. Включите ClamAV в конфигурации:

```toml
[signatures.sources]
clamav = true
```

## Управление импортированными хешами

Просмотр импортированных наборов хешей:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

Удаление импортированного набора:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## Следующие шаги

- [Пользовательские правила YARA](./custom-rules) — создание правил обнаружения на основе паттернов
- [Источники сигнатур](./sources) — все доступные источники разведки угроз
- [Обновление сигнатур](./update) — поддержание актуальности баз данных
- [Обзор разведки угроз](./index) — архитектура базы данных
