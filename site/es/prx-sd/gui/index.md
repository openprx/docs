---
title: Aplicación de Escritorio (GUI)
description: "PRX-SD incluye una aplicación de escritorio multiplataforma construida con Tauri 2 y Vue 3, con integración en la bandeja del sistema, escaneo por arrastrar y soltar, y un panel en tiempo real."
---

# Aplicación de Escritorio (GUI)

PRX-SD incluye una aplicación de escritorio multiplataforma construida con **Tauri 2** (backend en Rust) y **Vue 3** (frontend en TypeScript). La interfaz gráfica proporciona una interfaz visual para todas las funciones principales del motor sin necesidad de usar la línea de comandos.

## Arquitectura

```
+----------------------------------------------+
|              PRX-SD Desktop App               |
|                                               |
|   Vue 3 Frontend          Tauri 2 Backend     |
|   (Vite + TypeScript)     (Rust + IPC)        |
|                                               |
|   +------------------+   +-----------------+  |
|   | Dashboard        |<->| scan_path()     |  |
|   | File Scanner     |   | scan_directory()|  |
|   | Quarantine Mgmt  |   | get_config()    |  |
|   | Config Editor    |   | save_config()   |  |
|   | Signature Update |   | update_sigs()   |  |
|   | Alert History    |   | get_alerts()    |  |
|   | Adblock Panel    |   | adblock_*()     |  |
|   | Monitor Control  |   | start/stop()    |  |
|   +------------------+   +-----------------+  |
|                                               |
|   System Tray Icon (32x32)                    |
+----------------------------------------------+
```

El backend de Tauri expone 18 comandos IPC que el frontend de Vue llama para interactuar con el motor de escaneo, la bóveda de cuarentena, la base de datos de firmas y el motor de filtrado adblock. Todo el trabajo pesado (escaneo, coincidencia YARA, búsqueda de hashes) se ejecuta en Rust; el frontend solo se encarga de la representación visual.

## Funcionalidades

### Panel en Tiempo Real

El panel muestra el estado de seguridad de un vistazo:

- **Total de escaneos** realizados
- Recuento de **amenazas encontradas**
- Recuento de **archivos en cuarentena**
- **Tiempo del último escaneo**
- **Estado del monitoreo** (activo/inactivo)
- **Gráfico del historial de escaneos** (últimos 7 días)
- Lista de **amenazas recientes** con rutas, nombres de amenazas y niveles de severidad

<!-- Screenshot placeholder: dashboard.png -->

### Escaneo por Arrastrar y Soltar

Arrastra archivos o carpetas sobre la ventana de la aplicación para iniciar un escaneo de inmediato. Los resultados aparecen en una tabla ordenable con columnas para ruta, nivel de amenaza, tipo de detección, nombre de la amenaza y tiempo de escaneo.

<!-- Screenshot placeholder: scan-results.png -->

### Gestión de Cuarentena

Visualiza, restaura y elimina archivos en cuarentena a través de una interfaz visual:

- Tabla ordenable con ID, ruta original, nombre de la amenaza, fecha y tamaño de archivo
- Restauración con un clic a la ubicación original
- Eliminación permanente con un clic
- Estadísticas de la bóveda (total de archivos, tamaño total, entrada más antigua/reciente)

### Editor de Configuración

Edita todos los ajustes del motor a través de una interfaz basada en formularios. Los cambios se escriben en `~/.prx-sd/config.json` y surten efecto en el próximo escaneo.

### Actualizaciones de Firmas

Activa actualizaciones de la base de datos de firmas desde la interfaz gráfica. El backend descarga el último manifiesto, verifica la integridad SHA-256 e instala la actualización. El motor se reinicializa automáticamente con las nuevas firmas.

### Panel de Adblock

Gestiona el bloqueo de anuncios y dominios maliciosos:

- Habilitar/deshabilitar la protección adblock
- Sincronizar listas de filtros
- Verificar dominios individuales
- Ver el registro de bloqueos (últimas 50 entradas)
- Ver la configuración y estadísticas de las listas

### Bandeja del Sistema

PRX-SD reside en la bandeja del sistema con un icono persistente, proporcionando acceso rápido a:

- Abrir la ventana principal
- Iniciar/detener el monitoreo en tiempo real
- Verificar el estado del demonio
- Activar un escaneo rápido
- Salir de la aplicación

::: tip
El icono de la bandeja del sistema está configurado a 32x32 píxeles. En pantallas de alta densidad de píxeles, Tauri usa automáticamente la variante `128x128@2x.png`.
:::

## Compilar desde el Código Fuente

### Requisitos Previos

