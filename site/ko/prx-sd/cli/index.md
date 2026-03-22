---
title: CLI 명령어 레퍼런스
description: "카테고리별로 정리된 27개의 sd CLI 서브 커맨드 전체 레퍼런스: 전역 옵션과 빠른 사용 예제 포함."
---

# CLI 명령어 레퍼런스

`sd` 커맨드라인 인터페이스는 10개 카테고리로 구성된 27개의 서브 커맨드를 제공합니다. 이 페이지는 빠른 참조 인덱스 역할을 합니다. 각 명령어는 상세 문서 페이지로 연결됩니다.

## 전역 옵션

이 플래그는 모든 서브 커맨드에 전달할 수 있습니다:

| 플래그 | 기본값 | 설명 |
|------|---------|-------------|
| `--log-level <LEVEL>` | `warn` | 로깅 상세도: `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | 시그니처, 격리, 설정, 플러그인을 위한 기본 데이터 디렉토리 |
| `--help` | -- | 모든 명령어 또는 서브 커맨드에 대한 도움말 표시 |
| `--version` | -- | 엔진 버전 표시 |

```bash
# 디버그 로깅 활성화
sd --log-level debug scan /tmp

# 사용자 정의 데이터 디렉토리 사용
sd --data-dir /opt/prx-sd scan /home
```

## 스캔

온디맨드 파일 및 시스템 스캐닝을 위한 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd scan <PATH>` | 파일 또는 디렉토리에서 위협 스캔 |
| `sd scan-memory` | 실행 중인 프로세스 메모리 스캔 (Linux 전용, root 필요) |
| `sd scan-usb [DEVICE]` | USB/이동식 장치 스캔 |
| `sd check-rootkit` | 루트킷 지표 확인 (Linux 전용) |

```bash
# 자동 격리로 디렉토리 재귀 스캔
sd scan /home --auto-quarantine

# 자동화를 위한 JSON 출력으로 스캔
sd scan /tmp --json

# 4개 스레드와 HTML 보고서로 스캔
sd scan /var --threads 4 --report /tmp/report.html

# 패턴 제외
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# 스캔 및 자동 수정 (프로세스 종료, 격리, 지속성 정리)
sd scan /tmp --remediate

# 프로세스 메모리 스캔
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# USB 장치 스캔
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# 루트킷 확인
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## 실시간 모니터링

지속적인 파일 시스템 모니터링 및 백그라운드 데몬 운영을 위한 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd monitor <PATHS...>` | 실시간 파일 시스템 모니터링 시작 |
| `sd daemon [PATHS...]` | 모니터링 및 자동 업데이트와 함께 백그라운드 데몬으로 실행 |

```bash
# /home과 /tmp의 변경 사항 모니터링
sd monitor /home /tmp

# 블록 모드로 모니터링 (fanotify, root 필요)
sudo sd monitor /home --block

# 기본 경로로 데몬 실행 (/home, /tmp)
sd daemon

# 사용자 정의 업데이트 간격으로 데몬 실행 (2시간마다)
sd daemon /home /tmp /var --update-hours 2
```

## 격리 관리

AES-256-GCM 암호화된 격리 저장소 관리를 위한 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd quarantine list` | 모든 격리된 파일 목록 조회 |
| `sd quarantine restore <ID>` | 격리된 파일을 원래 위치로 복원 |
| `sd quarantine delete <ID>` | 격리된 파일 영구 삭제 |
| `sd quarantine delete-all` | 모든 격리된 파일 영구 삭제 |
| `sd quarantine stats` | 격리 저장소 통계 표시 |

```bash
# 격리된 파일 목록 조회
sd quarantine list

# 파일 복원 (ID의 처음 8자 사용)
sd quarantine restore a1b2c3d4

# 대체 경로로 복원
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# 특정 항목 삭제
sd quarantine delete a1b2c3d4

# 모든 항목 삭제 (확인 프롬프트 포함)
sd quarantine delete-all

# 확인 없이 모두 삭제
sd quarantine delete-all --yes

# 격리 통계 보기
sd quarantine stats
```

## 시그니처 관리

위협 시그니처 업데이트 및 가져오기 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd update` | 시그니처 데이터베이스 업데이트 확인 및 적용 |
| `sd import <FILE>` | 블록리스트 파일에서 해시 시그니처 가져오기 |
| `sd import-clamav <FILES...>` | ClamAV 시그니처 파일 가져오기 (.cvd, .hdb, .hsb) |
| `sd info` | 엔진 버전, 시그니처 상태, 시스템 정보 표시 |

```bash
# 시그니처 업데이트
sd update

# 다운로드 없이 업데이트 확인
sd update --check-only

# 강제 재다운로드
sd update --force

# 사용자 정의 해시 파일 가져오기
sd import /path/to/hashes.txt

# ClamAV 시그니처 가져오기
sd import-clamav main.cvd daily.cvd

# 엔진 정보 표시
sd info
```

## 설정

