---
title: Upload API
description: Fenfa-ში REST API-ის მეშვეობით აპლიკაციის build-ების ატვირთვა. სტანდარტული ატვირთვა და smart ატვირთვა ავტომატური metadata ამოღებით.
---

# Upload API

Fenfa ორ upload endpoint-ს უზრუნველყოფს: სტანდარტული ატვირთვა explicit metadata-სთვის და smart ატვირთვა, რომელიც ატვირთული package-იდან metadata-ს ავტო-გამოავლენს.

## სტანდარტული ატვირთვა

```
POST /upload
Content-Type: multipart/form-data
X-Auth-Token: <upload_token or admin_token>
```

### მოთხოვნის ველები

| ველი | სავალდებულო | ტიპი | აღწერა |
|------|-------------|------|--------|
| `variant_id` | დიახ | string | სამიზნე variant-ის ID (მაგ., `var_def456`) |
| `app_file` | დიახ | file | ბინარული ფაილი (IPA, APK, DMG, EXE და სხვ.) |
| `version` | არა | string | ვერსიის სტრინგი (მაგ., "1.2.0") |
| `build` | არა | integer | Build ნომერი (მაგ., 120) |
| `channel` | არა | string | განაწილების channel (მაგ., "internal", "beta") |
| `min_os` | არა | string | OS-ის მინიმალური ვერსია (მაგ., "15.0") |
| `changelog` | არა | string | Release შენიშვნების ტექსტი |

### მაგალითი

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0" \
  -F "build=120" \
  -F "channel=beta" \
  -F "min_os=15.0" \
  -F "changelog=Bug fixes and performance improvements"
```

### პასუხი (201 Created)

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
      "ios_install": "itms-services://?action=download-manifest&url=https://dist.example.com/ios/rel_b1cqa/manifest.plist"
    }
  }
}
```

`urls` ობიექტი გამოსაყენებელ ბმულებს გვაძლევს:
- `page` -- პროდუქტის ჩამოტვირთვის გვერდის URL
- `download` -- ბინარულის პირდაპირი ჩამოტვირთვის URL
- `ios_manifest` -- iOS manifest plist URL (მხოლოდ iOS variant-ებისთვის)
- `ios_install` -- სრული `itms-services://` ინსტალის URL (მხოლოდ iOS variant-ებისთვის)

## Smart ატვირთვა

```
POST /admin/api/smart-upload
Content-Type: multipart/form-data
X-Auth-Token: <admin_token>
```

Smart ატვირთვა სტანდარტული ატვირთვის იგივე ველებს იღებს, მაგრამ ატვირთული package-იდან metadata-ს ავტო-გამოავლენს.

::: tip ავტო-გამოვლენის ობიექტები
**IPA ფაილებისთვის**: bundle ID, ვერსია (CFBundleShortVersionString), build ნომერი (CFBundleVersion), app ხატი, iOS-ის მინიმალური ვერსია.

**APK ფაილებისთვის**: package name, version name, version code, app ხატი, მინიმალური SDK ვერსია.

Desktop ფორმატები (DMG, EXE, DEB და სხვ.) ავტო-გამოვლენას არ მხარს უჭერს. ვერსია და build explicit მიუთითეთ.
:::

### მაგალითი

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa"
```

Explicit მითითებული ველები ავტო-გამოვლენილ მნიშვნელობებს გადაფარავს:

```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -F "variant_id=var_def456" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.2.0-rc1" \
  -F "changelog=Release candidate 1"
```

## შეცდომის პასუხები

### Variant ID-ის გამოტოვება (400)

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### არასწორი Token (401)

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "invalid or missing auth token"
  }
}
```

### Variant ვერ მოიძებნა (404)

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "variant not found"
  }
}
```

## CI/CD მაგალითები

### GitHub Actions

```yaml
- name: Upload iOS build to Fenfa
  run: |
    RESPONSE=$(curl -s -X POST ${{ secrets.FENFA_URL }}/upload \
      -H "X-Auth-Token: ${{ secrets.FENFA_UPLOAD_TOKEN }}" \
      -F "variant_id=${{ secrets.FENFA_IOS_VARIANT }}" \
      -F "app_file=@build/MyApp.ipa" \
      -F "version=${{ github.ref_name }}" \
      -F "build=${{ github.run_number }}" \
      -F "changelog=${{ github.event.head_commit.message }}")
    echo "Upload response: $RESPONSE"
    echo "Download URL: $(echo $RESPONSE | jq -r '.data.urls.page')"
```

### GitLab CI

```yaml
upload:
  stage: deploy
  script:
    - |
      curl -X POST ${FENFA_URL}/upload \
        -H "X-Auth-Token: ${FENFA_UPLOAD_TOKEN}" \
        -F "variant_id=${FENFA_VARIANT_ID}" \
        -F "app_file=@build/output/app-release.apk" \
        -F "version=${CI_COMMIT_TAG}" \
        -F "build=${CI_PIPELINE_IID}" \
        -F "channel=beta"
  only:
    - tags
```

### Shell სკრიპტი

```bash
#!/bin/bash
# upload.sh - Upload a build to Fenfa
FENFA_URL="https://dist.example.com"
TOKEN="your-upload-token"
VARIANT="var_def456"
FILE="$1"
VERSION="$2"

if [ -z "$FILE" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./upload.sh <file> <version>"
  exit 1
fi

curl -X POST "${FENFA_URL}/upload" \
  -H "X-Auth-Token: ${TOKEN}" \
  -F "variant_id=${VARIANT}" \
  -F "app_file=@${FILE}" \
  -F "version=${VERSION}" \
  -F "build=$(date +%s)"
```

## შემდეგი ნაბიჯები

- [Admin API](./admin) -- სრული admin endpoint-ის ცნობარი
- [Release მართვა](../products/releases) -- ატვირთული release-ების მართვა
- [განაწილების მიმოხილვა](../distribution/) -- ატვირთვების მომხმარებლებამდე მიწოდება
