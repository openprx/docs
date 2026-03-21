---
title: Recarga en caliente
description: Como PRX aplica cambios de configuracion sin reiniciar -- que es recargable en caliente, que requiere reinicio y como funciona el monitor de archivos.
---

# Recarga en caliente

PRX soporta la recarga en caliente de la mayoria de los cambios de configuracion. Cuando editas `config.toml` (o cualquier fragmento en `config.d/`), los cambios se detectan y aplican en segundos -- sin necesidad de reiniciar.

## Como funciona

PRX utiliza un mecanismo de tres capas para actualizaciones de configuracion en vivo:

1. **Monitor de archivos** -- Un monitor de sistema de archivos `notify` supervisa el directorio de configuracion (tanto `config.toml` como todo el arbol `config.d/`) en busca de eventos de escritura.

2. **Debounce** -- Los eventos se agrupan con una ventana de 1 segundo para consolidar escrituras sucesivas rapidas (ej., de editores que escriben y luego renombran).

3. **Intercambio atomico** -- Al detectar un cambio, PRX:
   - Calcula una huella SHA-256 de la nueva configuracion
   - La compara con la ultima huella conocida (omite si es identica)
   - Analiza el nuevo TOML en una estructura `Config`
   - En caso de exito: publica atomicamente la nueva configuracion via `ArcSwap` (sin bloqueos)
   - En caso de fallo: mantiene la configuracion anterior y registra una advertencia

El tipo `SharedConfig` (`Arc<ArcSwap<Config>>`) asegura que todos los componentes que leen la configuracion obtengan una instantanea consistente sin contension. Los lectores llaman a `.load_full()` para obtener una instantanea `Arc<Config>` que permanece valida incluso si la configuracion se intercambia durante su uso.

## Que es recargable en caliente

Los siguientes cambios surten efecto inmediatamente (en ~1 segundo):

| Categoria | Ejemplos |
|-----------|----------|
| **Ajustes de proveedor** | `default_provider`, `default_model`, `default_temperature`, `api_key`, `api_url` |
| **Ajustes de canal** | `allowed_users` de Telegram, `mention_only` de Discord, `channel_id` de Slack, etc. |
| **Ajustes de memoria** | `backend`, `auto_save`, `embedding_provider`, periodos de retencion |
| **Ajustes del router** | `enabled`, pesos (`alpha`/`beta`/`gamma`/`delta`/`epsilon`), umbrales de Automix |
| **Ajustes de seguridad** | Backend de sandbox, limites de recursos, configuracion de auditoria |
| **Ajustes de autonomia** | Reglas de alcance, niveles de autonomia |
| **Ajustes MCP** | Definiciones de servidores, timeouts, listas de herramientas permitidas |
| **Ajustes de busqueda web** | `enabled`, `provider`, `max_results` |
| **Ajustes de navegador** | `enabled`, `allowed_domains` |
| **Ajustes Xin** | `enabled`, `interval_minutes`, limites de tareas |
| **Ajustes de costos** | `daily_limit_usd`, `monthly_limit_usd`, precios |
| **Ajustes de fiabilidad** | `max_retries`, `fallback_providers` |
| **Ajustes de observabilidad** | `backend`, endpoint OTLP |
| **Ajustes de proxy** | URLs de proxy, listas de exclusion, alcance |

## Que requiere reinicio

Un pequeno numero de ajustes se enlazan al inicio y no pueden cambiarse en tiempo de ejecucion:

| Ajuste | Razon |
|--------|-------|
| `[gateway] host` | El listener TCP se enlaza una vez al inicio |
| `[gateway] port` | El listener TCP se enlaza una vez al inicio |
| Ajustes de `[tunnel]` | Las conexiones de tunel se establecen al inicio |
| Tokens de bot de canales | Las conexiones de bot (long-poll de Telegram, gateway de Discord, socket de Slack) se inicializan una vez |

Para estos ajustes, debes reiniciar el demonio PRX:

```bash
# Si se ejecuta como servicio systemd
sudo systemctl restart openprx

# Si se ejecuta en primer plano
# Detener con Ctrl+C, luego iniciar de nuevo
prx
```

## Comando de recarga CLI

Puedes activar manualmente una recarga de configuracion sin editar el archivo:

```bash
prx config reload
```

Esto es equivalente a que el monitor de archivos detecte un cambio. Relee y reanaliza los archivos de configuracion e intercambia atomicamente la configuracion activa. Esto es util cuando:

- Has modificado el archivo pero el monitor no detecto el evento (raro)
- Quieres forzar una recarga despues de actualizar variables de entorno
- Estas automatizando cambios de configuracion mediante scripts

## Manejo de errores

Si el nuevo archivo de configuracion contiene errores:

- **Errores de sintaxis TOML** -- El analizador rechaza el archivo. Se mantiene la configuracion anterior. Se registra una advertencia con los detalles del error de analisis.
- **Valores de campo invalidos** -- La validacion detecta problemas como `confidence_threshold > 1.0` o `premium_model_id` vacio cuando Automix esta habilitado. Se mantiene la configuracion anterior.
- **Archivo faltante** -- Si se elimina `config.toml`, el monitor registra un error pero la configuracion en memoria continua funcionando.

En todos los casos de error, PRX continua operando con la ultima configuracion valida conocida. No se pierden datos y no se produce interrupcion del servicio.

## Monitoreo de recargas

El `HotReloadManager` mantiene un contador monotono `reload_version` que se incrementa en cada recarga exitosa. Puedes verificar la version actual a traves del endpoint de estado del gateway:

```bash
curl http://localhost:16830/api/status
```

La respuesta incluye el conteo de recargas actual, ayudandote a verificar que tus cambios se han aplicado.

## Recargas de archivos divididos

Cuando se usan archivos de configuracion divididos (`config.d/*.toml`), el monitor supervisa todo el directorio `config.d/` recursivamente. Un cambio en cualquier fragmento `.toml` activa una re-fusion y recarga completa de toda la configuracion. Esto significa:

- Editar `config.d/channels.toml` recarga toda la configuracion (no solo los canales)
- Agregar o eliminar un archivo de fragmento activa una recarga
- El orden de fusion es alfabetico por nombre de archivo, con los fragmentos teniendo precedencia sobre `config.toml`
