# Bitácora — Nuestro Alfajor

> **Qué es esto.** El registro corto de las decisiones que se fueron tomando en
> el desarrollo del sistema: qué se decidió, cuándo y **por qué**. No es la
> conversación, es la conclusión.
>
> **Para qué sirve.** Para abrir un chat nuevo (con Claude, con ChatGPT o con
> quien sea) y que arranque al día. Para que Francisco entienda por qué las
> cosas están como están. Para que dentro de seis meses te acuerdes vos.
>
> **La regla:** lo más nuevo va arriba. Cuando algo se termina, se agrega una
> entrada de 3 renglones. Si una decisión vieja se da vuelta, **no se borra** —
> se agrega la nueva arriba diciendo que reemplaza a la anterior.
>
> Documentos hermanos: [CONTEXTO_PARA_IA_Nuestro_Alfajor.md](CONTEXTO_PARA_IA_Nuestro_Alfajor.md)
> (el negocio y las reglas), [HOJA_DE_RUTA.md](HOJA_DE_RUTA.md) (qué falta),
> [../README.md](../README.md) (cómo funciona por dentro).

---

## Estado al 13 de agosto de 2026

**Qué está en vivo (rama `publicado`):**

| Dirección | Qué es | Quién entra |
|---|---|---|
| `nuestro-alfajor.vercel.app` | catálogo público + `/mayorista` + `/distribuidor` | cualquiera con el link |
| `nuestro-alfajor-ese9.vercel.app` | el panel interno (Pedidos, Producción, Stock, Orden de Compra, Planilla) | los 4 usuarios con PIN |

Las dos direcciones son el mismo programa y la misma base. Lo que separa una de
la otra es una llave de configuración (`CATALOGO_HOSTS`), no dos sistemas
distintos.

**Lo que hay que tener presente sí o sí:**

1. **Pushear `main` NO publica nada.** Lo que se ve en internet es la rama
   `publicado`. Es a propósito (ver 27/07).
2. **La base de tu computadora no es la de producción.** Probar en `localhost`
   no prueba nada de lo que ve la familia (ver 13/08).
3. **Los precios mayoristas salen de la lista de siempre**, nunca del catálogo
   comercial. Invertir esto rompe los aumentos programados (ver 04/08).

---

## 27 de agosto de 2026 — Totales por período en Pedidos

**Qué se hizo.** Dentro de Pedidos, un enlace "📊 Totales por período" que abre
una pantalla nueva (`/pedidos/totales`) con el detalle de unidades vendidas por
producto y el total en $ del período. Se elige el largo con tres botones —
**Semana**, **2 semanas**, **Mes** — y se mueve con las flechas ‹ ›, igual que
el calendario. La semana va de lunes a domingo; "Mes" es el mes del calendario.

**Qué precio usa.** El `precio_unitario` que quedó guardado en cada renglón del
pedido, que es el que se fijó según la **fecha de entrega** (regla 5.3). O sea:
el mismo número del remito. No recalcula nada.

**Qué pedidos cuenta.** Todos los que tienen entrega dentro del período, estén
Pendientes, con Remito Enviado o Entregados — es "lo vendido para esa fecha",
aunque todavía no se haya despachado. Se une por `fecha_entrega`.

**Dónde vive.** API `app/api/pedidos/totales/route.ts`, pantalla
`app/(app)/pedidos/totales/page.tsx` + `components/TotalesPedidos.tsx`. No toca
la barra de navegación (ya está llena con 5 pestañas): se entra desde el
selector `Calendario | Totales` arriba de las dos pantallas de Pedidos.

**Publicado el mismo día.** Se subió solo este cambio a `publicado` (commit
`c2ce1bf`), sin arrastrar nada más de `main`. Es la primera vez que se publica
una reforma suelta y no una etapa entera.

## 18 de agosto de 2026 — Cómo se decide la compra de la selladora

