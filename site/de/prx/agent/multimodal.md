---
title: Multimodale Inhaltsverarbeitung
description: Bild-, Audio- und Video-Unterstützung über Kanäle und Anbieter hinweg in PRX -- Inhaltstyperkennung, Transkodierung und Medienlimits.
---

# Multimodale Inhaltsverarbeitung

PRX unterstützt multimodale Inhalte -- Bilder, Audio und Video -- über seine Kanäle und LLM-Anbieter hinweg. Das multimodale Subsystem behandelt Inhaltstyperkennung, Formattranskodierung, Größenerzwingung und Fähigkeitsabstimmung zwischen Kanälen und Anbietern.

## Überblick

Wenn ein Benutzer einen Medienanhang (Foto, Sprachnachricht, Dokument) über einen Kanal sendet, führt die multimodale Pipeline folgende Schritte aus:

1. **Erkennung** des Inhaltstyps durch Magic Bytes und Dateierweiterung
2. **Validierung** des Inhalts gegen Größen- und Formatbeschränkungen
3. **Transkodierung** des Inhalts, wenn der Zielanbieter das Quellformat nicht unterstützt
4. **Weiterleitung** des Inhalts an den LLM-Anbieter als Teil des Gesprächskontexts
5. **Verarbeitung** von Medien in der Antwort, wenn der Anbieter Bilder oder Audio generiert

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

## Unterstützte Inhaltstypen

### Bilder

| Format | Erkennung | An Anbieter senden | Vom Anbieter empfangen |
|--------|-----------|-------------------|----------------------|
| JPEG | Magic Bytes `FF D8 FF` | Ja | Ja |
| PNG | Magic Bytes `89 50 4E 47` | Ja | Ja |
| GIF | Magic Bytes `47 49 46` | Ja (erstes Bild) | Nein |
| WebP | RIFF-Header + `WEBP` | Ja | Ja |
| BMP | Magic Bytes `42 4D` | Transkodiert zu PNG | Nein |
| TIFF | Magic Bytes `49 49` oder `4D 4D` | Transkodiert zu PNG | Nein |
| SVG | XML-Erkennung | Gerastert zu PNG | Nein |

### Audio

| Format | Erkennung | Transkription | Anbietereingabe |
|--------|-----------|--------------|----------------|
| OGG/Opus | OGG-Header | Ja (über STT) | Transkribierter Text |
| MP3 | ID3/Sync-Header | Ja (über STT) | Transkribierter Text |
| WAV | RIFF + `WAVE` | Ja (über STT) | Transkribierter Text |
| M4A/AAC | ftyp-Box | Ja (über STT) | Transkribierter Text |
| WebM | EBML-Header | Ja (über STT) | Transkribierter Text |

### Video

| Format | Erkennung | Verarbeitung |
|--------|-----------|------------|
| MP4 | ftyp-Box | Schlüsselbilder + Audiospur extrahieren |
| WebM | EBML-Header | Schlüsselbilder + Audiospur extrahieren |
| MOV | ftyp-Box | Schlüsselbilder + Audiospur extrahieren |

Videodateien werden in Schlüsselbilder und eine Audiospur zerlegt. Die Schlüsselbilder werden als Bilder gesendet und das Audio wird transkribiert.

## Inhaltstyperkennung

Die Erkennung verwendet einen Zwei-Phasen-Ansatz:

1. **Magic Bytes** -- die ersten 16 Bytes der Datei werden gegen bekannte Signaturen geprüft
2. **Dateierweiterung** -- wenn Magic Bytes nicht eindeutig sind, wird die Dateierweiterung als Fallback verwendet
3. **MIME-Typ-Header** -- bei über HTTP empfangenen Inhalten wird der `Content-Type`-Header konsultiert

Das Erkennungsergebnis bestimmt, welche Verarbeitungspipeline den Inhalt behandelt.

## Konfiguration

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

## Konfigurationsreferenz

### Bilder

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `max_size_bytes` | `u64` | `20971520` | Maximale Bilddateigröße (20 MB) |
| `max_resolution` | `String` | `"4096x4096"` | Maximale Bildabmessungen (BxH) |
| `auto_resize` | `bool` | `true` | Übergroße Bilder automatisch skalieren |
| `resize_quality` | `u8` | `85` | JPEG-Qualität für skalierte Bilder (1--100) |
| `strip_exif` | `bool` | `true` | EXIF-Metadaten aus Bildern entfernen |

### Audio

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `max_size_bytes` | `u64` | `26214400` | Maximale Audiodateigröße (25 MB) |
| `max_duration_secs` | `u64` | `300` | Maximale Audiodauer (5 Minuten) |
| `stt_provider` | `String` | `"whisper"` | Sprache-zu-Text-Anbieter |
| `stt_model` | `String` | `"whisper-1"` | STT-Modellname |
| `stt_language` | `String` | `"auto"` | Sprachhinweis für die Transkription |

### Video

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `max_size_bytes` | `u64` | `104857600` | Maximale Videodateigröße (100 MB) |
| `max_duration_secs` | `u64` | `120` | Maximale Videodauer (2 Minuten) |
| `keyframe_interval_secs` | `u64` | `5` | Sekunden zwischen extrahierten Schlüsselbildern |
| `max_keyframes` | `usize` | `20` | Maximale Anzahl zu extrahierender Schlüsselbilder |
| `extract_audio` | `bool` | `true` | Audiospur des Videos transkribieren |

