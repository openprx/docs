---
title: Media Tools
description: Image processing, screenshots, text-to-speech, and canvas rendering tools for visual and audio content generation.
---

# Media Tools

PRX inclut five media-related tools couvrant le traitement d'images, screen capture, text-to-speech synthesis, and structured content rendering. These tools enable agents to work with visual and audio content -- resizing images, capturing screenshots for visual reasoning, generating messages vocaux, and rendering charts and diagrams.

Les outils media sont distribues dans deux categories du registre d'outils. Les outils de vision (`image`, `image_info`, `screenshot`) are toujours registered in `all_tools()`. The rendering tools (`tts`, `canvas`) sont enregistres lorsqu'un channel is active ou unconditionally, respectively.

Together, these tools give PRX agents multimodal output capabilities, allowing them to produce images, audio, and visual artifacts alongside text responses.

## Configuration

Les outils media ont une configuration minimale. La plupart des parametres sont controles au niveau du canal (for delivery) or through le LLM fournisseur (for vision model capabilities):

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

## Reference des outils

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `action` | `string` | Oui | -- | Operation: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Oui | -- | Path vers le source image file |
| `width` | `integer` | Conditional | -- | Target width (for resize and crop) |
| `height` | `integer` | Conditional | -- | Target height (for resize and crop) |
| `x` | `integer` | Conditional | -- | X offset for crop origin |
| `y` | `integer` | Conditional | -- | Y offset for crop origin |
| `format` | `string` | Conditional | -- | Target format for conversion: `"png"`, `"jpeg"`, `"webp"`, `"gif"` |
| `output` | `string` | Non | Overwrites source | Output file path |

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `path` | `string` | Oui | -- | Path vers le image file |

**Retours information incluant :**

| Champ | Description |
|-------|-------------|
| Width | Image width in pixels |
| Height | Image height in pixels |
| Format | Image format (PNG, JPEG, WebP, etc.) |
| Color space | RGB, RGBA, Grayscale, etc. |
| File size | Size on disk |
| DPI | Resolution (if disponible dans metadata) |

### screenshot

Capture des captures d'ecran de l'ecran actuel ou de fenetres specifiques. Utile pour les taches de raisonnement visuel where l'agent doit observe the current state of the desktop or an application.

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `target` | `string` | Non | `"screen"` | What to capture: `"screen"` (full screen) or `"window"` (specific window) |
| `window_name` | `string` | Conditional | -- | Window title to capture (required when `target = "window"`) |
| `output` | `string` | Non | Auto-generated temp path | Output file path pour le screenshot |

Screenshots are saved as PNG files. When used with vision-capable LLMs (GPT-4o, Claude Sonnet, etc.), the screenshot peut etre inclus dans the next message for visual analysis.

### tts

Text-to-Speech synthesis. Converts text to an audio file and sends it comme un voice message vers le current conversation. L'outil handles MP3 generation, optional M4A conversion, and delivery via le active channel.

```json
{
  "name": "tts",
  "arguments": {
    "text": "Good morning! Here is your daily briefing. Three tasks are due today."
  }
}
```

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | Oui | -- | The text to convert to speech |
| `language` | `string` | Non | `"en"` | Language code for speech synthesis |
| `voice` | `string` | Non | Provider default | Voice identifier (fournisseur-specific) |

The TTS tool necessite an active channel qui prend en charge messages vocaux (Telegram, WhatsApp, Discord). On channels that ne faites pas support voice, l'outil retours an error.

**TTS Pipeline:**

1. Text is sent vers le TTS fournisseur (built-in or external)
2. Audio is generated as MP3
3. Si le channel necessite M4A (e.g., some mobile clients), automatic conversion is performed
4. The audio file is delivered via `message_send` comme un voice message

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

| Parametre | Type | Requis | Defaut | Description |
|-----------|------|----------|---------|-------------|
| `type` | `string` | Oui | -- | Content type: `"table"`, `"chart"`, `"diagram"`, `"code"` |
| `data` | `object` | Conditional | -- | Structured data for tables and charts |
| `content` | `string` | Conditional | -- | Text content for diagrams (Mermaid syntax) and code bloque |
| `format` | `string` | Non | `"png"` | Output format: `"png"`, `"svg"`, `"html"` |
| `output` | `string` | Non | Auto-generated temp path | Output file path |

## Utilisation Patterns

### Visual Raisoning Workflow

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

## Securite

### File System Access

Image and screenshot tools read and write files sur le local filesystem. These operations sont soumis aux memes politique de securite as `file_read` and `file_write`:

- Path validation empeche access outside allowed directories
- File write operations respect the politique de securite rules
- Temporary files are written to `TMPDIR` par defaut

### TTS Privacy

Voice messages may contain sensitive information depuis le conversation. Consider:

- TTS content is sent vers le TTS fournisseur (potentially external)
- Generated audio files sont stockes temporarily on disk
- Voice messages are delivered via le channel and subject vers le platform's privacy policy

### Canvas Content Safety

The canvas tool renders user-provided data. When rendering diagrams with Mermaid syntax, the content is processed locally et ne fait pas involve external services.

### Moteur de politiques

Les outils media peut etre individually controlled:

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # Require approval for screenshots
tts = "allow"
canvas = "allow"
```

## Voir aussi

- [Browser Tool](/fr/prx/tools/browser) -- web automation with screenshot support
- [Messaging](/fr/prx/tools/messaging) -- deliver media and voice through channels
- [Channels Overview](/fr/prx/channels/) -- channel media capabilities matrix
- [Tools Overview](/fr/prx/tools/) -- tous les outils et systeme de registre