**Qué pasó.** Javier y Mercedes están prácticamente decididos a comprar una
selladora de banda continua (Smartpack SP55, $1.173.530 de referencia en Mercado
Libre; consiguieron una en Industria Cristian López, acá). Vienen mirándola hace
un año y van a ir a probarla antes de comprar. Se armó
[decision-compra-selladora-2026-08-18.html](decision-compra-selladora-2026-08-18.html):
el método de compra en 6 pasos, aplicado a esta máquina con los datos del sistema.

**Lo que dicen los números propios.** La máquina sella unas 3.600 bolsas/hora; el
armado, en su mejor hora, da 72 paquetes x7 (504 alfajores). **El cuello de botella
es el armado, no el sellado**: comprarla por velocidad es pagar algo que no se puede
usar. Se justifica por confiabilidad, por el lote `ddmmaa` impreso en el envase y
porque habilita el alfajor individual. Con supuestos de ejemplo el repago da ~17
meses — largo para justificarla solo por ahorro, y así quedó dicho.

**Dato que llegó el mismo día.** La bolsa impresa x7 es **polipropileno de 40
micrones**. Cae justo en el medio de los 20 a 80 que dice sellar la máquina, así que
por espesor no hay problema y hay margen para los dos lados. Queda una sola pregunta
para Insupar, que es la que decide: **¿es BOPP monocapa o tiene capa interna
termosellable?** El BOPP monocapa se encoge en vez de pegarse y tiene una ventana de
temperatura angosta. Si fuera ese el caso, el argumento **se refuerza**: una banda
continua sostiene temperatura fija y velocidad constante, que es justo lo que un
material arisco necesita. Se agregó un octavo criterio de aceptación — mirar a
contraluz si el plástico se arruga al costado del sello, que es la señal del BOPP.

**Lo que falta y es urgente.** Tres cosas antes de la visita: (1) la ficha técnica
de la bolsa impresa x7 a Insupar —material y micrones, porque la máquina sella de 20
a 80 y nadie sabe dónde cae la bolsa—; (2) llevar 30 paquetes armados **con la
bandeja plástica adentro**, que es lo que puede trabarse en una banda horizontal;
(3) escribir los criterios de aceptación antes de salir. Sin contestar quedó la
alternativa más barata: **¿el problema de sellado es la máquina vieja o es la
bolsa?** Si es la bolsa, la máquina nueva no lo arregla.

**Lo que se agrega como práctica.** La ficha de decisión: media carilla con qué se
compró, qué alternativas se miraron, qué se esperaba y cuándo se revisa (90 días).
Es la bitácora aplicada a las compras. Y el alfajor individual, aunque lo habilite
la máquina, sigue pasando por el Protocolo de Lanzamiento — la máquina resuelve el
envasado, no el lanzamiento.

## 18 de agosto de 2026 — Llegó el informe del sistema de Francisco

**Qué llegó.** Francisco le pasó a su ChatGPT el pedido que le habíamos armado
([PARA_FRANCISCO_informe-de-tu-sistema.md](PARA_FRANCISCO_informe-de-tu-sistema.md))
y contestó. Su sistema es, en una línea, **una tienda online**: Next.js +
**Supabase**, catálogo, carrito, compra sin registrarse, un panel `/admin` de
pedidos y Mercado Pago empezado. Descuenta stock de **producto terminado** al
confirmar el pedido.

**Qué no tiene.** Producción, recetas, insumos, orden de compra, costos,
facturación, contabilidad y reportes: todo declarado como "planeado" o "no está
hecho". Es decir, casi exactamente lo que sí tiene el nuestro.

**La advertencia que hay que tener presente.** El informe dice "no me consta"
incluso sobre su propio modelo de datos: no pudo listar las columnas de
`pedidos` ni las de `productos`. Es ChatGPT **recordando la conversación**, no
leyendo el código. Sirve para saber por dónde va, no para planificar una
integración. Antes de decidir nada hay que pedirle la **estructura real** de la
base (export del esquema de Supabase, sin datos) o el link al repositorio.

**Dónde se pisan los dos sistemas.** Dos catálogos públicos de la misma marca;
dos paneles de pedidos (el nuestro lo usa la familia todos los días); dos ideas
distintas de precio — el suyo tiene un precio por producto, el nuestro tres
listas (minorista / mayorista / distribuidor) con fecha de corte; y dos cosas
distintas llamadas "stock" — el suyo es producto terminado, el nuestro son
insumos.

