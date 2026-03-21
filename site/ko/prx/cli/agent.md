---
title: prx agent
description: 스크립팅 및 파이핑을 위한 단일 턴 LLM 상호작용입니다.
---

# prx agent

단일 턴 LLM 상호작용을 실행합니다. 에이전트는 하나의 프롬프트를 처리하고, 응답을 반환한 후 종료합니다. 스크립팅, 파이핑, 다른 도구와의 통합을 위해 설계되었습니다.

## 사용법

```bash
prx agent [OPTIONS] [PROMPT]
```

`PROMPT`를 생략하면 stdin에서 입력을 읽습니다.

## 옵션

| 플래그 | 축약 | 기본값 | 설명 |
|--------|------|--------|------|
| `--provider` | `-P` | 설정 기본값 | 사용할 LLM 프로바이더 |
| `--model` | `-m` | 프로바이더 기본값 | 모델 식별자 |
| `--system` | `-s` | | 사용자 지정 시스템 프롬프트 |
| `--file` | `-f` | | 프롬프트 컨텍스트에 파일 첨부 |
| `--no-tools` | | `false` | 도구 사용 비활성화 |
| `--no-memory` | | `false` | 메모리 읽기 및 쓰기 비활성화 |
| `--json` | `-j` | `false` | 원시 JSON 응답 출력 |
| `--temperature` | `-t` | 프로바이더 기본값 | 샘플링 온도 (0.0 - 2.0) |
| `--max-tokens` | | 프로바이더 기본값 | 최대 응답 토큰 수 |
| `--timeout` | | `120` | 타임아웃(초) |

## 예시

```bash
# 간단한 질문
prx agent "What is the capital of France?"

# 분석을 위한 파이프 콘텐츠
cat error.log | prx agent "Summarize these errors"

# 파일 첨부
prx agent -f report.pdf "Summarize the key findings"

# 특정 모델 사용
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# 스크립팅을 위한 JSON 출력
prx agent --json "List 5 programming languages" | jq '.content'

# 다른 명령어와 체이닝
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## Stdin 대 인수

프롬프트는 위치 인수 또는 stdin을 통해 제공할 수 있습니다. 둘 다 있으면 연결됩니다 (stdin 콘텐츠가 먼저, 그다음 인수가 지시사항으로).

```bash
# 인수만
prx agent "Hello"

# stdin만
echo "Hello" | prx agent

# 둘 다: stdin을 컨텍스트로, 인수를 지시사항으로
cat data.csv | prx agent "Find anomalies in this dataset"
```

## 파일 첨부

`--file` 플래그는 프롬프트 컨텍스트에 파일 내용을 추가합니다. 여러 파일을 첨부할 수 있습니다:

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

지원되는 파일 유형에는 텍스트 파일, PDF, 이미지(비전 지원 모델의 경우), 일반적인 문서 형식이 포함됩니다.

## 종료 코드

| 코드 | 의미 |
|------|------|
| `0` | 성공 |
| `1` | 일반 오류 (잘못된 설정, 네트워크 장애) |
| `2` | 타임아웃 초과 |
| `3` | 프로바이더 오류 (속도 제한, 인증 실패) |

## 관련 문서

- [prx chat](./chat) -- 대화형 멀티 턴 채팅
- [프로바이더 개요](/ko/prx/providers/) -- 지원되는 LLM 프로바이더
- [도구 개요](/ko/prx/tools/) -- 에이전트 실행 중 사용 가능한 도구
