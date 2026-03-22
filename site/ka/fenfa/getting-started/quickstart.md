---
title: სწრაფი დაწყება
description: Fenfa-ს გაშვება და პირველი აპლიკაციის build-ის ატვირთვა 5 წუთში.
---

# სწრაფი დაწყება

ეს სახელმძღვანელო Fenfa-ს გაშვებას, პროდუქტის შექმნას, build-ის ატვირთვასა და ჩამოტვირთვის გვერდის გაზიარებას გაჩვენებთ -- ყველაფერი 5 წუთზე ნაკლებ დროში.

## ნაბიჯი 1: Fenfa-ს გაშვება

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

ბრაუზერში გახსენით `http://localhost:8000/admin`. შედით ნაგულისხმევი admin token-ით: `dev-admin-token`.

## ნაბიჯი 2: პროდუქტის შექმნა

1. Admin panel-ში sidebar-ში დააჭირეთ **Products**.
2. დააჭირეთ **Create Product**.
3. შეავსეთ პროდუქტის დეტალები:
   - **Name**: თქვენი აპლიკაციის სახელი (მაგ., "MyApp")
   - **Slug**: URL-ფრენდლი იდენტიფიკატორი (მაგ., "myapp") -- ეს გახდება ჩამოტვირთვის გვერდის URL
   - **Description**: თქვენი აპლიკაციის მოკლე აღწერა
4. დააჭირეთ **Save**.

## ნაბიჯი 3: Variant-ის დამატება

Variant წარმოადგენს პლატფორმა-სპეციფიკური build target-ს. ყოველ პროდუქტს მრავალი variant-ი შეიძლება ჰქონდეს (iOS, Android, macOS და სხვ.).

1. ახლახან შექმნილი პროდუქტი გახსენით.
2. დააჭირეთ **Add Variant**.
3. Variant-ის კონფიგურაცია:
   - **Platform**: სამიზნე პლატფორმის არჩევა (მაგ., "ios")
   - **Display Name**: ადამიანის-წასაკითხი სახელი (მაგ., "iOS App Store")
   - **Identifier**: Bundle ID ან package name (მაგ., "com.example.myapp")
   - **Architecture**: CPU არქიტექტურა (მაგ., "arm64")
   - **Installer Type**: ფაილის ტიპი (მაგ., "ipa", "apk", "dmg")
4. დააჭირეთ **Save**.

## ნაბიჯი 4: Build-ის ატვირთვა

### Admin Panel-ის მეშვეობით

1. შექმნილ variant-ზე გადადით.
2. დააჭირეთ **Upload Release**.
3. აირჩიეთ build ფაილი (IPA, APK, DMG და სხვ.).
4. შეავსეთ ვერსია და changelog (optional -- Fenfa IPA/APK metadata-დან ავტო-გამოავლენს).
5. დააჭირეთ **Upload**.

### API-ის მეშვეობით (CI/CD)

პირდაპირ build pipeline-დან ატვირთვა:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip Smart Upload
ავტომატური metadata გამოვლენისთვის გამოიყენეთ smart upload endpoint:
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
ეს ავტომატურად ამოიღებს bundle ID-ს, ვერსიას, build ნომერს და ხატს ატვირთული package-იდან.
:::

## ნაბიჯი 5: ჩამოტვირთვის გვერდის გაზიარება

თქვენი აპლიკაცია ახლა ხელმისაწვდომია:

```
http://localhost:8000/products/myapp
```

ეს გვერდი მოიცავს:

- **პლატფორმის გამოვლენა** -- ვიზიტორის მოწყობილობის მიხედვით ავტომატურად ჩვენებს სწორ ჩამოტვირთვის ღილაკს.
- **QR კოდი** -- სკანირება მობილურ მოწყობილობაზე ჩამოტვირთვის გვერდის გასახსნელად.
- **Release-ზე changelog-ები** -- ყოველი release ჩვენებს ვერსიასა და changelog-ს.
- **iOS OTA ინსტალაცია** -- iOS build-ები `itms-services://`-ს პირდაპირი ინსტალაციისთვის გამოიყენებს (production-ში HTTPS სჭირდება).

გაუზიარეთ ეს URL ან QR კოდი ტესტერებსა და დაინტერესებულ მხარეებს.

## შემდეგია?

| მიზანი | სახელმძღვანელო |
|--------|---------------|
| iOS ad-hoc განაწილების UDID binding-ით კონფიგურაცია | [iOS განაწილება](../distribution/ios) |
| სკალირებადი ფაილების storage-ისთვის S3/R2-ის კონფიგურაცია | [კონფიგურაცია](../configuration/) |
| CI/CD-დან ატვირთვების ავტომატიზება | [Upload API](../api/upload) |
| Nginx-ის მიღმა HTTPS-ით განასახება | [Production განასახება](../deployment/production) |
| Android, macOS და Windows variant-ების დამატება | [პლატფორმის Variant-ები](../products/variants) |
