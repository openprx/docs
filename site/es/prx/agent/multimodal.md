---
title: Manejo de contenido multimodal
description: Soporte de imagenes, audio y video a traves de canales y proveedores en PRX -- deteccion de tipo de contenido, transcodificacion y limites de medios.
---

# Manejo de contenido multimodal

PRX soporta contenido multimodal -- imagenes, audio y video -- a traves de sus canales y proveedores LLM. El subsistema multimodal maneja la deteccion de tipo de contenido, transcodificacion de formato, aplicacion de limites de tamano y negociacion de capacidades entre canales y proveedores.

## Vision general

Cuando un usuario envia un adjunto multimedia (foto, mensaje de voz, documento) a traves de un canal, el pipeline multimodal:

1. **Detecta** el tipo de contenido usando bytes magicos y extension de archivo
2. **Valida** el contenido contra restricciones de tamano y formato
3. **Transcodifica** el contenido si el proveedor destino no soporta el formato origen
4. **Despacha** el contenido al proveedor LLM como parte del contexto de conversacion
5. **Maneja** medios en la respuesta si el proveedor genera imagenes o audio

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

## Tipos de contenido soportados

### Imagenes

| Formato | Deteccion | Enviar a proveedor | Recibir de proveedor |
|---------|-----------|-------------------|---------------------|
| JPEG | Bytes magicos `FF D8 FF` | Si | Si |
| PNG | Bytes magicos `89 50 4E 47` | Si | Si |
| GIF | Bytes magicos `47 49 46` | Si (primer fotograma) | No |
| WebP | Cabecera RIFF + `WEBP` | Si | Si |
| BMP | Bytes magicos `42 4D` | Transcodificado a PNG | No |
| TIFF | Bytes magicos `49 49` o `4D 4D` | Transcodificado a PNG | No |
| SVG | Deteccion XML | Rasterizado a PNG | No |

### Audio

| Formato | Deteccion | Transcripcion | Entrada al proveedor |
|---------|-----------|--------------|---------------------|
| OGG/Opus | Cabecera OGG | Si (via STT) | Texto transcrito |
| MP3 | Cabecera ID3/sync | Si (via STT) | Texto transcrito |
| WAV | RIFF + `WAVE` | Si (via STT) | Texto transcrito |
| M4A/AAC | Caja ftyp | Si (via STT) | Texto transcrito |
| WebM | Cabecera EBML | Si (via STT) | Texto transcrito |

### Video

| Formato | Deteccion | Procesamiento |
|---------|-----------|--------------|
| MP4 | Caja ftyp | Extraer fotogramas clave + pista de audio |
| WebM | Cabecera EBML | Extraer fotogramas clave + pista de audio |
| MOV | Caja ftyp | Extraer fotogramas clave + pista de audio |

Los archivos de video se descomponen en imagenes de fotogramas clave y una pista de audio. Los fotogramas clave se envian como imagenes y el audio se transcribe.

## Deteccion de tipo de contenido

La deteccion usa un enfoque de dos pasadas:

1. **Bytes magicos** -- los primeros 16 bytes del archivo se verifican contra firmas conocidas
2. **Extension de archivo** -- si los bytes magicos no son concluyentes, se usa la extension de archivo como alternativa
3. **Cabecera de tipo MIME** -- para contenido recibido via HTTP, se consulta la cabecera `Content-Type`

El resultado de la deteccion determina que pipeline de procesamiento maneja el contenido.

## Configuracion

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

## Referencia de configuracion

### Imagenes

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `max_size_bytes` | `u64` | `20971520` | Tamano maximo de archivo de imagen (20 MB) |
| `max_resolution` | `String` | `"4096x4096"` | Dimensiones maximas de imagen (AnchoxAlto) |
| `auto_resize` | `bool` | `true` | Redimensionar automaticamente imagenes sobredimensionadas |
| `resize_quality` | `u8` | `85` | Calidad JPEG para imagenes redimensionadas (1--100) |
| `strip_exif` | `bool` | `true` | Eliminar metadatos EXIF de las imagenes |

### Audio

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `max_size_bytes` | `u64` | `26214400` | Tamano maximo de archivo de audio (25 MB) |
| `max_duration_secs` | `u64` | `300` | Duracion maxima de audio (5 minutos) |
| `stt_provider` | `String` | `"whisper"` | Proveedor de voz a texto |
| `stt_model` | `String` | `"whisper-1"` | Nombre del modelo STT |
| `stt_language` | `String` | `"auto"` | Indicacion de idioma para transcripcion |

