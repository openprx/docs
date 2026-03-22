---
title: نشر الإنتاج
description: "نشر OpenPR في الإنتاج مع وكيل عكسي Caddy وHTTPS التلقائي وتصليب PostgreSQL وأفضل ممارسات الأمان."
---

# نشر الإنتاج

يغطي هذا الدليل نشر OpenPR في بيئة إنتاج مع HTTPS ووكيل عكسي وتصليب قاعدة البيانات وأفضل ممارسات الأمان.

## البنية المعمارية

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>Auto HTTPS"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## المتطلبات الأولية

- خادم بـ 2 نواة CPU على الأقل و2 GB ذاكرة
- نطاق يشير إلى عنوان IP خادمك
- Docker وDocker Compose (أو Podman)

## الخطوة الأولى: إعداد البيئة

أنشئ ملف `.env` للإنتاج:

```bash
# Database (use strong passwords)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (generate a random secret)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Logging
RUST_LOG=info
```

::: danger الأسرار
لا تُودِع ملفات `.env` في التحكم بالإصدار. استخدم `chmod 600 .env` لتقييد أذونات الملف.
:::

## الخطوة الثانية: إعداد Caddy

ثبِّت Caddy على النظام المضيف:

```bash
sudo apt install -y caddy
```

هيِّئ Caddyfile:

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

يحصل Caddy تلقائياً على شهادات Let's Encrypt TLS ويجددها.

ابدأ Caddy:

```bash
sudo systemctl enable --now caddy
```

::: tip بديل: Nginx
إذا كنت تفضل Nginx، هيِّئه مع توجيه الوكيل إلى المنفذ 3000 واستخدم certbot لشهادات TLS.
:::

## الخطوة الثالثة: النشر بـ Docker Compose

```bash
cd /opt/openpr
docker-compose up -d
```

تحقق من سلامة جميع الخدمات:

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## الخطوة الرابعة: إنشاء حساب المسؤول

افتح `https://your-domain.example.com` في متصفحك وسجِّل حساب المسؤول.

::: warning أول مستخدم
أول مستخدم يسجل يصبح مسؤولاً. سجِّل حساب المسؤول قبل مشاركة URL.
:::

## قائمة فحص الأمان

### المصادقة

- [ ] تغيير `JWT_SECRET` إلى قيمة عشوائية 32+ حرفاً
- [ ] ضبط قيم TTL مناسبة للرمز (أقصر للوصول، أطول للتحديث)
- [ ] إنشاء حساب المسؤول فور النشر

### قاعدة البيانات

- [ ] استخدام كلمة مرور قوية لـ PostgreSQL
- [ ] عدم كشف منفذ PostgreSQL (5432) للإنترنت
- [ ] تفعيل SSL في PostgreSQL للاتصالات (إذا كانت قاعدة البيانات بعيدة)
- [ ] إعداد نسخ احتياطية منتظمة لقاعدة البيانات

### الشبكة

- [ ] استخدام Caddy أو Nginx مع HTTPS (TLS 1.3)
- [ ] كشف المنافذ 443 (HTTPS) و8090 اختياريًا (MCP) للإنترنت فقط
- [ ] استخدام جدار حماية (ufw، iptables) لتقييد الوصول
- [ ] النظر في تقييد وصول خادم MCP لنطاقات IP معروفة

### التطبيق

- [ ] ضبط `RUST_LOG=info` (وليس debug أو trace في الإنتاج)
- [ ] مراقبة استخدام القرص لدليل الرفع
- [ ] إعداد تدوير السجلات لسجلات الحاوية

## نسخ احتياطي لقاعدة البيانات

إعداد نسخ احتياطية تلقائية لـ PostgreSQL:

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Keep only last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

إضافة إلى cron:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/openpr/backup.sh
```

## المراقبة

### فحوصات الصحة

مراقبة نقاط نهاية صحة الخدمات:

```bash
# API
curl -f http://localhost:8080/health

# MCP Server
curl -f http://localhost:8090/health
```

### مراقبة السجلات

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service
docker-compose logs -f api --tail=100
```

## اعتبارات التوسع

- **خادم API**: يمكن تشغيل نسخ متعددة خلف موازن حمل. جميع الحالات تتصل بنفس قاعدة بيانات PostgreSQL.
- **العامل**: شغِّل حالة واحدة لتجنب معالجة المهام المكررة.
- **خادم MCP**: يمكن تشغيل نسخ متعددة. كل حالة عديمة الحالة.
- **PostgreSQL**: للتوافر العالي، فكِّر في تكرار PostgreSQL أو خدمة قاعدة بيانات مُدارة.

## التحديث

لتحديث OpenPR:

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

تُطبَّق ترحيلات قاعدة البيانات تلقائياً عند بدء تشغيل خادم API.

## الخطوات التالية

- [نشر Docker](./docker) -- مرجع Docker Compose
- [الإعداد](../configuration/) -- مرجع متغيرات البيئة
- [استكشاف الأخطاء](../troubleshooting/) -- مشكلات الإنتاج الشائعة
