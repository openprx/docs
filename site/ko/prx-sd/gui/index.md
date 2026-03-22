---
title: 데스크톱 애플리케이션 (GUI)
description: "PRX-SD는 Tauri 2와 Vue 3로 구축된 크로스 플랫폼 데스크톱 애플리케이션을 제공하며, 시스템 트레이 통합, 드래그 앤 드롭 스캔, 실시간 대시보드를 갖추고 있습니다."
---

# 데스크톱 애플리케이션 (GUI)

PRX-SD에는 **Tauri 2**(Rust 백엔드)와 **Vue 3**(TypeScript 프론트엔드)로 구축된 크로스 플랫폼 데스크톱 애플리케이션이 포함되어 있습니다. GUI는 명령줄 없이 모든 핵심 엔진 기능에 대한 시각적 인터페이스를 제공합니다.

## 아키텍처

```
+----------------------------------------------+
|              PRX-SD Desktop App               |
|                                               |
|   Vue 3 Frontend          Tauri 2 Backend     |
|   (Vite + TypeScript)     (Rust + IPC)        |
|                                               |
|   +------------------+   +-----------------+  |
|   | Dashboard        |<->| scan_path()     |  |
|   | File Scanner     |   | scan_directory()|  |
|   | Quarantine Mgmt  |   | get_config()    |  |
|   | Config Editor    |   | save_config()   |  |
|   | Signature Update |   | update_sigs()   |  |
|   | Alert History    |   | get_alerts()    |  |
|   | Adblock Panel    |   | adblock_*()     |  |
|   | Monitor Control  |   | start/stop()    |  |
|   +------------------+   +-----------------+  |
|                                               |
|   System Tray Icon (32x32)                    |
+----------------------------------------------+
```

Tauri 백엔드는 Vue 프론트엔드가 스캔 엔진, 격리 저장소, 시그니처 데이터베이스, adblock 필터 엔진과 상호 작용하기 위해 호출하는 18개의 IPC 명령어를 노출합니다. 모든 무거운 작업(스캔, YARA 매칭, 해시 조회)은 Rust에서 실행되며, 프론트엔드는 렌더링만 담당합니다.

## 기능

### 실시간 대시보드

대시보드는 한눈에 볼 수 있는 보안 상태를 표시합니다:

- **총 스캔** 수행 횟수
- **발견된 위협** 수
- **격리된 파일** 수
- **마지막 스캔 시간**
- **모니터링 상태** (활성/비활성)
- **스캔 기록 차트** (지난 7일)
- **최근 위협** 목록 (경로, 위협 이름, 심각도 포함)

<!-- Screenshot placeholder: dashboard.png -->

### 드래그 앤 드롭 스캔

파일이나 폴더를 애플리케이션 창에 드롭하여 즉시 스캔을 시작합니다. 결과는 경로, 위협 수준, 탐지 유형, 위협 이름, 스캔 시간 열이 있는 정렬 가능한 테이블에 표시됩니다.

<!-- Screenshot placeholder: scan-results.png -->

### 격리 관리

시각적 인터페이스를 통해 격리된 파일을 보고, 복원하고, 삭제합니다:

- ID, 원본 경로, 위협 이름, 날짜, 파일 크기가 있는 정렬 가능한 테이블
- 원래 위치로 한 번 클릭으로 복원
- 한 번 클릭으로 영구 삭제
- 저장소 통계 (총 파일, 총 크기, 가장 오래된/최신 항목)

### 설정 편집기

양식 기반 인터페이스를 통해 모든 엔진 설정을 편집합니다. 변경 사항은 `~/.prx-sd/config.json`에 저장되며 다음 스캔 시 적용됩니다.

### 시그니처 업데이트

GUI에서 시그니처 데이터베이스 업데이트를 트리거합니다. 백엔드가 최신 매니페스트를 다운로드하고, SHA-256 무결성을 검증하고, 업데이트를 설치합니다. 엔진은 새 시그니처로 자동으로 재초기화됩니다.

### Adblock 패널

광고 및 악성 도메인 차단 관리:

- adblock 보호 활성화/비활성화
- 필터 목록 동기화
- 개별 도메인 확인
- 차단 로그 보기 (최근 50개 항목)
- 목록 설정 및 통계 보기

### 시스템 트레이

PRX-SD는 시스템 트레이에 영구 아이콘과 함께 상주하며 빠른 접근을 제공합니다:

- 메인 창 열기
- 실시간 모니터링 시작/중지
- 데몬 상태 확인
- 빠른 스캔 트리거
- 애플리케이션 종료

::: tip
시스템 트레이 아이콘은 32x32 픽셀로 설정됩니다. 고DPI 디스플레이에서 Tauri는 자동으로 `128x128@2x.png` 변형을 사용합니다.
:::

