---
title: prx channel
description: إدارة اتصالات قنوات المراسلة -- عرض، إضافة، إزالة، تشغيل، وتشخيص القنوات.
---

# prx channel

إدارة قنوات المراسلة التي يتصل بها PRX. القنوات هي الجسور بين منصات المراسلة (Telegram، Discord، Slack، إلخ.) وبيئة تشغيل وكيل PRX.

## الاستخدام

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## الأوامر الفرعية

### `prx channel list`

عرض جميع القنوات المضبوطة وحالتها الحالية.

```bash
prx channel list [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--json` | `-j` | `false` | المخرج بتنسيق JSON |
| `--verbose` | `-v` | `false` | عرض معلومات الاتصال التفصيلية |

**مثال على المخرج:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

إضافة إعدادات قناة جديدة تفاعليًا أو من الرايات.

```bash
prx channel add [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--type` | `-t` | | نوع القناة (مثل `telegram`، `discord`، `slack`) |
| `--name` | `-n` | يُنشأ تلقائيًا | اسم العرض للقناة |
| `--token` | | | رمز البوت أو مفتاح API |
| `--enabled` | | `true` | تفعيل القناة فورًا |
| `--interactive` | `-i` | `true` | استخدام المعالج التفاعلي |

```bash
# الوضع التفاعلي (إرشادات موجّهة)
prx channel add

# غير تفاعلي مع الرايات
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

إزالة إعدادات قناة.

```bash
prx channel remove <NAME> [OPTIONS]
```

| الراية | اختصار | القيمة الافتراضية | الوصف |
|--------|--------|-------------------|-------|
| `--force` | `-f` | `false` | تجاوز طلب التأكيد |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

تشغيل (أو إعادة تشغيل) قناة محددة دون إعادة تشغيل الخادم.

```bash
prx channel start <NAME>
```

```bash
# إعادة تشغيل قناة بها خطأ
prx channel start slack-team
```

يرسل هذا الأمر رسالة تحكم إلى الخادم العامل. يجب أن يكون الخادم قيد التشغيل لكي يعمل هذا الأمر.

### `prx channel doctor`

تشغيل تشخيصات على اتصالات القنوات. يفحص صحة الرمز واتصال الشبكة وعناوين URL الخاصة بالـ webhook والصلاحيات.

```bash
prx channel doctor [NAME]
```

إذا لم يُحدد `NAME`، يتم فحص جميع القنوات.

```bash
# فحص جميع القنوات
prx channel doctor

# فحص قناة محددة
prx channel doctor telegram-main
```

**مثال على المخرج:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## أمثلة

```bash
# سير العمل الكامل: إضافة، تحقق، تشغيل
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# عرض القنوات بتنسيق JSON للبرمجة
prx channel list --json | jq '.[] | select(.status == "error")'
```

## ذو صلة

- [نظرة عامة على القنوات](/ar/prx/channels/) -- توثيق القنوات التفصيلي
- [prx daemon](./daemon) -- الخادم الذي يشغّل اتصالات القنوات
- [prx doctor](./doctor) -- تشخيصات النظام الكاملة بما في ذلك القنوات
