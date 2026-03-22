---
title: 빠른 시작
description: "5분 안에 Fenfa 실행 및 첫 번째 앱 빌드 업로드."
---

# 빠른 시작

이 가이드는 Fenfa 시작, 제품 생성, 빌드 업로드, 다운로드 페이지 공유를 5분 이내에 안내합니다.

## 1단계: Fenfa 시작

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

브라우저에서 `http://localhost:8000/admin`을 엽니다. 기본 관리 토큰 `dev-admin-token`으로 로그인합니다.

## 2단계: 제품 생성

1. 관리 패널에서 사이드바의 **제품**을 클릭합니다.
2. **제품 생성**을 클릭합니다.
3. 제품 세부 정보를 입력합니다:
   - **이름**: 앱 이름 (예: "MyApp")
   - **슬러그**: URL 친화적인 식별자 (예: "myapp") -- 다운로드 페이지 URL이 됩니다
   - **설명**: 앱에 대한 간략한 설명
4. **저장**을 클릭합니다.

## 3단계: 변형 추가

변형은 플랫폼별 빌드 대상을 나타냅니다. 각 제품은 여러 변형 (iOS, Android, macOS 등)을 가질 수 있습니다.

1. 방금 생성한 제품을 엽니다.
2. **변형 추가**를 클릭합니다.
3. 변형을 설정합니다:
   - **플랫폼**: 대상 플랫폼 선택 (예: "ios")
   - **표시 이름**: 사람이 읽기 쉬운 이름 (예: "iOS App Store")
   - **식별자**: 번들 ID 또는 패키지 이름 (예: "com.example.myapp")
   - **아키텍처**: CPU 아키텍처 (예: "arm64")
   - **설치 프로그램 유형**: 파일 유형 (예: "ipa", "apk", "dmg")
4. **저장**을 클릭합니다.

## 4단계: 빌드 업로드

### 관리 패널을 통해

1. 생성한 변형으로 이동합니다.
2. **릴리스 업로드**를 클릭합니다.
3. 빌드 파일 (IPA, APK, DMG 등)을 선택합니다.
4. 버전과 변경 로그를 입력합니다 (선택적 -- Fenfa가 IPA/APK 메타데이터에서 자동 감지합니다).
5. **업로드**를 클릭합니다.

### API를 통해 (CI/CD)

빌드 파이프라인에서 직접 업로드합니다:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip 스마트 업로드
자동 메타데이터 감지를 위해 스마트 업로드 엔드포인트를 사용합니다:
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
이렇게 하면 업로드된 패키지에서 번들 ID, 버전, 빌드 번호, 아이콘이 자동으로 추출됩니다.
:::

## 5단계: 다운로드 페이지 공유

이제 앱을 다음에서 이용할 수 있습니다:

```
http://localhost:8000/products/myapp
```

이 페이지는 다음을 제공합니다:

- **플랫폼 감지** -- 방문자의 기기에 따라 올바른 다운로드 버튼을 자동으로 표시합니다.
- **QR 코드** -- 모바일 기기에서 다운로드 페이지를 열기 위해 스캔합니다.
- **릴리스별 변경 로그** -- 각 릴리스가 버전과 변경 로그를 표시합니다.
- **iOS OTA 설치** -- iOS 빌드는 직접 설치를 위해 `itms-services://`를 사용합니다 (프로덕션에서는 HTTPS 필요).

이 URL 또는 QR 코드를 테스터와 이해관계자와 공유합니다.

## 다음은?

| 목표 | 가이드 |
|------|--------|
| UDID 바인딩으로 iOS 임시 배포 설정 | [iOS 배포](../distribution/ios) |
| 확장 가능한 파일 스토리지를 위한 S3/R2 설정 | [설정](../configuration/) |
| CI/CD에서 업로드 자동화 | [업로드 API](../api/upload) |
| Nginx와 HTTPS 뒤에 배포 | [프로덕션 배포](../deployment/production) |
| Android, macOS, Windows 변형 추가 | [플랫폼 변형](../products/variants) |
