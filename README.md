# Nuestro Alfajor — Etapa 0 (Pedidos + Remito + Mañana)

App mobile-first (PWA) para Javier, Mercedes y Francisco. Esta es la
**Etapa 0** de la Hoja de Ruta del documento de especificación: reemplaza
la parte de `NuestroAlfajor_Pedidos_Produccion.xlsx` que ya usan hoy —
Pedidos + generación de remito + resumen simplificado de producción
("Mañana") — sin agregar más de un concepto nuevo a la vez.

No incluye todavía: Stock, Orden de Compra, Producción Real ni Merma
(Etapas 1 a 5). Eso se agrega cuando el uso real de esta etapa lo pida,
según el criterio de desbloqueo de la Hoja de Ruta — no antes.

> ¿Primera vez en este repo? Ver [PARA_JUANPABLO_Y_MARTIN.md](PARA_JUANPABLO_Y_MARTIN.md)
> para una guía rápida de contexto, y [docs/HOJA_DE_RUTA.md](docs/HOJA_DE_RUTA.md)
> para el plan completo de las 7 etapas del sistema.

## Cómo probarla ahora mismo (local)

Requisitos: Node.js 18 o más nuevo, y una base de datos en Turso (ver sección
"Arquitectura" más abajo — es gratis y son dos minutos de alta).

```bash
cp .env.example .env.local   # completar TURSO_DATABASE_URL y TURSO_AUTH_TOKEN
npm install
npm run seed   # crea las tablas y carga productos, clientes y los 4 usuarios
npm run dev
```

Abrí http://localhost:3000 en el celular o en Chrome desktop (con las
herramientas de dispositivo móvil activadas para simular el uso real).

**Usuarios** (PIN `1234` para los tres — pedirle a cada uno que lo cambie
por uno propio la primera vez que entra, ver nota más abajo):

| Nombre | Celular |
|---|---|
| Javier | +54 9 3434 64-3517 |
| Mercedes | +54 9 3435 07-8807 |
| Francisco | +54 9 3434 75-5714 |
| Alejandro | +54 9 3434 15-4109 |

El login acepta el número escrito de cualquier forma (con o sin `+54 9`,
con espacios, guiones o todo junto) — no hace falta que cada uno lo tipee
exactamente igual a como está guardado.

## Qué hace hoy

- **Login** con celular + PIN de 4 dígitos, sin contraseñas complejas. La
  sesión queda abierta un año: no vuelve a pedir el PIN cada vez que se
  abre la app, solo si tocan "Salir" o borran datos del navegador.
  **Límite conocido en iPhone**: Safari (y por lo tanto la PWA agregada a
  la pantalla de inicio) puede borrar sola las cookies de una app si pasan
  7 días sin abrirla — es una política de privacidad de Apple (ITP), no
  un bug de esta app. Si a alguien le pide el PIN de nuevo después de un
  tiempo sin usarla, es por eso. Se resuelve del todo cuando se migre a
  Supabase Auth (Etapa 5+), que maneja sesiones de forma más robusta en
  PWA de iOS.
- **Pedidos**: cargar un pedido nuevo (52 clientes históricos ya cargados
  desde el Excel real de mayo 2026, con alta automática si es un cliente
  nuevo, fecha de entrega, cantidades por producto), ver la lista, cambiar
  estado (Pendiente / Remito Enviado / Entregado), copiar el remito
  formateado para pegar en WhatsApp.
- El **precio se calcula solo** según la fecha de ENTREGA (no la fecha en
  que se carga el pedido) — la misma regla que ya usa el Excel.
- **Precios editables** en Config, con permiso por rol: Alejandro, Javier y
  Mercedes pueden tocar precio y fecha de corte de cada producto; Francisco
  los ve pero no los puede cambiar (el control es server-side, no solo
  visual — si alguien intenta editar por afuera de la pantalla, la API lo
  rechaza igual).
- **Mañana** muestra dos bloques: (1) lo que se entrega justo ese día, y
  (2) el acumulado de todo lo pendiente con entrega en esa fecha o antes
  — incluye atrasos — para saber qué hace falta producir en total para
  estar al día hasta ese punto, no solo la foto del día puntual.
- **Pepas por variedad**: se piden por separado — DDL, Membrillo, Arándano,
  Batata y Frutos del Bosque, cada una su propia bandeja x18 al mismo
  precio (así lo modela el Excel real, columnas J:N de Pedidos). En
  "Mañana", las 5 variedades se siguen sumando en un solo cálculo de
  amasijo y packaging, porque comparten la misma masa (sección 3.1 del
  documento) — pedir 10 DDL + 8 Membrillo + 5 Arándano cuenta como 23
  bandejas = 414 pepas para las cuentas de producción, no como pedidos
  separados.