**Hacia dónde parece ir la cosa (todavía sin decidir).** Repartir por frontera
en vez de fusionar: Francisco se queda con la **venta online** (carrito y
cobro, que nosotros no tenemos) y nosotros con el **motor interno** (pedidos,
producción, stock, compras). Un único punto de contacto: el pedido pagado entra
a la pantalla de Pedidos que ya existe.

## 14 de agosto de 2026 — Análisis bromatológicos: qué dijeron y qué se cambia

**Qué apareció.** Llegaron los tres certificados de la Cámara Arbitral de
Cereales (356830 / 357063 / 357718): la misma tanda de alfajor de maicena
medida a los 0, 7 y 15 días. Dos valores fuera de lugar: **Staphylococcus
aureus 300 UFC/g en el Día 0** y **hongos y levaduras que trepan de 90 a 1620
en una semana**. Coliformes y E. coli en Ausencia en los tres.

**Qué significa.** Son dos problemas distintos, en dos etapas distintas. El
estafilococo no sobrevive al horno: si está, entró **por contacto con las manos
después de hornear** (armado, relleno, envasado). Los hongos son **ambiente y
humedad**: esporas que caen sobre el producto ya horneado, más envasado en
tibio. Que coliformes y E. coli den Ausencia descarta agua, huevo crudo e
higiene de fondo — el problema no es suciedad, es contacto.

**Qué se decidió.** Guantes obligatorios en la mesa de armado y no envasar
hasta que el alfajor esté frío al tacto, las dos desde ya. Repetir el Día 0 con
toma estéril (para descartar que la muestra se haya contaminado al tomarla, que
explicaría sola los 300) y mandar a analizar el coco rallado solo. La hoja para
Mercedes quedó en
[analisis-bromatologico-para-mercedes.html](analisis-bromatologico-para-mercedes.html).

**Lo que falta y no es menor.** Los tres certificados tienen la columna
**«MAX CAA» en blanco** y el campo RNPA vacío: dan números pero no dicen
formalmente apto o no apto. Y **no se midió Salmonella**, que en un producto
con huevo suele ser exigida.

**Corrección del mismo día, sobre los hongos.** Al mirarlo mejor: el Día 0 dio
**90**, que es un valor bajo. Si el coco estuviera cargado, el Día 0 daría alto,
porque el coco se pega en el último paso. **No es un problema de contaminación
sino de crecimiento**: el agua del dulce de leche migra a la tapa y despierta a
las esporas que ya estaban. Con higiene sola no se elimina. Las palancas reales,
en orden: sacarle agua (dulce repostero, medir aw), sorbato de potasio, envasar
frío, y recién cuarto el coco. **El coco baja de qué número se arranca, no
cambia la pendiente.**

**Se da vuelta lo de los guantes (reemplaza a "guantes obligatorios" de más
arriba).** Bromatología, cuando les habilitó la fábrica, les había dicho que el
guante es **peor** que la mano pelada. **Tienen razón**, y es la posición oficial
acá y en Europa: la mano se lava y el guante no, el que usa guante se lava menos
porque se siente protegido, adentro hay calor y humedad, y los guantes de
pastelería se rompen todo el tiempo. (En EE.UU. la norma es al revés, así que el
tema está discutido de verdad — pero manda el que firma la habilitación.) **Queda:
barbijo y cofia sí, guantes no**, más protocolo de manos (sin anillos, uñas
cortas, **papel descartable y nunca toalla de tela**, alcohol al 70%) y regla de
que **quien tenga una herida o esté resfriado no arma ese día**.

