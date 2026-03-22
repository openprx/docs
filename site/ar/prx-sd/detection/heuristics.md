---
title: التحليل الاكتشافي
description: يُجري محرك الاستدلاليات في PRX-SD تحليلاً سلوكياً مدركاً لنوع الملف على ملفات PE وELF وMach-O وOffice وPDF للكشف عن التهديدات غير المعروفة.
---

# التحليل الاكتشافي

التحليل الاكتشافي هو الطبقة الثالثة في خط أنابيب الكشف في PRX-SD. بينما تعتمد مطابقة الهاش وقواعد YARA على التوقيعات والأنماط المعروفة، تحلل الاستدلاليات **الخصائص الهيكلية والسلوكية** للملف للكشف عن التهديدات التي لم تُرَ من قبل قط -- بما فيها البرامج الضارة من يوم الصفر والزرعات المخصصة والعينات المُشوَّشة بشدة.

## كيف يعمل

يحدد PRX-SD أولاً نوع الملف باستخدام كشف الرقم السحري، ثم يطبق مجموعة من الفحوصات الاستدلالية المستهدفة الخاصة بتنسيق ذلك الملف. كل فحصة تُثير نقاطاً لنتيجة تراكمية. تحدد النتيجة النهائية الحكم.

### آلية التسجيل

| نطاق النتيجة | الحكم | المعنى |
|-------------|---------|---------|
| 0 - 29 | **نظيف** | لا توجد مؤشرات مشبوهة مهمة |
| 30 - 59 | **مشبوه** | بعض الحالات الشاذة رُصدت؛ يُوصى بالمراجعة اليدوية |
| 60 - 100 | **خطير** | تهديد عالي الثقة؛ مؤشرات قوية متعددة |

النتائج تراكمية. ملف بحالة شاذة بسيطة (مثل إنتروبيا عالية قليلاً) قد يسجل 15، بينما ملف يجمع الإنتروبيا العالية وواردات API المشبوهة وتوقيعات التغليف سيسجل 75+.

## تحليل PE (الملف القابل للتنفيذ في ويندوز)

استدلاليات PE تستهدف الملفات القابلة للتنفيذ في ويندوز (.exe، .dll، .scr، .sys):

| الفحصة | النقاط | الوصف |
|-------|--------|-------------|
| إنتروبيا القسم العالية | 10-25 | الأقسام بإنتروبيا > 7.0 تشير إلى تغليف أو تشفير |
| واردات API المشبوهة | 5-20 | APIs مثل `VirtualAllocEx` و`WriteProcessMemory` و`CreateRemoteThread` |
| توقيعات التغليف المعروفة | 15-25 | رصد رؤوس UPX وThemida وVMProtect وASPack وPECompact |
| شذوذ الطابع الزمني | 5-10 | طابع زمني للترجمة في المستقبل أو قبل عام 2000 |
| شذوذ اسم القسم | 5-10 | أسماء أقسام غير قياسية (`.rsrc` مُستبدل، سلاسل عشوائية) |
| شذوذ المورد | 5-15 | ملفات PE مُضمَّنة في الموارد، أقسام موارد مشفرة |
| شذوذ جدول الاستيراد | 10-15 | عدد قليل جداً من الواردات (مُغلَّف)، أو تركيبات استيراد مشبوهة |
| التوقيع الرقمي | -10 | توقيع Authenticode صالح يقلل النتيجة |
| TLS callbacks | 10 | إدخالات TLS callback للتحايل على التصحيح |
| بيانات الطبقة العلوية | 5-10 | بيانات مهمة مُلحَقة بعد هيكل PE |

### مثال على نتائج PE

```
Heuristic Analysis: updater.exe
Score: 72/100 [MALICIOUS]

Findings:
  [+25] Section '.text' entropy: 7.91 (likely packed or encrypted)
  [+15] Packer detected: UPX 3.96
  [+12] Suspicious API imports: VirtualAllocEx, WriteProcessMemory,
        CreateRemoteThread, NtUnmapViewOfSection
  [+10] Section name anomaly: '.UPX0', '.UPX1' (non-standard)
  [+10] Compilation timestamp: 2089-01-01 (future date)
```

## تحليل ELF (الملف القابل للتنفيذ في لينكس)

استدلاليات ELF تستهدف الثنائيات وكائنات الملفات المشتركة في لينكس:

