---
title: Multimodal Content Handling
description: Image, audio, and video support across channels and providers in PRX -- content type detection, transcoding, and media limits.
---

# Multimodal Content Handling

PRX prend en charge le contenu multimodal -- images, audio, et video -- a travers ses channels et LLM fournisseurs. The multimodal subsystem handles content type detection, format transcoding, size enforcement, et capability negotiation between channels et fournisseurs.

## Apercu

Lorsqu'un utilisateur envoie a media attachment (photo, voice message, document) via un channel, the multimodal pipeline:

1. **Detects** the content type using magic bytes and file extension
2. **Validates** the content against size and format constraints
3. **Transcodes** the content si le target fournisseur ne fait pas support the source format
4. **Dispatches** the content to le LLM fournisseur as part of the conversation context
5. **Handles** media in la reponse if le fournisseur genere images or audio

```
Channel Input                    Provider Output
  │                                  │
  ▼                                  ▼
┌──────────────┐              ┌──────────────┐
│ Content Type │              │ Response     │
│ Detection    │              │ Media        │
└──────┬───────┘              └──────┬───────┘
       │                             │
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│ Validation   │              │ Transcoding  │
│ & Limits     │              │ (if needed)  │
└──────┬───────┘              └──────┬───────┘
       │                             │
       ▼                             ▼
┌──────────────┐              ┌──────────────┐
│ Transcoding  │              │ Channel      │
│ (if needed)  │              │ Delivery     │
└──────┬───────┘              └──────────────┘
       │
       ▼
┌──────────────┐
│ Provider     │
│ Dispatch     │
└──────────────┘
```

## Supported Content Types

### Images

| Format | Detection | Send to Provider | Receive from Provider |
|--------|-----------|-----------------|----------------------|
| JPEG | Magic bytes `FF D8 FF` | Oui | Oui |
| PNG | Magic bytes `89 50 4E 47` | Oui | Oui |
| GIF | Magic bytes `47 49 46` | Oui (first frame) | Non |
| WebP | RIFF header + `WEBP` | Oui | Oui |
| BMP | Magic bytes `42 4D` | Transcoded to PNG | Non |
| TIFF | Magic bytes `49 49` or `4D 4D` | Transcoded to PNG | Non |
| SVG | XML detection | Rasterized to PNG | Non |

### Audio

| Format | Detection | Transcription | Provider Input |
|--------|-----------|--------------|----------------|
| OGG/Opus | OGG header | Oui (via STT) | Transcribed text |
| MP3 | ID3/sync header | Oui (via STT) | Transcribed text |
| WAV | RIFF + `WAVE` | Oui (via STT) | Transcribed text |
| M4A/AAC | ftyp box | Oui (via STT) | Transcribed text |
| WebM | EBML header | Oui (via STT) | Transcribed text |

### Video

| Format | Detection | Processing |
|--------|-----------|------------|
| MP4 | ftyp box | Extract keyframes + audio track |
| WebM | EBML header | Extract keyframes + audio track |
| MOV | ftyp box | Extract keyframes + audio track |

Les fichiers video sont decomposes en images cles et une piste audio. Les images cles sont envoyees comme images et the audio is transcribed.

## Content Type Detection

Detection uses a two-pass approach:

1. **Magic bytes** -- the first 16 bytes of le fichier are checked against known signatures
2. **File extension** -- if magic bytes are inconclusive, le fichier extension is used comme un fallback
3. **MIME type header** -- for content received via HTTP, the `Content-Type` header is consulted

The detection result determine which processing pipeline gere le content.

## Configuration

```toml
[multimodal]
enabled = true

[multimodal.images]
max_size_bytes = 20_971_520      # 20 MB
max_resolution = "4096x4096"     # maximum width x height
auto_resize = true               # resize images exceeding max_resolution
resize_quality = 85              # JPEG quality for resized images (1-100)
strip_exif = true                # remove EXIF metadata for privacy

[multimodal.audio]
max_size_bytes = 26_214_400      # 25 MB
max_duration_secs = 300          # 5 minutes
stt_provider = "whisper"         # "whisper", "deepgram", or "provider" (use LLM provider's STT)
stt_model = "whisper-1"
stt_language = "auto"            # "auto" for language detection, or ISO 639-1 code

[multimodal.video]
max_size_bytes = 104_857_600     # 100 MB
max_duration_secs = 120          # 2 minutes
keyframe_interval_secs = 5       # extract one keyframe every 5 seconds
max_keyframes = 20               # maximum keyframes to extract
extract_audio = true             # transcribe audio track
```

## Configuration Reference

