---
title: العُقد البعيدة
description: إدارة والتواصل مع عُقد PRX البعيدة لتنفيذ الوكلاء بشكل موزّع عبر أجهزة متعددة.
---

# العُقد البعيدة

تُمكّن أداة `nodes` وكلاء PRX من التفاعل مع مثيلات PRX بعيدة ضمن نشر موزّع. العقدة هي خدمة PRX منفصلة تعمل على جهاز آخر، وقد تمتلك قدرات عتادية مختلفة أو وصولًا شبكيًا مختلفًا أو إعدادات أدوات مختلفة، وتم إقرانها مع مثيل المتحكم.

من خلال أداة `nodes` يستطيع الوكيل اكتشاف العقد المتاحة، فحص حالتها الصحية، توجيه المهام إلى عقد متخصصة (مثل عقد GPU)، ثم استرجاع النتائج. هذا يتيح توزيع الأحمال، وتخصيص البيئات، والتوزيع الجغرافي للمهام.

تُسجَّل أداة `nodes` ضمن سجل `all_tools()` وتكون متاحة دائمًا. لكن الوظائف الفعلية تعتمد على إعدادات العقد وما إذا تم إقران الأقران البعيدين.

## الإعداد

### وضع المتحكم

المتحكم هو مثيل PRX الأساسي الذي ينسق العمل عبر العقد:

```toml
[node]
mode = "controller"
node_id = "primary"
advertise_address = "192.168.1.100:3121"

[node.discovery]
method = "static"          # "static" | "mdns"
peers = [
  "192.168.1.101:3121",   # GPU host
  "192.168.1.102:3121",   # Staging environment
]
```

### وضع العقدة

العقدة هي مثيل PRX يقبل أعمالًا مُفوّضة من المتحكم:

```toml
[node]
mode = "node"
node_id = "gpu-host-01"
advertise_address = "192.168.1.101:3121"
controller = "192.168.1.100:3121"
```

### طرق الاكتشاف

| الطريقة | الوصف | حالة الاستخدام |
|--------|------------|----------|
| `static` | قائمة صريحة لعناوين الأقران في الإعداد | بنية تحتية معروفة وثابتة |
| `mdns` | اكتشاف تلقائي عبر multicast DNS على الشبكة المحلية | بيئات ديناميكية والتطوير |

```toml
# mDNS discovery
[node.discovery]
method = "mdns"
service_name = "_prx._tcp.local."
```

## الاستخدام

### عرض العقد المتاحة

اكتشف جميع العقد البعيدة المقترنة واعرض حالتها:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "list"
  }
}
```

**مثال على الاستجابة:**

```
Nodes:
  1. gpu-host-01 (192.168.1.101:3121) - ONLINE
     Capabilities: gpu, cuda, python
     Load: 23%

  2. staging-01 (192.168.1.102:3121) - ONLINE
     Capabilities: docker, network-access
     Load: 5%
```

### فحص صحة العقدة

استعلم عن صحة عقدة معينة وقدراتها:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "health",
    "node_id": "gpu-host-01"
  }
}
```

### إرسال مهمة إلى عقدة

