---
title: التجارب وتقييم Fitness
description: تتبع تجارب A/B وتقييم fitness لقياس تحسينات التطور الذاتي في PRX.
---

# التجارب وتقييم Fitness

يستخدم نظام التطور الذاتي في PRX تجارب مضبوطة وتقييم fitness لقياس ما إذا كانت التغييرات المقترحة تحسّن أداء الوكيل فعليًا. كل مقترح تطور فوق L1 يُختبر عبر تجربة A/B قبل الاعتماد الدائم.

## نظرة عامة

يوفّر نظام التجارب:

- **A/B testing** -- تشغيل نسختي control وtreatment جنبًا إلى جنب
- **Fitness scoring** -- قياس أداء الوكيل عبر درجة مركبة
- **Statistical validation** -- ضمان أن التحسينات ذات دلالة وليست ضوضاء عشوائية
- **Automatic convergence** -- ترقية الفائز وإحالة الخاسر للتقاعد عندما تكون النتائج حاسمة

## دورة حياة التجربة

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  Create  │───►│  Run     │───►│ Evaluate │───►│ Converge  │
│          │    │          │    │          │    │           │
│ Define   │    │ Split    │    │ Compare  │    │ Promote   │
│ variants │    │ traffic  │    │ fitness  │    │ or reject │
└──────────┘    └──────────┘    └──────────┘    └───────────┘
```

### 1. Create

تُنشأ التجربة عندما يولد خط أنابيب التطور مقترحًا:

- نسخة **control** تمثل الإعداد الحالي
- نسخة **treatment** تمثل التغيير المقترح
- معلمات التجربة: المدة، حجم العينة، تقسيم الحركة

### 2. Run

أثناء التجربة، تُسند الجلسات إلى النسخ:

- تُسند الجلسات عشوائيًا حسب نسبة تقسيم الحركة
- كل جلسة تعمل بالكامل تحت نسخة واحدة (دون تبديل أثناء الجلسة)
- تُراقَب النسختان وفق مجموعة مؤشرات fitness نفسها

### 3. Evaluate

بعد الوصول إلى الحد الأدنى للمدة أو حجم العينة:

- تُحسب درجات fitness لكلا النسختين
- يُختبر مستوى الدلالة الإحصائية (الافتراضي: ثقة 95%)
- يُحسب حجم الأثر لقياس الدلالة العملية

### 4. Converge

بناءً على نتائج التقييم:

- **Treatment wins** -- يُرقّى التغيير المقترح إلى الإعداد الافتراضي
- **Control wins** -- يُرفض التغيير المقترح وتبقى نسخة control
- **Inconclusive** -- تُمدد التجربة أو يُؤجل التغيير

## الإعداد

```toml
[self_evolution.experiments]
enabled = true
default_duration_hours = 168       # 1 week default
min_sample_size = 100              # minimum sessions per variant
traffic_split = 0.5                # 50/50 split between control and treatment
confidence_level = 0.95            # 95% statistical confidence required
min_effect_size = 0.02             # minimum 2% improvement to accept

