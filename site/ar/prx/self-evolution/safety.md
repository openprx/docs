---
title: سلامة التطور
description: حماية rollback وفحوصات sanity وآليات السلامة للتطور الذاتي في PRX.
---

# سلامة التطور

السلامة هي الأولوية القصوى في نظام التطور الذاتي. يتضمن كل تغيير إمكانية rollback، وفحوصات sanity قبل/بعد التنفيذ، واكتشافًا تلقائيًا للتراجع لمنع التعديلات الضارة.

## آليات السلامة

### حماية Rollback

ينشئ كل تغيير تطوري snapshot قبل التطبيق. إذا تم اكتشاف مشكلات، يمكن للنظام الرجوع فورًا إلى الحالة السابقة:

- **Automatic rollback** -- يُفعّل عندما تفشل فحوصات sanity بعد التغيير
- **Manual rollback** -- متاح عبر CLI للتراجع الذي يبدأه الإنسان
- **Time-based rollback** -- تُعكس التغييرات تلقائيًا إذا لم يتم تأكيدها صراحة ضمن نافذة rollback

### فحوصات Sanity

قبل وبعد كل تغيير، يتحقق النظام من:

- استمرار عمل الوظائف الأساسية (smoke tests)
- الحفاظ على invariants الأمان (مثلًا: عدم إضعاف سياسة الأمان)
- بقاء مؤشرات الأداء ضمن حدود مقبولة
- عدم وجود تبعيات دائرية أو قواعد متعارضة

### اكتشاف التراجع

بعد تطبيق التغيير، يراقب النظام المؤشرات الأساسية لفترة قابلة للضبط:

- معدل إكمال المهام
- معدل الأخطاء
- متوسط جودة الاستجابة
- إشارات رضا المستخدم

إذا تدهور أي مؤشر بما يتجاوز حدًا معيّنًا، يتم rollback للتغيير تلقائيًا.

## الإعداد

```toml
[self_evolution.safety]
rollback_enabled = true
rollback_window_hours = 168  # 7 days
sanity_check_timeout_secs = 30
regression_monitoring_hours = 24
max_regression_threshold = 0.1  # 10% degradation triggers rollback
```

## أوامر CLI

```bash
prx evolution status          # View active evolution state
prx evolution rollback        # Rollback the last change
prx evolution history         # View evolution history
prx evolution approve <id>    # Approve a pending proposal
```

## صفحات ذات صلة

- [نظرة عامة على التطور الذاتي](./)
- [خط أنابيب التطور](./pipeline)
- [محرك سياسات الأمان](/ar/prx/security/policy-engine)
