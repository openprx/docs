---
title: 미디어 도구
description: 시각적 및 오디오 콘텐츠 생성을 위한 이미지 처리, 스크린샷, 텍스트 음성 변환, 캔버스 렌더링 도구입니다.
---

# 미디어 도구

PRX는 이미지 처리, 화면 캡처, 텍스트 음성 합성, 구조화된 콘텐츠 렌더링을 포함하는 5개의 미디어 관련 도구를 포함합니다. 이 도구들을 통해 에이전트는 시각적 및 오디오 콘텐츠로 작업할 수 있습니다 -- 이미지 리사이즈, 시각적 추론을 위한 스크린샷 캡처, 음성 메시지 생성, 차트와 다이어그램 렌더링.

미디어 도구는 도구 레지스트리의 두 카테고리에 분산됩니다. 비전 도구(`image`, `image_info`, `screenshot`)는 항상 `all_tools()`에 등록됩니다. 렌더링 도구(`tts`, `canvas`)는 채널이 활성일 때 또는 무조건적으로 등록됩니다.

이 도구들은 PRX 에이전트에 멀티모달 출력 기능을 제공하여 텍스트 응답과 함께 이미지, 오디오, 시각적 아티팩트를 생성할 수 있게 합니다.

## 설정

미디어 도구는 최소한의 설정이 필요합니다. 대부분의 설정은 채널 수준(전달용) 또는 LLM 프로바이더를 통해(비전 모델 기능용) 제어됩니다:

```toml
# 브라우저 설정이 스크린샷 기능에 영향
[browser]
enabled = true
backend = "rust_native"

# 채널 설정이 TTS 전달에 영향
[channels_config.telegram]
bot_token = "..."
stream_mode = "partial"

# 전용 미디어 도구 설정 섹션 없음
# 비전 도구는 all_tools()에서 항상 사용 가능
```

## 도구 참조

### image

이미지를 처리하고 변환합니다. 리사이즈, 크롭, 포맷 변환 작업을 지원합니다.

**이미지 리사이즈:**

```json
{
  "name": "image",
  "arguments": {
    "action": "resize",
    "path": "/home/user/photo.png",
    "width": 800,
    "height": 600
  }
}
```

**이미지 크롭:**

```json
{
  "name": "image",
  "arguments": {
    "action": "crop",
    "path": "/home/user/photo.png",
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300
  }
}
```

**포맷 변환:**

