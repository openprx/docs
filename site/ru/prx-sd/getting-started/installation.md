---
title: Установка
description: Установка PRX-SD на Linux, macOS или Windows WSL2 с помощью скрипта установки, Cargo, сборки из исходников или Docker.
---

# Установка

PRX-SD поддерживает четыре метода установки. Выберите тот, который лучше всего подходит для вашего рабочего процесса.

::: tip Рекомендуется
**Скрипт установки** — самый быстрый способ начать работу. Он определяет вашу платформу, скачивает правильный бинарный файл и помещает его в PATH.
:::

## Требования

| Требование | Минимум | Примечания |
|------------|---------|------------|
| Операционная система | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | Нативный Windows не поддерживается |
| Дисковое пространство | 200 МБ | ~50 МБ бинарный файл + ~150 МБ база данных сигнатур |
| ОЗУ | 512 МБ | 2 ГБ+ рекомендуется для сканирования больших каталогов |
| Rust (только для сборки из исходников) | 1.85.0 | Не нужен для скрипта или Docker |
| Git (только для сборки из исходников) | 2.30+ | Для клонирования репозитория |
| Docker (только для Docker) | 20.10+ | Или Podman 3.0+ |

## Метод 1: Скрипт установки (рекомендуется)

Скрипт установки скачивает последний выпущенный бинарный файл для вашей платформы и помещает его в `/usr/local/bin`.

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

Для установки конкретной версии:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash -s -- --version 0.5.0
```

Скрипт поддерживает следующие переменные окружения:

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `INSTALL_DIR` | `/usr/local/bin` | Пользовательский каталог установки |
| `VERSION` | `latest` | Конкретная версия выпуска |
| `ARCH` | автоопределение | Переопределить архитектуру (`x86_64`, `aarch64`) |

## Метод 2: Установка через Cargo

Если у вас установлен Rust, можно установить напрямую с crates.io:

```bash
cargo install prx-sd
```

Это компилирует из исходников и помещает бинарный файл `sd` в `~/.cargo/bin/`.

::: warning Зависимости сборки
Cargo install компилирует нативные зависимости. На Debian/Ubuntu может потребоваться:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
На macOS требуются инструменты командной строки Xcode:
```bash
xcode-select --install
```
:::

## Метод 3: Сборка из исходников

Клонируйте репозиторий и соберите в режиме release:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

Бинарный файл находится в `target/release/sd`. Скопируйте его в PATH:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Параметры сборки

| Флаг функции | По умолчанию | Описание |
|-------------|-------------|----------|
| `yara` | включён | Движок правил YARA-X |
| `ml` | отключён | Движок вывода ML ONNX |
| `gui` | отключён | Настольный GUI Tauri + Vue 3 |
| `virustotal` | отключён | Интеграция с API VirusTotal |

Сборка с поддержкой вывода ML:

```bash
cargo build --release --features ml
```

Сборка настольного GUI:

```bash
cargo build --release --features gui
```

## Метод 4: Docker

Загрузите официальный образ Docker:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

Запустите сканирование, монтируя целевой каталог:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

Для мониторинга в реальном времени запустите как демон:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
В корне репозитория доступен `docker-compose.yml` для производственных развёртываний с автоматическим обновлением сигнатур.
:::

## Примечания по платформам

### Linux

PRX-SD работает на любом современном дистрибутиве Linux. Для мониторинга в реальном времени используется подсистема `inotify`. Может потребоваться увеличить лимит наблюдателей для больших деревьев каталогов:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Обнаружение руткитов и сканирование памяти требуют привилегий root.

### macOS

PRX-SD использует FSEvents для мониторинга в реальном времени на macOS. Поддерживаются как Apple Silicon (aarch64), так и Intel (x86_64). Скрипт установки автоматически определяет вашу архитектуру.

::: warning macOS Gatekeeper
Если macOS блокирует бинарный файл, удалите атрибут карантина:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD работает внутри WSL2 с использованием бинарного файла Linux. Сначала установите WSL2 с дистрибутивом Linux, затем следуйте шагам установки для Linux. Нативная поддержка Windows запланирована в будущем выпуске.

## Проверка установки

После установки убедитесь, что `sd` работает:

```bash
sd --version
```

Ожидаемый вывод:

```
prx-sd 0.5.0
```

Проверьте полный статус системы, включая базу данных сигнатур:

```bash
sd info
```

Отображает установленную версию, количество сигнатур, количество правил YARA и пути к базам данных.

## Удаление

### Скрипт / Cargo install

```bash
# Удалить бинарный файл
sudo rm /usr/local/bin/sd
# Или если установлено через Cargo
cargo uninstall prx-sd

# Удалить базу данных сигнатур и конфигурацию
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## Следующие шаги

- [Быстрый старт](./quickstart) — начните сканирование за 5 минут
- [Сканирование файлов и каталогов](../scanning/file-scan) — полный справочник команды `sd scan`
- [Обзор движка обнаружения](../detection/) — понимание многоуровневого конвейера
