# Hoja de Ruta — hacia el Sistema de Producción completo

> Versión en Markdown del documento original `Hoja_de_Ruta_Sistema_Produccion.docx`
> (está también en esta carpeta, sin cambios, como fuente original). Preparado por
> Alejandro Peñas / Palanca Consultores, julio 2026.

## El camino hacia el sistema completo

Este documento es el mapa de ruta para pasar, paso a paso, de la planilla simple
de Pedidos y Remito que ya están usando, hasta el sistema completo de
producción que se diseñó: control de amasijo, relleno, packaging, compras,
stock real y merma. Ese sistema completo ya existe como planilla Excel
(`NuestroAlfajor_Sistema_Produccion.xlsx`, en esta misma carpeta) — es el
"destino final" contra el que se mide cada etapa de este software.

El criterio que ordena todo el camino es uno solo: **cada etapa nueva agrega
un concepto para aprender, nunca dos al mismo tiempo**. Y no se avanza de
etapa por calendario, sino cuando la etapa anterior ya es automática — la
usan todos los días sin errores y sin preguntar.

### Regla general para todo el camino

- Nunca avanzar dos etapas en la misma semana.
- Si en algún punto dejan de cargar algo con constancia, la señal es
  retroceder un escalón — no sumar más funciones para "compensar".
- El ritmo lo marca el uso real, no el cronograma.

Palanca Consultores acompaña cada salto de etapa junto con Javier y Mercedes.

---

## Las etapas

### Etapa 0 — Ya entregado: Pedidos + Remito + Mañana

**Qué se agrega**: cargar una venta y que el sistema arme solo el remito para
WhatsApp, y ver qué hay que producir al día siguiente.

**Concepto nuevo que aprenden**: "Cargo una venta, el sistema me arma cosas solo."

**Semáforo para pasar a la siguiente**: cargan pedidos todos los días sin que
se les recuerde, y miran la hoja Mañana antes de amasijar sin que se lo pidan.

> Estado real de este software: **construida y en producción**
> (`nuestro-alfajor-ese9.vercel.app`). Ver el [README](../README.md) para el
> detalle técnico completo.

### Etapa 1 — Stock simple (en la misma hoja Mañana)

**Qué se agrega**: dos columnas más por insumo — Stock actual (lo escriben a
mano, a ojo) y Falta comprar (resta sola). Sin registro histórico todavía.

**Concepto nuevo que aprenden**: "Lo que tengo importa para lo que tengo que comprar."

**Semáforo para pasar a la siguiente**: completan el Stock actual antes de
cada compra sin que se les recuerde, y entienden la resta de Faltante sin
confundirse.

### Etapa 2 — Separar en 3 hojas por etapa del proceso

**Qué se agrega**: la hoja Mañana se divide en Amasijo-Horneado,
Relleno-Glasé y Armado-Packaging. Recién acá, porque una sola hoja con ~30
insumos ya es difícil de leer.

**Concepto nuevo que aprenden**: "Cada persona mira solo su parte del proceso."

**Semáforo para pasar a la siguiente**: el encargado del amasijo, María y
Francisco saben cuál es "su" pestaña sin dudar.

### Etapa 3 — Orden de Compra consolidada (con costos)

**Qué se agrega**: una hoja que junta los faltantes de las tres anteriores y
calcula el total a comprar por proveedor. Es más para Javier/Alejandro que
para el resto del equipo.

**Concepto nuevo que aprenden**: "Ver la plata junta antes de salir a comprar."

**Semáforo para pasar a la siguiente**: la usan para decidir compras reales,
no solo para mirar los números.

### Etapa 4 — Producción Real (registrar lo que pasó de verdad)

**Qué se agrega**: un renglón por día — cuántos amasijos se hicieron y cuánto
salió armado. Acá arranca la disciplina de carga diaria — el salto más
grande de exigencia de todo el camino.

**Concepto nuevo que aprenden**: "Cargar todos los días lo que pasó, no solo
lo que planeé."

**Semáforo para pasar a la siguiente**: dos semanas cargando el día sin
faltar ninguno. Si fallan días seguidos, no conviene avanzar a la Etapa 5 —
el stock automático se rompe si esto no es constante.

### Etapa 5 — Stock automático real + Recepciones de compra + Merma

**Qué se agrega**: el stock deja de cargarse a mano — se mueve solo con lo
que entra (compras registradas) y lo que sale (producción real). Incluye el
cálculo de merma por línea de producto. Es la versión completa que ya está
construida y guardada (en el Excel).

**Concepto nuevo que aprenden**: "Confiar en un número que se mueve solo,
sin verificarlo cada vez."

**Semáforo para pasar a la siguiente**: dejan de anotar el stock "por las
dudas" en un papel aparte. Si todavía lo hacen, es señal de que no confían
en el sistema — no forzar el salto.

### Etapa 6 — Opcional: Contraseñas y hojas ocultas

**Qué se agrega**: separar accesos si hace falta (por ejemplo, si se suma
personal nuevo y hay que proteger precios y márgenes).

**Concepto nuevo que aprenden**: no es un paso de aprendizaje para Javier y
Mercedes — es una decisión de gobierno de la información, a criterio de
Alejandro.

**Semáforo para pasar a la siguiente**: se implementa solo si surge la
necesidad concreta, no antes.

---

## Cómo se traduce esto al software (no al Excel)

El Excel `NuestroAlfajor_Sistema_Produccion.xlsx` es el diseño funcional
completo (todas las fórmulas y hojas ya construidas ahí). Este repositorio es
la versión web/mobile de esa misma idea, construida etapa por etapa según el
mismo criterio de desbloqueo — no se migra todo el Excel de una vez. Ver la
sección "Arquitectura de esta etapa vs. la definitiva" del
[README](../README.md) para el estado técnico actual y los próximos pasos ya
diseñados (por ejemplo, carga de pedidos pegando texto de WhatsApp con IA).
