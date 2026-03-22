---
title: 문제 해결
description: "시그니처 업데이트, 스캔 성능, 권한, 오탐, 데몬 문제, 메모리 사용량을 포함한 일반적인 PRX-SD 문제에 대한 해결 방법."
---

# 문제 해결

이 페이지는 PRX-SD 실행 시 발생하는 가장 일반적인 문제와 그 원인 및 해결 방법을 다룹니다.

## 시그니처 데이터베이스 업데이트 실패

**증상:** `sd update`가 네트워크 오류, 타임아웃 또는 SHA-256 불일치로 실패합니다.

**가능한 원인:**
- 인터넷 연결이 없거나 방화벽이 아웃바운드 HTTPS를 차단
- 업데이트 서버가 일시적으로 사용 불가
- 프록시 또는 기업 방화벽이 응답을 수정

**해결 방법:**

1. 업데이트 서버에 대한 **연결 확인**:

```bash
curl -fsSL https://update.prx-sd.dev/v1/manifest.json
```

2. 네트워크 제한이 있는 경우 **오프라인 업데이트 스크립트** 사용:

```bash
# 인터넷 접근이 있는 머신에서
./tools/update-signatures.sh

# 시그니처 디렉토리를 대상 머신에 복사
scp -r ~/.prx-sd/signatures user@target:~/.prx-sd/
```

3. 손상된 캐시를 지우기 위해 **강제 재다운로드**:

```bash
sd update --force
```

4. 비공개 미러를 호스팅하는 경우 **사용자 정의 업데이트 서버** 사용:

```bash
sd config set update_server_url "https://internal-mirror.example.com/prx-sd/v1"
sd update
```

5. **SHA-256 불일치 확인** -- 이것은 보통 전송 중에 다운로드가 손상되었음을 의미합니다. 다시 시도하거나 수동으로 다운로드하세요:

```bash
sd update --force
```

::: tip
다운로드 없이 업데이트가 사용 가능한지 확인하려면 `sd update --check-only`를 실행하세요.
:::

## 스캔 속도가 느림

**증상:** 디렉토리 스캔이 예상보다 훨씬 오래 걸립니다.

**가능한 원인:**
- 네트워크 마운트 파일 시스템(NFS, CIFS, SSHFS) 스캔
- YARA 규칙이 모든 스캔마다 컴파일됨 (캐시된 컴파일 없음)
- 너무 많은 스레드가 회전식 디스크의 I/O를 두고 경쟁
- 대형 중첩 아카이브에 대한 아카이브 재귀

**해결 방법:**

1. SSD 스토리지를 위해 **스레드 수 늘리기**:

```bash
sd config set scan.threads 16
```

2. 회전식 디스크를 위해 **스레드 수 줄이기** (I/O 바운드):

```bash
sd config set scan.threads 2
```

3. 느리거나 관련 없는 경로 **제외**:

```bash
sd config set scan.exclude_paths '["/mnt/nfs", "/proc", "/sys", "/dev", "*.iso"]'
```

4. 필요하지 않은 경우 **아카이브 스캔 비활성화**:

```bash
sd config set scan.scan_archives false
```

5. 깊이 중첩된 아카이브를 피하기 위해 **아카이브 깊이 줄이기**:

```bash
sd config set scan.max_archive_depth 1
```

6. 일회성 스캔을 위해 **`--exclude` 플래그 사용**:

```bash
sd scan /home --exclude "*.iso" --exclude "node_modules"
```

7. 병목 현상을 찾기 위해 **디버그 로깅 활성화**:

```bash
sd --log-level debug scan /path/to/dir 2>&1 | grep -i "slow\|timeout\|skip"
```

## fanotify 권한 오류

**증상:** `sd monitor --block`이 "Permission denied" 또는 "Operation not permitted"로 실패합니다.

**가능한 원인:**
- root로 실행하지 않음
- Linux 커널에 `CONFIG_FANOTIFY_ACCESS_PERMISSIONS`가 활성화되지 않음
- AppArmor 또는 SELinux가 fanotify 접근을 차단

**해결 방법:**

1. **root로 실행**:

```bash
sudo sd monitor /home /tmp --block
```

2. **커널 설정 확인**:

```bash
zgrep FANOTIFY /proc/config.gz
# 다음을 표시해야 합니다: CONFIG_FANOTIFY=y and CONFIG_FANOTIFY_ACCESS_PERMISSIONS=y
```

