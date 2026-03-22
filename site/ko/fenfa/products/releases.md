---
title: 릴리스 관리
description: "Fenfa에서 앱 릴리스 업로드, 버전 관리, 관리. 각 릴리스는 플랫폼 변형에 업로드된 특정 빌드입니다."
---

# 릴리스 관리

릴리스는 변형 아래의 특정 업로드된 빌드를 나타냅니다. 각 릴리스에는 버전 문자열, 빌드 번호, 변경 로그, 바이너리 파일 자체가 있습니다. 릴리스는 제품 다운로드 페이지에 역순 시간순으로 표시됩니다.

## 릴리스 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | 자동 생성된 ID (예: `rel_b1cqa`) |
| `variant_id` | string | 상위 변형 ID |
| `version` | string | 버전 문자열 (예: "1.2.0") |
| `build` | integer | 빌드 번호 (예: 120) |
| `changelog` | text | 릴리스 노트 (다운로드 페이지에 표시됨) |
| `min_os` | string | 최소 OS 버전 |
| `channel` | string | 배포 채널 (예: "internal", "beta", "production") |
| `size_bytes` | integer | 파일 크기 (바이트) |
| `sha256` | string | 업로드된 파일의 SHA-256 해시 |
| `download_count` | integer | 이 릴리스가 다운로드된 횟수 |
| `file_name` | string | 원본 파일 이름 |
| `file_ext` | string | 파일 확장자 (예: "ipa", "apk") |
| `created_at` | datetime | 업로드 타임스탬프 |

## 릴리스 업로드

### 표준 업로드

특정 변형에 빌드 파일을 업로드합니다:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=Bug fixes and performance improvements"
```

응답:

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
      "ios_install": "itms-services://..."
    }
  }
}
```

### 스마트 업로드

스마트 업로드 엔드포인트는 업로드된 패키지에서 메타데이터를 자동 감지합니다:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip 자동 감지
스마트 업로드는 IPA 및 APK 파일에서 다음을 추출합니다:
- **번들 ID / 패키지 이름**
- **버전 문자열** (CFBundleShortVersionString / versionName)
- **빌드 번호** (CFBundleVersion / versionCode)
- **앱 아이콘** (추출하여 제품 아이콘으로 저장됨)
- **최소 OS 버전**

업로드 요청에서 명시적으로 제공하여 자동 감지된 필드를 재정의할 수 있습니다.
:::

### 업로드 필드

| 필드 | 필수 | 설명 |
|------|------|------|
| `variant_id` | 예 | 대상 변형 ID |
| `app_file` | 예 | 바이너리 파일 (IPA, APK, DMG 등) |
| `version` | 아니오 | 버전 문자열 (IPA/APK의 경우 자동 감지) |
| `build` | 아니오 | 빌드 번호 (IPA/APK의 경우 자동 감지) |
| `channel` | 아니오 | 배포 채널 |
| `min_os` | 아니오 | 최소 OS 버전 |
| `changelog` | 아니오 | 릴리스 노트 |

## 파일 스토리지

업로드된 파일은 다음에 저장됩니다:

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

각 릴리스는 복구 목적으로 `meta.json` 스냅샷 (로컬 스토리지만)도 가집니다.

::: info S3 스토리지
S3 호환 스토리지가 설정된 경우 파일이 설정된 버킷에 업로드됩니다. 스토리지 경로 구조는 동일하게 유지됩니다. S3 설정은 [설정](../configuration/)을 참조하세요.
:::

## 다운로드 URL

각 릴리스는 여러 URL을 제공합니다:

| URL | 설명 |
|-----|------|
| `/d/:releaseID` | 직접 바이너리 다운로드 (HTTP Range 요청 지원) |
| `/ios/:releaseID/manifest.plist` | iOS OTA 매니페스트 (`itms-services://` 링크용) |
| `/products/:slug` | 제품 다운로드 페이지 |
| `/products/:slug?r=:releaseID` | 특정 릴리스가 강조된 제품 페이지 |

## 릴리스 삭제

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
릴리스를 삭제하면 업로드된 바이너리 파일과 모든 관련 메타데이터가 영구적으로 제거됩니다.
:::

## 릴리스 데이터 내보내기

보고를 위해 모든 릴리스를 CSV로 내보냅니다:

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD 통합

Fenfa는 CI/CD 파이프라인에서 호출되도록 설계되었습니다. 일반적인 GitHub Actions 단계:

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## 다음 단계

- [업로드 API 레퍼런스](../api/upload) -- 전체 업로드 엔드포인트 문서
- [iOS 배포](../distribution/ios) -- iOS OTA 매니페스트 및 설치
- [배포 개요](../distribution/) -- 릴리스가 최종 사용자에게 도달하는 방법