**Corrección del 17/08 — el armado del maicena no es como yo suponía.** El dulce
va con **cuchara**, no con manga (la manga es para santafecino y pepa), sobre la
tapita **sostenida en la mano**; la tapa de arriba también va a mano; **el
excedente de dulce se saca con el dedo**; y el coco se aplica tomando el alfajor
con dos dedos. Son **cuatro contactos de mano por alfajor**, uno de ellos sobre
el dulce húmedo. Con eso los 300 de estafilococo quedan explicados y la
hipótesis del muestreo contaminado pasa a segundo plano. **La corrección número
uno es cambiar el dedo por una espatulita** (o dosificar para que no haya
excedente). Además usan **dulce repostero**, así que esa palanca contra los
hongos ya estaba tomada y sube en importancia medir aw.

**Dónde vive el informe.** El entregable con marca Palanca **no está en este
repositorio**: vive en la carpeta del cliente, junto a los otros informes, como
`Nuestro alfajor/Analisis_Bromatologico_NuestroAlfajor_PalancaConsultores.html`.
Es un HTML autocontenido (el logo va embebido, no hay ningún archivo suelto al
lado), así que se puede mandar por mail o abrir sin internet. En `docs/` quedó
solo el borrador de trabajo. **Los documentos de cliente no van en el repo.**

**Regla operativa nueva (coco).** Se compra en bolsas de 25 kg y se usa cargando
una bandeja donde se hace rodar el alfajor. El riesgo no es el coco: es el coco
con dulce de leche pegado, que a media jornada ya es medio de cultivo. **Lo que
entra a la bandeja no vuelve nunca a la bolsa.** Más: cambio por tanda con
criterio fijo, dos bandejas rotando (una húmeda es peor que una sucia),
fraccionar los 25 kg apenas llegan, y guardar cerrado sobre tarima.

**La prueba barata que define todo.** Analizar a los 7 días un maicena (con coco)
y un **Chocolate Semiamargo** (sin coco) de la misma tanda. Si el chocolate
también da mil y pico, el coco no tiene nada que ver y es agua y ambiente.

---

## 13 de agosto de 2026 — Documentos para trabajar con Francisco

**Qué se decidió.** Preparar dos documentos y pasárselos: uno con todo el
contexto del negocio para que se lo dé a su ChatGPT, y otro con un pedido de
informe para saber qué construyó él.

**Por qué.** Francisco está armando su propio sistema con ChatGPT y los padres
están orgullosos de eso. Pelearlo sería perder. La jugada es integrarlo: si el
sistema lleva su firma, la familia lo adopta más rápido.

**El riesgo que esto tapa.** Si los dos sistemas calculan precios con reglas
distintas, el negocio factura mal. El documento fija la regla nuestra por
escrito.

---

## 13 de agosto de 2026 — Planilla de producción semanal (PUBLICADA)

**Qué se decidió.** Botón "Planilla de la semana" en Producción, que imprime
media hoja A4 (A5 apaisado), de lunes a sábado, con las cantidades ya
precargadas desde los pedidos.

**Por qué.** Mercedes lo pidió en la visita del 12/08: querían reemplazar la
hoja de la libreta anillada donde anotan a mano.

**Tres cosas que no son obvias.**
- La fecha en formato `ddmmaa` de la primera columna **es el número de lote**
  del día, no una fecha decorativa.
- Producción le dice **CN = Chocolate Negro**; en el sistema ese producto se
  llama **Chocolate Semiamargo**. Es el mismo.
- La hoja entra por 4 milímetros. Cualquier cosa que se agregue al membrete la
  desborda.

---

## 13 de agosto de 2026 — Descubrimiento: la base local no es la de producción

**Qué pasó.** Al publicar la planilla salía cargada en la computadora y vacía
en internet. No era un error: en la base de desarrollo hay pedidos pendientes
de prueba y en la de producción los 20 pedidos están todos "Entregado".

**Por qué importa.** Verificar algo en `localhost` no prueba que en producción
se vea igual. De ahora en adelante, lo publicado se verifica en vivo.

**Lo que NO hay que hacer.** Cargar pedidos de prueba en producción para
verificar — ensucia la base real del negocio.

---

## 12 de agosto de 2026 — Remito con validez fiscal (PENDIENTE, no resuelto)

**Qué apareció.** Los clientes que viajan con la mercadería reciben controles
en la ruta y les piden comprobantes. Alejandro quedó en averiguar qué hace
falta.

