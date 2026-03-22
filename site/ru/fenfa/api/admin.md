---
title: Admin API
description: "Admin API Fenfa: управление продуктами, вариантами, релизами, устройствами iOS, Apple Developer API, настройками и экспортом данных."
---

# Admin API

Admin API предоставляет полный доступ ко всем административным операциям. Требует токен с правами `admin`.

## Продукты

### Список продуктов

```
GET /admin/api/products
```

```bash
curl https://dist.example.com/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Создание продукта

```
POST /admin/api/products
```

```bash
curl -X POST https://dist.example.com/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "slug": "my-app", "description": "My application"}'
```

### Обновление продукта

```
PUT /admin/api/products/{id}
```

```bash
curl -X PUT https://dist.example.com/admin/api/products/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App v2", "description": "Updated description"}'
```

### Удаление продукта

```
DELETE /admin/api/products/{id}
```

```bash
curl -X DELETE https://dist.example.com/admin/api/products/1 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Варианты

### Список вариантов продукта

```
GET /admin/api/products/{product_id}/variants
```

### Создание варианта

```
POST /admin/api/products/{product_id}/variants
```

```bash
curl -X POST https://dist.example.com/admin/api/products/1/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform": "ios", "name": "iOS", "description": "iPhone and iPad"}'
```

### Обновление варианта

```
PUT /admin/api/products/{product_id}/variants/{variant_id}
```

### Удаление варианта

```
DELETE /admin/api/products/{product_id}/variants/{variant_id}
```

## Релизы

### Список релизов варианта

```
GET /admin/api/variants/{variant_id}/releases
```

```bash
curl https://dist.example.com/admin/api/variants/1/releases \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Обновление релиза

```
PUT /admin/api/releases/{id}
```

```bash
# Активировать/деактивировать или обновить changelog
curl -X PUT https://dist.example.com/admin/api/releases/5 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": false, "changelog": "Updated release notes"}'
```

### Удаление релиза

```
DELETE /admin/api/releases/{id}
```

## События

Просмотр событий скачивания для релиза:

```
GET /admin/api/releases/{release_id}/events
```

```bash
curl https://dist.example.com/admin/api/releases/5/events \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## iOS устройства

### Список зарегистрированных устройств

```
GET /admin/api/ios/devices
```

```bash
curl https://dist.example.com/admin/api/ios/devices \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Синхронизация с Apple Developer API

```
POST /admin/api/ios/sync
```

```bash
curl -X POST https://dist.example.com/admin/api/ios/sync \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

Регистрирует все сохранённые UDID в Apple Developer Portal. Требует настроенного Apple Developer API (Key ID, Issuer ID, Private Key).

## Настройки

### Получить настройки

```
GET /admin/api/settings
```

### Обновить настройки

```
PUT /admin/api/settings
```

```bash
curl -X PUT https://dist.example.com/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apple_key_id": "ABC123DEF",
    "apple_issuer_id": "12345678-1234-1234-1234-123456789012",
    "apple_private_key": "-----BEGIN EC PRIVATE KEY-----\n..."
  }'
```

## Экспорт данных

Экспорт всех данных для резервного копирования или миграции:

```
GET /admin/api/export
```

```bash
curl https://dist.example.com/admin/api/export \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -o fenfa-export.json
```

## Следующие шаги

- [Upload API](./upload) — API загрузки для CI/CD
- [Конфигурация](../configuration/) — управление токенами и настройками
