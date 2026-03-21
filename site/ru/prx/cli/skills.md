---
title: prx skills
description: Управление устанавливаемыми навыками, расширяющими возможности агента PRX.
---

# prx skills

Управление навыками — модульными пакетами возможностей, расширяющими функциональность агента PRX. Навыки объединяют промпты, конфигурации инструментов и WASM-плагины в устанавливаемые единицы.

## Использование

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## Подкоманды

### `prx skills list`

Вывод списка установленных навыков и доступных навыков из реестра.

```bash
prx skills list [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--installed` | | `false` | Показать только установленные навыки |
| `--available` | | `false` | Показать только доступные (ещё не установленные) навыки |
| `--json` | `-j` | `false` | Вывод в формате JSON |

**Пример вывода:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

Установка навыка из реестра или по локальному пути.

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--version` | `-v` | последняя | Конкретная версия для установки |
| `--force` | `-f` | `false` | Переустановить, даже если уже установлен |

```bash
# Установка из реестра
prx skills install code-review

# Установка конкретной версии
prx skills install web-research --version 1.0.2

# Установка из локального пути
prx skills install ./my-custom-skill/

# Принудительная переустановка
prx skills install code-review --force
```

### `prx skills remove`

Удаление навыка.

```bash
prx skills remove <NAME> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--force` | `-f` | `false` | Пропустить запрос подтверждения |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## Структура навыка

Пакет навыка содержит:

```
my-skill/
  skill.toml          # Метаданные и конфигурация навыка
  system_prompt.md    # Дополнительные инструкции системного промпта
  tools.toml          # Определения и разрешения инструментов
  plugin.wasm         # Необязательный бинарник WASM-плагина
```

Манифест `skill.toml`:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## Каталог навыков

Установленные навыки хранятся в:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## См. также

- [Обзор плагинов](/ru/prx/plugins/) — система WASM-плагинов
- [Обзор инструментов](/ru/prx/tools/) — встроенные инструменты
- [Руководство разработчика](/ru/prx/plugins/developer-guide) — создание пользовательских плагинов
