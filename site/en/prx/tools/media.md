---
title: Media Tools
description: Image processing, screenshots, text-to-speech, and canvas rendering tools for visual and audio content generation.
---

# Media Tools

PRX includes five media-related tools spanning image processing, screen capture, text-to-speech synthesis, and structured content rendering. These tools enable agents to work with visual and audio content -- resizing images, capturing screenshots for visual reasoning, generating voice messages, and rendering charts and diagrams.

Media tools are distributed across two categories in the tool registry. The vision tools (`image`, `image_info`, `screenshot`) are always registered in `all_tools()`. The rendering tools (`tts`, `canvas`) are registered when a channel is active or unconditionally, respectively.

Together, these tools give PRX agents multimodal output capabilities, allowing them to produce images, audio, and visual artifacts alongside text responses.

## Configuration

Media tools have minimal configuration. Most settings are controlled at the channel level (for delivery) or through the LLM provider (for vision model capabilities):

```toml
# Browser configuration affects screenshot capabilities
[browser]
enabled = true
backend = "rust_native"

# Channel configuration affects TTS delivery
[channels_config.telegram]
bot_token = "..."
stream_mode = "partial"

# No dedicated media tool configuration section
# Vision tools are always available in all_tools()
```

## Tool Reference

### image

Processes and transforms images. Supports resize, crop, and format conversion operations.

**Resize an image:**

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

**Crop an image:**

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

**Convert format:**

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

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Yes | -- | Operation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Yes | -- | Path to the source image file |
| `width` | `integer` | Conditional | -- | Target width (for resize and crop) |
| `height` | `integer` | Conditional | -- | Target height (for resize and crop) |
| `x` | `integer` | Conditional | -- | X offset for crop origin |
| `y` | `integer` | Conditional | -- | Y offset for crop origin |
| `format` | `string` | Conditional | -- | Target format for conversion: `"png"`, `"jpeg"`, `"webp"`, `"gif"` |
| `output` | `string` | No | Overwrites source | Output file path |

### image_info

Extracts metadata and dimensions from image files without modifying them.

```json
{
  "name": "image_info",
  "arguments": {
    "path": "/home/user/photo.png"
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Yes | -- | Path to the image file |

**Returns information including:**

| Field | Description |
|-------|-------------|
| Width | Image width in pixels |
| Height | Image height in pixels |
| Format | Image format (PNG, JPEG, WebP, etc.) |
| Color space | RGB, RGBA, Grayscale, etc. |
| File size | Size on disk |
| DPI | Resolution (if available in metadata) |

### screenshot

Captures screenshots of the current screen or specific windows. Useful for visual reasoning tasks where the agent needs to observe the current state of the desktop or an application.

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

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | No | `"screen"` | What to capture: `"screen"` (full screen) or `"window"` (specific window) |
| `window_name` | `string` | Conditional | -- | Window title to capture (required when `target = "window"`) |
| `output` | `string` | No | Auto-generated temp path | Output file path for the screenshot |

Screenshots are saved as PNG files. When used with vision-capable LLMs (GPT-4o, Claude Sonnet, etc.), the screenshot can be included in the next message for visual analysis.

### tts

Text-to-Speech synthesis. Converts text to an audio file and sends it as a voice message to the current conversation. The tool handles MP3 generation, optional M4A conversion, and delivery through the active channel.

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Yes | -- | The text to convert to speech |
| `language` | `string` | No | `"en"` | Language code for speech synthesis |
| `voice` | `string` | No | Provider default | Voice identifier (provider-specific) |

The TTS tool requires an active channel that supports voice messages (Telegram, WhatsApp, Discord). On channels that do not support voice, the tool returns an error.

**TTS Pipeline:**

1. Text is sent to the TTS provider (built-in or external)
2. Audio is generated as MP3
3. If the channel requires M4A (e.g., some mobile clients), automatic conversion is performed
4. The audio file is delivered via `message_send` as a voice message

### canvas

Renders structured content for visual output. Supports tables, charts, diagrams, and formatted layouts.

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

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | Yes | -- | Content type: `"table"`, `"chart"`, `"diagram"`, `"code"` |
| `data` | `object` | Conditional | -- | Structured data for tables and charts |
| `content` | `string` | Conditional | -- | Text content for diagrams (Mermaid syntax) and code blocks |
| `format` | `string` | No | `"png"` | Output format: `"png"`, `"svg"`, `"html"` |
| `output` | `string` | No | Auto-generated temp path | Output file path |

## Usage Patterns

### Visual Reasoning Workflow

Use screenshots with vision-capable LLMs for understanding UI state:

```
Agent thinking: Need to verify the web application looks correct.
  1. [browser] action="navigate", url="https://app.example.com/dashboard"
  2. [screenshot] target="screen"
  3. [LLM vision analysis of screenshot]
  4. "The dashboard shows 3 active alerts and a chart with declining metrics..."
```

### Report Generation

Generate visual reports with charts and tables:

```
Agent thinking: User wants a project status report.
  1. [memory_search] query="project status"
  2. [canvas] type="table", data={project status data}
  3. [canvas] type="chart", data={progress chart data}
  4. [message_send] media_path="/tmp/status_table.png", caption="Project Status"
  5. [message_send] media_path="/tmp/progress_chart.png", caption="Sprint Progress"
```

### Voice Interaction

Provide audio responses for hands-free scenarios:

```
Agent thinking: User asked for a voice summary.
  1. [memory_recall] query="today's meetings and tasks"
  2. [tts] text="You have 3 meetings today. The first is at 10 AM with the engineering team..."
  → Voice message delivered via Telegram
```

## Security

### File System Access

Image and screenshot tools read and write files on the local filesystem. These operations are subject to the same security policy as `file_read` and `file_write`:

- Path validation prevents access outside allowed directories
- File write operations respect the security policy rules
- Temporary files are written to `TMPDIR` by default

### TTS Privacy

Voice messages may contain sensitive information from the conversation. Consider:

- TTS content is sent to the TTS provider (potentially external)
- Generated audio files are stored temporarily on disk
- Voice messages are delivered through the channel and subject to the platform's privacy policy

### Canvas Content Safety

The canvas tool renders user-provided data. When rendering diagrams with Mermaid syntax, the content is processed locally and does not involve external services.

### Policy Engine

Media tools can be individually controlled:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # Require approval for screenshots
tts = "allow"
canvas = "allow"
```

## Related

- [Browser Tool](/en/prx/tools/browser) -- web automation with screenshot support
- [Messaging](/en/prx/tools/messaging) -- deliver media and voice through channels
- [Channels Overview](/en/prx/channels/) -- channel media capabilities matrix
- [Tools Overview](/en/prx/tools/) -- all tools and registry system
