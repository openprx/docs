---
title: Продукты
description: "Управление продуктами и вариантами в Fenfa: создание, обновление, организация нескольких приложений и платформ через API или панель администратора."
---

# Продукты

Продукты — это верхний уровень иерархии в Fenfa. Каждый продукт представляет одно приложение и содержит несколько вариантов для разных платформ.

## Создание продукта

**Через панель администратора:**

Откройте `http://your-domain/admin`, нажмите **New Product** и заполните форму.

**Через API:**

```bash
curl -X POST https://dist.example.com/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "slug": "my-app",
    "description": "My mobile application"
  }'
```

### Поля продукта

| Поле | Тип | Обязательно | Описание |
|------|-----|:-----------:|----------|
| `name` | string | Да | Отображаемое название продукта |
| `slug` | string | Да | URL-идентификатор (только строчные буквы, цифры, дефисы) |
| `description` | string | Нет | Описание продукта |

Slug используется в публичных URL дистрибуции: `/d/{slug}`.

## Получение списка продуктов

```bash
curl https://dist.example.com/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Обновление продукта

```bash
curl -X PUT https://dist.example.com/admin/api/products/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App Renamed"}'
```

## Удаление продукта

```bash
curl -X DELETE https://dist.example.com/admin/api/products/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Удаление продукта удаляет все связанные варианты, релизы и файлы. Это действие необратимо.
:::

## Варианты

Каждый продукт содержит один или несколько вариантов. Вариант представляет конкретную платформу или флейвор приложения (например, iOS, Android, macOS).

### Создание варианта

```bash
curl -X POST https://dist.example.com/admin/api/products/1/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "name": "iOS",
    "description": "iPhone and iPad"
  }'
```

### Поддерживаемые платформы

| Значение платформы | Описание |
|-------------------|----------|
| `ios` | iPhone/iPad через OTA |
| `android` | Android APK |
| `macos` | macOS DMG/PKG/ZIP |
| `windows` | Windows EXE/MSI/ZIP |
| `linux` | Linux DEB/RPM/AppImage |

Полное описание платформ см. в разделе [Варианты](./variants).

### Обновление варианта

```bash
curl -X PUT https://dist.example.com/admin/api/products/1/variants/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "iOS (Stable)"}'
```

### Удаление варианта

```bash
curl -X DELETE https://dist.example.com/admin/api/products/1/variants/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Публичная страница дистрибуции

Каждый продукт имеет публичную страницу по адресу:

```
https://dist.example.com/d/{slug}
```

На этой странице посетители видят доступные платформы и могут скачать или установить последний активный релиз.

## Следующие шаги

- [Варианты](./variants) — платформы и конфигурация флейворов
- [Релизы](./releases) — загрузка и управление релизами
- [Дистрибуция iOS](../distribution/ios) — OTA и привязка устройств
