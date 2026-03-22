---
title: 업로드 API
description: "REST API를 통해 Fenfa에 앱 빌드 업로드. 표준 업로드와 자동 메타데이터 추출이 있는 스마트 업로드."
---

# 업로드 API

Fenfa는 두 가지 업로드 엔드포인트를 제공합니다: 명시적 메타데이터를 위한 표준 업로드와 업로드된 패키지에서 메타데이터를 자동 감지하는 스마트 업로드입니다.

## 표준 업로드

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### 요청 필드

| 필드 | 필수 | 타입 | 설명 |
|------|------|------|------|
| `variant_id` | 예 | string | 대상 변형 ID (예: `var_def456`) |
| `app_file` | 예 | file | 바이너리 파일 (IPA, APK, DMG, EXE 등) |
| `version` | 아니오 | string | 버전 문자열 (예: "1.2.0") |
| `build` | 아니오 | integer | 빌드 번호 (예: 120) |
| `channel` | 아니오 | string | 배포 채널 (예: "internal", "beta") |
| `min_os` | 아니오 | string | 최소 OS 버전 (예: "15.0") |
| `changelog` | 아니오 | string | 릴리스 노트 텍스트 |

### 예제

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### 응답 (201 Created)

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

`urls` 객체는 바로 사용할 수 있는 링크를 제공합니다:
- `page` -- 제품 다운로드 페이지 URL
- `download` -- 직접 바이너리 다운로드 URL
- `ios_manifest` -- iOS 매니페스트 plist URL (iOS 변형만)
- `ios_install` -- 전체 `itms-services://` 설치 URL (iOS 변형만)

## 스마트 업로드

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

스마트 업로드는 표준 업로드와 동일한 필드를 받지만 업로드된 패키지에서 메타데이터를 자동 감지합니다.

::: tip 자동 감지되는 내용
**IPA 파일**: 번들 ID, 버전 (CFBundleShortVersionString), 빌드 번호 (CFBundleVersion), 앱 아이콘, 최소 iOS 버전.

**APK 파일**: 패키지 이름, 버전 이름, 버전 코드, 앱 아이콘, 최소 SDK 버전.

데스크탑 형식 (DMG, EXE, DEB 등)은 자동 감지를 지원하지 않습니다. 버전과 빌드를 명시적으로 제공하세요.
:::

### 예제

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

명시적으로 제공된 필드는 자동 감지된 값을 재정의합니다:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## 오류 응답

### 변형 ID 누락 (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### 잘못된 토큰 (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### 변형을 찾을 수 없음 (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD 예제

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### 셸 스크립트

```bash
#!/bin/bash
# upload.sh - Fenfa에 빌드 업로드
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## 다음 단계

- [관리 API](./admin) -- 전체 관리 엔드포인트 레퍼런스
- [릴리스 관리](../products/releases) -- 업로드된 릴리스 관리
- [배포 개요](../distribution/) -- 업로드가 최종 사용자에게 도달하는 방법
