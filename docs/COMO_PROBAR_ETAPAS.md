# Cómo probar cada etapa localmente

Cada etapa de la [Hoja de Ruta](HOJA_DE_RUTA.md) que se construye queda
guardada como un **tag de Git** — un punto fijo en el historial al que
podés volver en cualquier momento, sin perder nada. Ninguna etapa nueva se
sube a internet (a Vercel/producción) hasta que vos lo indiques
explícitamente — todo esto vive solo en tu computadora hasta ese momento.

## Etapas disponibles hoy

| Tag | Qué incluye |
|---|---|
| `produccion-actual` | Exactamente lo que está en vivo ahora en `nuestro-alfajor-ese9.vercel.app` — para comparar. |
| `etapa-2` | + Producción dividida en 3 pestañas (Amasijo-Horneado / Relleno-Glasé / Armado-Packaging) con los insumos crudos desglosados. |
| `etapa-1` | + Stock simple (Stock actual editable y Falta comprar en cada insumo). Incluye Etapa 2. |

(Las etapas son acumulativas: `etapa-1` ya trae todo lo de `etapa-2`
adentro, porque se construyó una arriba de la otra, en ese orden.)

Para ver la lista completa y actualizada en cualquier momento:

```bash
git tag -l -n1
```

## Opción rápida: el script

```powershell
.\scripts\probar-etapa.ps1 etapa-2
```

Cambia el código a esa etapa y levanta el servidor local
(`http://localhost:3000`) directo. `Ctrl+C` para cortarlo.

## Opción manual (mismo resultado)

```bash
git status                # confirmar que no hay cambios sin guardar
git checkout etapa-2       # o produccion-actual, etapa-1, etc.
npm run dev
```

No hace falta `npm install` de nuevo al cambiar de etapa — las
dependencias no cambiaron entre estos puntos.

## Para volver a lo último en desarrollo

Después de probar una etapa quedás en un estado "detached" (Git te va a
avisar). Para volver a la rama principal, donde se sigue construyendo:

```bash
git checkout main
```

## Cuando decidas subir una etapa a producción

Avisame cuál (por ejemplo "subí hasta la etapa 2") y hago
`git push` de ese punto puntual — no se sube nada hasta que lo pidas.
