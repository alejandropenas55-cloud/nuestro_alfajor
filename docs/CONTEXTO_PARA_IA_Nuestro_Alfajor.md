# Nuestro Alfajor — Contexto completo del sistema

> **Para qué sirve este archivo.** Es un documento autocontenido para darle de
> contexto a una IA (ChatGPT, Claude o la que sea) antes de pedirle que escriba
> código para Nuestro Alfajor. Explica el negocio, las personas, las reglas y
> —sobre todo— **por qué** cada cosa está decidida como está. Sin esto, la IA
> escribe código razonable que rompe reglas que no ve.
>
> Preparado por Palanca Consultores (Alejandro Penas), agosto 2026.
> Compartido con Francisco para que los dos sistemas hablen el mismo idioma.

---

## 1. El negocio en dos minutos

**Nuestro Alfajor** es una fábrica de alfajores artesanales en Paraná, Entre
Ríos (Profesor Diego Mackinnon 1590). Produce y vende:

| Línea | Formato | Nota |
|---|---|---|
| Maicena | paquete x7 y bandeja x14 | el producto principal |
| Frutal | paquete x7 | lleva glasé |
| Santafesino | paquete x7 | las tapas NO se hacen: se compran a Don Jesús |
| Pepas DDL | bandeja x18 (320 g) | |
| Pepas Membrillo | bandeja x18 | |
| Pepas Batata | bandeja x18 | |
| Pepas Arándano | bandeja x18 | **pausada** (agosto 2026) |
| Pepas Frutos del Bosque | bandeja x18 | **pausada** (agosto 2026) |

Las dos variedades pausadas siguen existiendo en la base pero no se venden
hasta conseguir un proveedor de mermelada más barato. **No borrarlas**: la
pausa es temporal.

**Vende por tres canales, cada uno con su propia lista de precios:**

- **Minorista / consumidor final** — catálogo público, sin mínimos de compra.
- **Mayorista** — escuelas, clubes, empresas, reventa. **Con mínimos.**
- **Distribuidor** — sin mínimos, precio más bajo, y no ve el simulador de
  "cuánto ganás" (a un distribuidor no se le explica su propio margen).

**Las personas:**

| Quién | Rol |
|---|---|
| Javier | dueño. Mira la plata y decide compras. |
| Mercedes | carga los pedidos y maneja producción. Es la usuaria más intensiva. |
| Francisco | producción/armado. También está desarrollando su propio sistema. |
| María | armado. |
| Alejandro (Palanca Consultores) | consultor externo, ordena el proyecto. |

**Importante para el diseño**: el equipo no es técnico y trabaja **desde el
celular, con las manos ocupadas y a veces sucias**. Eso no es un detalle
estético, es el requisito principal de interfaz.

---

## 2. El principio rector (esto es lo que más se suele violar)

> **Cada etapa nueva agrega UN concepto para aprender, nunca dos al mismo
> tiempo. Y no se avanza por calendario: se avanza cuando la etapa anterior ya
> es automática — la usan todos los días, sin errores y sin preguntar.**

Existe una Hoja de Ruta de 7 etapas (0 a 6). El "destino final" ya está
diseñado y funcionando como planilla Excel
(`NuestroAlfajor_Sistema_Produccion.xlsx`); el software lo va alcanzando de a
un escalón.

| Etapa | Qué agrega | Concepto que aprenden | Estado |
|---|---|---|---|
| 0 | Pedidos + Remito + "Mañana" | "cargo una venta y el sistema arma cosas solo" | en producción |
| 1 | Stock simple a mano | "lo que tengo importa para lo que compro" | en producción |
| 2 | Separar en 3 hojas del proceso | "cada uno mira solo su parte" | en producción |
| 3 | Orden de Compra consolidada | "ver la plata junta antes de comprar" | en producción |
| 4 | Producción Real (lo que pasó) | "cargar todos los días, no solo lo planeado" | pendiente |
| 5 | Stock automático + recepciones + merma | "confiar en un número que se mueve solo" | pendiente |
| 6 | Accesos y permisos finos | (decisión de gobierno, no de aprendizaje) | opcional |

