---
title: 多模态内容
description: PRX Agent 的图片、音频、视频支持，包含内容类型检测、转码和 Provider/Channel 能力矩阵。
---

# 多模态内容

PRX Agent 支持处理文本之外的多种内容类型，包括图片、音频、视频和文件附件。多模态系统负责内容类型检测、格式转码，并协调 Provider 能力与 Channel 媒体限制之间的差异。

## 概述

多模态内容处理涉及三个层面的协调：

- **Channel 层** -- 不同消息渠道支持的媒体类型和格式各异
- **Agent 层** -- 统一内部格式，处理内容检测和转码
- **Provider 层** -- 不同 LLM 提供商对多模态输入的支持能力不同

```
Channel              Agent 层                Provider
(接收媒体)           (统一处理)              (LLM 推理)

Telegram ──┐    ┌─ 类型检测 ─┐     ┌── Anthropic (vision)
Discord ───┤    │  格式转码   │     ├── OpenAI (vision+audio)
Slack ─────┤───►│  尺寸压缩   │────►├── Gemini (multimodal)
WhatsApp ──┤    │  内容缓存   │     ├── Ollama (vision)
API ───────┘    └────────────┘     └── 其他
```

## 支持的内容类型

| 内容类型 | MIME Type | 说明 |
|----------|-----------|------|
| 图片 | `image/png`, `image/jpeg`, `image/gif`, `image/webp` | 静态图片和动图 |
| 音频 | `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm` | 语音消息和音频文件 |
| 视频 | `video/mp4`, `video/webm` | 视频消息和视频文件 |
| 文档 | `application/pdf`, `text/*` | PDF 和文本文件 |
| 文件 | `application/octet-stream` | 通用文件附件 |

## 内容类型检测

PRX 使用多层检测策略确定内容类型：

1. **魔数检测** -- 读取文件头部字节匹配已知格式签名
2. **MIME Type** -- 使用 Channel 或 HTTP 提供的 Content-Type
3. **扩展名** -- 根据文件扩展名推断类型（优先级最低）

```toml
[agent.multimodal]
detect_method = "magic"  # "magic" | "mime" | "extension"
```

### 检测优先级

魔数检测结果优先于 MIME Type 和扩展名，防止伪装文件类型绕过限制。

## 转码

当 Channel 或 Provider 不支持原始媒体格式时，PRX 自动进行格式转码。

### 图片转码

| 原始格式 | 目标格式 | 触发条件 |
|----------|----------|----------|
| WEBP | PNG | Provider 不支持 WEBP |
| GIF (动图) | PNG (首帧) | Provider 不支持动图 |
| BMP/TIFF | PNG | 标准化为通用格式 |
| 任意 | JPEG | 尺寸超限时压缩 |

### 图片尺寸限制

```toml
[agent.multimodal.image]
max_width = 2048
max_height = 2048
max_file_size_mb = 20
quality = 85
auto_resize = true
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_width` | u32 | `2048` | 最大图片宽度（像素），超过自动缩放 |
| `max_height` | u32 | `2048` | 最大图片高度（像素），超过自动缩放 |
| `max_file_size_mb` | u64 | `20` | 单张图片最大文件大小（MB） |
| `quality` | u8 | `85` | JPEG 压缩质量（1-100） |
| `auto_resize` | bool | `true` | 超过尺寸限制时自动缩放 |

### 音频转码

| 原始格式 | 目标格式 | 触发条件 |
|----------|----------|----------|
| OGG (Opus) | MP3 | Provider 不支持 OGG |
| WAV | MP3 | 文件过大时压缩 |
| AMR | MP3 | 标准化为通用格式 |

```toml
[agent.multimodal.audio]
max_duration_secs = 300
max_file_size_mb = 25
transcode_format = "mp3"
```

## Provider 能力矩阵

不同 LLM Provider 对多模态内容的支持程度不同：

| Provider | 图片输入 | 音频输入 | 视频输入 | 图片生成 |
|----------|:--------:|:--------:|:--------:|:--------:|
| Anthropic (Claude) | 支持 | 不支持 | 不支持 | 不支持 |
| OpenAI (GPT-4o) | 支持 | 支持 | 不支持 | 支持 (DALL-E) |
| Google Gemini | 支持 | 支持 | 支持 | 支持 |
| Ollama (LLaVA 等) | 支持 | 不支持 | 不支持 | 不支持 |
| OpenRouter | 视模型而定 | 视模型而定 | 视模型而定 | 视模型而定 |

### 降级策略

当 Provider 不支持收到的媒体类型时，PRX 采用以下降级策略：

| 场景 | 策略 |
|------|------|
| Provider 不支持图片 | 使用 OCR 提取文字，附加到消息中 |
| Provider 不支持音频 | 使用 Whisper API 转录为文字 |
| Provider 不支持视频 | 提取关键帧作为图片序列 |
| 文件类型完全不支持 | 提取文件元数据（名称、大小、类型）附加到消息 |

```toml
[agent.multimodal.fallback]
image_ocr = true
audio_transcribe = true
video_keyframes = true
keyframe_count = 4
```

## Channel 媒体限制

不同消息渠道对媒体有各自的限制：

| Channel | 图片发送 | 音频发送 | 视频发送 | 最大文件大小 |
|---------|:--------:|:--------:|:--------:|:------------:|
| Telegram | 支持 | 支持 | 支持 | 50 MB |
| Discord | 支持 | 支持 | 支持 | 25 MB |
| Slack | 支持 | 支持 | 支持 | 视计划而定 |
| WhatsApp | 支持 | 支持 | 支持 | 16 MB |
| Signal | 支持 | 支持 | 支持 | 100 MB |
| Matrix | 支持 | 支持 | 支持 | 视服务器配置 |
| 飞书 / Lark | 支持 | 不支持 | 不支持 | 30 MB |
| 钉钉 | 支持 | 不支持 | 不支持 | 20 MB |
| QQ | 支持 | 不支持 | 不支持 | 20 MB |
| Email | 支持 | 支持 | 支持 | 视邮件服务 |
| IRC | 不支持 | 不支持 | 不支持 | - |
| CLI | 不支持 | 不支持 | 不支持 | - |

### Channel 自动适配

PRX 自动根据目标 Channel 的能力约束处理媒体：

- 图片超过 Channel 大小限制时自动压缩
- Channel 不支持的媒体类型自动转为文本描述
- 长语音消息自动切分为多段发送

## 配置参考

### 完整配置示例

```toml
[agent.multimodal]
enabled = true
detect_method = "magic"
cache_dir = "~/.cache/openprx/media"
cache_ttl_hours = 24

[agent.multimodal.image]
max_width = 2048
max_height = 2048
max_file_size_mb = 20
quality = 85
auto_resize = true

[agent.multimodal.audio]
max_duration_secs = 300
max_file_size_mb = 25
transcode_format = "mp3"

[agent.multimodal.fallback]
image_ocr = true
audio_transcribe = true
video_keyframes = true
keyframe_count = 4
```

## 相关文档

- [Agent 运行时架构](./runtime) -- Agent 执行模型
- [消息渠道概览](/zh/prx/channels/) -- 各渠道的详细能力
- [Provider 列表](/zh/prx/providers/) -- LLM 提供商配置
- [完整配置参考](/zh/prx/config/reference)
