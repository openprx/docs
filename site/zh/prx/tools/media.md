---
title: 媒体工具
description: PRX 的媒体工具集提供图像处理、截图、文字转语音和画布渲染能力，支持视觉内容的生成和分析。
---

# 媒体工具

PRX 的媒体工具集涵盖视觉和音频相关的内容处理能力，包括 `image`（图像处理）、`image_info`（图像元数据提取）、`screenshot`（屏幕截图）、`tts`（文字转语音）和 `canvas`（画布渲染）五个工具。

这些工具使 Agent 具备多模态交互能力——不仅能处理文本，还能理解图像内容、生成视觉输出、合成语音消息。在实际应用中，Agent 可以截取屏幕状态、处理和优化图片、将文本转为语音并发送，以及渲染结构化的图表和表格。

`screenshot`、`image`、`image_info` 和 `canvas` 在 `all_tools()` 模式下始终可用。`tts` 在通信渠道活跃时自动注册。

## 配置

在 `config.toml` 中配置媒体工具：

```toml
# 图像处理配置
[vision]
max_image_size = 10485760     # 最大图像大小（10MB）
supported_formats = ["png", "jpeg", "webp", "gif", "bmp", "tiff"]
thumbnail_size = 256           # 缩略图默认尺寸

# 截图配置
[vision.screenshot]
format = "png"                 # 截图格式
quality = 80                   # 压缩质量（JPEG/WebP）
max_size = 5242880             # 最大截图文件大小（5MB）

# TTS 配置
[tts]
provider = "openai"            # "openai" | "edge" | "local"
model = "tts-1"                # TTS 模型
voice = "alloy"                # 语音：alloy, echo, fable, onyx, nova, shimmer
speed = 1.0                    # 语速（0.25-4.0）
output_format = "mp3"          # 输出格式

# OpenAI TTS 配置
[tts.openai]
api_key = "sk-..."             # 或通过环境变量 OPENAI_API_KEY
base_url = "https://api.openai.com/v1"

# 画布配置
[canvas]
default_width = 800
default_height = 600
background_color = "#ffffff"
font_family = "sans-serif"
```

## 使用方法

### image — 图像处理

调整图片尺寸：

```json
{
  "tool": "image",
  "arguments": {
    "action": "resize",
    "path": "/tmp/photo.jpg",
    "width": 800,
    "height": 600,
    "output_path": "/tmp/photo_resized.jpg"
  }
}
```

裁剪图片：

```json
{
  "tool": "image",
  "arguments": {
    "action": "crop",
    "path": "/tmp/photo.jpg",
    "x": 100,
    "y": 50,
    "width": 400,
    "height": 300,
    "output_path": "/tmp/photo_cropped.jpg"
  }
}
```

格式转换：

```json
{
  "tool": "image",
  "arguments": {
    "action": "convert",
    "path": "/tmp/image.png",
    "format": "webp",
    "quality": 85,
    "output_path": "/tmp/image.webp"
  }
}
```

### image_info — 图像元数据

```json
{
  "tool": "image_info",
  "arguments": {
    "path": "/tmp/photo.jpg"
  }
}
```

返回：

```json
{
  "width": 1920,
  "height": 1080,
  "format": "jpeg",
  "color_space": "sRGB",
  "bit_depth": 8,
  "file_size": 524288,
  "has_alpha": false,
  "exif": {
    "camera": "iPhone 15 Pro",
    "date_taken": "2024-01-15T10:30:00Z",
    "gps": null
  }
}
```

### screenshot — 屏幕截图

捕获全屏截图：

```json
{
  "tool": "screenshot",
  "arguments": {
    "target": "screen",
    "format": "png",
    "path": "/tmp/screenshot.png"
  }
}
```

捕获特定窗口：

```json
{
  "tool": "screenshot",
  "arguments": {
    "target": "window",
    "window_title": "Firefox",
    "path": "/tmp/firefox_screenshot.png"
  }
}
```

### tts — 文字转语音

生成语音并发送到当前对话：

```json
{
  "tool": "tts",
  "arguments": {
    "text": "您好，今天的会议摘要如下：第一，项目进度符合预期；第二，下周需要完成代码审查。",
    "voice": "nova",
    "speed": 1.0
  }
}
```

TTS 处理流程：

