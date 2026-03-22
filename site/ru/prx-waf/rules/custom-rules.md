---
title: Пользовательские правила
description: "Написание пользовательских правил обнаружения для PRX-WAF. Пошаговое руководство с примерами для контроля доступа, блокировки ботов, ограничения скорости и защиты конкретных приложений."
---

# Пользовательские правила

PRX-WAF упрощает написание пользовательских правил обнаружения, адаптированных к конкретному приложению. Правила пишутся на YAML и размещаются в каталоге `rules/custom/`.

## Начало работы

1. Создайте новый YAML-файл в `rules/custom/`:

```bash
cp rules/custom/example.yaml rules/custom/myapp.yaml
```

2. Отредактируйте файл в соответствии со [схемой правил YAML](./yaml-syntax).

3. Проверьте перед развёртыванием:

```bash
python rules/tools/validate.py rules/custom/myapp.yaml
```

4. Правила перезагружаются автоматически, или запустите перезагрузку вручную:

```bash
prx-waf rules reload
```

## Пример: Блокировка доступа к внутренним путям

Запретить внешний доступ к внутренним API-эндпоинтам:

```yaml
version: "1.0"
description: "Block access to internal paths"

rules:
  - id: "CUSTOM-ACCESS-001"
    name: "Block internal API endpoints"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(internal|_debug|_profiler|actuator)/"
    action: "block"
    tags: ["custom", "access-control"]
```

## Пример: Обнаружение подозрительных User-Agent

Журналировать запросы от автоматизированных инструментов для мониторинга:

```yaml
  - id: "CUSTOM-BOT-001"
    name: "Log suspicious automated tool user-agents"
    category: "scanner"
    severity: "medium"
    paranoia: 2
    field: "user_agent"
    operator: "regex"
    value: "(?i)(masscan|zgrab|python-requests/|go-http-client|curl/)"
    action: "log"
    tags: ["custom", "bot", "scanner"]
```

## Пример: Ограничение скорости по параметрам запроса

Блокировать запросы с чрезмерным количеством параметров запроса (распространено в DoS-атаках):

```yaml
  - id: "CUSTOM-DOS-001"
    name: "Block excessive query parameters"
    category: "dos"
    severity: "medium"
    paranoia: 1
    field: "query_arg_count"
    operator: "gt"
    value: "50"
    action: "block"
    tags: ["custom", "dos"]
```

## Пример: Блокировка определённых расширений файлов

Запретить доступ к резервным или конфигурационным файлам:

```yaml
  - id: "CUSTOM-FILE-001"
    name: "Block access to backup and config files"
    category: "access-control"
    severity: "high"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)\\.(bak|backup|old|orig|sql|tar|gz|zip|7z|rar|conf|env|ini|log)$"
    action: "block"
    tags: ["custom", "access-control", "file-extension"]
```

## Пример: Обнаружение credential stuffing

Обнаруживать быстрые попытки входа (полезно вместе со встроенным ограничителем скорости):

```yaml
  - id: "CUSTOM-AUTH-001"
    name: "Log login endpoint access for monitoring"
    category: "access-control"
    severity: "low"
    paranoia: 1
    field: "path"
    operator: "regex"
    value: "(?i)^/(api/)?(login|signin|authenticate|auth/token)"
    action: "log"
    tags: ["custom", "authentication", "monitoring"]
```

## Пример: Виртуальный патч CVE

Быстрое создание виртуального патча для конкретной уязвимости:

```yaml
  - id: "CUSTOM-CVE-001"
    name: "Virtual patch for MyApp RCE (CVE-2026-XXXXX)"
    category: "rce"
    severity: "critical"
    paranoia: 1
    field: "body"
    operator: "regex"
    value: "(?i)\\$\\{jndi:(ldap|rmi|dns)://[^}]+\\}"
    action: "block"
    tags: ["custom", "cve", "rce"]
    reference: "https://nvd.nist.gov/vuln/detail/CVE-2026-XXXXX"
```

## Использование скриптов Rhai для сложной логики

Для правил, требующих большего, чем сопоставление паттернов, PRX-WAF поддерживает скриптинг Rhai в Фазе 12:

```rhai
// rules/custom/scripts/geo-block.rhai
// Block requests from specific countries during maintenance
fn check(ctx) {
    let path = ctx.path;
    let country = ctx.geo_country;

    if path.starts_with("/maintenance") && country != "US" {
        return block("Maintenance mode: US-only access");
    }

    allow()
}
```

::: info
Скрипты Rhai выполняются в песочнице. Они не могут обращаться к файловой системе, сети или любым системным ресурсам за пределами контекста запроса.
:::

## Лучшие практики

1. **Начинайте с `action: log`** — мониторьте перед блокировкой для раннего обнаружения ложных срабатываний.

2. **Используйте специфичные якоря regex** — используйте `^` и `$` для предотвращения частичных совпадений, вызывающих ложные срабатывания.

3. **Устанавливайте подходящие уровни паранойи** — если правило может совпадать с легитимным трафиком, установите паранойю 2 или 3 вместо блокировки на уровне 1.

4. **Используйте не захватывающие группы** — используйте `(?:...)` вместо `(...)` для ясности и производительности.

5. **Добавляйте описательные теги** — теги отображаются в Admin UI и помогают с фильтрацией событий безопасности.

6. **Включайте ссылки** — добавляйте URL `reference`, ссылающийся на соответствующий CVE, статью OWASP или внутреннюю документацию.

7. **Тестируйте regex** — проверяйте паттерны regex перед развёртыванием:

```bash
python3 -c "import re; re.compile('your_pattern')"
```

8. **Проверяйте перед развёртыванием** — всегда запускайте валидатор:

```bash
python rules/tools/validate.py rules/custom/
```

## Импорт через CLI

Вы также можете импортировать правила из файлов или URL с помощью CLI:

```bash
# Импортировать из локального файла
prx-waf rules import /path/to/rules.yaml

# Импортировать из URL
prx-waf rules import https://example.com/rules/custom.yaml

# Проверить файл правил
prx-waf rules validate /path/to/rules.yaml
```

## Импорт правил ModSecurity

Конвертируйте существующие правила ModSecurity `.conf` в формат YAML PRX-WAF:

```bash
python rules/tools/modsec2yaml.py input.conf output.yaml
```

::: warning
Конвертер ModSecurity поддерживает базовое подмножество директив SecRule (ARGS, REQUEST_HEADERS, REQUEST_URI, REQUEST_BODY). Сложные правила ModSecurity с цепочками или Lua-скриптами не поддерживаются и требуют ручной переработки.
:::

## Следующие шаги

- [Синтаксис YAML](./yaml-syntax) — полный справочник схемы правил
- [Встроенные правила](./builtin-rules) — изучите существующие правила перед написанием новых
- [Обзор движка правил](./index) — понимание того, как правила оцениваются в конвейере