- **Rust** 1.85.0 o superior
- **Node.js** 18+ con npm
- **Dependencias del sistema** (Linux):

```bash
# Debian/Ubuntu
sudo apt install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf

# Fedora
sudo dnf install -y webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel
```

### Modo de Desarrollo

Ejecuta el servidor de desarrollo del frontend y el backend de Tauri juntos con recarga en caliente:

```bash
cd gui
npm install
npm run tauri dev
```

Esto inicia:
- Servidor de desarrollo Vite en `http://localhost:1420`
- Backend de Tauri que carga la URL de desarrollo

### Compilación para Producción

Compila el paquete de la aplicación distribuible:

```bash
cd gui
npm install
npm run tauri build
```

La salida de compilación varía según la plataforma:

| Plataforma | Salida |
|------------|--------|
| Linux | `.deb`, `.AppImage`, `.rpm` en `src-tauri/target/release/bundle/` |
| macOS | `.dmg`, `.app` en `src-tauri/target/release/bundle/` |
| Windows | `.msi`, `.exe` en `src-tauri\target\release\bundle\` |

## Configuración de la Aplicación

La aplicación Tauri se configura mediante `gui/src-tauri/tauri.conf.json`:

```json
{
  "productName": "PRX-SD",
  "version": "0.1.0",
  "identifier": "com.prxsd.app",
  "app": {
    "windows": [
      {
        "title": "PRX-SD Antivirus",
        "width": 1200,
        "height": 800,
        "minWidth": 900,
        "minHeight": 600,
        "center": true,
        "resizable": true
      }
    ],
    "trayIcon": {
      "id": "main-tray",
      "iconPath": "icons/32x32.png",
      "tooltip": "PRX-SD Antivirus"
    }
  }
}
```

## Comandos IPC

El backend expone estos comandos Tauri al frontend:

| Comando | Descripción |
|---------|-------------|
| `scan_path` | Escanear un archivo o directorio y devolver resultados |
| `scan_directory` | Escanear un directorio recursivamente |
| `start_monitor` | Validar e iniciar el monitoreo en tiempo real |
| `stop_monitor` | Detener el demonio de monitoreo |
| `get_quarantine_list` | Listar todas las entradas en cuarentena |
| `restore_quarantine` | Restaurar un archivo en cuarentena por ID |
| `delete_quarantine` | Eliminar una entrada de cuarentena por ID |
| `get_config` | Leer la configuración de escaneo actual |
| `save_config` | Escribir la configuración de escaneo en disco |
| `get_engine_info` | Obtener versión del motor, recuento de firmas y reglas YARA |
| `update_signatures` | Descargar e instalar las últimas firmas |
| `get_alert_history` | Leer el historial de alertas de los registros de auditoría |
| `get_dashboard_stats` | Agregar estadísticas del panel |
| `get_adblock_stats` | Obtener estado de adblock y recuentos de reglas |
| `adblock_enable` | Habilitar el bloqueo de anuncios mediante el archivo hosts |
| `adblock_disable` | Deshabilitar el bloqueo de anuncios mediante el archivo hosts |
| `adblock_sync` | Volver a descargar las listas de filtros |
| `adblock_check` | Verificar si un dominio está bloqueado |
| `get_adblock_log` | Leer las entradas recientes del registro de bloqueos |

## Directorio de Datos

La interfaz gráfica usa el mismo directorio de datos `~/.prx-sd/` que la CLI. Los cambios de configuración realizados en la interfaz gráfica son visibles para los comandos `sd` y viceversa.

::: warning
La interfaz gráfica y la CLI comparten el mismo estado del motor de escaneo. Si el demonio se está ejecutando mediante `sd daemon`, el botón "Iniciar Monitor" de la interfaz gráfica valida la preparación, pero el monitoreo real es manejado por el proceso demonio. Evita ejecutar el escáner de la interfaz gráfica y el escáner del demonio simultáneamente sobre los mismos archivos.
:::

## Pila Tecnológica

| Componente | Tecnología |
|------------|-----------|
| Backend | Tauri 2, Rust |
| Frontend | Vue 3, TypeScript, Vite 6 |
| IPC | Protocolo de comandos Tauri |
| Bandeja | Plugin de bandeja Tauri |
| Empaquetador | Empaquetador Tauri (deb/AppImage/dmg/msi) |
| Vinculaciones API | `@tauri-apps/api` v2 |

## Próximos Pasos

- Instala PRX-SD siguiendo la [Guía de Instalación](../getting-started/installation)
- Aprende sobre la [CLI](../cli/) para scripting y automatización
- Configura el motor mediante la [Referencia de Configuración](../configuration/reference)
- Extiende la detección con [Plugins WASM](../plugins/)
