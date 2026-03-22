---
title: توزيع سطح المكتب
description: توزيع تطبيقات سطح المكتب لـ macOS وWindows وLinux عبر Fenfa بالتنزيل المباشر.
---

# توزيع سطح المكتب

يوزع Fenfa تطبيقات سطح المكتب (macOS وWindows وLinux) عبر تنزيل الملفات مباشرةً. يزور مستخدمو سطح المكتب صفحة المنتج، يضغطون على زر التنزيل، ويحصلون على ملف المثبّت لمنصتهم.

## الصيغ المدعومة

| المنصة | الصيغ الشائعة | ملاحظات |
|--------|--------------|---------|
| macOS | `.dmg`، `.pkg`، `.zip` | DMG لصور الأقراص، PKG للمثبّتات، ZIP لحزم التطبيقات |
| Windows | `.exe`، `.msi`، `.zip` | EXE للمثبّتات، MSI لـ Windows Installer، ZIP للإصدار المحمول |
| Linux | `.deb`، `.rpm`، `.appimage`، `.tar.gz` | DEB لـ Debian/Ubuntu، RPM لـ Fedora/RHEL، AppImage للعالمي |

## إعداد متغيرات سطح المكتب

أنشئ متغيرات لكل مجموعة منصة ومعمارية تدعمها:

### macOS

```bash
# Apple Silicon
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Apple Silicon)",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'

# Intel
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "macos",
    "display_name": "macOS (Intel)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "dmg",
    "min_os": "12.0"
  }'
```

::: tip الثنائي العالمي
إذا كنت تبني ثنائياً عالمياً لـ macOS، أنشئ متغيراً واحداً بـ `arch: "universal"` بدلاً من متغيرات منفصلة لـ arm64 وx86_64.
:::

### Windows

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "windows",
    "display_name": "Windows",
    "identifier": "com.example.myapp",
    "arch": "x64",
    "installer_type": "exe",
    "min_os": "10"
  }'
```

### Linux

```bash
# DEB لـ Debian/Ubuntu
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (DEB)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "deb"
  }'

# AppImage (عالمي)
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "linux",
    "display_name": "Linux (AppImage)",
    "identifier": "com.example.myapp",
    "arch": "x86_64",
    "installer_type": "appimage"
  }'
```

## كشف المنصة

تكتشف صفحة المنتج في Fenfa نظام تشغيل الزائر عبر User-Agent وتُبرز زر التنزيل المطابق. يرى مستخدمو سطح المكتب متغير منصتهم في الأعلى، مع توفر المنصات الأخرى أدناه.

## رفع بنيات سطح المكتب

يعمل الرفع بنفس الطريقة كما للمنصات المحمولة:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info لا كشف تلقائي لسطح المكتب
على خلاف ملفات IPA لـ iOS وAPK لـ Android، لا تحتوي ثنائيات سطح المكتب (DMG وEXE وDEB إلخ.) على بيانات وصفية موحّدة يمكن لـ Fenfa استخراجها تلقائياً. أدخل دائماً `version` و`build` صراحةً عند رفع بنيات سطح المكتب.
:::

## مثال تكامل CI/CD

سير عمل GitHub Actions يرفع بنيات لجميع منصات سطح المكتب:

```yaml
jobs:
  upload:
    strategy:
      matrix:
        include:
          - platform: macos
            variant_id: var_macos_arm64
            file: dist/MyApp-arm64.dmg
          - platform: windows
            variant_id: var_windows_x64
            file: dist/MyApp-Setup.exe
          - platform: linux
            variant_id: var_linux_x64
            file: dist/MyApp.AppImage
    steps:
      - name: Upload to Fenfa
        run: |
          curl -X POST ${{ secrets.FENFA_URL }}/upload \
            -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
            -F "variant_id=${{ matrix.variant_id }}" \
            -F "app_file=@${{ matrix.file }}" \
            -F "version=${{ github.ref_name }}" \
            -F "build=${{ github.run_number }}"
```

## الخطوات التالية

- [توزيع iOS](./ios) -- التثبيت OTA وربط UDID لـ iOS
- [توزيع Android](./android) -- توزيع APK لـ Android
- [واجهة برمجة تطبيقات الرفع](../api/upload) -- مرجع كامل لنقطة نهاية الرفع