**La confusión a evitar.** El "remito" que hoy genera el sistema es **texto
para pegar en WhatsApp**. No sirve para un control en ruta. Son dos cosas
distintas con el mismo nombre.

**Qué haría falta de verdad.** Comprobante clase R con CAI, talonario impreso
por imprenta habilitada, numeración correlativa, por triplicado. Falta
confirmar con el contador qué exige Entre Ríos además.

---

## 4 de agosto de 2026 — Pegar pedidos de WhatsApp, sin IA a propósito

**Qué se decidió.** Una ventana donde se pega el mensaje de WhatsApp del
cliente y el pedido se carga solo. **Sin inteligencia artificial.**

**Por qué.** Los tres catálogos redactan el mensaje ellos mismos, así que el
sistema lo lee exacto y gratis. Usar IA implicaba una cuenta paga y margen de
error, para resolver un problema que no teníamos.

**Qué se guardó por las dudas.** El código con IA quedó en
`docs/ia-pedidos-guardado/`, no borrado. Serviría solo si algún día hay que
leer mensajes escritos a mano o notas de voz.

---

## 4 de agosto de 2026 — Precio según el canal

**Qué se decidió.** Cada pedido tiene un canal: mayorista, distribuidor o
minorista, y el precio sale de donde corresponde.

**La regla que no se toca.** Para **mayorista manda la lista de siempre**
(la tabla de productos con su fecha de corte), porque esos precios son los que
tienen el mecanismo de aumentos programados. Consumidor final y distribuidor
salen del catálogo comercial.

**Dato de fondo.** Los 56 pedidos históricos son todos mayoristas, por eso un
pedido viejo sin canal se lee como mayorista.

---

## 3 de agosto de 2026 — Alta de productos nuevos desde Configuración

**Qué se decidió.** Botón para cargar un producto nuevo sin tocar código.

**Por qué.** Cada producto nuevo era un pedido a Alejandro. Ahora lo hace la
familia sola.

---

## 30 de julio de 2026 — Orden de las solapas y condiciones por canal

**Qué se decidió.** En `/mayorista` y `/distribuidor` las solapas van:
**Pedidos primero**, y Condiciones comerciales y Quiénes somos al final. En
`/distribuidor` no aparece "Cuánto ganás".

**Por qué.** El que entra quiere pedir, no leer. Y a un distribuidor no se le
muestra la cuenta de cuánto gana revendiendo.

---

## 30 de julio de 2026 — Incidente: dos ventanas de Claude sobre el mismo repo

**Qué pasó.** Había dos sesiones trabajando en paralelo en el mismo proyecto y
una pisó a la otra al publicar. Un cambio quedó afuera sin que diera error.

**La lección.** Antes de publicar algo, verificar que nadie más haya movido la
rama. Si hay otra ventana abierta, avisar.

---

## 28 de julio de 2026 — Tres listas de precios

**Qué se decidió.** Tres puertas separadas: `/catalogo` (consumidor final, sin
solapas, scroll único), `/mayorista` (con mínimos) y `/distribuidor` (sin
mínimos).

**Por qué.** Cada uno compra distinto y no todos tienen que ver los mismos
números. El simulador de reventa además permite fijar el margen en pesos, no
solo en porcentaje, porque así es como razonan los revendedores.

---

## 27 de julio de 2026 — Se publica de a una etapa (rama `publicado`)

**Qué se decidió.** Vercel dejó de publicar `main` y pasó a publicar una rama
nueva llamada `publicado`. Cada etapa terminada se pasa a mano, de a una, y
solo cuando Alejandro lo dice.

**Por qué.** El desarrollo va mucho más rápido de lo que la familia puede
absorber. Ese día había 19 cambios acumulados: un solo push les hubiera tirado
encima Stock, Producción en pestañas y Orden de Compra el mismo día. *"La idea
es NO atormentarlos con cambios bruscos."*

**Consecuencia diaria.** Que algo esté terminado no significa que esté en vivo.
Y eso **no es un atraso**: es la decisión.

---