```
文本输入 → TTS 引擎生成 MP3 → 转换为 M4A → 发送到当前渠道
```

### canvas — 画布渲染

渲染表格：

```json
{
  "tool": "canvas",
  "arguments": {
    "type": "table",
    "title": "项目进度概览",
    "columns": ["项目", "状态", "进度", "负责人"],
    "rows": [
      ["PRX Core", "进行中", "75%", "Alice"],
      ["PRX Docs", "进行中", "60%", "Bob"],
      ["PRX Tests", "已完成", "100%", "Carol"]
    ]
  }
}
```

渲染图表：

```json
{
  "tool": "canvas",
  "arguments": {
    "type": "chart",
    "chart_type": "bar",
    "title": "每周代码提交数",
    "data": {
      "labels": ["周一", "周二", "周三", "周四", "周五"],
      "values": [12, 19, 8, 15, 22]
    }
  }
}
```

## 参数

### image 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作：`resize`、`crop`、`convert`、`rotate`、`flip` |
| `path` | string | 是 | 源图像路径 |
| `output_path` | string | 否 | 输出路径（省略时覆盖源文件） |
| `width` | integer | 条件 | 目标宽度 |
| `height` | integer | 条件 | 目标高度 |
| `format` | string | 条件 | 目标格式（`convert` 必填） |
| `quality` | integer | 否 | 压缩质量 1-100（JPEG/WebP） |
| `x` | integer | 条件 | 裁剪起始 X 坐标（`crop` 必填） |
| `y` | integer | 条件 | 裁剪起始 Y 坐标（`crop` 必填） |

### image_info 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 图像文件路径 |

### screenshot 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target` | string | 否 | `"screen"` | 截图目标：`screen`（全屏）或 `window`（窗口） |
| `window_title` | string | 条件 | — | 窗口标题（`target = "window"` 时必填） |
| `format` | string | 否 | `"png"` | 图片格式 |
| `quality` | integer | 否 | `80` | 压缩质量 |
| `path` | string | 否 | 自动生成 | 保存路径 |

### tts 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `text` | string | 是 | — | 要转换的文本 |
| `voice` | string | 否 | 配置值 | 语音选择 |
| `speed` | float | 否 | `1.0` | 语速（0.25-4.0） |
| `language` | string | 否 | 自动检测 | 语言代码 |

### canvas 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 内容类型：`table`、`chart`、`diagram`、`text` |
| `title` | string | 否 | 标题 |
| `columns` | string[] | 条件 | 列标题（`table` 必填） |
| `rows` | string[][] | 条件 | 数据行（`table` 必填） |
| `chart_type` | string | 条件 | 图表类型（`chart` 必填）：`bar`、`line`、`pie` |
| `data` | object | 条件 | 图表数据（`chart` 必填） |
| `width` | integer | 否 | 画布宽度 |
| `height` | integer | 否 | 画布高度 |

## 安全性

### 文件路径验证

所有媒体工具的文件操作都经过路径验证，防止目录遍历：

- `image` 工具的 `path` 和 `output_path` 都会被验证
- `screenshot` 的 `path` 限制在允许的目录内
- `image_info` 仅读取元数据，不修改文件

### TTS 外部 API 调用

TTS 工具可能调用外部 API（如 OpenAI），需注意：

- 文本内容会发送到第三方服务
- 不应对包含敏感信息的文本使用 TTS
- API 密钥通过配置文件或环境变量管理，不暴露给 Agent

### 图像 EXIF 隐私

`image_info` 可能提取包含位置信息的 EXIF 数据。在涉及隐私的场景下，建议：

- 在分享前去除 EXIF 数据
- 使用 `image` 工具的 `convert` 操作（转换格式时会去除 EXIF）

### 资源消耗

图像处理和 TTS 可能消耗大量计算资源：

- 大图像处理受 `max_image_size` 限制
- 截图受 `max_size` 限制
- TTS 请求受超时和文本长度限制

```toml
[security.tool_policy.tools]
image = "allow"
screenshot = "allow"
tts = "supervised"          # TTS 涉及外部 API，建议监督
canvas = "allow"
```

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [浏览器工具](/zh/prx/tools/browser/) — 浏览器自动化和截图
- [消息发送](/zh/prx/tools/messaging/) — 发送媒体和语音消息
- [配置参考](/zh/prx/config/reference/) — 完整 config.toml 参考
