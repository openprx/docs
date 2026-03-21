---
title: التعامل مع المحتوى متعدد الوسائط
description: دعم الصور والصوت والفيديو عبر القنوات والمزوّدين في PRX -- اكتشاف نوع المحتوى، والتحويل بين الصيغ، وحدود الوسائط.
---

# التعامل مع المحتوى متعدد الوسائط

يدعم PRX المحتوى متعدد الوسائط -- الصور والصوت والفيديو -- عبر قنواته ومزوّدي LLM. يتعامل نظام الوسائط المتعددة مع اكتشاف نوع المحتوى، والتحويل بين الصيغ، وفرض قيود الحجم، والتفاوض على القدرات بين القنوات والمزوّدين.

## نظرة عامة

عندما يرسل المستخدم مرفق وسائط (صورة، رسالة صوتية، مستند) عبر قناة، فإن خط أنابيب الوسائط المتعددة:

1. **يكتشف** نوع المحتوى باستخدام bytes السحرية وامتداد الملف
2. **يتحقق** من المحتوى مقابل قيود الحجم والصيغة
3. **يحوّل** المحتوى إذا كان المزوّد الهدف لا يدعم الصيغة المصدر
4. **يرسل** المحتوى إلى مزوّد LLM كجزء من سياق المحادثة
5. **يتعامل** مع الوسائط في الاستجابة إذا كان المزوّد يولّد صورًا أو صوتًا

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

## أنواع المحتوى المدعومة

### الصور

| Format | Detection | Send to Provider | Receive from Provider |
|--------|-----------|-----------------|----------------------|
| JPEG | Magic bytes `FF D8 FF` | Yes | Yes |
| PNG | Magic bytes `89 50 4E 47` | Yes | Yes |
| GIF | Magic bytes `47 49 46` | Yes (first frame) | No |
| WebP | RIFF header + `WEBP` | Yes | Yes |
| BMP | Magic bytes `42 4D` | Transcoded to PNG | No |
| TIFF | Magic bytes `49 49` or `4D 4D` | Transcoded to PNG | No |
| SVG | XML detection | Rasterized to PNG | No |

### الصوت

| Format | Detection | Transcription | Provider Input |
|--------|-----------|--------------|----------------|
| OGG/Opus | OGG header | Yes (via STT) | Transcribed text |
| MP3 | ID3/sync header | Yes (via STT) | Transcribed text |
| WAV | RIFF + `WAVE` | Yes (via STT) | Transcribed text |
| M4A/AAC | ftyp box | Yes (via STT) | Transcribed text |
| WebM | EBML header | Yes (via STT) | Transcribed text |

### الفيديو

| Format | Detection | Processing |
|--------|-----------|------------|
| MP4 | ftyp box | Extract keyframes + audio track |
| WebM | EBML header | Extract keyframes + audio track |
| MOV | ftyp box | Extract keyframes + audio track |

يتم تفكيك ملفات الفيديو إلى صور keyframes ومسار صوتي. تُرسل keyframes كصور ويتم تفريغ الصوت إلى نص.

## اكتشاف نوع المحتوى

يستخدم الاكتشاف أسلوبًا من مرحلتين:

1. **Magic bytes** -- يتم فحص أول 16 بايت من الملف مقابل تواقيع معروفة
2. **File extension** -- إذا كانت bytes السحرية غير حاسمة، يُستخدم امتداد الملف كخيار احتياطي
3. **MIME type header** -- للمحتوى المستلَم عبر HTTP، يتم الرجوع إلى ترويسة `Content-Type`

تحدد نتيجة الاكتشاف خط المعالجة الذي سيتعامل مع المحتوى.

## الإعدادات

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

## مرجع الإعدادات

### الصور

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `20971520` | Maximum image file size (20 MB) |
| `max_resolution` | `String` | `"4096x4096"` | Maximum image dimensions (WxH) |
| `auto_resize` | `bool` | `true` | Automatically resize oversized images |
| `resize_quality` | `u8` | `85` | JPEG quality for resized images (1--100) |
| `strip_exif` | `bool` | `true` | Remove EXIF metadata from images |

### الصوت

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `26214400` | Maximum audio file size (25 MB) |
| `max_duration_secs` | `u64` | `300` | Maximum audio duration (5 minutes) |
| `stt_provider` | `String` | `"whisper"` | Speech-to-text provider |
| `stt_model` | `String` | `"whisper-1"` | STT model name |
| `stt_language` | `String` | `"auto"` | Language hint for transcription |