3. 폴백으로 **비블록 모드 사용** (여전히 위협을 탐지하지만 파일 접근을 방지하지 않음):

```bash
sd monitor /home /tmp
```

::: warning
블록 모드는 fanotify 지원이 있는 Linux에서만 사용할 수 있습니다. macOS(FSEvents)와 Windows(ReadDirectoryChangesW)에서 실시간 모니터링은 탐지 전용 모드로 작동합니다.
:::

4. **SELinux/AppArmor 확인**:

```bash
# SELinux: 거부 확인
ausearch -m AVC -ts recent | grep prx-sd

# AppArmor: 거부 확인
dmesg | grep apparmor | grep prx-sd
```

## 오탐 (합법적인 파일이 위협으로 탐지됨)

**증상:** 알려진 안전한 파일이 의심스럽거나 악성으로 표시됩니다.

**해결 방법:**

1. **탐지를 유발한 것 확인**:

```bash
sd scan /path/to/file --json
```

`detection_type`과 `threat_name` 필드를 확인합니다:
- `HashMatch` -- 파일의 해시가 알려진 악성코드 해시와 일치합니다 (오탐 가능성 낮음)
- `YaraRule` -- YARA 규칙이 파일의 패턴과 일치했습니다
- `Heuristic` -- 휴리스틱 엔진이 파일을 임계값 이상으로 점수를 매겼습니다

2. **휴리스틱 오탐**의 경우 임계값을 높입니다:

```bash
# 기본값은 60; 오탐을 줄이기 위해 70으로 높입니다
sd config set scan.heuristic_threshold 70
```

3. 파일 또는 디렉토리를 스캔에서 **제외**합니다:

```bash
sd config set scan.exclude_paths '["/path/to/safe-file", "/opt/known-good/"]'
```

4. **YARA 오탐**의 경우 `~/.prx-sd/yara/` 디렉토리에서 특정 규칙을 제거하거나 주석 처리하여 제외할 수 있습니다.

5. **해시로 화이트리스트** -- 로컬 허용 목록에 파일의 SHA-256 추가 (향후 기능). 해결 방법으로 경로로 파일을 제외합니다.

::: tip
탐지가 진정한 오탐이라고 생각되면 파일 해시(파일 자체가 아님)와 규칙 이름과 함께 [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)에 보고해 주세요.
:::

## 데몬을 시작할 수 없음

**증상:** `sd daemon`이 즉시 종료되거나, `sd status`가 "중지됨"을 표시합니다.

**가능한 원인:**
- 다른 인스턴스가 이미 실행 중 (PID 파일 존재)
- 데이터 디렉토리에 접근할 수 없거나 손상됨
- 시그니처 데이터베이스가 없음

**해결 방법:**

1. **오래된 PID 파일 확인**:

```bash
cat ~/.prx-sd/prx-sd.pid
# 나열된 PID가 실행 중이지 않으면 파일을 제거합니다
rm ~/.prx-sd/prx-sd.pid
```

2. **데몬 상태 확인**:

```bash
sd status
```

3. 시작 오류를 보기 위해 디버그 로깅으로 **포그라운드에서 실행**:

```bash
sd --log-level debug daemon /home /tmp
```

4. **시그니처 존재 확인**:

```bash
sd info
# hash_count가 0이면 실행합니다:
sd update
```

5. **디렉토리 권한 확인**:

```bash
ls -la ~/.prx-sd/
# 모든 디렉토리는 사용자가 소유하고 쓰기 가능해야 합니다
```

6. 데이터 디렉토리가 손상된 경우 **재초기화**:

```bash
# 기존 데이터 백업
mv ~/.prx-sd ~/.prx-sd.bak

# 최초 실행 설정을 트리거하기 위해 아무 명령어나 다시 실행
sd info

# 시그니처 재다운로드
sd update
```

## 로그 레벨 조정

**문제:** 문제를 디버그하기 위해 더 많은 진단 정보가 필요합니다.

PRX-SD는 가장 자세한 것부터 가장 간략한 순서로 다섯 가지 로그 레벨을 지원합니다:

| 레벨 | 설명 |
|-------|-------------|
| `trace` | 파일별 YARA 매칭 세부 정보를 포함한 모든 것 |
| `debug` | 상세한 엔진 작업, 플러그인 로딩, 해시 조회 |
| `info` | 스캔 진행, 시그니처 업데이트, 플러그인 등록 |
| `warn` | 경고 및 치명적이지 않은 오류 (기본값) |
| `error` | 심각한 오류만 |

