---
title: Быстрый старт
description: Загрузите первое приложение в Fenfa за 5 шагов. От запуска до iOS OTA или Android APK за несколько минут.
---

# Быстрый старт

Это руководство поможет загрузить первое приложение и получить ссылку для дистрибуции за 5 минут.

## Шаг 1: Запустите Fenfa

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -e FENFA_ADMIN_TOKEN=admin-secret \
  -e FENFA_UPLOAD_TOKEN=upload-secret \
  -e FENFA_PRIMARY_DOMAIN=http://localhost:8000 \
  fenfa/fenfa:latest
```

## Шаг 2: Создайте продукт

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App", "slug": "my-app", "description": "My first app"}'
```

Ответ:

```json
{
  "ok": true,
  "data": {
    "id": 1,
    "slug": "my-app",
    "name": "My App"
  }
}
```

## Шаг 3: Создайте вариант

```bash
curl -X POST http://localhost:8000/admin/api/products/1/variants \
  -H "X-Auth-Token: admin-secret" \
  -H "Content-Type: application/json" \
  -d '{"platform": "android", "name": "Android", "description": "Android release"}'
```

## Шаг 4: Загрузите релиз

Загрузите APK-файл (или IPA для iOS):

```bash
curl -X POST http://localhost:8000/upload/api/variants/1/releases \
  -H "X-Auth-Token: upload-secret" \
  -F "file=@MyApp.apk" \
  -F "changelog=First release"
```

Для IPA и APK версия и номер билда извлекаются автоматически. Для других форматов укажите их явно:

```bash
curl -X POST http://localhost:8000/upload/api/variants/1/releases \
  -H "X-Auth-Token: upload-secret" \
  -F "file=@MyApp.dmg" \
  -F "version=1.0.0" \
  -F "build=100" \
  -F "changelog=First release"
```

## Шаг 5: Поделитесь ссылкой для скачивания

После загрузки откройте страницу продукта в браузере:

```
http://localhost:8000/d/my-app
```

Эта страница предоставляет:
- **iOS**: кнопку «Установить» через `itms-services://`
- **Android**: прямую ссылку для скачивания APK
- **Desktop**: ссылки для скачивания по платформам

## Следующие шаги

- [Продукты и варианты](../products/) — управление несколькими приложениями
- [iOS дистрибуция](../distribution/ios) — настройка UDID-привязки и Apple Developer API
- [REST API](../api/) — интеграция с CI/CD-пайплайном
- [Конфигурация](../configuration/) — S3-хранилище, токены и настройки домена
