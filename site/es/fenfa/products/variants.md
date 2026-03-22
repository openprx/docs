---
title: Variantes de Plataforma
description: "Configura variantes específicas de plataforma para iOS, Android, macOS, Windows y Linux bajo un producto Fenfa."
---

# Variantes de Plataforma

Una variante representa un objetivo de build específico de plataforma bajo un producto. Cada variante tiene su propia plataforma, identificador (bundle ID o nombre de paquete), arquitectura y tipo de instalador. Las versiones se suben a variantes específicas.

## Plataformas Soportadas

| Plataforma | Ejemplo de Identificador | Tipo de Instalador | Arquitectura |
|------------|--------------------------|--------------------|--------------|
| `ios` | `com.example.myapp` | `ipa` | `arm64` |
| `android` | `com.example.myapp` | `apk` | `universal`, `arm64-v8a`, `armeabi-v7a` |
| `macos` | `com.example.myapp` | `dmg`, `pkg`, `zip` | `arm64`, `x86_64`, `universal` |
| `windows` | `com.example.myapp` | `exe`, `msi`, `zip` | `x64`, `arm64` |
| `linux` | `com.example.myapp` | `deb`, `rpm`, `appimage`, `tar.gz` | `x86_64`, `aarch64` |

## Crear una Variante

### Via Panel de Administración

1. Abre el producto al que quieres agregar una variante.
2. Haz clic en **Agregar Variante**.
3. Rellena los campos:

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| Plataforma | Sí | Plataforma objetivo (`ios`, `android`, `macos`, `windows`, `linux`) |
| Nombre de Visualización | Sí | Nombre legible (ej. "iOS", "Android ARM64") |
| Identificador | Sí | Bundle ID o nombre de paquete |
| Arquitectura | No | Arquitectura de CPU |
| Tipo de Instalador | No | Tipo de archivo (`ipa`, `apk`, `dmg`, etc.) |
| OS Mínimo | No | Requisito de versión mínima del OS |
| Orden de Clasificación | No | Orden de visualización en la página de descarga (menor = primero) |

4. Haz clic en **Guardar**.

### Via API

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

Respuesta:

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

## Configuración Típica de Producto

Un producto multi-plataforma típico podría tener estas variantes:

```
MyApp (Product)
├── iOS (com.example.myapp, ipa, arm64)
├── Android (com.example.myapp, apk, universal)
├── macOS Apple Silicon (com.example.myapp, dmg, arm64)
├── macOS Intel (com.example.myapp, dmg, x86_64)
├── Windows (com.example.myapp, exe, x64)
└── Linux (com.example.myapp, appimage, x86_64)
```

::: tip Arquitectura Única vs. Múltiple
Para plataformas que soportan binarios universales (como Android o macOS), puedes crear una única variante con arquitectura `universal`. Para plataformas donde distribuyes binarios separados por arquitectura, crea una variante por arquitectura.
:::

## Actualizar una Variante

```bash
curl -X PUT http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "iOS (Ad-Hoc)",
    "min_os": "16.0"
  }'
```

## Eliminar una Variante

::: danger Eliminación en Cascada
Eliminar una variante elimina permanentemente todas sus versiones y archivos subidos.
:::

```bash
curl -X DELETE http://localhost:8000/admin/api/variants/var_def456 \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Estadísticas de Variante

Obtén estadísticas de descarga para una variante específica:

```bash
curl http://localhost:8000/admin/api/variants/var_def456/stats \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Formato de ID

Los IDs de variante usan el prefijo `var_` seguido de una cadena aleatoria (ej. `var_def456`).

## Siguientes Pasos

- [Gestión de Versiones](./releases) -- Sube builds a tus variantes
- [Distribución iOS](../distribution/ios) -- Configuración de variante específica de iOS para OTA y vinculación UDID
- [Distribución de Escritorio](../distribution/desktop) -- Consideraciones de distribución para macOS, Windows y Linux
