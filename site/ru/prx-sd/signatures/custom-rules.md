---
title: Пользовательские правила YARA
description: "Создание, тестирование и развёртывание пользовательских правил YARA для PRX-SD для обнаружения угроз, специфичных для вашей среды."
---

# Пользовательские правила YARA

YARA — это язык сопоставления паттернов, предназначенный для обнаружения вредоносных программ. PRX-SD поддерживает загрузку пользовательских правил YARA наряду со встроенными и общественными правилами, что позволяет создавать логику обнаружения, адаптированную к вашему конкретному ландшафту угроз.

## Расположение файлов правил

Поместите пользовательские правила YARA в каталог `~/.prx-sd/yara/`:

```
~/.prx-sd/yara/
  custom_ransomware.yar
  internal_threats.yar
  compliance_checks.yar
```

PRX-SD загружает все файлы `.yar` и `.yara` из этого каталога при запуске и во время обновления сигнатур. Правила компилируются в оптимизированный кеш (`compiled.yarc`) для быстрого сканирования.

::: tip
Поддерживаются подкаталоги. Организуйте правила по категориям для упрощения управления:
```
~/.prx-sd/yara/
  ransomware/
    lockbit_variant.yar
    custom_encryptor.yar
  webshells/
    internal_webshell.yar
  compliance/
    pii_detection.yar
```
:::

## Синтаксис правил YARA

Правило YARA состоит из трёх разделов: **meta**, **strings** и **condition**.

### Базовая структура правила

```yara
rule Detect_CustomMalware : trojan
{
    meta:
        author = "Security Team"
        description = "Detects custom trojan used in targeted attack"
        severity = "high"
        date = "2026-03-21"
        reference = "https://internal.wiki/incident-2026-042"

    strings:
        $magic = { 4D 5A 90 00 }              // PE header (hex bytes)
        $str1 = "cmd.exe /c" ascii nocase      // ASCII string, case-insensitive
        $str2 = "powershell -enc" ascii nocase
        $str3 = "C:\\Users\\Public\\payload" wide  // UTF-16 string
        $mutex = "Global\\CustomMutex_12345"
        $regex = /https?:\/\/[a-z0-9]{8,12}\.onion/ // Regex pattern

    condition:
        $magic at 0 and
        (2 of ($str*)) and
        ($mutex or $regex)
}
```

### Ключевые элементы синтаксиса

| Элемент | Синтаксис | Описание |
|---------|----------|----------|
| Шестнадцатеричные строки | `{ 4D 5A ?? 00 }` | Байтовые паттерны с wildcards (`??`) |
| Текстовые строки | `"text" ascii` | Простые ASCII-строки |
| Широкие строки | `"text" wide` | Строки в кодировке UTF-16LE |
| Без учёта регистра | `"text" nocase` | Сопоставление независимо от регистра |
| Регулярные выражения | `/pattern/` | Паттерны регулярных выражений |
| Теги | `rule Name : tag1 tag2` | Теги категоризации |
| Размер файла | `filesize < 1MB` | Условие по размеру файла |
| Точка входа | `entrypoint` | Смещение точки входа PE/ELF |
| По смещению | `$str at 0x100` | Строка по конкретному смещению |
| В диапазоне | `$str in (0..1024)` | Строка в диапазоне байтов |
| Количество | `#str > 3` | Количество вхождений строки |

### Уровни серьёзности

PRX-SD читает поле метаданных `severity` для определения классификации угрозы:

| Серьёзность | Вердикт PRX-SD |
|------------|---------------|
| `critical` | MALICIOUS |
| `high` | MALICIOUS |
| `medium` | SUSPICIOUS |
| `low` | SUSPICIOUS |
| (не задано) | SUSPICIOUS |

## Примеры правил

### Обнаружение подозрительного скрипта

