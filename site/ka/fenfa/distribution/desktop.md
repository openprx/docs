---
title: Desktop განაწილება
description: macOS, Windows და Linux desktop აპლიკაციების Fenfa-ს მეშვეობით პირდაპირი ჩამოტვირთვებით განაწილება.
---

# Desktop განაწილება

Fenfa desktop აპლიკაციებს (macOS, Windows, Linux) პირდაპირი ფაილის ჩამოტვირთვების მეშვეობით ანაწილებს. Desktop მომხმარებლები პროდუქტის გვერდს ეწვევიან, ჩამოტვირთვის ღილაკს დააჭერენ და პლატფორმისთვის installer ფაილს იღებენ.

## მხარდაჭერილი ფორმატები

| პლატფორმა | გავრცელებული ფორმატები | შენიშვნა |
|-----------|----------------------|---------|
| macOS | `.dmg`, `.pkg`, `.zip` | DMG disk image-ებისთვის, PKG installer-ებისთვის, ZIP app bundle-ებისთვის |
| Windows | `.exe`, `.msi`, `.zip` | EXE installer-ებისთვის, MSI Windows Installer-ისთვის, ZIP portable-ისთვის |
| Linux | `.deb`, `.rpm`, `.appimage`, `.tar.gz` | DEB Debian/Ubuntu-სთვის, RPM Fedora/RHEL-ისთვის, AppImage universal-ისთვის |

## Desktop Variant-ების კონფიგურაცია

შექმენით variant-ები მხარდაჭერილი ყოველი პლატფორმა-არქიტექტურის კომბინაციისთვის:

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

::: tip Universal ბინარული
Universal macOS ბინარულის build-ის შემთხვევაში შექმენით ერთი variant `arch: "universal"`-ით ცალ-ცალკე arm64 და x86_64 variant-ების ნაცვლად.
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
# DEB for Debian/Ubuntu
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

# AppImage (universal)
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

## პლატფორმის გამოვლენა

Fenfa-ს პროდუქტის გვერდი ვიზიტორის OS-ს User-Agent-ის მეშვეობით გამოავლენს და ემთხვევა ჩამოტვირთვის ღილაკს პირველ ადგილზე გამოიყვანს. Desktop მომხმარებლები პლატფორმის variant-ს ზევით ხედავს, სხვა პლატფორმები ქვევით ხელმისაწვდომია.

## Desktop Build-ების ატვირთვა

ატვირთვა მობილური პლატფორმებისნაირად მუშაობს:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: YOUR_UPLOAD_TOKEN" \
  -F "variant_id=var_macos_arm64" \
  -F "app_file=@MyApp-arm64.dmg" \
  -F "version=2.0.0" \
  -F "build=200" \
  -F "changelog=Native Apple Silicon support"
```

::: info Desktop-ისთვის ავტო-გამოვლენა არ არის
iOS IPA და Android APK ფაილებისგან განსხვავებით, desktop ბინარული ფაილები (DMG, EXE, DEB და სხვ.) სტანდარტიზებულ metadata-ს არ შეიცავს, Fenfa-ს ავტო-ამოიღება არ შეუძლია. Desktop build-ების ატვირთვისას ყოველთვის მიუთითეთ `version` და `build` explicitly.
:::

## CI/CD ინტეგრაციის მაგალითი

GitHub Actions workflow, რომელიც ყველა desktop პლატფორმისთვის build-ებს ატვირთავს:

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

## შემდეგი ნაბიჯები

- [iOS განაწილება](./ios) -- iOS OTA ინსტალაცია და UDID binding
- [Android განაწილება](./android) -- Android APK განაწილება
- [Upload API](../api/upload) -- სრული upload endpoint-ის ცნობარი
