---
title: 휴리스틱 분석
description: PRX-SD 휴리스틱 엔진은 PE, ELF, Mach-O, Office, PDF 파일에 대한 파일 유형별 행동 분석을 수행하여 알려지지 않은 위협을 탐지합니다.
---

# 휴리스틱 분석

휴리스틱 분석은 PRX-SD 탐지 파이프라인의 세 번째 레이어입니다. 해시 매칭과 YARA 규칙이 알려진 시그니처와 패턴에 의존하는 반면, 휴리스틱은 파일의 **구조적 및 행동적 속성**을 분석하여 이전에 본 적이 없는 위협을 탐지합니다 -- 제로데이 악성코드, 맞춤형 임플란트, 심하게 난독화된 샘플 포함.

## 작동 방식

PRX-SD는 먼저 매직 넘버 탐지로 파일 유형을 식별한 다음 해당 파일 형식에 특정한 타겟팅된 휴리스틱 검사 세트를 적용합니다. 트리거되는 각 검사는 누적 점수에 포인트를 추가합니다. 최종 점수가 판정을 결정합니다.

### 점수 메커니즘

| 점수 범위 | 판정 | 의미 |
|-------------|---------|---------|
| 0 - 29 | **Clean** | 중요한 의심 지표 없음 |
| 30 - 59 | **Suspicious** | 일부 이상 감지; 수동 검토 권장 |
| 60 - 100 | **Malicious** | 높은 신뢰도의 위협; 여러 강력한 지표 |

점수는 누적됩니다. 사소한 이상(예: 약간 높은 엔트로피)이 있는 파일은 15점을 받을 수 있는 반면, 높은 엔트로피, 의심스러운 API 임포트, 패커 시그니처를 결합한 파일은 75점 이상을 받을 수 있습니다.

## PE (Windows 실행 파일) 분석

PE 휴리스틱은 Windows 실행 파일(.exe, .dll, .scr, .sys)을 대상으로 합니다:

| 검사 | 포인트 | 설명 |
|-------|--------|-------------|
| 높은 섹션 엔트로피 | 10-25 | 엔트로피 > 7.0인 섹션은 패킹 또는 암호화를 나타냄 |
| 의심스러운 API 임포트 | 5-20 | `VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread` 같은 API |
| 알려진 패커 시그니처 | 15-25 | UPX, Themida, VMProtect, ASPack, PECompact 헤더 감지 |
| 타임스탬프 이상 | 5-10 | 미래 또는 2000년 이전의 컴파일 타임스탬프 |
| 섹션 이름 이상 | 5-10 | 비표준 섹션 이름 (`.rsrc` 교체, 랜덤 문자열) |
| 리소스 이상 | 5-15 | 리소스에 임베드된 PE 파일, 암호화된 리소스 섹션 |
| 임포트 테이블 이상 | 10-15 | 매우 적은 임포트 (패킹됨), 또는 의심스러운 임포트 조합 |
| 디지털 서명 | -10 | 유효한 Authenticode 서명은 점수를 줄임 |
| TLS 콜백 | 10 | 디버그 방지 TLS 콜백 항목 |
| 오버레이 데이터 | 5-10 | PE 구조 이후 추가된 중요한 데이터 |

### PE 발견 예제

```
휴리스틱 분석: updater.exe
점수: 72/100 [MALICIOUS]

발견 사항:
  [+25] 섹션 '.text' 엔트로피: 7.91 (패킹 또는 암호화 가능)
  [+15] 패커 감지: UPX 3.96
  [+12] 의심스러운 API 임포트: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] 섹션 이름 이상: '.UPX0', '.UPX1' (비표준)
  [+10] 컴파일 타임스탬프: 2089-01-01 (미래 날짜)
```

## ELF (Linux 실행 파일) 분석

ELF 휴리스틱은 Linux 바이너리 및 공유 객체를 대상으로 합니다:

