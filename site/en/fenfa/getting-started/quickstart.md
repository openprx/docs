---
title: Quick Start
description: Get Fenfa running and upload your first app build in 5 minutes.
---

# Quick Start

This guide walks you through starting Fenfa, creating a product, uploading a build, and sharing the download page -- all in under 5 minutes.

## Step 1: Start Fenfa

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

Open `http://localhost:8000/admin` in your browser. Log in with the default admin token: `dev-admin-token`.

## Step 2: Create a Product

1. In the admin panel, click **Products** in the sidebar.
2. Click **Create Product**.
3. Fill in the product details:
   - **Name**: Your app name (e.g., "MyApp")
   - **Slug**: URL-friendly identifier (e.g., "myapp") -- this becomes the download page URL
   - **Description**: Brief description of your app
4. Click **Save**.

## Step 3: Add a Variant

A variant represents a platform-specific build target. Each product can have multiple variants (iOS, Android, macOS, etc.).

1. Open the product you just created.
2. Click **Add Variant**.
3. Configure the variant:
   - **Platform**: Select the target platform (e.g., "ios")
   - **Display Name**: Human-readable name (e.g., "iOS App Store")
   - **Identifier**: Bundle ID or package name (e.g., "com.example.myapp")
   - **Architecture**: CPU architecture (e.g., "arm64")
   - **Installer Type**: File type (e.g., "ipa", "apk", "dmg")
4. Click **Save**.

## Step 4: Upload a Build

### Via Admin Panel

1. Navigate to the variant you created.
2. Click **Upload Release**.
3. Select your build file (IPA, APK, DMG, etc.).
4. Fill in version and changelog (optional -- Fenfa auto-detects from IPA/APK metadata).
5. Click **Upload**.

### Via API (CI/CD)

Upload directly from your build pipeline:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip Smart Upload
Use the smart upload endpoint for automatic metadata detection:
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
This auto-extracts the bundle ID, version, build number, and icon from the uploaded package.
:::

## Step 5: Share the Download Page

Your app is now available at:

```
http://localhost:8000/products/myapp
```

This page features:

- **Platform detection** -- Automatically shows the correct download button based on the visitor's device.
- **QR code** -- Scan to open the download page on a mobile device.
- **Per-release changelogs** -- Each release displays its version and changelog.
- **iOS OTA install** -- iOS builds use `itms-services://` for direct installation (requires HTTPS in production).

Share this URL or the QR code with your testers and stakeholders.

## What's Next?

| Goal | Guide |
|------|-------|
| Set up iOS ad-hoc distribution with UDID binding | [iOS Distribution](../distribution/ios) |
| Configure S3/R2 for scalable file storage | [Configuration](../configuration/) |
| Automate uploads from CI/CD | [Upload API](../api/upload) |
| Deploy behind Nginx with HTTPS | [Production Deployment](../deployment/production) |
| Add Android, macOS, and Windows variants | [Platform Variants](../products/variants) |