```yara
rule Suspicious_PowerShell_Download : script
{
    meta:
        author = "Security Team"
        description = "PowerShell script downloading and executing remote content"
        severity = "high"

    strings:
        $dl1 = "Invoke-WebRequest" ascii nocase
        $dl2 = "Net.WebClient" ascii nocase
        $dl3 = "DownloadString" ascii nocase
        $dl4 = "DownloadFile" ascii nocase
        $exec1 = "Invoke-Expression" ascii nocase
        $exec2 = "iex(" ascii nocase
        $exec3 = "Start-Process" ascii nocase
        $enc = "-EncodedCommand" ascii nocase
        $bypass = "-ExecutionPolicy Bypass" ascii nocase

    condition:
        filesize < 5MB and
        (any of ($dl*)) and
        (any of ($exec*) or $enc or $bypass)
}
```

### Обнаружение криптовалютных майнеров

```yara
rule Crypto_Miner_Strings : miner
{
    meta:
        author = "Security Team"
        description = "Detects cryptocurrency mining software"
        severity = "medium"

    strings:
        $pool1 = "stratum+tcp://" ascii
        $pool2 = "stratum+ssl://" ascii
        $pool3 = "pool.minexmr.com" ascii
        $pool4 = "xmrpool.eu" ascii
        $algo1 = "cryptonight" ascii nocase
        $algo2 = "randomx" ascii nocase
        $algo3 = "ethash" ascii nocase
        $wallet = /[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}/ ascii  // Monero address

    condition:
        (any of ($pool*)) or
        ((any of ($algo*)) and $wallet)
}
```

### Обнаружение веб-шеллов

```yara
rule PHP_Webshell_Generic : webshell
{
    meta:
        author = "Security Team"
        description = "Generic PHP webshell detection"
        severity = "critical"

    strings:
        $php = "<?php" ascii nocase
        $eval1 = "eval(" ascii nocase
        $eval2 = "assert(" ascii nocase
        $eval3 = "preg_replace" ascii nocase
        $input1 = "$_GET[" ascii
        $input2 = "$_POST[" ascii
        $input3 = "$_REQUEST[" ascii
        $input4 = "$_COOKIE[" ascii
        $cmd1 = "system(" ascii nocase
        $cmd2 = "passthru(" ascii nocase
        $cmd3 = "shell_exec(" ascii nocase
        $cmd4 = "exec(" ascii nocase
        $obf1 = "base64_decode" ascii nocase
        $obf2 = "str_rot13" ascii nocase
        $obf3 = "gzinflate" ascii nocase

    condition:
        $php and
        (any of ($eval*)) and
        (any of ($input*)) and
        (any of ($cmd*) or any of ($obf*))
}
```

## Тестирование правил

Проверьте правила перед развёртыванием:

```bash
# Проверка компиляции файла правил (синтаксическая валидация)
sd yara validate ~/.prx-sd/yara/custom_ransomware.yar

# Тестирование правила на конкретном файле
sd yara test ~/.prx-sd/yara/custom_ransomware.yar /path/to/sample

# Тестирование всех пользовательских правил на каталоге образцов
sd yara test ~/.prx-sd/yara/ /path/to/samples/ --recursive

# Пробное сканирование с использованием только пользовательских правил
sd scan --yara-only --yara-path ~/.prx-sd/yara/ /path/to/test
```

::: warning
Всегда тестируйте новые правила на наборе заведомо чистых файлов для проверки ложных срабатываний перед развёртыванием в производственном мониторинге.
:::

## Перезагрузка правил

После добавления или изменения правил выполните перезагрузку без перезапуска демона:

```bash
# Перекомпилировать и перезагрузить правила
sd yara reload

# При работе в режиме демона отправьте SIGHUP
kill -HUP $(cat ~/.prx-sd/sd.pid)
```

## Участие в разработке правил

Поделитесь своими правилами с сообществом PRX-SD:

1. Сделайте fork репозитория [prx-sd-signatures](https://github.com/OpenPRX/prx-sd-signatures)
2. Добавьте своё правило в соответствующий каталог категории
3. Включите полные поля `meta` (автор, описание, серьёзность, ссылка)
4. Протестируйте на вредоносных образцах и чистых файлах
5. Отправьте pull request с хешами образцов для валидации

## Следующие шаги

- [Источники сигнатур](./sources) — общественные и сторонние источники правил YARA
- [Импорт хешей](./import) — добавление списков блокировок на основе хешей
- [Обновление сигнатур](./update) — поддержание актуальности всех правил
- [Обзор разведки угроз](./index) — полная архитектура сигнатур