### Video

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `max_size_bytes` | `u64` | `104857600` | Tamano maximo de archivo de video (100 MB) |
| `max_duration_secs` | `u64` | `120` | Duracion maxima de video (2 minutos) |
| `keyframe_interval_secs` | `u64` | `5` | Segundos entre fotogramas clave extraidos |
| `max_keyframes` | `usize` | `20` | Numero maximo de fotogramas clave a extraer |
| `extract_audio` | `bool` | `true` | Transcribir la pista de audio del video |

## Capacidades de proveedores

No todos los proveedores LLM soportan los mismos tipos de medios. PRX negocia capacidades automaticamente:

| Proveedor | Entrada de imagen | Salida de imagen | Entrada de audio | Multimodal nativo |
|-----------|------------------|-----------------|-----------------|-------------------|
| Anthropic (Claude) | Si | No | No (transcribir primero) | Si (vision) |
| OpenAI (GPT-4o) | Si | Si (DALL-E) | Si (Whisper) | Si |
| Google (Gemini) | Si | Si (Imagen) | Si | Si |
| Ollama (LLaVA) | Si | No | No | Si (vision) |
| AWS Bedrock | Varia segun modelo | Varia | No | Varia |

Cuando un proveedor no soporta un tipo de medio de forma nativa, PRX aplica procesamiento alternativo:

- **Imagen no soportada** -- la imagen se describe usando un modelo con capacidad de vision, y la descripcion se envia como texto
- **Audio no soportado** -- el audio se transcribe usando el proveedor STT configurado, y la transcripcion se envia como texto
- **Video no soportado** -- los fotogramas clave y la transcripcion del audio se envian como un mensaje compuesto

## Limites de medios por canal

Cada canal impone sus propias restricciones de tamano de archivo y formato:

| Canal | Subida maxima | Descarga maxima | Formatos soportados |
|-------|--------------|----------------|---------------------|
| Telegram | 50 MB | 20 MB | Imagenes, audio, video, documentos |
| Discord | 25 MB (gratis) | 25 MB | Imagenes, audio, video, documentos |
| WhatsApp | 16 MB (medios) | 16 MB | JPEG, PNG, MP3, MP4, PDF |
| QQ | 20 MB | 20 MB | Imagenes, audio, documentos |
| DingTalk | 20 MB | 20 MB | Imagenes, audio, documentos |
| Lark | 25 MB | 25 MB | Imagenes, audio, video, documentos |
| Matrix | Depende del homeserver | Depende del homeserver | Todos los formatos comunes |
| Email | 25 MB (tipico) | 25 MB | Todos via adjuntos MIME |
| CLI | Limite del sistema de archivos | Limite del sistema de archivos | Todos los formatos |

PRX aplica los limites del canal antes de intentar enviar una respuesta. Si una imagen o archivo generado excede el limite del canal, se comprime o se proporciona un enlace de descarga en su lugar.

## Pipeline de transcodificacion

Cuando se necesita conversion de formato, PRX usa el siguiente pipeline de transcodificacion:

1. **Transcodificacion de imagenes** -- manejada por el crate `image` (Rust puro, sin dependencias externas)
2. **Transcodificacion de audio** -- manejada por FFmpeg si esta instalado, en caso contrario recurre a decodificadores nativos para formatos comunes
3. **Extraccion de fotogramas clave de video** -- requiere FFmpeg

### Deteccion de FFmpeg

PRX detecta automaticamente FFmpeg al iniciar:

```bash
prx doctor multimodal
```

Salida:

```
Multimodal Support:
  Images: OK (native)
  Audio transcoding: OK (ffmpeg 6.1 detected)
  Video processing: OK (ffmpeg 6.1 detected)
  STT provider: OK (whisper-1 via OpenAI)
```

Si FFmpeg no esta instalado, la transcodificacion de audio y el procesamiento de video se limitan a formatos soportados nativamente.

## Limitaciones

- El procesamiento de video requiere que FFmpeg este instalado en el sistema
- Los archivos multimedia grandes pueden incrementar significativamente el uso de tokens del LLM (especialmente multiples fotogramas clave)
- Algunos proveedores cobran tarifas adicionales por llamadas a la API de vision/multimodal
- El streaming de audio en tiempo real (conversacion por voz en vivo) aun no esta soportado
- Las imagenes generadas por proveedores (DALL-E, Imagen) estan sujetas a la politica de contenido del proveedor
- La rasterizacion de SVG usa un renderizador basico; SVGs complejos pueden no renderizarse con precision

## Paginas relacionadas

- [Runtime del agente](./runtime) -- como el contenido multimedia fluye a traves del bucle del agente
- [Vision general de canales](../channels/) -- manejo de medios especifico por canal
- [Vision general de proveedores](../providers/) -- capacidades multimodales de proveedores
- [Backend de embeddings](../memory/embeddings) -- modelos de embedding para memoria