### الفيديو

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `max_size_bytes` | `u64` | `104857600` | Maximum video file size (100 MB) |
| `max_duration_secs` | `u64` | `120` | Maximum video duration (2 minutes) |
| `keyframe_interval_secs` | `u64` | `5` | Seconds between extracted keyframes |
| `max_keyframes` | `usize` | `20` | Maximum number of keyframes to extract |
| `extract_audio` | `bool` | `true` | Transcribe the video's audio track |

## قدرات المزوّدين

لا تدعم كل مزوّدات LLM أنواع الوسائط نفسها. يقوم PRX بالتفاوض على القدرات تلقائيًا:

| Provider | Image Input | Image Output | Audio Input | Native Multimodal |
|----------|------------|-------------|-------------|-------------------|
| Anthropic (Claude) | Yes | No | No (transcribe first) | Yes (vision) |
| OpenAI (GPT-4o) | Yes | Yes (DALL-E) | Yes (Whisper) | Yes |
| Google (Gemini) | Yes | Yes (Imagen) | Yes | Yes |
| Ollama (LLaVA) | Yes | No | No | Yes (vision) |
| AWS Bedrock | Varies by model | Varies | No | Varies |

عندما لا يدعم مزوّد نوع وسائط بشكل أصلي، يطبّق PRX معالجة احتياطية:

- **Image not supported** -- يتم وصف الصورة باستخدام نموذج يدعم الرؤية، ثم يُرسل الوصف كنص
- **Audio not supported** -- يتم تفريغ الصوت باستخدام مزوّد STT المُعد، ثم يُرسل النص المفرغ
- **Video not supported** -- تُرسل keyframes وتفريغ الصوت كرسالة مركبة

## حدود الوسائط في القنوات

كل قناة تفرض قيودها الخاصة على حجم الملفات والصيغ:

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

يفرض PRX حدود القناة قبل محاولة إرسال الاستجابة. إذا تجاوزت صورة أو ملف مولَّد حد القناة، يتم ضغطه أو تقديم رابط تنزيل بدلًا من ذلك.

## خط أنابيب التحويل بين الصيغ

عند الحاجة إلى تحويل الصيغة، يستخدم PRX خط الأنابيب التالي:

1. **Image transcoding** -- يتم التعامل معه بواسطة crate `image` (Rust خالص بلا تبعيات خارجية)
2. **Audio transcoding** -- يتم التعامل معه بواسطة FFmpeg إذا كان مثبتًا، وإلا يرجع إلى مفككات أصلية للصيغ الشائعة
3. **Video keyframe extraction** -- يتطلب FFmpeg

### اكتشاف FFmpeg

يكتشف PRX وجود FFmpeg تلقائيًا عند بدء التشغيل:

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

إذا لم يكن FFmpeg مثبتًا، فسيكون تحويل الصوت ومعالجة الفيديو محدودين بالصيغ المدعومة أصلاً.

## القيود

- تتطلب معالجة الفيديو تثبيت FFmpeg على النظام
- قد تزيد ملفات الوسائط الكبيرة استهلاك رموز LLM بشكل ملحوظ (خصوصًا عند تعدد keyframes)
- بعض المزوّدين يفرضون رسومًا إضافية على استدعاءات واجهات الرؤية/متعددة الوسائط
- البث الصوتي الآني (محادثة صوتية مباشرة) غير مدعوم بعد
- الصور المولدة من المزوّدين (DALL-E, Imagen) تخضع لسياسة المحتوى الخاصة بالمزوّد
- يستخدم تحويل SVG إلى صور نقطية مُصيّرًا أساسيًا؛ وقد لا تُعرض ملفات SVG المعقدة بدقة

## صفحات ذات صلة

- [وقت تشغيل الوكيل](./runtime) -- كيف يتدفق محتوى الوسائط عبر حلقة الوكيل
- [نظرة عامة على القنوات](../channels/) -- التعامل مع الوسائط حسب القناة
- [نظرة عامة على المزوّدين](../providers/) -- قدرات الوسائط المتعددة لدى المزوّدين
- [واجهة التضمينات الخلفية](../memory/embeddings) -- نماذج التضمين للذاكرة