## 27 de julio de 2026 — Catálogo público editable

**Qué se decidió.** El catálogo pasó de ser una página HTML que había que
regenerar a mano cada vez que cambiaba un precio, a leerse de la base y
editarse desde el panel: textos, fotos, sellos, condiciones y mínimos.

**La regla que salió de acá.** **Todo es dato, no constante.** Si un número
vive en el código y su texto en la base, el texto dice una cosa y el sistema
hace otra. Ya costó un error, no se repite.

**Dos arreglos de fondo que no hay que deshacer.** Uno que impedía que se vieran
los cambios recién guardados (caché), y otro que hacía que la carga inicial de
datos se cortara por la mitad.

---

## 24 de julio de 2026 — Producción cuenta paquetes, no alfajores sueltos

**Qué se decidió.** La pantalla de Producción muestra paquetes x7, bandejas x14
y pepas, con "Paquetes a producir" arriba de todo.

**Por qué.** En la fábrica nadie piensa en alfajores sueltos. Piensan en
paquetes. El sistema tenía que hablar el idioma de ellos, no al revés.

---

## 23 de julio de 2026 — Pedidos como calendario mensual

**Qué se decidió.** Los pedidos se ven en un calendario del mes en vez de una
lista con páginas.

**Por qué.** Lo que importa no es "cuántos pedidos hay" sino "qué entra el
jueves". El calendario contesta esa pregunta de un vistazo.

---

## 16 de julio de 2026 — Etapa 3: Orden de Compra

**Qué se decidió.** Orden de compra consolidada, agrupada por proveedor y con
los costos.

**Por qué.** Para comprar una vez por proveedor en lugar de ir sumando a mano
lo que hace falta de cada insumo.

---

## 16 de julio de 2026 — Los lanzadores `.bat` quedan fuera de git

**Qué se decidió.** Los archivos "PROBAR - ..." de doble clic viven solo en el
disco de Alejandro, no en el repositorio.

**Por qué.** Son una comodidad personal para probar cada etapa sin abrir la
terminal. En el repositorio le ensucian el proyecto a cualquier otro que lo
abra. **No volver a agregarlos.**

---

## 15 de julio de 2026 — Etapas 1 y 2

**Qué se decidió.** Etapa 1: Stock simple, con "Stock actual" y "Falta
comprar". Etapa 2: Producción separada en 3 pestañas, mostrando los insumos
crudos.

**Por qué.** Entregar de a pedazos usables en vez de un sistema entero de golpe.
Cada etapa se puede probar sola.

---

## 13 y 14 de julio de 2026 — Etapa 0: el arranque

**Qué se decidió.** Pedidos + Remito + "Mañana", con la base de datos en Turso
para poder publicarlo en internet. Edición y borrado de pedidos, los estados
pintados en verde, y el logo real de la empresa.

**Por qué Turso.** Porque el sistema tenía que estar en internet y funcionar
desde el celular en la fábrica, no en una computadora sola.

---

## Pendientes abiertos (al 14/08/2026)

- **Límites del CAA por escrito** — pedirle a la bromatóloga cuál es el máximo
  que aplica a cada determinación para alfajores de maicena. Sin eso los
  certificados no dicen apto ni no apto (ver 14/08).
- **Salmonella y actividad de agua** — agregar ambas al próximo análisis.
- **Remito fiscal** — averiguar con el contador qué exige Entre Ríos. No
  empezado.
- **PIN de los usuarios** — los 4 siguen en `1234` hasta que cada uno lo cambie
  desde Configuración.
- **Fotos de Pepas** — faltan las 3.
- **Foto del Frutal** — es una edición con IA y tiene impresa la descripción de
  la Maicena. Alejandro decidió dejarla igual sabiendo eso.
- **Precios mayoristas a la vista** — `/mayorista` es público: cualquiera con el
  link ve esos precios. Quedó pendiente decidir si se le pone un código.
- **Pepas Arándano y Frutos del Bosque** — pausadas hasta conseguir un proveedor
  de mermeladas más barato. Están en el sistema pero fuera del catálogo. **No es
  un error de datos.**