```bash
# 최대 상세도
sd --log-level trace scan /tmp

# 문제 해결을 위한 디버그 레벨
sd --log-level debug monitor /home

# 분석을 위해 파일로 로그 리디렉션
sd --log-level debug scan /home 2> /tmp/prx-sd-debug.log
```

::: tip
`--log-level` 플래그는 전역이며 서브 커맨드 **앞에** 와야 합니다:
```bash
# 올바름
sd --log-level debug scan /tmp

# 올바르지 않음 (서브 커맨드 뒤의 플래그)
sd scan /tmp --log-level debug
```
:::

## 높은 메모리 사용량

**증상:** `sd` 프로세스가 예상보다 더 많은 메모리를 소비합니다, 특히 대형 디렉토리 스캔 중에.

**가능한 원인:**
- 많은 스레드로 매우 많은 수의 파일 스캔
- YARA 규칙이 메모리로 컴파일됨 (38,800개 이상의 규칙이 상당한 메모리 사용)
- 아카이브 스캔이 대형 압축 파일을 메모리로 팽창
- 높은 `max_memory_mb` 제한이 있는 WASM 플러그인

**해결 방법:**

1. **스레드 수 줄이기** (각 스레드가 자체 YARA 컨텍스트 로드):

```bash
sd config set scan.threads 2
```

2. 매우 큰 파일을 건너뛰기 위해 **최대 파일 크기 제한**:

```bash
# 50 MiB로 제한
sd config set scan.max_file_size 52428800
```

3. 메모리가 제한된 시스템을 위해 **아카이브 스캔 비활성화**:

```bash
sd config set scan.scan_archives false
```

4. **아카이브 깊이 줄이기**:

```bash
sd config set scan.max_archive_depth 1
```

5. **WASM 플러그인 메모리 제한 확인** -- 높은 `max_memory_mb` 값이 있는 플러그인의 `~/.prx-sd/plugins/*/plugin.json`을 검토하고 줄입니다.

6. **스캔 중 메모리 모니터링**:

```bash
# 다른 터미널에서
watch -n 1 'ps aux | grep sd | grep -v grep'
```

7. **데몬**의 경우 시간에 따른 메모리 모니터링:

```bash
sd status
# PID를 표시합니다; 메모리를 감시하기 위해 top/htop 사용
```

## 기타 일반적인 문제

### "YARA 규칙을 찾을 수 없음" 경고

YARA 규칙 디렉토리가 비어 있습니다. 최초 실행 설정을 다시 실행하거나 규칙을 다운로드합니다:

```bash
sd update
# 또는 yara 디렉토리를 제거하여 수동으로 설정 트리거:
rm -rf ~/.prx-sd/yara
sd info  # 내장 규칙으로 최초 실행 설정 트리거
```

### "시그니처 데이터베이스를 열 수 없음" 오류

LMDB 시그니처 데이터베이스가 손상되었을 수 있습니다:

```bash
rm -rf ~/.prx-sd/signatures
sd update
```

### Adblock: "권한 부족"

adblock 활성화/비활성화 명령어는 시스템 hosts 파일을 수정하며 root가 필요합니다:

```bash
sudo sd adblock enable
sudo sd adblock disable
```

### 스캔이 "타임아웃" 오류로 파일을 건너뜀

개별 파일 타임아웃은 기본적으로 30초입니다. 복잡한 파일을 위해 늘립니다:

```bash
sd config set scan.timeout_per_file_ms 60000
```

## 도움 받기

위의 해결 방법으로 문제가 해결되지 않는 경우:

1. **기존 이슈 확인:** [github.com/openprx/prx-sd/issues](https://github.com/openprx/prx-sd/issues)
2. **새 이슈 제출** (다음 포함):
   - PRX-SD 버전 (`sd info`)
   - 운영 체제 및 커널 버전
   - 디버그 로그 출력 (`sd --log-level debug ...`)
   - 재현 단계

## 다음 단계

- 엔진 동작을 미세 조정하기 위해 [설정 레퍼런스](../configuration/reference) 검토
- 위협이 어떻게 식별되는지 이해하기 위해 [탐지 엔진](../detection/) 알아보기
- 문제를 사전에 알리기 위해 [알림](../alerts/) 설정
