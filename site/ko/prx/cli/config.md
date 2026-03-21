---
title: prx config
description: 명령줄에서 PRX 설정을 검사하고 수정합니다.
---

# prx config

TOML을 직접 편집하지 않고 PRX 설정 파일을 읽고, 쓰고, 유효성을 검사하고, 변환합니다.

## 사용법

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## 하위 명령어

### `prx config get`

점 표기법 키 경로로 설정 값을 읽습니다.

```bash
prx config get <KEY> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |
| `--json` | `-j` | `false` | JSON으로 값 출력 |

```bash
# 기본 프로바이더 가져오기
prx config get providers.default

# 게이트웨이 포트 가져오기
prx config get gateway.port

# 전체 섹션을 JSON으로 가져오기
prx config get providers --json
```

### `prx config set`

설정 값을 설정합니다.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 경로 |

```bash
# 기본 프로바이더 변경
prx config set providers.default "anthropic"

# 게이트웨이 포트 변경
prx config set gateway.port 8080

# 불리언 설정
prx config set evolution.l1.enabled true

# 중첩 값 설정
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

전체 설정 JSON 스키마를 출력합니다. 에디터 자동 완성 및 유효성 검사에 유용합니다.

```bash
prx config schema [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--output` | `-o` | stdout | 파일에 스키마 작성 |
| `--format` | | `json` | 출력 형식: `json` 또는 `yaml` |

```bash
# stdout에 스키마 출력
prx config schema

# 에디터 통합을 위해 스키마 저장
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

단일 설정 파일을 섹션별 파일로 분할합니다. 프로바이더, 채널, 크론 등에 대해 별도의 파일이 있는 설정 디렉터리를 생성합니다.

```bash
prx config split [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 소스 설정 파일 |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | 출력 디렉터리 |

```bash
prx config split

# 결과:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

분할된 설정 디렉터리를 다시 단일 파일로 병합합니다.

```bash
prx config merge [OPTIONS]
```

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | 소스 디렉터리 |
| `--output` | `-o` | `~/.config/prx/config.toml` | 출력 파일 |
| `--force` | `-f` | `false` | 기존 출력 파일 덮어쓰기 |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## 예시

```bash
# 빠른 설정 검사
prx config get .  # 전체 설정 출력

# 프로바이더 키 업데이트
prx config set providers.anthropic.api_key "sk-ant-..."

# VS Code용 스키마 생성
prx config schema --output ~/.config/prx/schema.json
# 그런 다음 VS Code settings.json에서:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# 버전 관리를 위한 백업 및 분할
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## 관련 문서

- [설정 개요](/ko/prx/config/) -- 설정 파일 형식 및 구조
- [전체 레퍼런스](/ko/prx/config/reference) -- 모든 설정 옵션
- [핫 리로드](/ko/prx/config/hot-reload) -- 런타임 설정 다시 로드
- [환경 변수](/ko/prx/config/environment) -- 환경 변수 재정의
