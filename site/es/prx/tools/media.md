---
title: Herramientas de medios
description: Procesamiento de imagenes, capturas de pantalla, texto a voz y herramientas de renderizado canvas para generacion de contenido visual y de audio.
---

# Herramientas de medios

PRX incluye cinco herramientas relacionadas con medios que abarcan procesamiento de imagenes, captura de pantalla, sintesis de texto a voz y renderizado de contenido estructurado. Estas herramientas permiten a los agentes trabajar con contenido visual y de audio -- redimensionar imagenes, capturar pantallas para razonamiento visual, generar mensajes de voz y renderizar graficos y diagramas.

## Referencia de herramientas

### image

Procesa y transforma imagenes. Soporta operaciones de redimensionar, recortar y conversion de formato.

### image_info

Extrae metadatos y dimensiones de archivos de imagen sin modificarlos.

### screenshot

Captura pantallas de la pantalla actual o ventanas especificas. Util para tareas de razonamiento visual.

### tts

Sintesis de texto a voz. Convierte texto en un archivo de audio y lo envia como mensaje de voz a la conversacion actual. La herramienta maneja generacion de MP3, conversion opcional a M4A y entrega a traves del canal activo.

### canvas

Renderiza contenido estructurado para salida visual. Soporta tablas, graficos, diagramas y disenos formateados. Los diagramas usan sintaxis Mermaid.

## Seguridad

Las herramientas de imagen y captura de pantalla leen y escriben archivos en el sistema de archivos local, sujetas a las mismas politicas de seguridad que `file_read` y `file_write`. Las herramientas de medios pueden controlarse individualmente via la politica de seguridad.

```toml
[security.tool_policy.tools]
image = "allow"
image_info = "allow"
screenshot = "supervised"    # Requiere aprobacion para capturas de pantalla
tts = "allow"
canvas = "allow"
```

## Relacionado

- [Herramienta de navegador](/es/prx/tools/browser) -- automatizacion web con soporte de captura de pantalla
- [Mensajeria](/es/prx/tools/messaging) -- entregar medios y voz a traves de canales
- [Vision general de canales](/es/prx/channels/) -- matriz de capacidades de medios de canales
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