엔진 설정 및 수정 정책 관리 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd config show` | 현재 설정 표시 |
| `sd config set <KEY> <VALUE>` | 설정 값 지정 |
| `sd config reset` | 설정을 기본값으로 초기화 |
| `sd policy show` | 수정 정책 표시 |
| `sd policy set <KEY> <VALUE>` | 수정 정책 값 지정 |
| `sd policy reset` | 수정 정책을 기본값으로 초기화 |

```bash
# 설정 표시
sd config show

# 스캔 스레드 설정
sd config set scan.threads 8

# 기본값으로 초기화
sd config reset

# 수정 정책 표시
sd policy show
```

자세한 내용은 [설정 개요](../configuration/)와 [설정 레퍼런스](../configuration/reference)를 참조하세요.

## 예약 스캔

systemd 타이머 또는 cron을 통한 주기적 예약 스캔 관리 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd schedule add <PATH>` | 반복 예약 스캔 등록 |
| `sd schedule remove` | 예약 스캔 제거 |
| `sd schedule status` | 현재 일정 상태 표시 |

```bash
# /home의 주간 스캔 예약
sd schedule add /home --frequency weekly

# 일간 스캔 예약
sd schedule add /var --frequency daily

# 사용 가능한 빈도: hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# 일정 제거
sd schedule remove

# 일정 상태 확인
sd schedule status
```

## 알림 및 웹훅

웹훅 및 이메일을 통한 알림 설정 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd webhook list` | 설정된 웹훅 엔드포인트 목록 |
| `sd webhook add <NAME> <URL>` | 웹훅 엔드포인트 추가 |
| `sd webhook remove <NAME>` | 웹훅 엔드포인트 제거 |
| `sd webhook test` | 모든 웹훅으로 테스트 알림 전송 |
| `sd email-alert configure` | SMTP 이메일 알림 설정 |
| `sd email-alert test` | 테스트 알림 이메일 전송 |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | 사용자 정의 알림 이메일 전송 |

```bash
# Slack 웹훅 추가
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Discord 웹훅 추가
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# 일반 웹훅 추가
sd webhook add my-webhook https://example.com/webhook

# 모든 웹훅 목록 조회
sd webhook list

# 모든 웹훅 테스트
sd webhook test

# 이메일 알림 설정
sd email-alert configure

# 이메일 알림 테스트
sd email-alert test
```

## 네트워크 보호

DNS 레벨 광고 및 악성 도메인 차단 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd adblock enable` | hosts 파일을 통한 광고 차단 보호 활성화 |
| `sd adblock disable` | 광고 차단 보호 비활성화 |
| `sd adblock sync` | 모든 필터 목록 재다운로드 |
| `sd adblock stats` | 광고 차단 엔진 통계 표시 |
| `sd adblock check <URL>` | URL/도메인이 차단되었는지 확인 |
| `sd adblock log` | 최근 차단된 항목 표시 |
| `sd adblock add <NAME> <URL>` | 사용자 정의 필터 목록 추가 |
| `sd adblock remove <NAME>` | 필터 목록 제거 |
| `sd dns-proxy` | 필터링을 사용한 로컬 DNS 프록시 시작 |

```bash
# 광고 차단 활성화
sudo sd adblock enable

# DNS 프록시 시작
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

자세한 내용은 [광고 차단](../network/adblock)과 [DNS 프록시](../network/dns-proxy)를 참조하세요.

## 보고

| 명령어 | 설명 |
|---------|-------------|
| `sd report <OUTPUT>` | JSON 스캔 결과에서 HTML 보고서 생성 |

```bash
# JSON 출력으로 스캔한 후 HTML 보고서 생성
sd scan /home --json > results.json
sd report report.html --input results.json

# 또는 --report 플래그 직접 사용
sd scan /home --report /tmp/scan-report.html
```

## 시스템

엔진 유지 관리, 통합, 자체 업데이트 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd status` | 데몬 상태 표시 (실행 중/중지됨, PID, 차단된 위협) |
| `sd install-integration` | 파일 관리자 우클릭 스캔 통합 설치 |
| `sd self-update` | 엔진 바이너리 업데이트 확인 및 적용 |

```bash
# 데몬 상태 확인
sd status

# 데스크톱 통합 설치
sd install-integration

# 엔진 업데이트 확인
sd self-update --check-only

# 엔진 업데이트 적용
sd self-update
```

## 커뮤니티

커뮤니티 위협 인텔리전스 공유 명령어.

| 명령어 | 설명 |
|---------|-------------|
| `sd community status` | 커뮤니티 공유 설정 표시 |
| `sd community enroll` | 이 머신을 커뮤니티 API에 등록 |
| `sd community disable` | 커뮤니티 공유 비활성화 |

```bash
# 등록 상태 확인
sd community status

# 커뮤니티 공유에 등록
sd community enroll

# 공유 비활성화 (자격증명 보존)
sd community disable
```

## 다음 단계

- [빠른 시작 가이드](../getting-started/quickstart)로 5분 안에 스캔 시작
- [설정](../configuration/)으로 엔진 동작 커스터마이징
- 지속적인 보호를 위한 [실시간 모니터링](../realtime/) 설정
- [탐지 엔진](../detection/) 파이프라인에 대해 알아보기
