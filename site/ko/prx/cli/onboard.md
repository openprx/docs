---
title: prx onboard
description: PRX 최초 설정을 위한 대화형 설정 마법사입니다.
---

# prx onboard

PRX를 처음 사용하기 위해 설정 마법사를 실행합니다. 마법사가 프로바이더 선택, API 키 설정, 채널 구성, 기본 설정을 안내합니다.

## 사용법

```bash
prx onboard [OPTIONS]
```

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--quick` | `-q` | `false` | 빠른 모드 -- 최소 프롬프트, 합리적인 기본값 |
| `--provider` | `-P` | | 프로바이더 사전 선택 (프로바이더 선택 단계 건너뛰기) |
| `--config` | `-c` | `~/.config/prx/config.toml` | 설정 파일 출력 경로 |
| `--force` | `-f` | `false` | 기존 설정 파일 덮어쓰기 |
| `--non-interactive` | | `false` | 비대화형 모드 (`--provider` 및 키용 환경 변수 필요) |

## 마법사 단계

대화형 마법사가 다음 단계를 안내합니다:

1. **프로바이더 선택** -- 기본 LLM 프로바이더 선택 (Anthropic, OpenAI, Ollama 등)
2. **API 키 구성** -- API 키 입력 및 유효성 검사
3. **모델 선택** -- 선택한 프로바이더에서 기본 모델 선택
4. **채널 설정** (선택 사항) -- 하나 이상의 메시징 채널 구성
5. **메모리 백엔드** -- 대화 메모리 저장 위치 선택 (markdown, SQLite, PostgreSQL)
6. **보안** -- 페어링 코드 및 샌드박스 설정
7. **설정 검토** -- 생성된 설정 미리보기 및 확인

## 예시

```bash
# 전체 대화형 마법사
prx onboard

# Anthropic으로 빠른 설정
prx onboard --quick --provider anthropic

# 비대화형 (환경에서 API 키 가져오기)
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# 사용자 지정 경로에 설정 작성
prx onboard --config /etc/prx/config.toml

# 마법사 다시 실행 (기존 설정 덮어쓰기)
prx onboard --force
```

## 빠른 모드

빠른 모드(`--quick`)는 선택적 단계를 건너뛰고 합리적인 기본값을 사용합니다:

- 메모리 백엔드: SQLite
- 보안: 샌드박스 활성화, 페어링 불필요
- 채널: 없음 (나중에 `prx channel add`로 추가)
- 진화: 비활성화 (나중에 설정에서 활성화)

작동하는 설정을 얻는 가장 빠른 방법입니다:

```bash
prx onboard --quick --provider ollama
```

## 설정 후

온보딩이 완료되면 다음을 수행할 수 있습니다:

```bash
# 설정 확인
prx doctor

# 채팅 시작
prx chat

# 더 많은 채널 추가
prx channel add

# 전체 데몬 시작
prx daemon
```

## 관련 문서

- [시작하기](/ko/prx/getting-started/quickstart) -- 빠른 시작 가이드
- [설정 개요](/ko/prx/config/) -- 설정 파일 형식 및 옵션
- [prx config](./config) -- 초기 설정 후 설정 수정
- [prx channel](./channel) -- 온보딩 후 채널 추가
