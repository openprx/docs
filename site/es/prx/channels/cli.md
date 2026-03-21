---
title: CLI
description: Usar PRX de forma interactiva desde la terminal a traves de stdin/stdout
---

# CLI

> Usa PRX directamente desde la terminal con stdin/stdout para conversaciones interactivas sin dependencias de servicios externos.

## Requisitos previos

- PRX instalado y configurado con al menos un proveedor de LLM
- Una terminal con soporte stdin/stdout

## Configuracion rapida

### 1. Configurar

El canal CLI esta habilitado por defecto. No se necesita configuracion adicional.

```toml
[channels_config]
cli = true  # por defecto, se puede omitir
```

### 2. Iniciar

```bash
prx
```

PRX iniciara en modo interactivo, leyendo de stdin y escribiendo respuestas en stdout.

### 3. Uso

Escribe tu mensaje y presiona Enter. Comandos especiales:

```
> Hello, how are you?
[PRX responds...]

> /quit    # Salir de la sesion
> /exit    # Salir de la sesion (alternativa)
```

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `cli` | `bool` | `true` | Habilitar o deshabilitar el canal CLI interactivo |

## Caracteristicas

- **Cero dependencias** -- no se necesitan cuentas externas, tokens ni APIs mas alla del proveedor de LLM
- **Siempre disponible** -- habilitado por defecto; funciona desde el momento de la instalacion
- **Interfaz stdin/stdout** -- E/S Unix estandar para facil scripting y piping
- **Filtrado de lineas vacias** -- las lineas en blanco se ignoran silenciosamente
- **Salida ordenada** -- escribe `/quit` o `/exit` para terminar la sesion de forma limpia
- **Acceso completo a herramientas** -- todas las herramientas configuradas (shell, archivo, navegador, memoria, etc.) estan disponibles

## Limitaciones

- Solo un usuario, una sesion
- Sin historial de conversacion persistente entre sesiones (a menos que la persistencia de sesion este habilitada globalmente)
- Sin soporte de medios o adjuntos de archivos (solo entrada de texto)
- Sin salida progresiva/streaming (las respuestas se imprimen completas despues de la generacion)
- No puede ejecutarse concurrentemente con otros canales en el mismo proceso a menos que se configure explicitamente

## Solucion de problemas

### PRX no inicia en modo CLI
- Asegurate de que `cli = true` (u omitelo, ya que por defecto es `true`) en `[channels_config]`
- Si otros canales estan configurados, PRX puede priorizarlos; revisa los logs de inicio
- Verifica que al menos un proveedor de LLM esta configurado

### La entrada no se procesa
- Asegurate de que estas escribiendo en la terminal donde PRX se esta ejecutando (no en un proceso en segundo plano)
- Las lineas vacias se ignoran; escribe un mensaje no vacio
- Verifica que stdin esta conectado (no redirigido desde `/dev/null`)

### Como usar CLI con pipes
- PRX lee de stdin linea por linea, asi que puedes redirigir entrada:
  ```bash
  echo "What is 2 + 2?" | prx
  ```
- Para conversaciones multi-turno via scripts, usa un FIFO o un enfoque basado en `expect`