- **Config**: precios vigentes por producto y lista de clientes (solo
  lectura por ahora).
- Instalable como PWA: "Agregar a pantalla de inicio" desde el navegador
  del celular — no hace falta subirla a ninguna tienda de aplicaciones.

## Dónde vive cada regla de negocio (por si hay que ajustar algo)

- `lib/produccion.ts` — todas las fórmulas de la sección 3 del documento
  (amasijos, tapas, garrafas, packaging). Las constantes están comentadas
  con su origen; son datos de campo confirmados, no aproximaciones.
- `lib/pricing.ts` — la regla de "precio por fecha de entrega".
- `lib/remito.ts` — formato exacto del texto de WhatsApp.
- `lib/db.ts` — esquema de datos, pensado como espejo 1:1 de la sección
  8.3 (para cuando se migre a Supabase, ver más abajo).

## Arquitectura de esta etapa vs. la definitiva

Esta Etapa 0 arrancó con SQLite local (`data/nuestroalfajor.db`) solo para
probar en `localhost` sin depender de crear ninguna cuenta. Para que Javier,
Mercedes, Francisco y Alejandro la usaran de verdad desde el celular hacía
falta una base que persistiera entre pedidos y una URL pública, así que se
migró a:

- **Turso** (libSQL, mismo SQL que SQLite) como base de datos — capa gratuita
  sin tarjeta, alcanza sobradamente para este volumen. `lib/db.ts` usa
  `@libsql/client` en vez de `better-sqlite3`, pero el esquema de tablas sigue
  siendo el mismo espejo 1:1 del modelo de datos de la sección 8.3 del
  documento.
- **GitHub** como repositorio del código.
- **Vercel** como hosting (nivel gratuito, según ya preveía el documento) —
  deploy continuo: cada push a `main` redeploya solo.

Cuando llegue el momento de la infraestructura definitiva (Etapa 5+), migrar
de Turso a Supabase/Postgres es:

1. Crear el mismo esquema en un proyecto de Supabase (Postgres).
2. Reemplazar `lib/db.ts` por un cliente de Supabase.
3. La lógica de negocio (`lib/pricing.ts`, `lib/produccion.ts`,
   `lib/remito.ts`) no cambia — es independiente de dónde viven los datos.
4. Cambiar el login para usar Supabase Auth (teléfono) en vez de la cookie
   simple actual, y pasar el PIN a hash en vez de texto plano (hoy el PIN de
   4 dígitos no tiene protección contra fuerza bruta — riesgo conocido y
   aceptado para esta etapa, la URL de producción no está indexada por
   buscadores mientras tanto).

