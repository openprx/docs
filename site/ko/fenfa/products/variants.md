---
title: 플랫폼 변형
description: "Fenfa 제품 아래 iOS, Android, macOS, Windows, Linux를 위한 플랫폼별 변형 설정."
---

# 플랫폼 변형

변형은 제품 아래의 플랫폼별 빌드 대상을 나타냅니다. 각 변형은 자체 플랫폼, 식별자 (번들 ID 또는 패키지 이름), 아키텍처, 설치 프로그램 유형을 가집니다. 릴리스는 특정 변형에 업로드됩니다.

## 지원 플랫폼

| 플랫폼 | 식별자 예시 | 설치 프로그램 유형 | 아키텍처 |
|--------|-----------|----------------|---------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## 변형 생성

### 관리 패널을 통해

1. 변형을 추가할 제품을 엽니다.
2. **변형 추가**를 클릭합니다.
3. 필드를 입력합니다:

| 필드 | 필수 | 설명 |
|------|------|------|
| 플랫폼 | 예 | 대상 플랫폼 (`ios`, `android`, `macos`, `windows`, `linux`) |
| 표시 이름 | 예 | 사람이 읽기 쉬운 이름 (예: "iOS", "Android ARM64") |
| 식별자 | 예 | 번들 ID 또는 패키지 이름 |
| 아키텍처 | 아니오 | CPU 아키텍처 |
| 설치 프로그램 유형 | 아니오 | 파일 유형 (`ipa`, `apk`, `dmg` 등) |
| 최소 OS | 아니오 | 최소 OS 버전 요구사항 |
| 정렬 순서 | 아니오 | 다운로드 페이지의 표시 순서 (낮을수록 먼저) |

4. **저장**을 클릭합니다.

### API를 통해

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

응답:

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## 일반적인 제품 설정

일반적인 멀티 플랫폼 제품은 다음 변형을 가질 수 있습니다:

```
MyApp (Product)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip 단일 아키텍처 vs. 다중 아키텍처
유니버설 바이너리를 지원하는 플랫폼 (Android 또는 macOS 등)의 경우 `universal` 아키텍처로 단일 변형을 생성할 수 있습니다. 아키텍처별로 별도의 바이너리를 배포하는 플랫폼의 경우 아키텍처당 하나의 변형을 생성합니다.
:::

## 변형 업데이트

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## 변형 삭제

::: danger 계단식 삭제
변형을 삭제하면 모든 릴리스와 업로드된 파일이 영구적으로 제거됩니다.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## 변형 통계

특정 변형의 다운로드 통계를 가져옵니다:

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## ID 형식

변형 ID는 접두사 `var_` 다음에 임의 문자열이 사용됩니다 (예: `var_def456`).

## 다음 단계

- [릴리스 관리](./releases) -- 변형에 빌드 업로드
- [iOS 배포](../distribution/ios) -- OTA 및 UDID 바인딩을 위한 iOS별 변형 설정
- [데스크탑 배포](../distribution/desktop) -- macOS, Windows, Linux 배포 고려사항
