---
title: 데스크탑 배포
description: "Fenfa를 통해 직접 다운로드로 macOS, Windows, Linux 데스크탑 애플리케이션 배포."
---

# 데스크탑 배포

Fenfa는 직접 파일 다운로드를 통해 데스크탑 애플리케이션 (macOS, Windows, Linux)을 배포합니다. 데스크탑 사용자가 제품 페이지를 방문하고 다운로드 버튼을 클릭하면 플랫폼에 맞는 설치 파일을 받습니다.

## 지원 형식

| 플랫폼 | 일반 형식 | 비고 |
|--------|---------|------|
| macOS | `.dmg`, `.pkg`, `.zip` | 디스크 이미지용 DMG, 설치 프로그램용 PKG, 앱 번들용 ZIP |
| Windows | `.exe`, `.msi`, `.zip` | 설치 프로그램용 EXE, Windows Installer용 MSI, 포터블용 ZIP |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | Debian/Ubuntu용 DEB, Fedora/RHEL용 RPM, 범용 AppImage |

## 데스크탑 변형 설정

지원하는 각 플랫폼과 아키텍처 조합에 대한 변형을 생성합니다:

### macOS

```bash
# Apple Silicon
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Apple Silicon)",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'

# Intel
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Intel)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'
```

::: tip 유니버설 바이너리
유니버설 macOS 바이너리를 빌드하는 경우 별도의 arm64 및 x86_64 변형 대신 `arch: "universal"`로 단일 변형을 생성합니다.
:::

### Windows

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "windows",
    "display_name": "Windows",
    "identifier": "com.example.myapp",
    "arch": "x64",
    "installer_type": "exe",
    "min_os": "10"
  }'
```

### Linux

```bash
# Debian/Ubuntu용 DEB
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (DEB)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "deb"
  }'

# AppImage (범용)
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (AppImage)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "appimage"
  }'
```

## 플랫폼 감지

Fenfa의 제품 페이지는 User-Agent를 통해 방문자의 운영 체제를 감지하고 일치하는 다운로드 버튼을 강조합니다. 데스크탑 사용자는 자신의 플랫폼 변형을 상단에서 보고 다른 플랫폼을 아래에서 볼 수 있습니다.

## 데스크탑 빌드 업로드

업로드는 모바일 플랫폼과 동일하게 작동합니다:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info 데스크탑은 자동 감지 없음
iOS IPA 및 Android APK 파일과 달리 데스크탑 바이너리 (DMG, EXE, DEB 등)는 Fenfa가 자동으로 추출할 수 있는 표준화된 메타데이터를 포함하지 않습니다. 데스크탑 빌드를 업로드할 때 항상 `version`과 `build`를 명시적으로 제공하세요.
:::

## CI/CD 통합 예제

모든 데스크탑 플랫폼에 대한 빌드를 업로드하는 GitHub Actions 워크플로우:

```yaml
jobs:
  upload:
    strategy:
      matrix:
        include:
          - platform: macos
            variant_id: var_macos_arm64
            file: dist/MyApp-arm64.dmg
          - platform: windows
            variant_id: var_windows_x64
            file: dist/MyApp-Setup.exe
          - platform: linux
            variant_id: var_linux_x64
            file: dist/MyApp.AppImage
    steps:
      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## 다음 단계

- [iOS 배포](./ios) -- iOS OTA 설치 및 UDID 바인딩
- [Android 배포](./android) -- Android APK 배포
- [업로드 API](../api/upload) -- 전체 업로드 엔드포인트 레퍼런스
