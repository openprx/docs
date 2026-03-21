---
title: AWS Bedrock
description: تهيئة AWS Bedrock كمزوّد LLM في PRX
---

# AWS Bedrock

> الوصول إلى نماذج الأساس (Claude، Titan، Llama، Mistral والمزيد) عبر Converse API في AWS Bedrock مع مصادقة SigV4، واستدعاء الأدوات الأصلي، وتخزين المطالبات مؤقتًا.

## المتطلبات المسبقة

- حساب AWS مع تفعيل الوصول إلى نماذج Bedrock
- بيانات اعتماد AWS ‏(Access Key ID + Secret Access Key) مع صلاحيات `bedrock:InvokeModel`

## إعداد سريع

### 1. تفعيل الوصول إلى النموذج

1. افتح [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. انتقل إلى **Model access** في الشريط الجانبي الأيسر
3. اطلب الوصول إلى النماذج التي تريد استخدامها (مثل Anthropic Claude وMeta Llama)

### 2. إعداد بيانات اعتماد AWS

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # optional, defaults to us-east-1
```

### 3. إعداد PRX

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. التحقق

```bash
prx doctor models
```

## النماذج المتاحة

تتبع معرفات النماذج في Bedrock الصيغة `<provider>.<model>-<version>`:

| Model ID | Provider | Context | Vision | Tool Use | Notes |
|----------|----------|---------|--------|----------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | Yes | Yes | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | Yes | Yes | Latest Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | Yes | Yes | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | Yes | Yes | Fast Claude model |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | No | Yes | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | No | Yes | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | No | No | Amazon Titan |

راجع [توثيق AWS Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) للحصول على القائمة الكاملة للنماذج المتاحة في منطقتك.

## مرجع الإعدادات

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|---------|-------------|
| `model` | string | مطلوب | معرّف نموذج Bedrock (مثل `anthropic.claude-sonnet-4-6`) |

تتم المصادقة بالكامل عبر متغيرات بيئة AWS:

| متغير البيئة | مطلوب | الوصف |
|---------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | نعم | معرّف مفتاح وصول AWS |
| `AWS_SECRET_ACCESS_KEY` | نعم | مفتاح AWS السري |
| `AWS_SESSION_TOKEN` | لا | رمز جلسة مؤقت (للأدوار المفترضة) |
| `AWS_REGION` | لا | منطقة AWS ‏(الافتراضي: `us-east-1`) |
| `AWS_DEFAULT_REGION` | لا | منطقة احتياطية إذا لم يتم ضبط `AWS_REGION` |

## الميزات

### توقيع SigV4 بدون تبعيات

ينفّذ PRX توقيع طلبات AWS SigV4 باستخدام مكتبات `hmac` و`sha2` فقط، دون الاعتماد على AWS SDK. هذا يُبقي الحزمة صغيرة ويتجنب تعارضات إصدارات SDK. يشمل التوقيع:

- سلسلة اشتقاق مفتاح HMAC-SHA256
- بناء طلب canonical مع ترويسات مرتبة
- دعم `x-amz-security-token` لبيانات الاعتماد المؤقتة

### Converse API

يستخدم PRX واجهة Converse API في Bedrock (وليس واجهة InvokeModel القديمة)، والتي توفر:
- صيغة رسائل موحدة عبر جميع مزودي النماذج
- استدعاء أدوات منظّمًا باستخدام كتل `toolUse` و`toolResult`
- دعم مطالبات النظام
- صيغة استجابة متسقة

### الاستدعاء الأصلي للأدوات

تُرسل الأدوات باستخدام صيغة `toolConfig` الأصلية في Bedrock مع تعريفات `toolSpec` التي تتضمن `name` و`description` و`inputSchema`. تُلف نتائج الأدوات ككتل محتوى `toolResult` داخل رسائل `user`.

### التخزين المؤقت للمطالبات

يطبّق PRX آليات Bedrock للتخزين المؤقت للمطالبات (بنفس الحدود المستخدمة في مزود Anthropic):
- مطالبات النظام الأكبر من 3 KB تحصل على كتلة `cachePoint`
- المحادثات التي تحتوي على أكثر من 4 رسائل غير نظامية يتم وسم آخر رسالة فيها بـ `cachePoint`

### ترميز URL لمعرفات النماذج

معرفات نماذج Bedrock التي تحتوي على النقطتين (مثل `v1:0`) تحتاج معالجة خاصة. PRX:
- يرسل النقطتين كما هي في رابط HTTP (كما يفعل reqwest)
- يرمّز النقطتين إلى `%3A` في canonical URI لتوقيع SigV4
- يضمن هذا النهج المزدوج نجاح التوجيه عبر HTTP والتحقق من التوقيع معًا

## الأسماء المستعارة للمزوّد

الأسماء التالية تُحل إلى مزود Bedrock:

- `bedrock`
- `aws-bedrock`

## استكشاف الأخطاء وإصلاحها

### "AWS Bedrock credentials not set"

تأكد من ضبط كل من `AWS_ACCESS_KEY_ID` و`AWS_SECRET_ACCESS_KEY` كمتغيرات بيئة. لا يقرأ PRX من `~/.aws/credentials` أو `~/.aws/config`.

### 403 AccessDeniedException

الأسباب الشائعة:
- مستخدم/دور IAM لا يملك صلاحية `bedrock:InvokeModel`
- لم تطلب الوصول إلى النموذج من وحدة تحكم Bedrock
- النموذج غير متاح في المنطقة المضبوطة

### SignatureDoesNotMatch

يشير هذا غالبًا إلى انحراف في ساعة النظام. تأكد من مزامنة ساعة النظام:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### النموذج غير متاح في المنطقة

ليست كل النماذج متاحة في كل المناطق. راجع [مصفوفة توافر نماذج Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) واضبط `AWS_REGION` وفقًا لذلك.

### استخدام بيانات اعتماد مؤقتة (STS)

إذا كنت تستخدم AWS STS (أدوار مفترضة، SSO)، اضبط المتغيرات الثلاثة:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

يتم تضمين رمز الجلسة تلقائيًا في توقيع SigV4 كترويسة `x-amz-security-token`.
