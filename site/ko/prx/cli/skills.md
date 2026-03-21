---
title: prx skills
description: PRX 에이전트 기능을 확장하는 설치 가능한 스킬을 관리합니다.
---

# prx skills

스킬을 관리합니다 -- PRX 에이전트가 할 수 있는 것을 확장하는 모듈식 기능 패키지입니다. 스킬은 프롬프트, 도구 구성, WASM 플러그인을 설치 가능한 단위로 번들링합니다.

## 사용법

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx skills list`

설치된 스킬과 레지스트리에서 사용 가능한 스킬을 나열합니다.

```bash
prx skills list [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--installed` | | `false` | 설치된 스킬만 표시 |
| `--available` | | `false` | 사용 가능한(아직 설치되지 않은) 스킬만 표시 |
| `--json` | `-j` | `false` | JSON으로 출력 |

**출력 예시:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

레지스트리 또는 로컬 경로에서 스킬을 설치합니다.

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--version` | `-v` | 최신 | 설치할 특정 버전 |
| `--force` | `-f` | `false` | 이미 설치되어 있어도 재설치 |

```bash
# 레지스트리에서 설치
prx skills install code-review

# 특정 버전 설치
prx skills install web-research --version 1.0.2

# 로컬 경로에서 설치
prx skills install ./my-custom-skill/

# 강제 재설치
prx skills install code-review --force
```

### `prx skills remove`

스킬을 제거합니다.

```bash
prx skills remove <NAME> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--force` | `-f` | `false` | 확인 프롬프트 건너뛰기 |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## 스킬 구조

스킬 패키지의 구성:

```
my-skill/
  skill.toml          # 스킬 메타데이터 및 구성
  system_prompt.md    # 추가 시스템 프롬프트 지침
  tools.toml          # 도구 정의 및 권한
  plugin.wasm         # 선택적 WASM 플러그인 바이너리
```

`skill.toml` 매니페스트:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## 스킬 디렉터리

설치된 스킬은 다음 위치에 저장됩니다:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## 관련 문서

- [플러그인 개요](/ko/prx/plugins/) -- WASM 플러그인 시스템
- [도구 개요](/ko/prx/tools/) -- 내장 도구
- [개발자 가이드](/ko/prx/plugins/developer-guide) -- 사용자 지정 플러그인 빌드
