# Nuestro Alfajor — Etapa 0 (Pedidos + Remito + Mañana)

App mobile-first (PWA) para Javier, Mercedes y Francisco. Esta es la
**Etapa 0** de la Hoja de Ruta del documento de especificación: reemplaza
la parte de `NuestroAlfajor_Pedidos_Produccion.xlsx` que ya usan hoy —
Pedidos + generación de remito + resumen simplificado de producción
("Mañana") — sin agregar más de un concepto nuevo a la vez.

No incluye todavía: Stock, Orden de Compra, Producción Real ni Merma
(Etapas 1 a 5). Eso se agrega cuando el uso real de esta etapa lo pida,
según el criterio de desbloqueo de la Hoja de Ruta — no antes.

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

## Diseño listo para construir: cargar pedidos pegando el texto de WhatsApp (IA)

Idea planteada por Alejandro: reducir el tipeo manual de Mercedes cuando carga
un pedido que le llegó por WhatsApp. Quedó **diseñado pero no construido** —
se retoma cuando el uso real de la carga manual lo pida (mismo criterio de
desbloqueo de siempre).

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

**Camino elegido: "Pegar pedido" + IA, sin tocar WhatsApp para nada.**

1. En `/pedidos/nuevo` se agrega una segunda forma de cargar (junto a la
   actual, que sigue existiendo tal cual): un campo para pegar el texto tal
   cual llega por WhatsApp, con un botón "Interpretar pedido".
2. Ese botón llama a un endpoint nuevo, `POST /api/pedidos/interpretar`, que
   manda el texto pegado a un modelo de IA (Claude, vía `@anthropic-ai/sdk`,
   modelo económico tipo Haiku — alcanza de sobra para esta tarea) junto con
   el catálogo vigente (`listarProductos()`) y la lista de clientes, pidiendo
   como respuesta un JSON estricto: cliente sugerido (o "no encontrado"),
   lista de `{ producto_id, cantidad }`, y cualquier parte del texto que no
   pudo interpretar.
3. Esa respuesta **prellena el mismo formulario de siempre**
   (`FormNuevoPedido`) — no crea el pedido directo. Mercedes ve las
   cantidades ya cargadas, revisa, corrige si algo se interpretó mal, y
   **siempre** tiene que elegir ella la fecha de entrega a mano — la IA
   nunca la completa sola, es el gesto explícito de "reviso y confirmo" que
   pidió Alejandro.
4. Si algo del texto no se pudo interpretar, se muestra como aviso visible
   (no se descarta en silencio) para que lo cargue a mano.
5. Guardar el pedido sigue siendo exactamente el mismo `POST /api/pedidos`
   de hoy — este flujo solo cambia cómo se llena el formulario, no cómo se
   guarda.

**Por qué es seguro por diseño**: nada se guarda automático; la IA solo
prellena un formulario que igual requiere confirmación humana (mismo riesgo
que cargar a mano hoy, con menos tipeo). Si la IA falla o no está segura,
Mercedes siempre puede seguir cargando el pedido manualmente como ya lo hace.

**Piezas nuevas cuando se construya**: dependencia `@anthropic-ai/sdk`,
variable de entorno `ANTHROPIC_API_KEY` (local y en Vercel), `lib/interpretarPedido.ts`
(arma el prompt y valida la forma de la respuesta antes de confiar en ella),
`app/api/pedidos/interpretar/route.ts`, y una pequeña ampliación de
`FormNuevoPedido` para el modo "pegar texto".

## Qué falta decidir

- Validar el diseño visual con Javier antes de invertir en Stock/Producción
  Real (Etapas 1+), según el riesgo 6 del pre-mortem.
- Comprar el dominio elegido.
- Construir "Pegar pedido + IA" cuando la carga manual muestre que vale la
  pena el esfuerzo (ver sección de arriba).