| 검사 | 포인트 | 설명 |
|-------|--------|-------------|
| 높은 섹션 엔트로피 | 10-25 | 엔트로피 > 7.0인 섹션 |
| LD_PRELOAD 참조 | 15-20 | `LD_PRELOAD` 또는 `/etc/ld.so.preload`를 참조하는 문자열 |
| Cron 지속성 | 10-15 | `/etc/crontab`, `/var/spool/cron`, cron 디렉토리에 대한 참조 |
| Systemd 지속성 | 10-15 | systemd 유닛 경로, `systemctl enable`에 대한 참조 |
| SSH 백도어 지표 | 15-20 | 수정된 `authorized_keys` 경로, `sshd` 설정 문자열 |
| 디버그 방지 | 10-15 | `ptrace(PTRACE_TRACEME)`, `/proc/self/status` 확인 |
| 네트워크 작업 | 5-10 | 원시 소켓 생성, 의심스러운 포트 바인딩 |
| 자기 삭제 | 10 | 실행 후 자체 바이너리 경로의 `unlink` |
| 스트립됨 + 높은 엔트로피 | 10 | 높은 엔트로피를 가진 스트립된 바이너리는 패킹된 악성코드를 나타냄 |
| `/dev/null` 리다이렉트 | 5 | 출력을 `/dev/null`로 리다이렉트 (데몬 동작) |

### ELF 발견 예제

```
휴리스틱 분석: .cache/systemd-helper
점수: 65/100 [MALICIOUS]

발견 사항:
  [+20] LD_PRELOAD 참조: /etc/ld.so.preload 조작
  [+15] Cron 지속성: /var/spool/cron/root에 쓰기
  [+15] SSH 백도어: /root/.ssh/authorized_keys 수정
  [+10] 자기 삭제: /tmp/.cache/systemd-helper의 unlink
  [+5]  네트워크: 원시 소켓 생성
```

## Mach-O (macOS 실행 파일) 분석

Mach-O 휴리스틱은 macOS 바이너리, 번들, 유니버설 바이너리를 대상으로 합니다:

| 검사 | 포인트 | 설명 |
|-------|--------|-------------|
| 높은 섹션 엔트로피 | 10-25 | 엔트로피 > 7.0인 섹션 |
| Dylib 주입 | 15-20 | `DYLD_INSERT_LIBRARIES` 참조, 의심스러운 dylib 로딩 |
| LaunchAgent/Daemon 지속성 | 10-15 | `~/Library/LaunchAgents`, `/Library/LaunchDaemons` 참조 |
| Keychain 접근 | 10-15 | Keychain API 호출, `security` 명령어 사용 |
| Gatekeeper 우회 | 10-15 | `xattr -d com.apple.quarantine` 문자열 |
| 개인정보 TCC 우회 | 10-15 | TCC 데이터베이스, 접근성 API 남용에 대한 참조 |
| 분석 방지 | 10 | 디버거를 위한 `sysctl` 확인, VM 탐지 문자열 |
| 코드 서명 이상 | 5-10 | 임시 서명 또는 서명되지 않은 바이너리 |

### Mach-O 발견 예제

```
휴리스틱 분석: com.apple.helper
점수: 55/100 [SUSPICIOUS]

발견 사항:
  [+20] Dylib 주입: DYLD_INSERT_LIBRARIES 조작
  [+15] LaunchAgent 지속성: ~/Library/LaunchAgents/ 에 쓰기
  [+10] Keychain 접근: SecKeychainFindGenericPassword 호출
  [+10] 서명되지 않은 바이너리: 코드 서명 없음
```

## Office 문서 분석

Office 휴리스틱은 Microsoft Office 형식(.doc, .docx, .xls, .xlsx, .ppt)을 대상으로 합니다:

| 검사 | 포인트 | 설명 |
|-------|--------|-------------|
| VBA 매크로 존재 | 10-15 | 자동 실행 매크로 (`AutoOpen`, `Document_Open`, `Workbook_Open`) |
| 셸 실행 매크로 | 20-30 | 매크로에서 `Shell()`, `WScript.Shell`, `PowerShell` 호출 |
| DDE 필드 | 15-20 | 명령어를 실행하는 동적 데이터 교환 필드 |
| 외부 템플릿 링크 | 10-15 | `attachedTemplate`을 통한 원격 템플릿 주입 |
| 난독화된 VBA | 10-20 | 심하게 난독화된 매크로 코드 (Chr(), 문자열 연결 남용) |
| 임베드된 OLE 객체 | 5-10 | OLE 객체로 임베드된 실행 파일 또는 스크립트 |
| 의심스러운 메타데이터 | 5 | base64 문자열 또는 비정상적인 패턴이 있는 작성자 필드 |