وجّه مهمة إلى عقدة بعيدة محددة للتنفيذ:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "send",
    "node_id": "gpu-host-01",
    "task": "Run the ML inference pipeline on the uploaded dataset."
  }
}
```

### استرجاع نتائج العقدة

احصل على نتائج مهمة أُرسلت مسبقًا:

```json
{
  "name": "nodes",
  "arguments": {
    "action": "result",
    "task_id": "task_xyz789"
  }
}
```

## المعاملات

| المعامل | النوع | مطلوب | الافتراضي | الوصف |
|-----------|------|----------|---------|-------------|
| `action` | `string` | نعم | -- | إجراء العقدة: `"list"` أو `"health"` أو `"send"` أو `"result"` أو `"capabilities"` |
| `node_id` | `string` | مشروط | -- | معرّف العقدة الهدف (مطلوب لـ `"health"` و`"send"`) |
| `task` | `string` | مشروط | -- | وصف المهمة (مطلوب لـ `"send"`) |
| `task_id` | `string` | مشروط | -- | معرّف المهمة (مطلوب لـ `"result"`) |

**القيمة المرجعة:**

| الحقل | النوع | الوصف |
|-------|------|-------------|
| `success` | `bool` | `true` إذا اكتملت العملية |
| `output` | `string` | نتيجة العملية (قائمة العقد، حالة الصحة، نتيجة المهمة، إلخ) |
| `error` | `string?` | رسالة خطأ إذا فشلت العملية (تعذر الوصول للعقدة، مهمة غير موجودة، إلخ) |

## المعمارية

يستخدم نظام العقد في PRX بنية متحكم-عقدة:

```
┌──────────────────┐         ┌──────────────────┐
│   Controller     │         │   Node A         │
│   (primary PRX)  │◄──────► │   (gpu-host-01)  │
│                  │  mTLS   │   GPU, CUDA      │
│   Agent Loop     │         │   Local tools    │
│   ├── nodes tool │         └──────────────────┘
│   └── delegate   │
│                  │         ┌──────────────────┐
│                  │◄──────► │   Node B         │
│                  │  mTLS   │   (staging-01)   │
│                  │         │   Docker, Net    │
└──────────────────┘         └──────────────────┘
```

### بروتوكول الاتصال

تتواصل العقد عبر بروتوكول مخصص فوق TCP مع مصادقة TLS متبادلة (mTLS):

1. **الإقران**: تُقرَن العقدة مع المتحكم عبر مصافحة تحدٍّ/استجابة (راجع [إقران العقد](/ar/prx/nodes/pairing)).
2. **نبضات الحياة**: ترسل العقد المقترنة نبضات دورية للإبلاغ عن الصحة والقدرات.
3. **توجيه المهمة**: يرسل المتحكم المهام إلى العقد مع سياق متسلسل.
4. **إرجاع النتيجة**: تعيد العقد نتائج المهام بإخراج منظّم.

### إعلان القدرات

تعلن كل عقدة عن قدراتها، ويستخدم المتحكم هذه المعلومات للتوجيه الذكي للمهام:

- **العتاد**: `gpu` و`cuda` و`tpu` و`high-memory`.
- **البرمجيات**: `docker` و`python` و`rust` و`nodejs`.
- **الشبكة**: `network-access` و`vpn-connected` و`internal-network`.
- **الأدوات**: قائمة أدوات PRX المتاحة على العقدة.

## أنماط شائعة

### مهام معجّلة بـ GPU

وجّه مهام تعلم الآلة والحوسبة الثقيلة إلى العقد المجهزة بـ GPU:

```
Agent: The user wants to run image classification.
  1. [nodes] action="list" → finds gpu-host-01 with CUDA
  2. [nodes] action="send", node_id="gpu-host-01", task="Run image classification on /data/images/"
  3. [waits for completion]
  4. [nodes] action="result", task_id="task_abc123"
```

### عزل البيئة

استخدم العقد للمهام التي تتطلب بيئات محددة:

```
Agent: Need to test the deployment script in a staging environment.
  1. [nodes] action="send", node_id="staging-01", task="Run deploy.sh and verify all services start"
  2. [nodes] action="result", task_id="task_def456"
```

### توزيع الأحمال

وزّع العمل عبر عدة عقد للتنفيذ المتوازي:

```
Agent: Process 3 datasets simultaneously.
  1. [nodes] action="send", node_id="node-a", task="Process dataset-1.csv"
  2. [nodes] action="send", node_id="node-b", task="Process dataset-2.csv"
  3. [nodes] action="send", node_id="node-c", task="Process dataset-3.csv"
  4. [collect results from all three]
```

## الأمان

### مصادقة TLS المتبادلة

تستخدم جميع اتصالات العقد mTLS. يجب أن يقدّم كل من المتحكم والعقدة شهادات صالحة أثناء مصافحة TLS. يتم تبادل الشهادات أثناء عملية الإقران.

### شرط الإقران

يجب أن تُكمل العقد مصافحة الإقران قبل تبادل المهام. يتم رفض العقد غير المقترنة على مستوى الاتصال. راجع [إقران العقد](/ar/prx/nodes/pairing) لبروتوكول الإقران.

### عزل المهام

تُنفَّذ المهام المرسلة إلى العقد البعيدة ضمن سياسة أمان العقدة نفسها. إعدادات sandbox وقيود الأدوات وحدود الموارد في العقدة تطبّق بشكل مستقل عن إعدادات المتحكم.

### أمان الشبكة

- يجب حماية منافذ اتصال العقد بجدار ناري يسمح فقط بعناوين المتحكم/العقد المعروفة.
- اكتشاف mDNS محصور في مقطع الشبكة المحلية.
- يُنصح بقوائم أقران ثابتة في بيئات الإنتاج.

### محرك السياسات

تخضع أداة `nodes` لسياسة الأمان:

```toml
[security.tool_policy.tools]
nodes = "supervised"       # Require approval before sending tasks to remote nodes
```

## مرتبط

- [العُقد البعيدة](/ar/prx/nodes/) -- معمارية نظام العقد
- [إقران العقد](/ar/prx/nodes/pairing) -- بروتوكول الإقران وتبادل الشهادات
- [بروتوكول الاتصال](/ar/prx/nodes/protocol) -- تفاصيل بروتوكول النقل
- [إقران الأمان](/ar/prx/security/pairing) -- نموذج الأمان لإقران الأجهزة
- [الجلسات والوكلاء](/ar/prx/tools/sessions) -- بديل للتنفيذ المحلي متعدد الوكلاء
- [نظرة عامة على الأدوات](/ar/prx/tools/) -- جميع الأدوات ونظام التسجيل
