---
title: Plattform-Varianten
description: "Plattformspezifische Varianten für iOS, Android, macOS, Windows und Linux unter einem Fenfa-Produkt konfigurieren."
---

# Plattform-Varianten

Eine Variante repräsentiert ein plattformspezifisches Build-Target unter einem Produkt. Jede Variante hat eine eigene Plattform, Bezeichner (Bundle-ID oder Paketname), Architektur und Installer-Typ. Releases werden zu bestimmten Varianten hochgeladen.

## Unterstützte Plattformen

| Plattform | Bezeichner-Beispiel | Installer-Typ | Architektur |
|-----------|-------------------|--------------|------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## Variante erstellen

### Über das Admin-Panel

1. Das Produkt öffnen, zu dem eine Variante hinzugefügt werden soll.
2. Auf **Variante hinzufügen** klicken.
3. Felder ausfüllen:

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| Plattform | Ja | Ziel-Plattform (`ios`, `android`, `macos`, `windows`, `linux`) |
| Anzeigename | Ja | Lesbarer Name (z.B. "iOS", "Android ARM64") |
| Bezeichner | Ja | Bundle-ID oder Paketname |
| Architektur | Nein | CPU-Architektur |
| Installer-Typ | Nein | Dateityp (`ipa`, `apk`, `dmg`, etc.) |
| Mindest-OS | Nein | Mindest-OS-Versionsanforderung |
| Sortierreihenfolge | Nein | Anzeigereihenfolge auf der Download-Seite (niedriger = zuerst) |

4. Auf **Speichern** klicken.

### Über API

```bash
curl -X POST http://localhost:8000/admin/api/products/prd_abc123/variants \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0"
  }'
```

Antwort:

```json
{
  "ok": true,
  "data": {
    "id": "var_def456",
    "product_id": "prd_abc123",
    "platform": "ios",
    "display_name": "iOS",
    "identifier": "com.example.myapp",
    "arch": "arm64",
    "installer_type": "ipa",
    "min_os": "15.0",
    "published": true,
    "sort_order": 0
  }
}
```

## Typisches Produkt-Setup

Ein typisches Multi-Plattform-Produkt könnte folgende Varianten haben:

```
MeineApp (Produkt)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip Einzelne Architektur vs. Mehrere
Für Plattformen, die universelle Binärdateien unterstützen (wie Android oder macOS), kann eine einzelne Variante mit `universal`-Architektur erstellt werden. Für Plattformen, bei denen separate Binärdateien pro Architektur ausgeliefert werden, eine Variante pro Architektur erstellen.
:::

## Variante aktualisieren

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## Variante löschen

::: danger Kaskadierendes Löschen
Das Löschen einer Variante entfernt dauerhaft alle Releases und hochgeladenen Dateien.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Varianten-Statistiken

Download-Statistiken für eine bestimmte Variante abrufen:

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## ID-Format

Varianten-IDs verwenden das Präfix `var_` gefolgt von einem zufälligen String (z.B. `var_def456`).

## Nächste Schritte

- [Release-Verwaltung](./releases) -- Builds zu Varianten hochladen
- [iOS-Distribution](../distribution/ios) -- iOS-spezifische Variantenkonfiguration für OTA und UDID-Bindung
- [Desktop-Distribution](../distribution/desktop) -- macOS-, Windows- und Linux-Distributionsaspekte