**Regla que se rompe fácil:** si el equipo deja de cargar algo con constancia,
la respuesta correcta es **retroceder un escalón**, no agregar funciones para
compensar. Un sistema con 40 pantallas que nadie completa vale menos que 3 que
usan todos los días.

**Consecuencia para cualquier IA que escriba código acá:** cuando te pidan una
función, la respuesta buena casi nunca es "te agrego también estas cinco cosas
relacionadas". Agregá lo pedido y nada más.

---

## 3. Arquitectura actual

- **Next.js 14** (App Router) + **React 18** + **TypeScript**.
- **Tailwind CSS** para el panel interno; CSS plano con prefijos (`.may-`,
  `.plan-`) para las piezas comerciales y de papel, que tienen su propio
  sistema visual.
- **Turso** (libSQL — mismo SQL que SQLite) como base de datos, vía
  `@libsql/client`.
- **Vercel** como hosting.
- **PWA**: se instala con "Agregar a pantalla de inicio", no pasa por ninguna
  tienda de apps.
- **Sin ORM, sin librería de estado, sin componentes de terceros.** SQL escrito
  a mano y `fetch`. Es deliberado: menos capas que explicar y menos que se
  rompa solo con las actualizaciones.

**Estructura:**

```
app/
  (app)/        panel interno: pedidos, produccion, orden-de-compra, config
  (imprimir)/   páginas para imprimir en papel (planilla de producción)
  api/          endpoints REST
  catalogo/     catálogo público (consumidor final)
  mayorista/    lista de precios mayorista
  distribuidor/ lista de precios distribuidor
lib/            TODA la lógica de negocio vive acá
components/     componentes de React
```

**`lib/` es el corazón.** La regla es que la lógica de negocio no vive en los
componentes ni en las rutas: vive en `lib/` como funciones puras y testeables,
independientes de dónde estén guardados los datos. Por eso migrar de Turso a
Postgres/Supabase (Etapa 5+) significa cambiar un archivo (`lib/db.ts`) y no
tocar ninguna regla.

- `lib/produccion.ts` — todas las fórmulas de producción.
- `lib/pricing.ts` — la regla de precio por fecha de entrega y precio por canal.
- `lib/remito.ts` — el texto de remito para WhatsApp.
- `lib/planilla.ts` — la planilla semanal de producción que se imprime.
- `lib/leerPedidoPegado.ts` — lector de pedidos pegados de WhatsApp.
- `lib/db.ts` — esquema y conexión.

---

## 4. Modelo de datos

```
usuarios         (nombre, rol, telefono, pin, intentos_fallidos, bloqueado_hasta)
productos        (linea, formato, precio_hasta, precio_desde, fecha_corte)
clientes         (nombre, ciudad, lista_difusion, creado_en)
pedidos          (fecha_pedido, fecha_entrega, cliente_id, estado, texto_remito, canal)
pedido_items     (pedido_id, producto_id, cantidad, precio_unitario)
stock_insumos    (nombre, cantidad, actualizado_en)
catalogo_productos   (nombre, peso, descripcion, precio, precio_minorista,
                      precio_distribuidor, foto BLOB, minimo_propio, produccion_ref)
catalogo_textos      (clave, valor)
catalogo_condiciones (titulo, texto, orden, visible_mayorista, visible_distribuidor)
```

**Dos listas de productos, a propósito.** Esto confunde a todo el que llega:

- **`productos`** es la entidad **operativa**: la que usan pedidos y
  producción. Tiene los precios con fecha de corte (así se programa un aumento).
- **`catalogo_productos`** es la entidad **comercial**: lo que el cliente ve en
  la web, con foto, descripción y las listas por canal.

