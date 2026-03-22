---
title: Release მართვა
description: Fenfa-ში აპლიკაციის release-ების ატვირთვა, ვერსიები და მართვა. ყოველი release პლატფორმის variant-ზე ატვირთული სპეციფიკური build-ია.
---

# Release მართვა

Release წარმოადგენს variant-ის ქვეშ ატვირთულ სპეციფიკურ build-ს. ყოველ release-ს აქვს ვერსიის სტრინგი, build ნომერი, changelog და ბინარული ფაილი. Release-ები პროდუქტის ჩამოტვირთვის გვერდზე საპირისპირო ქრონოლოგიური თანმიმდევრობით ჩანს.

## Release-ის ველები

| ველი | ტიპი | აღწერა |
|------|------|--------|
| `id` | string | ავტო-გენერირებული ID (მაგ., `rel_b1cqa`) |
| `variant_id` | string | მშობელი variant-ის ID |
| `version` | string | ვერსიის სტრინგი (მაგ., "1.2.0") |
| `build` | integer | Build ნომერი (მაგ., 120) |
| `changelog` | text | Release შენიშვნები (ჩამოტვირთვის გვერდზე ნაჩვენები) |
| `min_os` | string | OS-ის მინიმალური ვერსია |
| `channel` | string | განაწილების channel (მაგ., "internal", "beta", "production") |
| `size_bytes` | integer | ფაილის ზომა ბაიტებში |
| `sha256` | string | ატვირთული ფაილის SHA-256 hash |
| `download_count` | integer | ამ release-ის ჩამოტვირთვების რაოდენობა |
| `file_name` | string | ორიგინალი ფაილის სახელი |
| `file_ext` | string | ფაილის გაფართოება (მაგ., "ipa", "apk") |
| `created_at` | datetime | ატვირთვის timestamp |

## Release-ის ატვირთვა

### სტანდარტული ატვირთვა

Build ფაილის ატვირთვა სპეციფიკური variant-ისთვის:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "changelog=Bug fixes and performance improvements"
```

პასუხი:

```json
{
  "ok": true,
  "data": {
    "app": {
      "id": "app_xxx",
      "name": "MyApp",
      "platform": "ios",
      "bundle_id": "com.example.myapp"
    },
    "release": {
      "id": "rel_b1cqa",
      "version": "1.2.0",
      "build": 120
    },
    "urls": {
      "page": "https://dist.example.com/products/myapp",
      "download": "https://dist.example.com/d/rel_b1cqa",
      "ios_manifest": "https://dist.example.com/ios/rel_b1cqa/manifest.plist",
      "ios_install": "itms-services://..."
    }
  }
}
```

### Smart ატვირთვა

Smart upload endpoint-ი ატვირთული package-იდან metadata-ს ავტო-გამოავლენს:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

::: tip ავტო-გამოვლენა
Smart upload IPA და APK ფაილებიდან ამოიღებს:
- **Bundle ID / Package Name**
- **ვერსიის სტრინგი** (CFBundleShortVersionString / versionName)
- **Build ნომერი** (CFBundleVersion / versionCode)
- **აპლიკაციის ხატი** (ამოიღება და პროდუქტის ხატად ინახება)
- **OS-ის მინიმალური ვერსია**

upload მოთხოვნაში ნებისმიერი ავტო-გამოვლენილი ველის explicit მითითებით გადაფარვა შეიძლება.
:::

### ატვირთვის ველები

| ველი | სავალდებულო | აღწერა |
|------|-------------|--------|
| `variant_id` | დიახ | სამიზნე variant-ის ID |
| `app_file` | დიახ | ბინარული ფაილი (IPA, APK, DMG და სხვ.) |
| `version` | არა | ვერსიის სტრინგი (IPA/APK-ისთვის ავტო-გამოვლენილი) |
| `build` | არა | Build ნომერი (IPA/APK-ისთვის ავტო-გამოვლენილი) |
| `channel` | არა | განაწილების channel |
| `min_os` | არა | OS-ის მინიმალური ვერსია |
| `changelog` | არა | Release შენიშვნები |

## ფაილების შენახვა

ატვირთული ფაილები შენახულია:

```
uploads/{product_id}/{variant_id}/{release_id}/filename.ext
```

ყოველ release-ს ასევე აქვს `meta.json` snapshot (მხოლოდ ლოკალური storage-ი) აღდგენისთვის.

::: info S3 Storage
S3-compatible storage-ის კონფიგურაციისას ფაილები კონფიგურირებულ bucket-ში ატვირთდება. storage path-ის სტრუქტურა იგივე რჩება. S3-ის კონფიგურაციისთვის იხ. [კონფიგურაცია](../configuration/).
:::

## ჩამოტვირთვის URL-ები

ყოველი release-ი რამდენიმე URL-ს გვაძლევს:

| URL | აღწერა |
|-----|--------|
| `/d/:releaseID` | პირდაპირი ბინარული ჩამოტვირთვა (HTTP Range request-ების მხარდაჭერა) |
| `/ios/:releaseID/manifest.plist` | iOS OTA manifest (`itms-services://` ბმულებისთვის) |
| `/products/:slug` | პროდუქტის ჩამოტვირთვის გვერდი |
| `/products/:slug?r=:releaseID` | პროდუქტის გვერდი კონკრეტული release-ის გამოყოფილი ჩვენებით |

## Release-ის წაშლა

```bash
curl -X DELETE http://localhost:8000/admin/api/releases/rel_b1cqa \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

::: warning
Release-ის წაშლა ატვირთულ ბინარულ ფაილსა და ყველა მასთან დაკავშირებულ metadata-ს სამუდამოდ შლის.
:::

## Release მონაცემების ექსპორტი

ყველა release-ის CSV-ად ექსპორტი ანგარიშგებისთვის:

```bash
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## CI/CD ინტეგრაცია

Fenfa CI/CD pipeline-ებიდან გამოსაძახებლად შექმნილია. ტიპიური GitHub Actions ნაბიჯი:

```yaml
- name: Upload to Fenfa
  run: |
    curl -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_VARIANT_ID }}" \
      -F "app_file=@build/output/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}"
```

## შემდეგი ნაბიჯები

- [Upload API ცნობარი](../api/upload) -- სრული upload endpoint-ის დოკუმენტაცია
- [iOS განაწილება](../distribution/ios) -- iOS OTA manifest და ინსტალაცია
- [განაწილების მიმოხილვა](../distribution/) -- Release-ების მომხმარებლებამდე მიწოდება
