---
title: AWS Bedrock
description: PRX에서 AWS Bedrock을 LLM 프로바이더로 설정합니다
---

# AWS Bedrock

> SigV4 인증, 네이티브 도구 호출, 프롬프트 캐싱이 지원되는 AWS Bedrock의 Converse API를 통해 파운데이션 모델 (Claude, Titan, Llama, Mistral 등)에 접근합니다.

## 사전 요구 사항

- Bedrock 모델 접근이 활성화된 AWS 계정
- `bedrock:InvokeModel` 권한이 있는 AWS 자격 증명 (Access Key ID + Secret Access Key)

## 빠른 설정

### 1. 모델 접근 활성화

1. [AWS Bedrock 콘솔](https://console.aws.amazon.com/bedrock/)을 엽니다
2. 왼쪽 사이드바에서 **Model access**로 이동합니다
3. 사용하려는 모델에 대한 접근을 요청합니다 (예: Anthropic Claude, Meta Llama)

### 2. AWS 자격 증명 설정

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # 선택사항, 기본값은 us-east-1
```

### 3. PRX 설정

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. 확인

```bash
prx doctor models
```

## 사용 가능한 모델

모델 ID는 Bedrock 포맷 `<provider>.<model>-<version>`을 따릅니다:

| 모델 ID | 프로바이더 | 컨텍스트 | 비전 | 도구 사용 | 참고 |
|---------|-----------|---------|------|----------|------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | 예 | 예 | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | 예 | 예 | 최신 Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | 예 | 예 | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | 예 | 예 | 빠른 Claude 모델 |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | 아니요 | 예 | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | 아니요 | 예 | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | 아니요 | 아니요 | Amazon Titan |

해당 리전에서 사용 가능한 전체 모델 목록은 [AWS Bedrock 문서](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)를 확인하세요.

## 설정 레퍼런스

| 필드 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `model` | string | 필수 | Bedrock 모델 ID (예: `anthropic.claude-sonnet-4-6`) |

인증은 전적으로 AWS 환경 변수를 통해 처리됩니다:

| 환경 변수 | 필수 | 설명 |
|----------|------|------|
| `AWS_ACCESS_KEY_ID` | 예 | AWS 액세스 키 ID |
| `AWS_SECRET_ACCESS_KEY` | 예 | AWS 시크릿 액세스 키 |
| `AWS_SESSION_TOKEN` | 아니요 | 임시 세션 토큰 (역할 위임용) |
| `AWS_REGION` | 아니요 | AWS 리전 (기본값: `us-east-1`) |
| `AWS_DEFAULT_REGION` | 아니요 | `AWS_REGION`이 설정되지 않은 경우 대체 리전 |

## 기능

### 제로 의존성 SigV4 서명

PRX는 `hmac`과 `sha2` 크레이트만 사용하여 AWS SigV4 요청 서명을 구현하며, AWS SDK에 대한 의존성이 없습니다. 이는 바이너리를 작게 유지하고 SDK 버전 충돌을 방지합니다. 서명에는 다음이 포함됩니다:

- HMAC-SHA256 키 파생 체인
- 정렬된 헤더를 가진 정규 요청 구성
- 임시 자격 증명을 위한 `x-amz-security-token` 지원

### Converse API

PRX는 Bedrock의 Converse API (레거시 InvokeModel API가 아님)를 사용하며, 다음을 제공합니다:
- 모든 모델 프로바이더에 걸친 통합 메시지 포맷
- `toolUse`와 `toolResult` 블록을 통한 구조화된 도구 호출
- 시스템 프롬프트 지원
- 일관된 응답 포맷

### 네이티브 도구 호출

도구는 `name`, `description`, `inputSchema`를 포함하는 `toolSpec` 정의와 함께 Bedrock의 네이티브 `toolConfig` 포맷으로 전송됩니다. 도구 결과는 `user` 메시지 내의 `toolResult` 콘텐츠 블록으로 래핑됩니다.

### 프롬프트 캐싱

PRX는 Bedrock의 프롬프트 캐싱 휴리스틱을 적용합니다 (Anthropic 프로바이더와 동일한 임계값 사용):
- 3 KB 이상의 시스템 프롬프트는 `cachePoint` 블록을 받습니다
- 4개 이상의 비시스템 메시지가 있는 대화에서 마지막 메시지에 `cachePoint`가 표시됩니다

### 모델 ID의 URL 인코딩

콜론이 포함된 Bedrock 모델 ID (예: `v1:0`)는 특별한 처리가 필요합니다. PRX는:
- HTTP URL에서 원시 콜론을 전송합니다 (reqwest 방식)
- SigV4 서명의 정규 URI에서 콜론을 `%3A`로 인코딩합니다
- 이 이중 접근 방식은 HTTP 라우팅과 서명 검증 모두 성공하도록 합니다

## 프로바이더 별칭

다음 이름이 Bedrock 프로바이더로 해석됩니다:

- `bedrock`
- `aws-bedrock`

## 문제 해결

### "AWS Bedrock credentials not set"

`AWS_ACCESS_KEY_ID`와 `AWS_SECRET_ACCESS_KEY`가 환경 변수로 설정되어 있는지 확인하세요. PRX는 `~/.aws/credentials`나 `~/.aws/config`에서 읽지 않습니다.

### 403 AccessDeniedException

일반적인 원인:
- IAM 사용자/역할에 `bedrock:InvokeModel` 권한이 없음
- Bedrock 콘솔에서 모델 접근을 요청하지 않음
- 설정된 리전에서 모델을 사용할 수 없음

### SignatureDoesNotMatch

일반적으로 시계 오차를 나타냅니다. 시스템 시계가 동기화되어 있는지 확인하세요:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### 리전에서 모델을 사용할 수 없음

모든 모델이 모든 리전에서 사용 가능한 것은 아닙니다. [Bedrock 모델 가용성 매트릭스](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html)를 확인하고 `AWS_REGION`을 적절히 조정하세요.

### 임시 자격 증명 사용 (STS)

AWS STS (역할 위임, SSO)를 사용하는 경우 세 가지 변수를 모두 설정합니다:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

세션 토큰은 `x-amz-security-token` 헤더로 SigV4 서명에 자동으로 포함됩니다.