Los nombres **no coinciden** y está bien que no coincidan ("Alfajor de Maicena
x7" en la vidriera, `Maicena` + `x7` en la cocina). La columna
`produccion_ref` es el puente entre las dos, y se elige a mano desde el
editor de catálogo. **Si el puente no existe, el sistema avisa en vez de
adivinar.**

---

## 5. Reglas de negocio que no se deducen mirando el código

Estas son las que hay que respetar sí o sí. Cada una tiene una razón:

1. **El precio se calcula por la fecha de ENTREGA, no por la fecha en que se
   carga el pedido.** Cada producto tiene `precio_hasta`, `precio_desde` y
   `fecha_corte`. Así es como el negocio programa un aumento sin tener que
   acordarse de cambiarlo el día justo. (Es la misma regla que ya usaba el
   Excel — no se inventó acá.)

2. **Para mayorista manda SIEMPRE la lista operativa (`productos`), nunca el
   catálogo.** Esos precios son los que tienen la fecha de corte. Si el
   catálogo los pisara, el aumento programado no se aplicaría nunca. Para
   minorista y distribuidor el precio sale del catálogo, que es donde el
   cliente lo vio.

3. **Maicena y Frutal comparten la misma masa y el mismo amasijo.** Un amasijo
   rinde 1508 tapas = 754 alfajores. No se calculan por separado.

4. **Santafesino no amasija**: sus tapas se compran a Don Jesús (3 tapas por
   alfajor, 80 tapas por kilo). Nunca sumarlo al cálculo de amasijos.

5. **Las 5 variedades de Pepas se piden por separado pero se producen juntas.**
   Comparten masa: 10 DDL + 8 Membrillo + 5 Arándano = 23 bandejas = 414 pepas
   para las cuentas de amasijo, no tres cálculos distintos.

6. **Las constantes de producción son datos de campo verificados con Javier, no
   estimaciones.** 1508 tapas por amasijo, 45 horneadas por garrafa, 115
   alfajores por preparado de glasé, 15 paquetes x7 por caja. **No
   redondearlas ni "prolijizarlas" porque quedan más lindas.**

7. **Producción muestra dos números, no uno**: (a) lo que se entrega ese día
   puntual y (b) el acumulado de todo lo pendiente hasta esa fecha, que
   incluye los atrasos. El segundo es el que evita que se acumule deuda
   invisible.

8. **El número de lote es la fecha en formato `ddmmaa`, sin separadores.**
   17 de agosto de 2026 → `170826`. No es una decoración de la planilla: es el
   dato que producción copia a las cajas.

9. **Un pedido entregado ya no se produce.** Todas las consultas de producción
   filtran `estado != 'Entregado'`.

---

## 6. Decisiones tomadas y caminos descartados

Saber qué se descartó vale tanto como saber qué se eligió. Si una IA propone
alguna de estas, ya se evaluó y se dijo que no:

**Leer el WhatsApp real con una librería no oficial (Baileys, whatsapp-web.js)
— DESCARTADO.** Técnicamente simple, pero viola los términos de servicio de
WhatsApp y arriesga que Meta banee el número. Es el mismo número con el que el
negocio habla con todos sus clientes. Riesgo inaceptable.

**WhatsApp Business API oficial — DESCARTADO POR AHORA.** Sin riesgo de ban,
pero exige verificación de negocio ante Meta (semanas) y cambia cómo Mercedes
usa el número desde la app normal. Demasiada fricción para el problema.

**Usar IA para interpretar los pedidos — GUARDADO, NO DESCARTADO.** Los pedidos
que llegan por los catálogos de la casa los redacta **este mismo sistema**, con
un formato fijo (`10x Alfajor de Maicena x7 — $25.000`). O sea que se pueden
leer de forma exacta, gratis y sin riesgo de que se invente un producto. Meter
IA ahí agregaba una cuenta paga y un margen de error para resolver algo que ya
estaba resuelto. **Sí serviría** para los pedidos que el cliente escribe a mano
y para transcribir notas de voz — el código está guardado en
`docs/ia-pedidos-guardado/` para retomarlo cuando el uso lo justifique.

**El pedido leído nunca se guarda solo.** Prellena el formulario de siempre; el
cliente y la fecha de entrega los elige siempre una persona. Ese gesto de
"reviso y confirmo" es un requisito explícito, no una limitación técnica.

**Lo que no se pudo leer se muestra como aviso visible, con el motivo, y nunca
se descarta en silencio.** Regla general del sistema: **fallar a la vista, no
en silencio.**

---

## 7. Convenciones de interfaz (no son gustos, son requisitos)

- **Mobile-first de verdad.** El panel se diseña para una columna angosta de
  celular (`max-w-md`). El escritorio es el caso raro.
- **Botones grandes**, pensados para el pulgar y sin necesidad de precisión de
  mouse. Nada de íconos chiquitos como única forma de hacer algo.
- **Sin scroll horizontal.** Nunca.
- **Todo en español rioplatense**, incluidos los nombres de variables, tablas y
  campos del código. `fecha_entrega`, no `delivery_date`. El equipo tiene que
  poder leer una consulta y entenderla.
- **Los mensajes de error dicen qué hacer**, no qué falló. "El servidor no
  responde, probá de nuevo", no "Error 500".
- **Marca**: la app es de Nuestro Alfajor (paleta de dulce de leche, tapa
  horneada y glasé). Pie discreto "Desarrollado por Palanca Consultores".
- **Los textos que el negocio quiere cambiar van en la base, no en el código**,
  para que los dueños los editen sin depender de un despliegue.

---

## 8. Seguridad — el estado real, sin maquillaje

Esto está así a conciencia y con el riesgo aceptado para esta etapa:

- Login con celular + PIN de 4 dígitos. **El PIN se guarda en texto plano.**
- Hay freno de fuerza bruta: 4 intentos fallidos = 15 minutos bloqueado.
- La sesión dura un año (pedido explícito: que no pida el PIN cada vez).
- Los permisos por rol se validan **en el servidor**, no solo escondiendo
  botones. Francisco ve los precios pero no los puede cambiar, y la API lo
  rechaza aunque intente por afuera de la pantalla.
- **Límite conocido en iPhone**: Safari puede borrar solo las cookies si pasan
  7 días sin abrir la app (política ITP de Apple, no un bug). Se resuelve
  cuando se migre a Supabase Auth.

Al migrar a Supabase (Etapa 5+): PIN a hash y autenticación real por teléfono.

---

## 9. Qué NO hacer

- No agregar dependencias sin una razón fuerte. El stack es chico a propósito.
- No refactorizar lo que funciona "para que quede más prolijo".
- No cambiar las constantes de producción.
- No borrar los productos pausados.
- No hacer que el sistema adivine cuando le falta un dato: que avise.
- No guardar nada automáticamente que una persona debería confirmar.
- No agregar dos conceptos nuevos al mismo tiempo.
- No escribir la interfaz en inglés.

---

## 10. Estado al 13 de agosto de 2026

**Funcionando en producción:**
Pedidos (carga manual y pegando texto de WhatsApp) · remito de WhatsApp ·
producción por fecha con las 3 pestañas del proceso · stock simple ·
orden de compra consolidada · catálogo público · listas de precio por canal
(minorista / mayorista / distribuidor) · editor de catálogo · planilla de
producción semanal imprimible.

**Pendiente:** Etapa 4 (Producción Real) y Etapa 5 (stock automático, merma) ·
comprar el dominio `nuestroalfajor.com.ar` · IA para pedidos escritos a mano ·
remito con validez fiscal (comprobante clase R de ARCA, para los clientes que
viajan con mercadería y se la piden en la ruta).

**Publicación:** el despliegue sale de la rama `publicado`, no de `main`.

---

## 11. Si vas a escribir código para este sistema

Antes de proponer una solución, respondé estas cuatro:

1. **¿Qué etapa de la Hoja de Ruta toca?** Si agrega un concepto nuevo que no
   corresponde todavía, decilo antes de escribir nada.
2. **¿Dónde va la lógica?** Si es una regla de negocio, va en `lib/` como
   función pura. Si terminó adentro de un componente, está mal ubicada.
3. **¿Rompe alguna de las 9 reglas de la sección 5?**
4. **¿Lo puede usar Mercedes con el celular en una mano y las manos sucias?**

Y una advertencia práctica: **este equipo no lee código.** Cualquier cosa que
entregues tiene que venir explicada en castellano, paso a paso y sin jerga:
qué hace, dónde tocarlo si hay que cambiarlo, y qué se rompe si se toca mal.