[self_evolution.experiments.auto_converge]
enabled = true
check_interval_hours = 24          # evaluate results every 24 hours
max_duration_hours = 720           # force convergence after 30 days
```

## مرجع الإعداد

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|-----------|-------|
| `enabled` | `bool` | `true` | تفعيل أو تعطيل نظام التجارب |
| `default_duration_hours` | `u64` | `168` | مدة التجربة الافتراضية بالساعات (أسبوع واحد) |
| `min_sample_size` | `usize` | `100` | الحد الأدنى للجلسات لكل نسخة قبل التقييم |
| `traffic_split` | `f64` | `0.5` | نسبة الجلسات المسندة إلى نسخة treatment (من 0.0 إلى 1.0) |
| `confidence_level` | `f64` | `0.95` | مستوى الثقة الإحصائية المطلوب |
| `min_effect_size` | `f64` | `0.02` | الحد الأدنى لتحسن fitness (كنسبة) لقبول treatment |
| `auto_converge.enabled` | `bool` | `true` | الترقية/الرفض تلقائيًا عندما تكون النتائج حاسمة |
| `auto_converge.check_interval_hours` | `u64` | `24` | عدد مرات التحقق من النتائج |
| `auto_converge.max_duration_hours` | `u64` | `720` | فرض convergence بعد هذه المدة (30 يومًا افتراضيًا) |

## بنية سجل التجربة

تُتبع كل تجربة كسجل منظَّم:

| الحقل | النوع | الوصف |
|-------|------|-------|
| `experiment_id` | `String` | معرف فريد (UUIDv7) |
| `decision_id` | `String` | رابط إلى القرار الأصلي |
| `layer` | `Layer` | طبقة التطور: `L1` أو `L2` أو `L3` |
| `status` | `Status` | `running` أو `evaluating` أو `converged` أو `cancelled` |
| `created_at` | `DateTime<Utc>` | وقت إنشاء التجربة |
| `converged_at` | `Option<DateTime<Utc>>` | وقت انتهاء التجربة |
| `control` | `Variant` | وصف نسخة control |
| `treatment` | `Variant` | وصف نسخة treatment |
| `control_sessions` | `usize` | عدد الجلسات المسندة إلى control |
| `treatment_sessions` | `usize` | عدد الجلسات المسندة إلى treatment |
| `control_fitness` | `FitnessScore` | fitness المجمّع لنسخة control |
| `treatment_fitness` | `FitnessScore` | fitness المجمّع لنسخة treatment |
| `p_value` | `Option<f64>` | الدلالة الإحصائية (كلما انخفضت كانت الدلالة أعلى) |
| `winner` | `Option<String>` | `"control"` أو `"treatment"` أو `null` إذا كانت النتيجة غير حاسمة |

## تقييم Fitness

يقيس Fitness أداء الوكيل عبر عدة أبعاد. تُستخدم درجة fitness المركبة للمقارنة بين نسخ التجارب وتتبع تقدم التطور عبر الزمن.

### أبعاد Fitness

| البعد | الوزن | الوصف | طريقة القياس |
|------|-------|-------|--------------|
| `response_relevance` | 0.30 | مدى ارتباط استجابات الوكيل باستفسارات المستخدم | LLM-as-judge scoring |
| `task_completion` | 0.25 | نسبة المهام المكتملة بنجاح | Tool call success rate |
| `response_latency` | 0.15 | الزمن من رسالة المستخدم إلى أول رمز استجابة | Percentile-based (p50, p95) |
| `token_efficiency` | 0.10 | الرموز المستهلكة لكل مهمة ناجحة | الأقل أفضل |
| `memory_precision` | 0.10 | صلة الذكريات المسترجعة | Recall relevance scoring |
| `user_satisfaction` | 0.10 | إشارات رضا المستخدم الصريحة | Thumbs up/down, corrections |

### الدرجة المركبة

درجة fitness المركبة هي مجموع موزون:

```
fitness = sum(dimension_score * dimension_weight)
```

يتم تطبيع كل بعد إلى نطاق 0.0--1.0 قبل الوزن. كما تكون الدرجة المركبة أيضًا ضمن 0.0--1.0، وكلما ارتفعت كانت أفضل.

### إعداد Fitness

```toml
[self_evolution.fitness]
evaluation_window_hours = 24       # aggregate metrics over this window
min_sessions_for_score = 10        # require at least 10 sessions for a valid score

[self_evolution.fitness.weights]
response_relevance = 0.30
task_completion = 0.25
response_latency = 0.15
token_efficiency = 0.10
memory_precision = 0.10
user_satisfaction = 0.10

[self_evolution.fitness.thresholds]
minimum_acceptable = 0.50          # fitness below this triggers an alert
regression_delta = 0.05            # fitness drop > 5% triggers rollback
```

### مرجع إعداد Fitness

| الحقل | النوع | الافتراضي | الوصف |
|-------|------|-----------|-------|
| `evaluation_window_hours` | `u64` | `24` | نافذة الزمن لتجميع مؤشرات fitness |
| `min_sessions_for_score` | `usize` | `10` | الحد الأدنى للجلسات اللازمة لحساب درجة صالحة |
| `weights.*` | `f64` | *(انظر الجدول أعلاه)* | وزن كل بُعد من أبعاد fitness (يجب أن يساوي المجموع 1.0) |
| `thresholds.minimum_acceptable` | `f64` | `0.50` | حد التنبيه لانخفاض fitness |
| `thresholds.regression_delta` | `f64` | `0.05` | أقصى هبوط fitness قبل rollback تلقائي |

## أوامر CLI

```bash
# List active experiments
prx evolution experiments --status running