## Anbieterfähigkeiten

Nicht alle LLM-Anbieter unterstützen die gleichen Medientypen. PRX handelt die Fähigkeiten automatisch aus:

| Anbieter | Bildeingabe | Bildausgabe | Audioeingabe | Natives Multimodal |
|----------|------------|-------------|-------------|-------------------|
| Anthropic (Claude) | Ja | Nein | Nein (zuerst transkribieren) | Ja (Vision) |
| OpenAI (GPT-4o) | Ja | Ja (DALL-E) | Ja (Whisper) | Ja |
| Google (Gemini) | Ja | Ja (Imagen) | Ja | Ja |
| Ollama (LLaVA) | Ja | Nein | Nein | Ja (Vision) |
| AWS Bedrock | Variiert je nach Modell | Variiert | Nein | Variiert |

Wenn ein Anbieter einen Medientyp nicht nativ unterstützt, wendet PRX eine Fallback-Verarbeitung an:

- **Bild nicht unterstützt** -- Bild wird mit einem visionsfähigen Modell beschrieben, und die Beschreibung wird als Text gesendet
- **Audio nicht unterstützt** -- Audio wird mit dem konfigurierten STT-Anbieter transkribiert, und das Transkript wird als Text gesendet
- **Video nicht unterstützt** -- Schlüsselbilder und Audio-Transkript werden als zusammengesetzte Nachricht gesendet

## Kanal-Medienlimits

Jeder Kanal legt eigene Dateigrößen- und Formatbeschränkungen fest:

| Kanal | Max Upload | Max Download | Unterstützte Formate |
|-------|-----------|-------------|-------------------|
| Telegram | 50 MB | 20 MB | Bilder, Audio, Video, Dokumente |
| Discord | 25 MB (kostenlos) | 25 MB | Bilder, Audio, Video, Dokumente |
| WhatsApp | 16 MB (Medien) | 16 MB | JPEG, PNG, MP3, MP4, PDF |
| QQ | 20 MB | 20 MB | Bilder, Audio, Dokumente |
| DingTalk | 20 MB | 20 MB | Bilder, Audio, Dokumente |
| Lark | 25 MB | 25 MB | Bilder, Audio, Video, Dokumente |
| Matrix | Abhängig vom Homeserver | Abhängig vom Homeserver | Alle gängigen Formate |
| E-Mail | 25 MB (typisch) | 25 MB | Alle über MIME-Anhänge |
| CLI | Dateisystem-Limit | Dateisystem-Limit | Alle Formate |

PRX erzwingt die Limits des Kanals, bevor versucht wird, eine Antwort zu senden. Wenn ein generiertes Bild oder eine Datei das Kanallimit überschreitet, wird es komprimiert oder stattdessen ein Download-Link bereitgestellt.

## Transkodierungs-Pipeline

Wenn eine Formatkonvertierung erforderlich ist, verwendet PRX die folgende Transkodierungs-Pipeline:

1. **Bildtranskodierung** -- behandelt durch die `image`-Crate (reines Rust, keine externen Abhängigkeiten)
2. **Audiotranskodierung** -- behandelt durch FFmpeg, falls installiert, andernfalls Fallback auf native Decoder für gängige Formate
3. **Video-Schlüsselbild-Extraktion** -- erfordert FFmpeg

### FFmpeg-Erkennung

PRX erkennt FFmpeg automatisch beim Start:

```bash
prx doctor multimodal
```

Ausgabe:

```
Multimodal Support:
  Images: OK (native)
  Audio transcoding: OK (ffmpeg 6.1 detected)
  Video processing: OK (ffmpeg 6.1 detected)
  STT provider: OK (whisper-1 via OpenAI)
```

Wenn FFmpeg nicht installiert ist, sind Audiotranskodierung und Videoverarbeitung auf nativ unterstützte Formate beschränkt.

## Einschränkungen

- Videoverarbeitung erfordert, dass FFmpeg auf dem System installiert ist
- Große Mediendateien können den LLM-Token-Verbrauch erheblich erhöhen (insbesondere mehrere Schlüsselbilder)
- Einige Anbieter erheben zusätzliche Gebühren für Vision-/Multimodal-API-Aufrufe
- Echtzeit-Audio-Streaming (Live-Sprachkonversation) wird noch nicht unterstützt
- Von Anbietern generierte Bilder (DALL-E, Imagen) unterliegen den Inhaltsrichtlinien des Anbieters
- SVG-Rasterung verwendet einen einfachen Renderer; komplexe SVGs werden möglicherweise nicht korrekt dargestellt

## Verwandte Seiten

- [Agenten-Laufzeit](./runtime) -- wie Medieninhalte durch die Agenten-Schleife fließen
- [Kanalübersicht](../channels/) -- kanalspezifische Medienverarbeitung
- [Anbieterübersicht](../providers/) -- Multimodal-Fähigkeiten der Anbieter
- [Embeddings-Backend](../memory/embeddings) -- Embedding-Modelle für das Gedächtnis