```json
{
  "name": "image",
  "arguments": {
    "action": "convert",
    "path": "/home/user/photo.png",
    "format": "jpeg",
    "output": "/home/user/photo.jpg"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | `string` | 예 | -- | 작업: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | 예 | -- | 소스 이미지 파일 경로 |
| `width` | `integer` | 조건부 | -- | 대상 너비 (리사이즈 및 크롭용) |
| `height` | `integer` | 조건부 | -- | 대상 높이 (리사이즈 및 크롭용) |
| `x` | `integer` | 조건부 | -- | 크롭 원점 X 오프셋 |
| `y` | `integer` | 조건부 | -- | 크롭 원점 Y 오프셋 |
| `format` | `string` | 조건부 | -- | 변환 대상 포맷: `"png"`, `"jpeg"`, `"webp"`, `"gif"` |
| `output` | `string` | 아니오 | 소스 덮어쓰기 | 출력 파일 경로 |

### image_info

이미지 파일을 수정하지 않고 메타데이터와 크기를 추출합니다.

```json
{
  "name": "image_info",
  "arguments": {
    "path": "/home/user/photo.png"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `path` | `string` | 예 | -- | 이미지 파일 경로 |

**반환 정보:**

| 필드 | 설명 |
|------|------|
| Width | 이미지 너비 (픽셀) |
| Height | 이미지 높이 (픽셀) |
| Format | 이미지 포맷 (PNG, JPEG, WebP 등) |
| Color space | RGB, RGBA, 그레이스케일 등 |
| File size | 디스크상 크기 |
| DPI | 해상도 (메타데이터에서 사용 가능한 경우) |

### screenshot

현재 화면 또는 특정 창의 스크린샷을 캡처합니다. 에이전트가 데스크톱이나 애플리케이션의 현재 상태를 관찰해야 하는 시각적 추론 작업에 유용합니다.

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "screen"
  }
}
```

```json
{
  "name": "screenshot",
  "arguments": {
    "target": "window",
    "window_name": "Firefox"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `target` | `string` | 아니오 | `"screen"` | 캡처 대상: `"screen"` (전체 화면) 또는 `"window"` (특정 창) |
| `window_name` | `string` | 조건부 | -- | 캡처할 창 제목 (`target = "window"`일 때 필수) |
| `output` | `string` | 아니오 | 자동 생성 임시 경로 | 스크린샷 출력 파일 경로 |

스크린샷은 PNG 파일로 저장됩니다. 비전 가능 LLM(GPT-4o, Claude Sonnet 등)과 함께 사용할 때 스크린샷을 시각적 분석을 위해 다음 메시지에 포함할 수 있습니다.

### tts

텍스트 음성 합성. 텍스트를 오디오 파일로 변환하고 현재 대화에 음성 메시지로 보냅니다. 이 도구는 MP3 생성, 선택적 M4A 변환, 활성 채널을 통한 전달을 처리합니다.

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `text` | `string` | 예 | -- | 음성으로 변환할 텍스트 |
| `language` | `string` | 아니오 | `"en"` | 음성 합성 언어 코드 |
| `voice` | `string` | 아니오 | 프로바이더 기본값 | 음성 식별자 (프로바이더별) |

TTS 도구는 음성 메시지를 지원하는 활성 채널(Telegram, WhatsApp, Discord)이 필요합니다. 음성을 지원하지 않는 채널에서는 도구가 오류를 반환합니다.

**TTS 파이프라인:**

1. 텍스트가 TTS 프로바이더(내장 또는 외부)에 전송
2. 오디오가 MP3로 생성
3. 채널이 M4A를 요구하면(예: 일부 모바일 클라이언트) 자동 변환 수행
4. 오디오 파일이 `message_send`를 통해 음성 메시지로 전달

### canvas

시각적 출력을 위한 구조화된 콘텐츠를 렌더링합니다. 테이블, 차트, 다이어그램, 포맷된 레이아웃을 지원합니다.

```json
{
  "name": "canvas",
  "arguments": {
    "type": "table",
    "data": {
      "headers": ["Name", "Status", "Score"],
      "rows": [
        ["Module A", "Passed", "98"],
        ["Module B", "Failed", "45"],
        ["Module C", "Passed", "87"]
      ]
    }
  }
}
```

```json
{
  "name": "canvas",
  "arguments": {
    "type": "diagram",
    "content": "graph LR\n  A[Input] --> B[Process]\n  B --> C[Output]"
  }
}
```

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `type` | `string` | 예 | -- | 콘텐츠 유형: `"table"`, `"chart"`, `"diagram"`, `"code"` |
| `data` | `object` | 조건부 | -- | 테이블 및 차트용 구조화된 데이터 |
| `content` | `string` | 조건부 | -- | 다이어그램(Mermaid 구문) 및 코드 블록용 텍스트 콘텐츠 |
| `format` | `string` | 아니오 | `"png"` | 출력 포맷: `"png"`, `"svg"`, `"html"` |
| `output` | `string` | 아니오 | 자동 생성 임시 경로 | 출력 파일 경로 |

## 사용 패턴

### 시각적 추론 워크플로우

비전 가능 LLM과 함께 스크린샷을 사용하여 UI 상태 이해:

```
에이전트 사고: 웹 애플리케이션이 올바르게 보이는지 확인해야 함.
  1. [browser] action="navigate", url="https://app.example.com/dashboard"
  2. [screenshot] target="screen"
  3. [LLM 비전 분석의 스크린샷]
  4. "대시보드에 3개의 활성 알림과 하락 메트릭 차트가 표시됩니다..."
```

### 보고서 생성

차트와 테이블로 시각적 보고서 생성:

```
에이전트 사고: 사용자가 프로젝트 상태 보고서를 원함.
  1. [memory_search] query="project status"
  2. [canvas] type="table", data={프로젝트 상태 데이터}
  3. [canvas] type="chart", data={진행 차트 데이터}
  4. [message_send] media_path="/tmp/status_table.png", caption="프로젝트 상태"
  5. [message_send] media_path="/tmp/progress_chart.png", caption="스프린트 진행"
```

### 음성 상호작용

핸즈프리 시나리오를 위한 오디오 응답 제공:

```
에이전트 사고: 사용자가 음성 요약을 요청함.
  1. [memory_recall] query="오늘의 회의와 작업"
  2. [tts] text="오늘 3개의 회의가 있습니다. 첫 번째는 오전 10시 엔지니어링 팀..."
  → Telegram을 통해 음성 메시지 전달
```

## 보안

### 파일시스템 접근

이미지 및 스크린샷 도구는 로컬 파일시스템에서 파일을 읽고 씁니다. 이 작업은 `file_read`와 `file_write`와 동일한 보안 정책의 적용을 받습니다:

- 경로 검증이 허용된 디렉토리 외부 접근을 방지
- 파일 쓰기 작업이 보안 정책 규칙을 준수
- 임시 파일은 기본적으로 `TMPDIR`에 기록

### TTS 프라이버시

음성 메시지는 대화의 민감한 정보를 포함할 수 있습니다. 고려 사항:

- TTS 콘텐츠가 TTS 프로바이더(외부일 수 있음)에 전송됨
- 생성된 오디오 파일이 디스크에 임시 저장됨
- 음성 메시지가 채널을 통해 전달되며 플랫폼의 개인정보 보호 정책의 적용을 받음

### 캔버스 콘텐츠 안전

캔버스 도구는 사용자 제공 데이터를 렌더링합니다. Mermaid 구문으로 다이어그램을 렌더링할 때 콘텐츠는 로컬에서 처리되며 외부 서비스를 관여시키지 않습니다.

### 정책 엔진

미디어 도구는 개별적으로 제어할 수 있습니다:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # 스크린샷에 승인 필요
tts = "allow"
canvas = "allow"
```

## 관련 페이지

- [브라우저 도구](/ko/prx/tools/browser) -- 스크린샷 지원이 있는 웹 자동화
- [메시징](/ko/prx/tools/messaging) -- 채널을 통한 미디어 및 음성 전달
- [채널 개요](/ko/prx/channels/) -- 채널 미디어 기능 매트릭스
- [도구 개요](/ko/prx/tools/) -- 모든 도구 및 레지스트리 시스템