| الفحصة | النقاط | الوصف |
|-------|--------|-------------|
| إنتروبيا القسم العالية | 10-25 | الأقسام بإنتروبيا > 7.0 |
| مراجع LD_PRELOAD | 15-20 | سلاسل تشير إلى `LD_PRELOAD` أو `/etc/ld.so.preload` |
| استمرارية cron | 10-15 | مراجع إلى `/etc/crontab` و`/var/spool/cron` وأدلة cron |
| استمرارية systemd | 10-15 | مراجع إلى مسارات وحدة systemd و`systemctl enable` |
| مؤشرات الباب الخلفي SSH | 15-20 | مسارات `authorized_keys` المعدلة، سلاسل إعداد `sshd` |
| التحايل على التصحيح | 10-15 | `ptrace(PTRACE_TRACEME)` وفحوصات `/proc/self/status` |
| العمليات الشبكية | 5-10 | إنشاء مقبس خام، ربط منفذ مشبوه |
| حذف الذات | 10 | `unlink` لمسار الملف الثنائي الخاص بعد التنفيذ |
| مجرد + إنتروبيا عالية | 10 | ثنائي مجرد بإنتروبيا عالية يشير إلى برنامج ضار مُغلَّف |
| إعادة توجيه `/dev/null` | 5 | إعادة توجيه المخرجات إلى `/dev/null` (سلوك وحيد خدمة) |

### مثال على نتائج ELF

```
Heuristic Analysis: .cache/systemd-helper
Score: 65/100 [MALICIOUS]

Findings:
  [+20] LD_PRELOAD reference: /etc/ld.so.preload manipulation
  [+15] Cron persistence: writes to /var/spool/cron/root
  [+15] SSH backdoor: modifies /root/.ssh/authorized_keys
  [+10] Self-deletion: unlinks /tmp/.cache/systemd-helper
  [+5]  Network: creates raw socket
```

## تحليل Mach-O (الملف القابل للتنفيذ في ماك أو إس)

استدلاليات Mach-O تستهدف الثنائيات الموحدة وملفات bundle وثنائيات ماك أو إس:

| الفحصة | النقاط | الوصف |
|-------|--------|-------------|
| إنتروبيا القسم العالية | 10-25 | الأقسام بإنتروبيا > 7.0 |
| حقن dylib | 15-20 | مراجع `DYLD_INSERT_LIBRARIES`، تحميل dylib مشبوه |
| استمرارية LaunchAgent/Daemon | 10-15 | مراجع إلى `~/Library/LaunchAgents` و`/Library/LaunchDaemons` |
| الوصول إلى Keychain | 10-15 | استدعاءات Keychain API، استخدام أمر `security` |
| تجاوز Gatekeeper | 10-15 | سلاسل `xattr -d com.apple.quarantine` |
| تجاوز الخصوصية TCC | 10-15 | مراجع إلى قاعدة بيانات TCC، إساءة استخدام API إمكانية الوصول |
| مكافحة التحليل | 10 | فحوصات `sysctl` للمصحِّحات، سلاسل كشف الجهاز الافتراضي |
| شذوذ توقيع الكود | 5-10 | ثنائي موقَّع بشكل مخصص أو غير موقَّع |

### مثال على نتائج Mach-O

```
Heuristic Analysis: com.apple.helper
Score: 55/100 [SUSPICIOUS]

Findings:
  [+20] Dylib injection: DYLD_INSERT_LIBRARIES manipulation
  [+15] LaunchAgent persistence: writes to ~/Library/LaunchAgents/
  [+10] Keychain access: SecKeychainFindGenericPassword calls
  [+10] Unsigned binary: no code signature present
```

## تحليل مستندات Office

استدلاليات Office تستهدف تنسيقات Microsoft Office (.doc، .docx، .xls، .xlsx، .ppt):