Esto es intencional: validar la Etapa 0 con el equipo primero, y recién ahí
pagar el costo de la infraestructura definitiva — coherente con el principio
rector de la Hoja de Ruta ("no se avanza por calendario, se avanza cuando el
uso real lo demuestra").

## Antes de mostrarle esto a Javier

El documento marca esto explícitamente (sección 1 y riesgo 6 del
pre-mortem): Javier vio una app comercial "linda" y puede juzgar esta v1
contra ese estándar. Convendría decirle de entrada que esta primera
versión está hecha para cómo trabaja su equipo específicamente — pantallas
grandes, sin scroll horizontal, sin necesidad de "entrar" a una celda — y
que el pulido visual de una app madura viene después, no en el día uno.

## Decisiones ya tomadas (sección 8.4 del documento)

- **Nombre y dominio**: Nuestro Alfajor / `nuestroalfajor.com.ar`. Se eligió
  el `.com.ar` porque coincide exacto con el nombre de marca (sin abreviar)
  y transmite confianza local a clientes que llegan por WhatsApp o redes —
  es el registro más habitual para una PyME que vende en Argentina. Falta
  comprar el dominio y, si se despliega en Vercel antes de tenerlo, usar
  mientras tanto el subdominio gratuito que da Vercel (ej.
  `nuestro-alfajor.vercel.app`).
- **Marca visual**: la app es de Nuestro Alfajor (paleta, tipografía y tono
  propios de la sección 8.1), con un pie de página discreto que acredita
  "Desarrollado por Palanca Consultores" — visible en el login y al final
  de cada pantalla interna, sin competir con la identidad de Nuestro
  Alfajor.

## Pegar un pedido de WhatsApp en Pedidos (construido, agosto 2026)

Idea planteada por Alejandro: reducir el tipeo manual de Mercedes cuando carga
un pedido que le llegó por WhatsApp.

**Se descartaron dos caminos más "automáticos" por riesgo/costo:**
- Leer el WhatsApp real de Mercedes con una librería no oficial (Baileys,
  whatsapp-web.js): técnicamente simple, pero viola los términos de servicio
  de WhatsApp y arriesga que Meta banee el número — que es el mismo número
  con el que el negocio habla con sus clientes. Riesgo inaceptable para algo
  tan central.
- WhatsApp Business API oficial (Meta Cloud API): sin riesgo de ban, pero
  requiere verificación de negocio ante Meta (puede tardar semanas) y
  probablemente cambiar cómo Mercedes usa ese número desde la app normal.
  Demasiada fricción para el problema que se quiere resolver.

**Camino elegido: leer el mensaje que arma el propio catálogo, sin IA.**

La clave es que los pedidos que llegan por los tres catálogos de la casa
(`/catalogo`, `/mayorista` y `/distribuidor`) los redacta este mismo sistema,
con un formato fijo (`10x Alfajor de Maicena x7 — $25.000`). O sea que se
pueden leer de forma exacta, gratis, sin depender de un servicio externo y sin
riesgo de que "se invente" un producto. Se descartó usar IA en esta etapa por
eso mismo: agregaba una cuenta paga y un margen de error para resolver un
problema que ya estaba resuelto de forma determinística.

1. En `/pedidos/nuevo` (y también al editar un pedido) hay un panel plegable
   **"Pegar un pedido de WhatsApp"**, junto a la carga manual de siempre, que
   sigue existiendo tal cual.
2. `lib/leerPedidoPegado.ts` es una función pura — no toca base ni red — que
   corre en el navegador con el catálogo que la página ya bajó. Reconoce de
   qué canal salió el mensaje por el saludo, lee las cantidades y mapea cada
   nombre comercial al producto operativo.
3. El resultado **prellena el formulario de siempre**, no guarda nada. El
   cliente y la fecha de entrega los elige siempre la persona: es el gesto
   explícito de "reviso y confirmo" que pidió Alejandro.
4. Lo que no se pudo leer se muestra como aviso visible, con el motivo, y
   nunca se descarta en silencio.

**El puente entre las dos listas de productos**: el catálogo comercial
(`catalogo_productos`) y el operativo (`productos`) son entidades separadas a
propósito y sus nombres no coinciden. La columna `produccion_ref` —que existía
en el esquema desde el principio sin usarse— es la que las vincula, y se elige
a mano desde Catálogo → Editar producto. Sin ese vínculo, el renglón se avisa
como "no lo pude cargar" en vez de adivinar.

**Precio por canal**: la tabla `pedidos` guarda ahora `canal`
(mayorista / distribuidor / minorista, NULL = pedidos viejos, que se leen como
mayoristas) y el remito muestra con cuál se valorizó (`🏷️ Lista: ...`).

Para **mayorista** manda la lista de siempre (`productos` + `precioVigente()`):
esos precios SON la lista mayorista y son los que tienen la fecha de corte, que
es como el negocio programa un aumento. Si el catálogo se la pisara, el aumento
programado no se aplicaría nunca. Para **consumidor final** y **distribuidor**
—que antes no existían en el sistema— el precio sale del catálogo comercial,
que es donde el cliente lo vio; si el producto no está vinculado o no tiene
precio cargado en esa lista, cae al precio de siempre.

**El camino con IA quedó guardado, no descartado**: está en
`docs/ia-pedidos-guardado/` con las instrucciones para retomarlo. Serviría para
los pedidos que el cliente escribe a mano (y para transcribir notas de voz),
que es justo lo que el lector determinístico no puede resolver.

## Qué falta decidir

- Validar el diseño visual con Javier antes de invertir en Stock/Producción
  Real (Etapas 1+), según el riesgo 6 del pre-mortem.
- Comprar el dominio elegido.
- Sumar la IA para los pedidos que el cliente escribe a mano (y las notas de
  voz), cuando el uso real muestre que vale la pena la cuenta paga. El código
  está guardado en `docs/ia-pedidos-guardado/`.
- Pepas Arándano y Pepas Frutos del Bosque: **no se están produciendo** hasta
  conseguir un proveedor más barato de mermeladas (agosto 2026). Por eso están
  en `productos` pero no en el catálogo comercial, y nadie las puede pedir
  desde la web — es lo correcto mientras dure la pausa. Cuando vuelvan a
  producirse hay que darlas de alta en Catálogo y vincularlas, si no un pedido
  de esos productos se factura con el precio único de siempre en vez del
  precio del canal. No borrarlas: la pausa es temporal.
