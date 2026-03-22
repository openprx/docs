---
title: Schnellstart
description: "Fenfa starten und den ersten App-Build in 5 Minuten hochladen."
---

# Schnellstart

Diese Anleitung führt durch das Starten von Fenfa, das Erstellen eines Produkts, das Hochladen eines Builds und das Teilen der Download-Seite -- alles in unter 5 Minuten.

## Schritt 1: Fenfa starten

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

`http://localhost:8000/admin` im Browser öffnen. Mit dem Standard-Admin-Token anmelden: `dev-admin-token`.

## Schritt 2: Produkt erstellen

1. Im Admin-Panel auf **Produkte** in der Seitenleiste klicken.
2. Auf **Produkt erstellen** klicken.
3. Produktdetails ausfüllen:
   - **Name**: App-Name (z.B. "MeineApp")
   - **Slug**: URL-freundlicher Bezeichner (z.B. "meineapp") -- wird zur Download-Seiten-URL
   - **Beschreibung**: Kurze Beschreibung der App
4. Auf **Speichern** klicken.

## Schritt 3: Variante hinzufügen

Eine Variante repräsentiert ein plattformspezifisches Build-Target. Jedes Produkt kann mehrere Varianten haben (iOS, Android, macOS, etc.).

1. Das gerade erstellte Produkt öffnen.
2. Auf **Variante hinzufügen** klicken.
3. Die Variante konfigurieren:
   - **Plattform**: Ziel-Plattform auswählen (z.B. "ios")
   - **Anzeigename**: Lesbarer Name (z.B. "iOS App Store")
   - **Bezeichner**: Bundle-ID oder Paketname (z.B. "com.example.myapp")
   - **Architektur**: CPU-Architektur (z.B. "arm64")
   - **Installer-Typ**: Dateityp (z.B. "ipa", "apk", "dmg")
4. Auf **Speichern** klicken.

## Schritt 4: Build hochladen

### Über das Admin-Panel

1. Zur erstellten Variante navigieren.
2. Auf **Release hochladen** klicken.
3. Build-Datei auswählen (IPA, APK, DMG, etc.).
4. Version und Changelog ausfüllen (optional -- Fenfa erkennt automatisch aus IPA/APK-Metadaten).
5. Auf **Hochladen** klicken.

### Über API (CI/CD)

Direkt aus der Build-Pipeline hochladen:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip Intelligenter Upload
Den Smart-Upload-Endpunkt für automatische Metadatenerkennung verwenden:
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
Damit werden Bundle-ID, Version, Build-Nummer und Icon automatisch aus dem hochgeladenen Paket extrahiert.
:::

## Schritt 5: Download-Seite teilen

Die App ist jetzt verfügbar unter:

```
http://localhost:8000/products/meineapp
```

Diese Seite bietet:

- **Plattformerkennung** -- Zeigt automatisch den richtigen Download-Button basierend auf dem Gerät des Besuchers.
- **QR-Code** -- Scannen, um die Download-Seite auf einem Mobilgerät zu öffnen.
- **Pro-Release-Changelogs** -- Jeder Release zeigt Version und Changelog.
- **iOS OTA-Installation** -- iOS-Builds verwenden `itms-services://` für direkte Installation (erfordert HTTPS in der Produktion).

Diese URL oder den QR-Code mit Testern und Stakeholdern teilen.

## Was als nächstes?

| Ziel | Anleitung |
|------|----------|
| iOS Ad-hoc-Distribution mit UDID-Bindung einrichten | [iOS-Distribution](../distribution/ios) |
| S3/R2 für skalierbaren Dateispeicher konfigurieren | [Konfiguration](../configuration/) |
| Uploads aus CI/CD automatisieren | [Upload-API](../api/upload) |
| Hinter Nginx mit HTTPS bereitstellen | [Produktions-Deployment](../deployment/production) |
| Android-, macOS- und Windows-Varianten hinzufügen | [Plattform-Varianten](../products/variants) |