| الفحصة | النقاط | الوصف |
|-------|--------|-------------|
| وجود ماكرو VBA | 10-15 | ماكرو يُنفَّذ تلقائياً (`AutoOpen`، `Document_Open`، `Workbook_Open`) |
| ماكرو مع تنفيذ shell | 20-30 | `Shell()` و`WScript.Shell` واستدعاء `PowerShell` في الماكرو |
| حقول DDE | 15-20 | حقول Dynamic Data Exchange التي تُنفِّذ الأوامر |
| رابط قالب خارجي | 10-15 | حقن قالب بعيد عبر `attachedTemplate` |
| VBA مُشوَّش | 10-20 | كود ماكرو مُشوَّش بشدة (Chr()، إساءة استخدام تسلسل السلاسل) |
| كائنات OLE مُضمَّنة | 5-10 | ملفات قابلة للتنفيذ أو نصوص برمجية مُضمَّنة ككائنات OLE |
| بيانات وصفية مشبوهة | 5 | حقول المؤلف بسلاسل base64 أو أنماط غير عادية |

### مثال على نتائج Office

```
Heuristic Analysis: Q3_Report.xlsm
Score: 60/100 [MALICIOUS]

Findings:
  [+15] VBA macro with AutoOpen trigger
  [+25] Macro executes: Shell("powershell -enc JABjAGwA...")
  [+10] Obfuscated VBA: 47 Chr() calls, string concatenation abuse
  [+10] External template: https://evil.example.com/template.dotm
```

## تحليل PDF

استدلاليات PDF تستهدف مستندات PDF:

| الفحصة | النقاط | الوصف |
|-------|--------|-------------|
| JavaScript مُضمَّن | 15-25 | JavaScript في إجراءات `/JS` أو `/JavaScript` |
| إجراء Launch | 20-25 | إجراء `/Launch` يُنفِّذ أوامر النظام |
| إجراء URI | 5-10 | إجراءات URI مشبوهة تشير إلى أنماط سيئة معروفة |
| تدفقات مُشوَّشة | 10-15 | طبقات ترميز متعددة (FlateDecode + ASCII85 + hex) |
| ملفات مُضمَّنة | 5-10 | ملفات قابلة للتنفيذ مُضمَّنة كمرفقات |
| إرسال نموذج | 5-10 | نماذج ترسل البيانات إلى URLs خارجية |
| AcroForm مع JavaScript | 15 | نماذج تفاعلية بـ JavaScript مُضمَّن |

### مثال على نتائج PDF

```
Heuristic Analysis: shipping_label.pdf
Score: 45/100 [SUSPICIOUS]

Findings:
  [+20] Embedded JavaScript: 3 /JS actions found
  [+15] Obfuscated stream: triple-encoded FlateDecode chain
  [+10] Embedded file: invoice.exe (PE executable)
```

## مرجع النتائج الشائعة

الجدول التالي يُدرج أكثر النتائج الاستدلالية شيوعاً عبر جميع أنواع الملفات:

| النتيجة | الخطورة | أنواع الملفات | معدل الإيجابية الكاذبة |
|---------|----------|------------|---------------------|
| قسم بإنتروبيا عالية | متوسطة | PE وELF وMach-O | منخفض-متوسط (أصول الألعاب والبيانات المضغوطة) |
| كشف التغليف | عالية | PE | منخفض جداً |
| ماكرو يُنفَّذ تلقائياً | عالية | Office | منخفض (بعض الماكرو المشروع) |
| التلاعب بـ LD_PRELOAD | عالية | ELF | منخفض جداً |
| JavaScript مُضمَّن | متوسطة-عالية | PDF | منخفض |
| واردات API مشبوهة | متوسطة | PE | متوسطة (أدوات الأمان تُثير هذا) |
| حذف الذات | عالية | ELF | منخفض جداً |

::: tip تقليل الإيجابيات الكاذبة
إذا أثار ملف مشروع تنبيهات استدلالية، يمكنك إضافته إلى قائمة السماح بهاش SHA-256:
```bash
sd allowlist add /path/to/legitimate/file
```
الملفات في قائمة السماح تتخطى التحليل الاكتشافي لكنها لا تزال تُفحص مقابل قواعد بيانات الهاش وYARA.
:::

## الخطوات التالية

- [أنواع الملفات المدعومة](./file-types) -- مصفوفة نوع الملفات الكاملة وتفاصيل كشف الرقم السحري
- [قواعد YARA](./yara-rules) -- الكشف المستند إلى الأنماط الذي يكمل الاستدلاليات
- [مطابقة الهاش](./hash-matching) -- أسرع طبقة كشف
- [نظرة عامة على محرك الكشف](./index) -- كيف تعمل جميع الطبقات معاً
