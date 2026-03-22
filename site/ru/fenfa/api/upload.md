---
title: Upload API
description: "Upload API Fenfa: стандартная и умная загрузка файлов, параметры запроса, примеры для GitHub Actions, GitLab CI и shell-скриптов."
---

# Upload API

Upload API позволяет CI/CD-системам загружать релизы приложений в Fenfa. Он принимает токены обоих скоупов — upload и admin.

## Загрузка релиза

```
POST /upload/api/variants/{variant_id}/releases
Content-Type: multipart/form-data
X-Auth-Token: YOUR_UPLOAD_TOKEN
```

### Параметры запроса

| Поле | Тип | Обязательно | Описание |
|------|-----|:-----------:|----------|
| `file` | file | Да | Файл приложения (IPA, APK, DMG, EXE, DEB и т.д.) |
| `version` | string | Нет* | Строка версии (например, `1.2.3`) |
| `build` | string | Нет* | Номер билда (например, `456`) |
| `changelog` | string | Нет | Заметки о релизе (поддерживает Markdown) |
| `active` | bool | Нет | Активировать релиз сразу (по умолчанию: `true`) |

*Для IPA и APK `version` и `build` извлекаются автоматически, если не указаны.

### Стандартная загрузка

```bash
curl -X POST https://dist.example.com/upload/api/variants/3/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@MyApp.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Major update with new features"
```

### Умная загрузка (IPA/APK)

```bash
# Version и build извлекаются из бинарника
curl -X POST https://dist.example.com/upload/api/variants/1/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@MyApp.ipa" \
  -F "changelog=Bug fixes"
```

### Пример ответа

```json
{
  "ok": true,
  "data": {
    "id": 42,
    "variant_id": 1,
    "version": "2.0.0",
    "build": "200",
    "changelog": "Major update with new features",
    "file_size": 52428800,
    "active": true,
    "downloads": 0,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

## Примеры CI/CD

### GitHub Actions

```yaml
name: Deploy to Fenfa

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: make build

      - name: Upload iOS to Fenfa
        run: |
          curl -f -X POST "${{ secrets.FENFA_URL }}/upload/api/variants/${{ secrets.IOS_VARIANT_ID }}/releases" \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "file=@build/MyApp.ipa" \
            -F "changelog=${{ github.event.head_commit.message }}"

      - name: Upload Android to Fenfa
        run: |
          curl -f -X POST "${{ secrets.FENFA_URL }}/upload/api/variants/${{ secrets.ANDROID_VARIANT_ID }}/releases" \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "file=@build/MyApp.apk" \
            -F "changelog=${{ github.event.head_commit.message }}"
```

### GitLab CI

```yaml
stages:
  - build
  - deploy

deploy:fenfa:
  stage: deploy
  script:
    - |
      curl -f -X POST "${FENFA_URL}/upload/api/variants/${IOS_VARIANT_ID}/releases" \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "file=@build/MyApp.ipa" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "changelog=${CI_COMMIT_MESSAGE}"
  only:
    - tags
```

### Shell-скрипт

```bash
#!/bin/bash
set -e

FENFA_URL="${FENFA_URL:-https://dist.example.com}"
VARIANT_ID="${1:?Usage: $0 <variant_id> <file>}"
FILE="${2:?Usage: $0 <variant_id> <file>}"

response=$(curl -f -s -X POST "${FENFA_URL}/upload/api/variants/${VARIANT_ID}/releases" \
  -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN:?FENFA_UPLOAD_TOKEN not set}" \
  -F "file=@${FILE}" \
  -F "changelog=${CHANGELOG:-}")

echo "Upload successful:"
echo "${response}" | jq '.data | {id, version, build}'
```

## Следующие шаги

- [Admin API](./admin) — управление продуктами, вариантами и релизами
- [Релизы](../products/releases) — управление релизами через панель администратора
