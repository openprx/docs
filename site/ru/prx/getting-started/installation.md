---
title: Установка
description: Установка PRX на Linux, macOS или Windows WSL2 с помощью скрипта установки, Cargo, сборки из исходного кода или Docker.
---

# Установка

PRX поставляется в виде единого статически скомпонованного бинарника `prx`. Выберите способ установки, подходящий для вашего рабочего процесса.

## Предварительные требования

Перед установкой PRX убедитесь, что ваша система соответствует следующим требованиям:

| Требование | Подробности |
|------------|-------------|
| **ОС** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel) или Windows через WSL2 |
| **Rust** | 1.92.0+ (редакция 2024) — требуется только для установки через Cargo или сборки из исходного кода |
| **Системные пакеты** | `pkg-config` (Linux, только для сборки из исходного кода) |
| **Дисковое пространство** | ~50 МБ для бинарника, ~200 МБ со средой выполнения WASM-плагинов |
| **ОЗУ** | Минимум 64 МБ для демона (без локального инференса LLM) |

::: tip
Если вы используете скрипт установки или Docker, наличие Rust в системе не требуется.
:::

## Способ 1: Скрипт установки (рекомендуется)

Самый быстрый способ начать. Скрипт определяет вашу ОС и архитектуру, загружает последний релизный бинарник и размещает его в вашем `PATH`.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

По умолчанию скрипт устанавливает `prx` в `~/.local/bin/`. Убедитесь, что этот каталог включён в ваш `PATH`:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Установка конкретной версии:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

Установка в пользовательский каталог:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## Способ 2: Установка через Cargo

Если у вас установлен набор инструментов Rust, вы можете установить PRX напрямую из crates.io:

```bash
cargo install openprx
```

Это собирает релизный бинарник с параметрами по умолчанию и размещает его в `~/.cargo/bin/prx`.

Установка со всеми дополнительными возможностями (шифрование Matrix E2EE, WhatsApp Web и т.д.):

```bash
cargo install openprx --all-features
```

::: info Флаги функций
PRX использует флаги функций Cargo для дополнительной поддержки каналов:

| Функция | Описание |
|---------|----------|
| `channel-matrix` | Канал Matrix с поддержкой сквозного шифрования |
| `whatsapp-web` | Канал WhatsApp Web с поддержкой нескольких устройств |
| **default** | Все стабильные каналы включены |
:::

## Способ 3: Сборка из исходного кода

Для разработки или запуска последнего невыпущенного кода:

```bash
# Клонирование репозитория
git clone https://github.com/openprx/prx.git
cd prx

# Сборка релизного бинарника
cargo build --release

# Бинарник расположен по пути target/release/prx
./target/release/prx --version
```

Сборка со всеми функциями:

```bash
cargo build --release --all-features
```

Установка локально собранного бинарника в каталог Cargo bin:

```bash
cargo install --path .
```

### Отладочная сборка

Для ускорения итераций во время разработки используйте отладочную сборку:

```bash
cargo build
./target/debug/prx --version
```

::: warning
Отладочные сборки значительно медленнее при выполнении. Для промышленной эксплуатации или бенчмаркинга всегда используйте `--release`.
:::

## Способ 4: Docker

Запуск PRX в контейнере без локальной установки:

```bash
docker pull ghcr.io/openprx/prx:latest
```

Запуск с подключённым каталогом конфигурации:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

Или с помощью Docker Compose:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
При запуске в Docker задавайте ключи API ваших LLM через переменные окружения или подключайте файл конфигурации. Подробнее — в разделе [Конфигурация](../config/).
:::

## Проверка установки

После установки убедитесь, что PRX работает:

```bash
prx --version
```

Ожидаемый вывод:

```
prx 0.3.0
```

Запустите проверку состояния:

```bash
prx doctor
```

Команда проверяет набор инструментов Rust (если установлен), системные зависимости, корректность файла конфигурации и сетевое подключение к LLM-провайдерам.

## Примечания по платформам

### Linux

PRX работает на любом современном дистрибутиве Linux (ядро 4.18+). Бинарник статически скомпонован с `rustls` для TLS, поэтому установка OpenSSL не требуется.

Для функций песочницы могут потребоваться дополнительные пакеты:

```bash
# Бэкенд песочницы Firejail
sudo apt install firejail

# Бэкенд песочницы Bubblewrap
sudo apt install bubblewrap

# Бэкенд песочницы Docker (требуется демон Docker)
sudo apt install docker.io
```

### macOS

PRX нативно работает как на Apple Silicon (aarch64), так и на Intel (x86_64) Mac. Канал iMessage доступен только на macOS.

При сборке из исходного кода убедитесь, что у вас установлены Xcode Command Line Tools:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX поддерживается в Windows через WSL2. Установите дистрибутив Linux (рекомендуется Ubuntu) и следуйте инструкциям для Linux внутри вашего окружения WSL2.

```powershell
# Из PowerShell (установка WSL2 с Ubuntu)
wsl --install -d Ubuntu
```

Затем внутри WSL2:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
Нативная поддержка Windows в настоящее время отсутствует. WSL2 обеспечивает производительность, близкую к нативной Linux, и является рекомендуемым подходом.
:::

## Удаление

Для удаления PRX:

```bash
# Если установлен через скрипт установки
rm ~/.local/bin/prx

# Если установлен через Cargo
cargo uninstall openprx

# Удаление конфигурации и данных (необязательно)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## Следующие шаги

- [Быстрый старт](./quickstart) — запуск PRX за 5 минут
- [Мастер настройки](./onboarding) — настройка LLM-провайдера
- [Конфигурация](../config/) — полный справочник конфигурации
