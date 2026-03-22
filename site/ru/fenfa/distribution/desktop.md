---
title: Дистрибуция Desktop
description: "Desktop дистрибуция в Fenfa: macOS DMG/PKG, Windows EXE/MSI, Linux DEB/RPM/AppImage. Несколько архитектур, матрица сборки CI/CD и управление вариантами."
---

# Дистрибуция Desktop

Fenfa поддерживает дистрибуцию десктопных приложений для macOS, Windows и Linux. В отличие от мобильных платформ, десктопные файлы всегда скачиваются напрямую.

## Поддерживаемые форматы

| Платформа | Форматы | Примечание |
|-----------|---------|------------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG — наиболее распространённый |
| Windows | `.exe`, `.msi`, `.zip` | EXE или MSI для установщиков |
| Linux | `.deb`, `.rpm`, `.AppImage`, `.tar.gz` | AppImage — универсальный формат |

## Несколько архитектур

Для поддержки нескольких архитектур создайте отдельные варианты:

```bash
# macOS Apple Silicon
curl -X POST .../products/1/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -d '{"platform": "macos", "name": "macOS (Apple Silicon)", "description": "arm64"}'

# macOS Intel
curl -X POST .../products/1/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -d '{"platform": "macos", "name": "macOS (Intel)", "description": "x86_64"}'
```

## Метаданные при загрузке

Для десктопных форматов умное извлечение метаданных недоступно. Всегда указывайте `version` и `build` явно:

```bash
curl -X POST https://dist.example.com/upload/api/variants/{variant_id}/releases \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "file=@MyApp.dmg" \
  -F "version=2.1.0" \
  -F "build=210" \
  -F "changelog=New features in 2.1"
```

## CI/CD матрица сборки

Пример GitHub Actions для нескольких платформ:

```yaml
name: Build and Upload

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            arch: arm64
            variant_id_secret: FENFA_MACOS_ARM64_VARIANT_ID
            artifact: MyApp-arm64.dmg
          - os: macos-13
            arch: x86_64
            variant_id_secret: FENFA_MACOS_X86_VARIANT_ID
            artifact: MyApp-x86_64.dmg
          - os: windows-latest
            arch: x86_64
            variant_id_secret: FENFA_WINDOWS_VARIANT_ID
            artifact: MyApp-Setup.exe
          - os: ubuntu-latest
            arch: x86_64
            variant_id_secret: FENFA_LINUX_VARIANT_ID
            artifact: MyApp.AppImage

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: ./build.sh --arch ${{ matrix.arch }}

      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload/api/variants/${{ secrets[matrix.variant_id_secret] }}/releases \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "file=@dist/${{ matrix.artifact }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}" \
            -F "changelog=Release ${{ github.ref_name }}"
```

## Публичная страница дистрибуции

На странице `/d/{slug}` десктопные варианты отображаются с кнопками скачивания, сгруппированными по платформе. Если для одной платформы несколько вариантов (например, arm64 и x86_64 для macOS) — они показываются как отдельные варианты.

## Следующие шаги

- [Дистрибуция iOS](./ios) — OTA установка для iPhone/iPad
- [Дистрибуция Android](./android) — скачивание APK
- [Upload API](../api/upload) — полная документация API загрузки
