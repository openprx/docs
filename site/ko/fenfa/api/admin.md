---
title: 관리 API
description: "제품, 변형, 릴리스, 기기, 설정, 내보내기를 관리하기 위한 완전한 Fenfa 관리 API 레퍼런스."
---

# 관리 API

모든 관리 엔드포인트는 관리 범위 토큰이 있는 `X-Auth-Token` 헤더가 필요합니다. 관리 토큰은 업로드를 포함한 모든 API 작업에 대한 전체 액세스 권한을 가집니다.

## 제품

### 제품 목록 조회

```
GET /admin/api/products
```

기본 정보가 있는 모든 제품을 반환합니다.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### 제품 생성

```
POST /admin/api/products
Content-Type: application/json
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | 예 | 제품 표시 이름 |
| `slug` | 예 | URL 식별자 (고유) |
| `description` | 아니오 | 제품 설명 |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### 제품 가져오기

```
GET /admin/api/products/:productID
```

모든 변형이 있는 제품을 반환합니다.

### 제품 업데이트

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### 제품 삭제

```
DELETE /admin/api/products/:productID
```

::: danger 계단식 삭제
제품을 삭제하면 모든 변형, 릴리스, 업로드된 파일이 영구적으로 제거됩니다.
:::

## 변형

### 변형 생성

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `platform` | 예 | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | 예 | 사람이 읽기 쉬운 이름 |
| `identifier` | 예 | 번들 ID 또는 패키지 이름 |
| `arch` | 아니오 | CPU 아키텍처 |
| `installer_type` | 아니오 | 파일 유형 (`ipa`, `apk`, `dmg` 등) |
| `min_os` | 아니오 | 최소 OS 버전 |
| `sort_order` | 아니오 | 표시 순서 (낮을수록 먼저) |

### 변형 업데이트

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### 변형 삭제

```
DELETE /admin/api/variants/:variantID
```

::: danger 계단식 삭제
변형을 삭제하면 모든 릴리스와 업로드된 파일이 영구적으로 제거됩니다.
:::

### 변형 통계

```
GET /admin/api/variants/:variantID/stats
```

변형의 다운로드 수와 기타 통계를 반환합니다.

## 릴리스

### 릴리스 삭제

```
DELETE /admin/api/releases/:releaseID
```

릴리스와 업로드된 바이너리 파일을 제거합니다.

## 게시

공개 다운로드 페이지에서 제품/앱의 가시성을 제어합니다.

### 게시

```
PUT /admin/api/apps/:appID/publish
```

### 게시 취소

```
PUT /admin/api/apps/:appID/unpublish
```

## 이벤트

### 이벤트 쿼리

```
GET /admin/api/events
```

방문, 클릭, 다운로드 이벤트를 반환합니다. 필터링을 위한 쿼리 파라미터를 지원합니다.

| 파라미터 | 설명 |
|---------|------|
| `type` | 이벤트 유형 (`visit`, `click`, `download`) |
| `variant_id` | 변형으로 필터링 |
| `release_id` | 릴리스로 필터링 |

## iOS 기기

### 기기 목록 조회

```
GET /admin/api/ios_devices
```

UDID 바인딩을 완료한 모든 iOS 기기를 반환합니다.

### Apple에 기기 등록

```
POST /admin/api/devices/:deviceID/register-apple
```

단일 기기를 Apple Developer 계정에 등록합니다.

### 기기 일괄 등록

```
POST /admin/api/devices/register-apple
```

등록되지 않은 모든 기기를 단일 일괄 작업으로 Apple에 등록합니다.

## Apple Developer API

### 상태 확인

```
GET /admin/api/apple/status
```

Apple Developer API 자격 증명이 설정되어 있고 유효한지 여부를 반환합니다.

### Apple 기기 목록 조회

```
GET /admin/api/apple/devices
```

Apple Developer 계정에 등록된 기기를 반환합니다.

## 설정

### 설정 가져오기

```
GET /admin/api/settings
```

현재 시스템 설정 (도메인, 조직, 스토리지 유형)을 반환합니다.

### 설정 업데이트

```
PUT /admin/api/settings
Content-Type: application/json
```

업데이트 가능한 필드에는 다음이 포함됩니다:
- `primary_domain` -- 매니페스트와 콜백을 위한 공개 URL
- `secondary_domains` -- CDN 또는 대체 도메인
- `organization` -- iOS 프로파일의 조직 이름
- `storage_type` -- `local` 또는 `s3`
- S3 설정 (엔드포인트, 버킷, 키, 공개 URL)
- Apple Developer API 자격 증명

### 업로드 설정 가져오기

```
GET /admin/api/upload-config
```

스토리지 유형과 제한을 포함한 현재 업로드 설정을 반환합니다.

## 내보내기

외부 분석을 위해 데이터를 CSV 파일로 내보냅니다:

| 엔드포인트 | 데이터 |
|----------|--------|
| `GET /admin/exports/releases.csv` | 메타데이터가 있는 모든 릴리스 |
| `GET /admin/exports/events.csv` | 모든 이벤트 |
| `GET /admin/exports/ios_devices.csv` | 모든 iOS 기기 |

```bash
# 예제: 모든 릴리스 내보내기
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## 다음 단계

- [업로드 API](./upload) -- 업로드 엔드포인트 레퍼런스
- [설정](../configuration/) -- 서버 설정 옵션
- [프로덕션 배포](../deployment/production) -- 관리 API 보안
