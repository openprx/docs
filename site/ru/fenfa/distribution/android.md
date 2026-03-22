---
title: Дистрибуция Android
description: "Android APK дистрибуция в Fenfa: прямое скачивание, умное извлечение метаданных, предупреждение о неизвестных источниках и интеграция с CI/CD."
---

# Дистрибуция Android

Fenfa раздаёт Android-приложения в виде прямых скачиваний APK. Для Android не требуется специальная настройка — загрузите APK, и страница дистрибуции сформируется автоматически.

## Поток скачивания APK

Когда пользователь нажимает кнопку скачивания на Android-устройстве:

1. Браузер запрашивает APK у Fenfa
2. Fenfa стримит файл из хранилища
3. Браузер скачивает APK
4. Пользователь открывает APK для установки

::: warning Установка из неизвестных источников
Android блокирует установку APK из источников, отличных от Google Play, по умолчанию. Пользователи должны разрешить установку из неизвестных источников в настройках безопасности. Fenfa автоматически показывает эту инструкцию на странице дистрибуции.
:::

## Умное извлечение метаданных

При загрузке APK Fenfa автоматически извлекает:

- **Версию** из `AndroidManifest.xml` (атрибут `versionName`)
- **Номер билда** из `AndroidManifest.xml` (атрибут `versionCode`)
- **Имя пакета** (applicationId)

Поэтому при загрузке APK поля `version` и `build` указывать необязательно:

```bash
curl -X POST https://dist.example.com/upload/api/variants/{variant_id}/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@app-release.apk" \
  -F "changelog=Bug fixes"
# version и build извлекаются автоматически
```

## Загрузка APK через CI/CD

### GitHub Actions

```yaml
name: Upload to Fenfa

on:
  push:
    tags:
      - 'v*'

jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build APK
        run: ./gradlew assembleRelease

      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload/api/variants/${{ secrets.ANDROID_VARIANT_ID }}/releases \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "file=@app/build/outputs/apk/release/app-release.apk" \
            -F "changelog=Release ${{ github.ref_name }}"
```

## Проверка загруженного релиза

После загрузки убедитесь, что метаданные извлечены корректно:

```bash
curl https://dist.example.com/admin/api/variants/{variant_id}/releases \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

В ответе проверьте поля `version` и `build`.

## Следующие шаги

- [Дистрибуция iOS](./ios) — OTA установка для iPhone/iPad
- [Дистрибуция Desktop](./desktop) — macOS, Windows, Linux
- [Upload API](../api/upload) — полная документация API загрузки
