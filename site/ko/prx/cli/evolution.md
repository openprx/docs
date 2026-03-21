---
title: prx evolution
description: PRX 자기 진화 엔진을 모니터링하고 제어합니다.
---

# prx evolution

자기 진화 엔진을 검사하고 제어합니다. PRX는 세 가지 수준의 자율 진화를 지원합니다: L1(메모리), L2(프롬프트), L3(전략). 이 명령으로 진화 상태를 확인하고, 기록을 검토하고, 설정을 업데이트하고, 수동 진화 사이클을 트리거할 수 있습니다.

## 사용법

```bash
prx evolution <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx evolution status`

진화 엔진의 현재 상태를 표시합니다.

```bash
prx evolution status [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--json` | `-j` | `false` | JSON으로 출력 |

**출력 예시:**

```
 Evolution Engine Status
 ───────────────────────
 Engine:    running
 L1 Memory:    enabled   (last: 2h ago, next: in 4h)
 L2 Prompt:    enabled   (last: 1d ago, next: in 23h)
 L3 Strategy:  disabled
 Total cycles: 142
 Rollbacks:    3
```

### `prx evolution history`

진화 기록 로그를 표시합니다.

```bash
prx evolution history [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--limit` | `-n` | `20` | 표시할 항목 수 |
| `--level` | `-l` | 전체 | 수준별 필터: `l1`, `l2`, `l3` |
| `--json` | `-j` | `false` | JSON으로 출력 |

```bash
# 최근 L2 진화 10개 표시
prx evolution history --limit 10 --level l2
```

**출력 예시:**

```
 Time                Level  Action                          Status
 2026-03-21 08:00    L1     memory consolidation            success
 2026-03-20 20:00    L1     memory consolidation            success
 2026-03-20 09:00    L2     prompt refinement (system)      success
 2026-03-19 14:22    L2     prompt refinement (tool-use)    rolled back
```

### `prx evolution config`

진화 설정을 확인하거나 업데이트합니다.

```bash
prx evolution config [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--set` | | | 설정 값 설정 (예: `--set l1.enabled=true`) |
| `--json` | `-j` | `false` | JSON으로 출력 |

```bash
# 현재 설정 확인
prx evolution config

# L3 전략 진화 활성화
prx evolution config --set l3.enabled=true

# L1 간격을 2시간으로 설정
prx evolution config --set l1.interval=7200
```

### `prx evolution trigger`

수동으로 진화 사이클을 트리거합니다.

```bash
prx evolution trigger [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--level` | `-l` | `l1` | 트리거할 진화 수준: `l1`, `l2`, `l3` |
| `--dry-run` | | `false` | 변경 사항을 적용하지 않고 진화 미리보기 |

```bash
# L1 메모리 진화 트리거
prx evolution trigger --level l1

# L2 프롬프트 진화 미리보기
prx evolution trigger --level l2 --dry-run
```

## 진화 수준

| 수준 | 대상 | 설명 |
|------|------|------|
| **L1** | 메모리 | 메모리 항목을 통합, 중복 제거, 정리합니다 |
| **L2** | 프롬프트 | 상호작용 패턴을 기반으로 시스템 프롬프트와 도구 사용 지침을 개선합니다 |
| **L3** | 전략 | 고수준 행동 전략을 적응시킵니다 (명시적 옵트인 필요) |

모든 진화 변경 사항은 되돌릴 수 있습니다. 엔진은 롤백 기록을 유지하며 성능 저하를 유발하는 변경 사항은 자동으로 되돌립니다.

## 관련 문서

- [자기 진화 개요](/ko/prx/self-evolution/) -- 아키텍처 및 개념
- [L1: 메모리 진화](/ko/prx/self-evolution/l1-memory) -- 메모리 통합 세부 사항
- [L2: 프롬프트 진화](/ko/prx/self-evolution/l2-prompt) -- 프롬프트 개선 파이프라인
- [L3: 전략 진화](/ko/prx/self-evolution/l3-strategy) -- 전략 적응
- [진화 안전성](/ko/prx/self-evolution/safety) -- 롤백 및 안전 메커니즘
