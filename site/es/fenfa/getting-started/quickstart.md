---
title: Inicio Rápido
description: Pon Fenfa en marcha y sube tu primer build de app en 5 minutos.
---

# Inicio Rápido

Esta guía te lleva por los pasos para iniciar Fenfa, crear un producto, subir un build y compartir la página de descarga -- todo en menos de 5 minutos.

## Paso 1: Iniciar Fenfa

```bash
docker run -d --name fenfa -p 8000:8000 fenfa/fenfa:latest
```

Abre `http://localhost:8000/admin` en tu navegador. Inicia sesión con el token de administrador predeterminado: `dev-admin-token`.

## Paso 2: Crear un Producto

1. En el panel de administración, haz clic en **Productos** en la barra lateral.
2. Haz clic en **Crear Producto**.
3. Rellena los detalles del producto:
   - **Nombre**: El nombre de tu app (ej. "MyApp")
   - **Slug**: Identificador amigable para URL (ej. "myapp") -- esto se convierte en la URL de la página de descarga
   - **Descripción**: Breve descripción de tu app
4. Haz clic en **Guardar**.

## Paso 3: Agregar una Variante

Una variante representa un objetivo de build específico de plataforma. Cada producto puede tener múltiples variantes (iOS, Android, macOS, etc.).

1. Abre el producto que acabas de crear.
2. Haz clic en **Agregar Variante**.
3. Configura la variante:
   - **Plataforma**: Selecciona la plataforma objetivo (ej. "ios")
   - **Nombre de Visualización**: Nombre legible por humanos (ej. "iOS App Store")
   - **Identificador**: Bundle ID o nombre de paquete (ej. "com.example.myapp")
   - **Arquitectura**: Arquitectura de CPU (ej. "arm64")
   - **Tipo de Instalador**: Tipo de archivo (ej. "ipa", "apk", "dmg")
4. Haz clic en **Guardar**.

## Paso 4: Subir un Build

### Via Panel de Administración

1. Navega a la variante que creaste.
2. Haz clic en **Subir Versión**.
3. Selecciona tu archivo de build (IPA, APK, DMG, etc.).
4. Rellena la versión y el changelog (opcional -- Fenfa detecta automáticamente desde los metadatos de IPA/APK).
5. Haz clic en **Subir**.

### Via API (CI/CD)

Sube directamente desde tu pipeline de compilación:

```bash
curl -X POST http://localhost:8000/upload \
  -H "X-Auth-Token: dev-upload-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa" \
  -F "version=1.0.0" \
  -F "changelog=Initial release"
```

::: tip Subida Inteligente
Usa el endpoint de subida inteligente para detección automática de metadatos:
```bash
curl -X POST http://localhost:8000/admin/api/smart-upload \
  -H "X-Auth-Token: dev-admin-token" \
  -F "variant_id=var_xxxxx" \
  -F "app_file=@build/MyApp.ipa"
```
Esto extrae automáticamente el bundle ID, versión, número de build e icono del paquete subido.
:::

## Paso 5: Compartir la Página de Descarga

Tu app ya está disponible en:

```
http://localhost:8000/products/myapp
```

Esta página incluye:

- **Detección de plataforma** -- Muestra automáticamente el botón de descarga correcto según el dispositivo del visitante.
- **Código QR** -- Escanea para abrir la página de descarga en un dispositivo móvil.
- **Changelogs por versión** -- Cada versión muestra su número de versión y changelog.
- **Instalación OTA de iOS** -- Los builds de iOS usan `itms-services://` para instalación directa (requiere HTTPS en producción).

Comparte esta URL o el código QR con tus testers y partes interesadas.

## ¿Qué Sigue?

| Objetivo | Guía |
|----------|------|
| Configurar distribución ad-hoc de iOS con vinculación UDID | [Distribución iOS](../distribution/ios) |
| Configurar S3/R2 para almacenamiento de archivos escalable | [Configuración](../configuration/) |
| Automatizar subidas desde CI/CD | [API de Subida](../api/upload) |
| Desplegar detrás de Nginx con HTTPS | [Despliegue en Producción](../deployment/production) |
| Agregar variantes Android, macOS y Windows | [Variantes de Plataforma](../products/variants) |
