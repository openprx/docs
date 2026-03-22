---
title: REST API
description: "REST API Fenfa: аутентификация по токенам, скоупы upload и admin, формат ответов, коды ошибок и полный справочник эндпоинтов."
---

# REST API

Fenfa предоставляет REST API для автоматизации всех операций. API используется как CI/CD-системами для загрузки артефактов, так и инструментами администратора для управления контентом.

## Аутентификация

Все API-запросы используют аутентификацию по токену через заголовок `X-Auth-Token`:

```bash
curl https://dist.example.com/admin/api/products \
  -H "X-Auth-Token: YOUR_TOKEN"
```

### Скоупы токенов

| Скоуп | Переменная окружения | Доступ |
|-------|---------------------|--------|
| `upload` | `FENFA_UPLOAD_TOKEN` | Загрузка релизов через Upload API |
| `admin` | `FENFA_ADMIN_TOKEN` | Полный доступ ко всем операциям |

Токены с правами admin также принимаются на Upload API-эндпоинтах.

## Формат ответа

Все ответы API возвращаются в JSON в унифицированном формате:

### Успешный ответ

```json
{
  "ok": true,
  "data": { ... }
}
```

### Ответ с ошибкой

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Product not found"
  }
}
```

### Коды ошибок

| Код | HTTP-статус | Описание |
|-----|-------------|----------|
| `UNAUTHORIZED` | 401 | Отсутствующий или неверный токен |
| `FORBIDDEN` | 403 | Токен не имеет нужного скоупа |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `VALIDATION_ERROR` | 422 | Неверные параметры запроса |
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

## Обзор эндпоинтов

### Upload API (`/upload/api/`)

Требует токен с правами `upload` или `admin`.

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/upload/api/variants/{id}/releases` | Загрузить новый релиз |

### Admin API (`/admin/api/`)

Требует токен с правами `admin`.

**Продукты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/admin/api/products` | Список продуктов |
| `POST` | `/admin/api/products` | Создать продукт |
| `GET` | `/admin/api/products/{id}` | Получить продукт |
| `PUT` | `/admin/api/products/{id}` | Обновить продукт |
| `DELETE` | `/admin/api/products/{id}` | Удалить продукт |

**Варианты:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/admin/api/products/{id}/variants` | Список вариантов |
| `POST` | `/admin/api/products/{id}/variants` | Создать вариант |
| `PUT` | `/admin/api/products/{id}/variants/{id}` | Обновить вариант |
| `DELETE` | `/admin/api/products/{id}/variants/{id}` | Удалить вариант |

**Релизы:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/admin/api/variants/{id}/releases` | Список релизов |
| `PUT` | `/admin/api/releases/{id}` | Обновить релиз (active, changelog) |
| `DELETE` | `/admin/api/releases/{id}` | Удалить релиз |

**iOS устройства:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/admin/api/ios/devices` | Список зарегистрированных устройств |
| `POST` | `/admin/api/ios/sync` | Синхронизировать с Apple Developer |

**Настройки:**

| Метод | Путь | Описание |
|-------|------|----------|
| `GET` | `/admin/api/settings` | Получить настройки |
| `PUT` | `/admin/api/settings` | Обновить настройки |

## Следующие шаги

- [Upload API](./upload) — полная документация API загрузки
- [Admin API](./admin) — полная документация Admin API
- [Конфигурация](../configuration/) — управление токенами