### Images

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `20971520` | Maximum image file size (20 MB) |
| `max_resolution` | `String` | `"4096x4096"` | Maximum image dimensions (WxH) |
| `auto_resize` | `bool` | `true` | Automatically resize oversized images |
| `resize_quality` | `u8` | `85` | JPEG quality for resized images (1--100) |
| `strip_exif` | `bool` | `true` | Remove EXIF metadata from images |

### Audio

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `26214400` | Maximum audio file size (25 MB) |
| `max_duration_secs` | `u64` | `300` | Maximum audio duration (5 minutes) |
| `stt_fournisseur` | `String` | `"whisper"` | Speech-to-text fournisseur |
| `stt_model` | `String` | `"whisper-1"` | STT model name |
| `stt_language` | `String` | `"auto"` | Language hint for transcription |

### Video

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `104857600` | Maximum video file size (100 MB) |
| `max_duration_secs` | `u64` | `120` | Maximum video duration (2 minutes) |
| `keyframe_interval_secs` | `u64` | `5` | Seconds between extracted keyframes |
| `max_keyframes` | `usize` | `20` | Maximum number of keyframes to extract |
| `extract_audio` | `bool` | `true` | Transcribe the video's audio track |

## Provider Capabilities

Nont all LLM fournisseurs support the same media types. PRX negotiates capabilities automatically:

| Provider | Image Input | Image Output | Audio Input | Native Multimodal |
|----------|------------|-------------|-------------|-------------------|
| Anthropic (Claude) | Oui | Non | Non (transcribe first) | Oui (vision) |
| OpenAI (GPT-4o) | Oui | Oui (DALL-E) | Oui (Whisper) | Oui |
| Google (Gemini) | Oui | Oui (Imagen) | Oui | Oui |
| Ollama (LLaVA) | Oui | Non | Non | Oui (vision) |
| AWS Bedrock | Varies by model | Varies | Non | Varies |

When a fournisseur ne fait pas support a media type natively, PRX applies fallback processing:

- **Image not supported** -- l'image est decrite a l'aide d'un modele capable de vision, and the description is sent as text
- **Audio not supported** -- audio is transcribed en utilisant le configured STT fournisseur, and the transcript is sent as text
- **Video not supported** -- keyframes and audio transcript sont envoyes comme un composite message

## Channel Media Limites

Each channel imposes its own file size and format restrictions:

| Channel | Max Upload | Max Download | Supported Formats |
|---------|-----------|-------------|-------------------|
| Telegram | 50 MB | 20 MB | Images, audio, video, documents |
| Discord | 25 MB (free) | 25 MB | Images, audio, video, documents |
| WhatsApp | 16 MB (media) | 16 MB | JPEG, PNG, MP3, MP4, PDF |
| QQ | 20 MB | 20 MB | Images, audio, documents |
| DingTalk | 20 MB | 20 MB | Images, audio, documents |
| Lark | 25 MB | 25 MB | Images, audio, video, documents |
| Matrix | Homeserver dependent | Homeserver dependent | All common formats |
| Email | 25 MB (typical) | 25 MB | All via MIME attachments |
| CLI | Filesystem limit | Filesystem limit | All formats |

PRX applique the channel's limits before attempting to send a response. Si un generated image ou file exceeds the channel limit, it is compressed ou un download link is provided instead.

## Transcoding Pipeline

When format conversion is needed, PRX utilise les elements suivants transcoding pipeline:

1. **Image transcoding** -- gere par the `image` crate (pure Rust, no external dependencies)
2. **Audio transcoding** -- gere par FFmpeg if installed, otherwise falls back to native decoders for common formats
3. **Video keyframe extraction** -- necessite FFmpeg

### FFmpeg Detection

PRX automatiquement detects FFmpeg au demarrage:

```bash
prx doctor multimodal
```

Output:

```
Multimodal Support:
  Images: OK (native)
  Audio transcoding: OK (ffmpeg 6.1 detected)
  Video processing: OK (ffmpeg 6.1 detected)
  STT provider: OK (whisper-1 via OpenAI)
```

If FFmpeg is pas installed, audio transcoding et video processing are limited to nativement supported formats.

## Limiteations

- Video processing necessite FFmpeg to be installed on le systeme
- Large media files may significantly increase LLM token usage (especially multiple keyframes)
- Some fournisseurs charge additional fees for vision/multimodal API calls
- Real-time audio streaming (live voice conversation) is not yet supported
- Generated images from fournisseurs (DALL-E, Imagen) sont soumis a le fournisseur's content policy
- SVG rasterization uses a basic renderer; complex SVGs ne peut pas render accurately

## Voir aussi Pages

- [Agent Runtime](./runtime) -- how media content flows through la boucle de l'agent
- [Channels Overview](../channels/) -- channel-specific media handling
- [Providers Overview](../fournisseurs/) -- fournisseur multimodal capabilities
- [Embeddings Backend](../memory/embeddings) -- embedding models for memory
