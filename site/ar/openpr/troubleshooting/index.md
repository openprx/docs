---
title: استكشاف الأخطاء وإصلاحها
description: "حلول للمشكلات الشائعة في OpenPR بما فيها اتصالات قاعدة البيانات وأخطاء المصادقة ومشكلات Docker وإعداد خادم MCP."
---

# استكشاف الأخطاء وإصلاحها

تغطي هذه الصفحة المشكلات الشائعة وحلولها عند تشغيل OpenPR.

## اتصال قاعدة البيانات

### فشل API في البدء بـ "connection refused"

يبدأ خادم API قبل أن يكون PostgreSQL جاهزاً.

**الحل**: يتضمن ملف Docker Compose فحوصات صحة و`depends_on` مع `condition: service_healthy`. إذا استمرت المشكلة، زِد `start_period` لـ PostgreSQL:

```yaml
postgres:
  healthcheck:
    start_period: 30s  # Increase from default 10s
```

### "role openpr does not exist"

لم يُنشأ مستخدم PostgreSQL.

**الحل**: تحقق من ضبط `POSTGRES_USER` و`POSTGRES_PASSWORD` في بيئة Docker Compose. إذا كنت تشغل PostgreSQL يدوياً:

```bash
createuser -U postgres openpr
createdb -U postgres -O openpr openpr
```

### لم تُطبَّق الترحيلات

تعمل الترحيلات تلقائياً فقط عند أول تشغيل لحاوية PostgreSQL (عبر `docker-entrypoint-initdb.d`).

**الحل**: إذا كانت قاعدة البيانات موجودة بالفعل، طبِّق الترحيلات يدوياً:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr
# Then run each migration SQL file in order
```

أو أعِد إنشاء المجلد:

```bash
docker-compose down -v
docker-compose up -d
```

::: warning فقدان البيانات
`docker-compose down -v` يحذف مجلد قاعدة البيانات. احتفظ بنسخة احتياطية من بياناتك أولاً.
:::

## المصادقة

### "رمز غير صالح" بعد إعادة تشغيل الخادم

رموز JWT مُوقَّعة بـ `JWT_SECRET`. إذا تغيرت هذه القيمة بين إعادات التشغيل، تصبح جميع الرموز الموجودة غير صالحة.

**الحل**: اضبط `JWT_SECRET` ثابتاً في `.env`:

```bash
JWT_SECRET=your-fixed-random-secret-here
```

### أول مستخدم ليس مسؤولاً

دور المسؤول يُكلَّف لأول مستخدم يسجل. إذا رأيت `role: "user"` بدلاً من `role: "admin"`، سُجِّل حساب آخر أولاً.

**الحل**: استخدم قاعدة البيانات لتحديث الدور:

```bash
docker exec -it openpr-postgres psql -U openpr -d openpr \
  -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

## Docker / Podman

### فشل بناء Podman بخطأ DNS

الشبكة الافتراضية لـ Podman لا تملك وصولاً إلى DNS أثناء البناء.

**الحل**: استخدم دائماً `--network=host` عند بناء الصور مع Podman:

```bash
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
```

### الواجهة الأمامية تُظهر "502 Bad Gateway"

حاوية Nginx لا تستطيع الوصول إلى خادم API.

**الحل**: تحقق من أن:
1. حاوية API تعمل: `docker-compose ps`
2. فحص صحة API يجتاز: `docker exec openpr-api curl -f http://localhost:8080/health`
3. كلا الحاويتين على نفس الشبكة: `docker network inspect openpr_openpr-network`

### تعارضات المنافذ

خدمة أخرى تستخدم نفس المنفذ.

**الحل**: غيِّر تعيين المنفذ الخارجي في `docker-compose.yml`:

```yaml
api:
  ports:
    - "8082:8080"  # Changed from 8081
```

## خادم MCP

### "tools/list تُعيد فارغاً"

خادم MCP لا يستطيع الاتصال بـ API.

**الحل**: تحقق من متغيرات البيئة:

```bash
docker exec openpr-mcp-server env | grep OPENPR
```

تحقق من أن:
- `OPENPR_API_URL` يشير إلى نقطة نهاية API الصحيحة
- `OPENPR_BOT_TOKEN` رمز بوت صالح (يبدأ بـ `opr_`)
- `OPENPR_WORKSPACE_ID` UUID مساحة عمل صالح

### نقل stdio لا يعمل

يحتاج ثنائي MCP إلى إعداده كأمر في عميل الذكاء الاصطناعي.

**الحل**: تأكد من صحة مسار الثنائي وضبط متغيرات البيئة:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/absolute/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_...",
        "OPENPR_WORKSPACE_ID": "..."
      }
    }
  }
}
```

### انقطاع اتصال SSE

قد تُغلق خوادم الوكيل اتصالات SSE بمهل قصيرة.

**الحل**: إذا كنت تستخدم وكيلاً عكسياً، زِد المهلة لنقطة نهاية SSE:

```
# Caddy
reverse_proxy /sse localhost:8090 {
    flush_interval -1
}
```

## الواجهة الأمامية

### صفحة فارغة بعد النشر

قد يستخدم بناء الواجهة الأمامية رابط API الخاطئ.

**الحل**: اضبط `VITE_API_URL` قبل البناء:

```bash
VITE_API_URL=https://your-domain.example.com/api npm run build
```

### تسجيل الدخول يعمل لكن الصفحات فارغة

طلبات API تفشل بصمت. تحقق من وحدة تحكم المتصفح (F12) لأخطاء 401 أو CORS.

**الحل**: تأكد من إمكانية وصول API من المتصفح وإعداد CORS. يجب أن توجِّه الواجهة الأمامية طلبات API عبر Nginx.

## الأداء

### عمليات بحث بطيئة

يمكن أن يكون البحث النصي الكامل لـ PostgreSQL بطيئاً على مجموعات البيانات الكبيرة دون فهارس مناسبة.

**الحل**: تأكد من وجود فهارس FTS (تُنشأ بالترحيلات):

```sql
-- Check for existing indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'work_items';
```

### استهلاك ذاكرة عالٍ

يعالج خادم API رفع الملفات في الذاكرة.

**الحل**: حدِّد أحجام الرفع وراقب دليل `uploads/`. فكِّر في إعداد تنظيف دوري للرفع القديم.

## الحصول على المساعدة

إذا لم تُغطَّ مشكلتك هنا:

1. تحقق من [مشكلات GitHub](https://github.com/openprx/openpr/issues) للمشكلات المعروفة.
2. راجع سجلات API وخادم MCP لرسائل الخطأ.
3. افتح مشكلة جديدة مع سجلات الخطأ وتفاصيل البيئة وخطوات إعادة الإنتاج.
