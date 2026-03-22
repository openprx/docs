---
title: Варианты
description: "Варианты в Fenfa: платформы iOS, Android, macOS, Windows, Linux. Конфигурация форматов файлов, поддержка нескольких флейворов и управление через API."
---

# Варианты

Вариант — это конкретная платформа или флейвор продукта. Один продукт может иметь несколько вариантов (например, «iOS», «Android», «macOS»).

## Поддерживаемые платформы

| Платформа | Ожидаемые форматы файлов | Поведение установки |
|-----------|--------------------------|---------------------|
| `ios` | `.ipa` | OTA через `itms-services://` |
| `android` | `.apk` | Прямое скачивание APK |
| `macos` | `.dmg`, `.pkg`, `.zip` | Прямое скачивание |
| `windows` | `.exe`, `.msi`, `.zip` | Прямое скачивание |
| `linux` | `.deb`, `.rpm`, `.AppImage`, `.tar.gz` | Прямое скачивание |

## Создание варианта

```bash
curl -X POST https://dist.example.com/admin/api/products/{product_id}/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "name": "iOS",
    "description": "iPhone and iPad release"
  }'
```

### Поля варианта

| Поле | Тип | Обязательно | Описание |
|------|-----|:-----------:|----------|
| `platform` | string | Да | Идентификатор платформы (см. таблицу выше) |
| `name` | string | Да | Отображаемое название варианта |
| `description` | string | Нет | Описание варианта |

## Несколько флейворов на одной платформе

Для одной платформы допускается несколько вариантов. Типичные сценарии:

- **Beta и Stable** — отдельные варианты iOS для бета-тестирования и стабильного релиза
- **Arm64 и x86_64** — отдельные варианты macOS для разных архитектур
- **Enterprise и Consumer** — разные флейворы одного приложения

```bash
# Стабильный вариант iOS
curl -X POST .../products/1/variants \
  -d '{"platform": "ios", "name": "iOS Stable"}'

# Бета-вариант iOS
curl -X POST .../products/1/variants \
  -d '{"platform": "ios", "name": "iOS Beta"}'
```

## Получение вариантов продукта

```bash
curl https://dist.example.com/admin/api/products/1/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Обновление варианта

```bash
curl -X PUT https://dist.example.com/admin/api/products/1/variants/2 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "iOS (Beta)", "description": "TestFlight alternative"}'
```

## Удаление варианта

```bash
curl -X DELETE https://dist.example.com/admin/api/products/1/variants/2 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Удаление варианта удаляет все его релизы и файлы. Это действие необратимо.
:::

## Поведение публичной страницы

На публичной странице дистрибуции (`/d/{slug}`) варианты группируются по платформе. Если для одной платформы существует несколько вариантов, они отображаются в виде отдельных вкладок или секций.

## Следующие шаги

- [Релизы](./releases) — загрузка и управление релизами
- [Дистрибуция iOS](../distribution/ios) — настройка iOS OTA
- [API](../api/) — автоматизация через REST API
