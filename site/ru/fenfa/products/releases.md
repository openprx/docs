---
title: Релизы
description: "Загрузка и управление релизами в Fenfa: стандартная и умная загрузка, активные релизы, интеграция с CI/CD и автоматическое извлечение метаданных из IPA и APK."
---

# Релизы

Релиз — это конкретный файл сборки, привязанный к варианту продукта. Каждый релиз содержит файл, версию, номер билда и опциональный журнал изменений.

## Поля релиза

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | int | Уникальный идентификатор |
| `variant_id` | int | Идентификатор варианта |
| `version` | string | Версия (например, `1.2.3`) |
| `build` | string | Номер билда (например, `456`) |
| `changelog` | string | Заметки о релизе (Markdown) |
| `file_path` | string | Путь к хранимому файлу |
| `file_size` | int64 | Размер файла в байтах |
| `active` | bool | Отображается ли релиз на публичной странице |
| `downloads` | int | Счётчик скачиваний |
| `created_at` | timestamp | Время загрузки |

## Загрузка релиза

### Стандартная загрузка

```bash
curl -X POST https://dist.example.com/upload/api/variants/{variant_id}/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@MyApp.ipa" \
  -F "version=1.2.3" \
  -F "build=456" \
  -F "changelog=Bug fixes and improvements"
```

### Умная загрузка (автоопределение метаданных)

Для IPA и APK Fenfa автоматически извлекает версию и номер билда:

```bash
curl -X POST https://dist.example.com/upload/api/variants/{variant_id}/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@MyApp.ipa" \
  -F "changelog=New features"
```

::: tip Умное извлечение
Умное извлечение работает для `.ipa` (iOS) и `.apk` (Android). Для десктопных форматов всегда указывайте `version` и `build` явно.
:::

## Активные релизы

Только **активные** релизы отображаются на публичной странице дистрибуции. По умолчанию новый загруженный релиз становится активным.

### Активация/деактивация релиза

```bash
# Активировать релиз
curl -X PUT https://dist.example.com/admin/api/releases/5 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# Деактивировать релиз
curl -X PUT https://dist.example.com/admin/api/releases/5 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"active": false}'
```

## Получение списка релизов

```bash
curl https://dist.example.com/admin/api/variants/1/releases \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Удаление релиза

```bash
curl -X DELETE https://dist.example.com/admin/api/releases/5 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Интеграция с CI/CD

### GitHub Actions

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload/api/variants/${{ secrets.VARIANT_ID }}/releases \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "file=@app-release.apk" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload/api/variants/${VARIANT_ID}/releases \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "file=@app-release.ipa" \
        -F "changelog=${CI_COMMIT_MESSAGE}"
```

## Следующие шаги

- [API загрузки](../api/upload) — полная документация Upload API
- [Дистрибуция iOS](../distribution/ios) — OTA установка и привязка устройств
- [Дистрибуция Android](../distribution/android) — скачивание APK