## 소스에서 빌드

### 필수 조건

- **Rust** 1.85.0 이상
- **Node.js** 18+ (npm 포함)
- **시스템 종속성** (Linux):

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### 개발 모드

핫 리로드로 프론트엔드 개발 서버와 Tauri 백엔드를 함께 실행합니다:

```bash
cd gui
npm install
npm run tauri dev
```

이는 다음을 시작합니다:
- `http://localhost:1420`에서 Vite 개발 서버
- 개발 URL을 로드하는 Tauri 백엔드

### 프로덕션 빌드

배포 가능한 애플리케이션 번들 빌드:

```bash
cd gui
npm install
npm run tauri build
```

빌드 출력은 플랫폼에 따라 다릅니다:

| 플랫폼 | 출력 |
|----------|--------|
| Linux | `src-tauri/target/release/bundle/`에 `.deb`, `.AppImage`, `.rpm` |
| macOS | `src-tauri/target/release/bundle/`에 `.dmg`, `.app` |
| Windows | `src-tauri\target\release\bundle\`에 `.msi`, `.exe` |

## 애플리케이션 설정

Tauri 앱은 `gui/src-tauri/tauri.conf.json`을 통해 설정됩니다:

```json
{
  "productName": "PRX-SD",
  "version": "0.1.0",
  "identifier": "com.prxsd.app",
  "app": {
    "windows": [
      {
        "title": "PRX-SD Antivirus",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "trayIcon": {
      "id": "main-tray",
      "iconPath": "icons/32x32.png",
      "tooltip": "PRX-SD Antivirus"
    }
  }
}
```

## IPC 명령어

백엔드는 다음 Tauri 명령어를 프론트엔드에 노출합니다:

| 명령어 | 설명 |
|---------|-------------|
| `scan_path` | 파일 또는 디렉토리 스캔, 결과 반환 |
| `scan_directory` | 디렉토리를 재귀적으로 스캔 |
| `start_monitor` | 실시간 모니터링 검증 및 시작 |
| `stop_monitor` | 모니터링 데몬 중지 |
| `get_quarantine_list` | 모든 격리 항목 나열 |
| `restore_quarantine` | ID로 격리된 파일 복원 |
| `delete_quarantine` | ID로 격리 항목 삭제 |
| `get_config` | 현재 스캔 설정 읽기 |
| `save_config` | 스캔 설정을 디스크에 저장 |
| `get_engine_info` | 엔진 버전, 시그니처 수, YARA 규칙 가져오기 |
| `update_signatures` | 최신 시그니처 다운로드 및 설치 |
| `get_alert_history` | 감사 로그에서 알림 기록 읽기 |
| `get_dashboard_stats` | 대시보드 통계 집계 |
| `get_adblock_stats` | adblock 상태 및 규칙 수 가져오기 |
| `adblock_enable` | hosts 파일 광고 차단 활성화 |
| `adblock_disable` | hosts 파일 광고 차단 비활성화 |
| `adblock_sync` | 필터 목록 재다운로드 |
| `adblock_check` | 도메인이 차단되는지 확인 |
| `get_adblock_log` | 최근 차단 로그 항목 읽기 |

## 데이터 디렉토리

GUI는 CLI와 동일한 `~/.prx-sd/` 데이터 디렉토리를 사용합니다. GUI에서 만든 설정 변경은 `sd` 명령어에서 볼 수 있으며 그 반대도 마찬가지입니다.

::: warning
GUI와 CLI는 동일한 스캔 엔진 상태를 공유합니다. 데몬이 `sd daemon`을 통해 실행 중인 경우 GUI의 "모니터 시작" 버튼은 준비 상태를 검증하지만 실제 모니터링은 데몬 프로세스에서 처리됩니다. 동일한 파일에서 GUI 스캐너와 데몬 스캐너를 동시에 실행하지 마세요.
:::

## 기술 스택

| 컴포넌트 | 기술 |
|-----------|-----------|
| 백엔드 | Tauri 2, Rust |
| 프론트엔드 | Vue 3, TypeScript, Vite 6 |
| IPC | Tauri 명령어 프로토콜 |
| 트레이 | Tauri 트레이 플러그인 |
| 번들러 | Tauri 번들러 (deb/AppImage/dmg/msi) |
| API 바인딩 | `@tauri-apps/api` v2 |

## 다음 단계

- [설치 가이드](../getting-started/installation)를 따라 PRX-SD 설치
- 스크립팅 및 자동화를 위해 [CLI](../cli/)에 대해 알아보기
- [설정 레퍼런스](../configuration/reference)를 통해 엔진 설정
- [WASM 플러그인](../plugins/)으로 탐지 확장
