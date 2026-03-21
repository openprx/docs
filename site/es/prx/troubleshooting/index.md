---
title: Solucion de problemas
description: Problemas comunes y soluciones para PRX, incluyendo herramientas de diagnostico y FAQ.
---

# Solucion de problemas

Esta seccion cubre problemas comunes encontrados al ejecutar PRX y como resolverlos.

## Diagnostico rapido

Ejecuta el comando doctor integrado para una verificacion de salud completa:

```bash
prx doctor
```

Esto verifica:

- Validez del archivo de configuracion
- Conectividad y autenticacion de proveedores
- Dependencias del sistema
- Espacio en disco y permisos
- Estado del daemon activo

## Problemas comunes

### El daemon no inicia

**Sintomas**: `prx daemon` se cierra inmediatamente o falla al enlazar.

**Soluciones**:
- Verifica si otra instancia esta en ejecucion: `prx daemon status`
- Verifica que el puerto este disponible: `ss -tlnp | grep 3120`
- Revisa los logs: `prx daemon logs`
- Valida la configuracion: `prx config check`

### La autenticacion del proveedor falla

**Sintomas**: Errores "Unauthorized" o "Invalid API key".

**Soluciones**:
- Verifica tu clave API: `prx auth status`
- Re-autentica: `prx auth login <provider>`
- Verifica las variables de entorno: `env | grep API_KEY`

### Alto uso de memoria

**Sintomas**: El proceso PRX consume memoria excesiva.

**Soluciones**:
- Reduce las sesiones concurrentes: configura `[agent.limits] max_concurrent_sessions`
- Habilita la higiene de memoria: `prx memory compact`
- Verifica sesiones de larga duracion: `prx session list`

### La ejecucion de herramientas se cuelga

**Sintomas**: El agente parece atascado durante la ejecucion de herramientas.

**Soluciones**:
- Verifica la configuracion del sandbox
- Verifica que las dependencias de herramientas esten instaladas
- Establece un timeout: `[agent] session_timeout_secs = 300`
- Cancela la sesion: `prx session cancel <id>`

## Obtener ayuda

- Consulta la pagina de [Diagnosticos](./diagnostics) para procedimientos de diagnostico detallados
- Abre un issue en GitHub: `https://github.com/openprx/prx/issues`
- Unete al Discord de la comunidad para ayuda en tiempo real

## Paginas relacionadas

- [Diagnosticos](./diagnostics)