# View a specific experiment
prx evolution experiments --id <experiment_id>

# View experiment results with fitness breakdown
prx evolution experiments --id <experiment_id> --details

# Cancel a running experiment (reverts to control)
prx evolution experiments cancel <experiment_id>

# View current fitness score
prx evolution fitness

# View fitness history over time
prx evolution fitness --history --last 30d

# View fitness breakdown by dimension
prx evolution fitness --breakdown
```

### مثال مخرجات Fitness

```
Current Fitness Score: 0.74

Dimension            Score   Weight  Contribution
response_relevance   0.82    0.30    0.246
task_completion      0.78    0.25    0.195
response_latency     0.69    0.15    0.104
token_efficiency     0.65    0.10    0.065
memory_precision     0.71    0.10    0.071
user_satisfaction    0.60    0.10    0.060

Trend (last 7 days): +0.03 (improving)
```

## أمثلة التجارب

### L2 Prompt Optimization

تجربة L2 نموذجية تختبر تغييرًا في مطالبة النظام:

- **Control**: مطالبة النظام الحالية (320 token)
- **Treatment**: مطالبة نظام محسنة (272 token، أقصر بنسبة 15%)
- **Hypothesis**: تقصير المطالبة يحرر نافذة السياق، مما يحسن صلة الاستجابة
- **Duration**: 7 أيام، 100 جلسة لكل نسخة
- **Result**: fitness للـ treatment يساوي 0.75 مقابل 0.72 للـ control (p = 0.03)، تمت ترقية treatment

### L3 Strategy Change

تجربة L3 تختبر تغييرًا في سياسة التوجيه:

- **Control**: توجيه جميع مهام البرمجة إلى Claude Opus
- **Treatment**: توجيه مهام البرمجة البسيطة إلى Claude Sonnet والمعقدة إلى Opus
- **Hypothesis**: توجيه أكثر كفاءة من حيث التكلفة بدون فقد الجودة
- **Duration**: 14 يومًا، 200 جلسة لكل نسخة
- **Result**: fitness للـ treatment يساوي 0.73 مقابل 0.74 للـ control (p = 0.42)، النتيجة غير حاسمة -- تم تمديد التجربة

## الأساليب الإحصائية

يستخدم نظام التجارب الأساليب الإحصائية التالية:

- **Two-sample t-test** لمقارنة متوسط درجات fitness بين النسخ
- **Mann-Whitney U test** كبديل لا معلمي عندما تكون توزيعات fitness منحرفة
- **Bonferroni correction** عند مقارنة عدة أبعاد fitness في الوقت نفسه
- **Sequential analysis** مع alpha-spending للسماح بالإيقاف المبكر عندما تكون النتائج ذات دلالة واضحة

## القيود

- تتطلب التجارب حجم جلسات كافيًا؛ النشرات منخفضة الحركة قد تحتاج أسابيع للوصول إلى دلالة
- إشارات رضا المستخدم تعتمد على تغذية راجعة صريحة، وقد تكون قليلة
- استخدام LLM-as-judge لتقييم صلة الاستجابة يضيف زمنًا وتكلفة إلى خط أنابيب التقييم
- يمكن تشغيل تجربة واحدة فقط لكل طبقة تطور في الوقت نفسه لتجنب التشويش
- درجات fitness نسبية للنشرة المحددة؛ ولا يمكن مقارنتها بين مثيلات PRX المختلفة

## صفحات ذات صلة

- [نظرة عامة على التطور الذاتي](./)
- [سجل القرارات](./decision-log) -- القرارات التي تُطلق التجارب
- [خط أنابيب التطور](./pipeline) -- خط الأنابيب الذي يولد المقترحات
- [السلامة وRollback](./safety) -- rollback تلقائي عند التراجع