### Office 발견 예제

```
휴리스틱 분석: Q3_Report.xlsm
점수: 60/100 [MALICIOUS]

발견 사항:
  [+15] AutoOpen 트리거가 있는 VBA 매크로
  [+25] 매크로 실행: Shell("powershell -enc JABjAGwA...")
  [+10] 난독화된 VBA: 47개의 Chr() 호출, 문자열 연결 남용
  [+10] 외부 템플릿: https://evil.example.com/template.dotm
```

## PDF 분석

PDF 휴리스틱은 PDF 문서를 대상으로 합니다:

| 검사 | 포인트 | 설명 |
|-------|--------|-------------|
| 임베드된 JavaScript | 15-25 | `/JS` 또는 `/JavaScript` 액션의 JavaScript |
| Launch 액션 | 20-25 | 시스템 명령어를 실행하는 `/Launch` 액션 |
| URI 액션 | 5-10 | 알려진 나쁜 패턴을 가리키는 의심스러운 URI 액션 |
| 난독화된 스트림 | 10-15 | 여러 인코딩 레이어 (FlateDecode + ASCII85 + 16진수) |
| 임베드된 파일 | 5-10 | 첨부 파일로 임베드된 실행 파일 |
| 양식 제출 | 5-10 | 외부 URL로 데이터를 제출하는 양식 |
| JavaScript가 있는 AcroForm | 15 | 임베드된 JavaScript가 있는 대화형 양식 |

### PDF 발견 예제

```
휴리스틱 분석: shipping_label.pdf
점수: 45/100 [SUSPICIOUS]

발견 사항:
  [+20] 임베드된 JavaScript: 3개의 /JS 액션 발견
  [+15] 난독화된 스트림: 삼중 인코딩된 FlateDecode 체인
  [+10] 임베드된 파일: invoice.exe (PE 실행 파일)
```

## 일반적인 발견 사항 레퍼런스

다음 표는 모든 파일 유형에서 가장 자주 트리거되는 휴리스틱 발견 사항을 나열합니다:

| 발견 사항 | 심각도 | 파일 유형 | 오탐지율 |
|---------|----------|------------|---------------------|
| 높은 엔트로피 섹션 | 중간 | PE, ELF, Mach-O | 낮음-중간 (게임 자산, 압축 데이터) |
| 패커 탐지 | 높음 | PE | 매우 낮음 |
| 자동 실행 매크로 | 높음 | Office | 낮음 (일부 합법적인 매크로) |
| LD_PRELOAD 조작 | 높음 | ELF | 매우 낮음 |
| 임베드된 JavaScript | 중간-높음 | PDF | 낮음 |
| 의심스러운 API 임포트 | 중간 | PE | 중간 (보안 도구가 이것을 트리거함) |
| 자기 삭제 | 높음 | ELF | 매우 낮음 |

::: tip 오탐지 줄이기
합법적인 파일이 휴리스틱 알림을 트리거하는 경우 SHA-256 해시로 허용 목록에 추가할 수 있습니다:
```bash
sd allowlist add /path/to/legitimate/file
```
허용 목록에 추가된 파일은 휴리스틱 분석을 건너뛰지만 여전히 해시 및 YARA 데이터베이스에 대해 확인됩니다.
:::

## 다음 단계

- [지원 파일 유형](./file-types) -- 전체 파일 유형 매트릭스 및 매직 탐지 세부 정보
- [YARA 규칙](./yara-rules) -- 휴리스틱을 보완하는 패턴 기반 탐지
- [해시 매칭](./hash-matching) -- 가장 빠른 탐지 레이어
- [탐지 엔진 개요](./index) -- 모든 레이어가 함께 작동하는 방식
