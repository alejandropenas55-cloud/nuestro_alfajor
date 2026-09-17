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

## 17 de septiembre de 2026 — Insumos con precio editable + Recetas por producto

Hasta ahora el precio de cada materia prima vivía en un array fijo dentro del
código (`lib/costos.ts`): cambiar un precio, o agregar un insumo nuevo,
necesitaba tocar código y publicar de nuevo. Se migró esa tabla a la base
(tabla `insumos`, editable desde la pantalla nueva **/insumos**) y se agregó
una pantalla **/recetas** para cargar, producto por producto, qué insumos y
en qué cantidad lleva una unidad de venta. El costo de cada producto (y el
margen contra el precio de venta) se calcula solo sumando cantidad × precio.

**Por qué.** Alejandro pidió que actualizar el precio de un insumo compartido
(harina, dulce de leche) alcance una sola vez para que se refleje en todos los
productos que lo usan, en vez de tocar código cada vez.

**Qué NO cambió.** El motor de `lib/produccion.ts`/Orden de Compra sigue
calculando por LOTE de amasijo para decidir cuánto comprar — esa lógica no se
tocó. Lo único que comparten las dos cosas es el precio del insumo: Orden de
Compra ahora lo lee de la tabla `insumos` en vez del archivo fijo.

**Actualización el mismo día — las 11 recetas ya se cargaron.** Se migraron
desde `lib/produccion.ts` (que ya coincidía 1:1 con
`Costos_NuestroAlfajor_2026-09_amasijo-por-sueldos.xlsx`) a la base: masa,
relleno, glasé y packaging de Maicena x7/x14, Frutal x7, Santafesino x7 y las
5 variedades de Pepas. También se cargó la masa y el baño de Chocolate
Semiamargo y Chocolate Blanco (hoja 08, ya confirmados: masa igual a
Maicena/Frutal, precio $12.000/kg, 8,02g/8,24g de baño por alfajor). Se
agregaron 3 insumos que faltaban: "Tapas malteadas (Don Jesús)" ($50/u) y
los dos chocolates de cobertura.

**Dulce de leche en Chocolate Blanco, no en Semiamargo.** El catálogo
(`lib/catalogo.ts`) dice que el Blanco "lleva relleno de dulce de leche" pero
la descripción del Semiamargo no menciona relleno — y la hoja 08 del Excel
marca exactamente esa duda como pendiente ("confirmar cuál lleva el
semiamargo"). Se cargó dulce de leche solo en el Blanco, con la misma
cantidad que Maicena (25,51 g/alfajor), tal como confirmó Alejandro. El
Semiamargo queda sin relleno hasta que se confirme con Javier.

**Sigue pendiente:** el packaging de los dos chocolates (¿misma bandeja x7 +
bolsa que Maicena? todavía no confirmado en la hoja 08), la merma de
chocolate al bañar, y la mano de obra de amasijo/bañado — esas no entran en
esta receta de costo de materia prima, son otra pieza del costeo. Y esta
carga se hizo en la base de **desarrollo** (Turso `nuestroalfajor-dev`): hay
que repetirla en la base de producción cuando el sistema de Insumos/Recetas
se publique.

**Corregido el mismo día.** Alejandro aclaró dos cosas que la hoja 08 tenía
mal o sin confirmar: (1) el Chocolate Semiamargo (CN) **sí** lleva dulce de
leche, misma cantidad que Blanco y Maicena — se agregó; (2) la masa de los
dos chocolates **NO** es la misma que la de Maicena/Frutal (la hoja 08 lo
daba como supuesto "SI/SI" sin confirmar) — se sacó la masa que se había
copiado de Maicena. Los dos chocolates quedan por ahora solo con
chocolate + dulce de leche; **falta la receta real de la masa**, que Alejandro
todavía no pasó.

---

## 12 de septiembre de 2026 — El cambio de equipo de armado se propagó al Plan Económico Financiero

El `PlanEconomicoFinanciero_NuestroAlfajor_2026-09.xlsx` (hoja 01) todavía tenía
a María y Francisco a $5.000/hora y el rendimiento viejo de armado (410,67
alfajores/hora, promedio de la curva de cansancio 504→392→336). Se actualizó:
María y Jessi a $6.000/hora, rendimiento a 728/hora. También se anotó en la
hoja 11 · Qué falta el avance parcial del costeo de CN/CB.

**Corregido más tarde el mismo día.** La presentación HTML SÍ correspondía a
la entrega de la semana 11 / Fase 7 (confirmado en
`docs/cierre-etapa1-y-puente-2026-09-11.html`: "7 fases en 11 semanas...
viernes 11 de septiembre se cumple la semana 11") y **todavía no se había
presentado** — Alejandro la va a dar el lunes 14/09 junto con el Excel. No era
una foto ya entregada, era un borrador. Se actualizó: el párrafo de "El
armado" (ahora dice 728 alfajores/hora con María+Jessi+Javier, ya no 410 con
2 personas) y el recuadro de los chocolates (precio real $12.000/kg y ~8g de
baño en vez del supuesto de $10.000/kg y 20g, más la mano de obra ya cargada).
El resto de la presentación (fijos, retiros, escenarios) sigue igual porque
esos datos siguen sin llegar.

---

## 12 de septiembre de 2026 — Armado con cinta de coquera: nuevo equipo, nueva capacidad

Francisco pasó de armado a amasijo (ya reflejado en la hoja 07 de sueldos) y
se incorporó **Jessi** en armado, a $6.000/hora — mismo valor que **María**,
a quien también le subieron de $5.000 a $6.000/hora desde el relevamiento de
junio.

El proceso de armado cambió: María y Jessi arman con manga y colocan en la
**cinta de la coquera**, Javier recibe los alfajores ya encocados y los
coloca en las bandejas. Entre los tres llegan a **728 alfajores/hora** (52
paquetes x14), cronometrado en fábrica — bastante más que el máximo viejo de
504/hora con María + Francisco solos. Se actualizó `CAPACIDAD_ARMADO` en
`lib/produccion.ts` con este dato; **no se inventó una curva de cansancio**
para la 2da y 3ra hora porque todavía no se cronometró con este equipo.

También mencionaron que 4 personas armando + 1 recibiendo soportaría el
proceso, pero **esa configuración todavía no se probó** — quedó anotado en
la hoja 06 del libro de costos como hipótesis, no como dato real.

**Por qué importa para el costeo:** como Javier y Mercedes (que bañan CN y
CB) no tienen sueldo asignado, se usa la tarifa de María/Jessi ($6.000/hora)
como proxy del costo de mano de obra del bañado en la hoja 08. Es una
decisión de Alejandro, documentada como comentario en esa celda.

---

## 12 de septiembre de 2026 — Primeros datos reales de CN y CB, todavía incompletos

Mercedes bañó **1050 alfajores** (686 semiamargo/CN, 364 blanco/CB) el
11/09/2026, de 11 a 19hs con 1,5h de corte: **6,5h efectivas**. Se usaron 5,5kg
de chocolate negro y 3kg de blanco, a $12.000/kg los dos ($240.000 los 20kg).

Con eso se cargaron en la hoja `08 · Chocolates CN y CB` de
`Costos_NuestroAlfajor_2026-09_amasijo-por-sueldos.xlsx`: precio del chocolate,
gramos por alfajor (8,0g CN / 8,2g CB) y un **rendimiento de bañado combinado**
de 161,5 alfajores/hora — combinado porque el tiempo no se cronometró por
separado entre negro y blanco, así que se aplicó el mismo a los dos.

**Sigue faltando el costo de mano de obra del bañado.** Javier y Mercedes no
tienen sueldo asignado, usan el dinero como un fondo único — la hoja 08 asume
un $/hora, y ese modelo no aplica tal cual a ellos. Hasta que se defina un
criterio para asignarle un valor-hora a ese trabajo, "COSTO POR ALFAJOR" sigue
diciendo FALTAN DATOS.

---

## 8 de septiembre de 2026 — Diciembre ya se resolvió una vez, y no con alfajores

Javier y Mercedes dijeron que **diciembre les va bien porque hacen budines y pan
dulces**, y que **enero y febrero son «una muerte»**. Las dos cosas cambian el
plan económico financiero.

Lo de enero y febrero baja los índices del año de 10% y 35% a **8% y 20%** de
agosto: el año pasa de 9,2 a **8,9 meses equivalentes de venta contra 12 de
sueldos**. Con eso, los escenarios 2 y 3 pasan de 2 a **3 meses en pérdida**, y
el 3 (sucursal en Santa Fe) sigue dejando menos que no hacer nada: 79,4 M contra
83,7 M.

Lo de diciembre es más importante que el número. **La fábrica ya llenó un valle
una vez y no lo hizo vendiéndole más al mismo cliente ni bajando el precio: lo
hizo cambiando de producto.** Enero y febrero piden exactamente lo mismo. Además
deja tres agujeros abiertos: los budines y pan dulces **no están costeados ni
cargados en ninguna hoja** del plan (el 55% de diciembre del modelo es solo
alfajores), no se sabe si comparten horno y gente con el amasijo —si lo hacen,
en diciembre no hay capacidad libre—, y el budín, a diferencia del pan dulce,
**no es estacional por producto sino por costumbre**: nada impide venderlo en
enero.

Cambió: hoja `05 · El año real` del Excel (punto 4 nuevo y sexta palanca «un
producto de enero»), el tablero HTML, y la lista de la hoja 11 · Qué falta.

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

## 8 de septiembre de 2026 — El valle: julio vende el 12% de agosto

**Qué se corrigió.** La primera versión del plan trató a julio como un mes
incompleto por arranque del sistema. **No lo es**: julio está cargado entero y
ese es el dato. Julio (del 14 al 31, que es cuando arrancó el sistema) facturó
**$2.748.700 contra $23.107.200 de agosto**. El fuerte de la fábrica son clubes
y escuelas, y en los recesos de invierno y verano ese canal no baja: se apaga.

**Lo que muestran los números.** En agosto se usó el 99,3% de la capacidad de
amasijo; en julio, el 12%. El mismo alfajor cargó **$24 de mano de obra de
amasijo en agosto y $197 en julio**, porque los dos sueldos se pagan igual. Con
solo los dos costos fijos que hoy conocemos, **julio ya da pérdida**. El año
tiene **9,2 meses de venta y 12 de sueldos**.

**Lo que cambia en el plan.** No es un problema de capacidad sino de calendario,
y da vuelta el orden de la expansión: crecer sobre los meses buenos (Santa Fe,
cuarto amasijo) suma costo fijo los doce meses para vender más solo en los que
ya eran buenos — el escenario de sucursal propia **deja menos que no hacer
nada**. Santa Fe, Esperanza y Rafaela además tienen el mismo calendario escolar
que Paraná: expandirse ahí no diversifica la estacionalidad, la multiplica.
Primero el valle, después el pico.

**Qué se agregó.** Hoja `05 · El año real` en el libro del plan (comparación
julio/agosto, el año completo con índice por mes, la meta del valle en paquetes,
y las palancas candidatas: turismo de la costa del Uruguay en enero y febrero,
minorista y kioscos, regalo de fin de año para empresas, y costo flexible).
Producir en el valle para vender en el pico está bloqueado por la vida útil de
30 días. **Pendiente:** enero, febrero y diciembre siguen siendo supuestos de
Palanca — pedírselos a Mercedes.

---

## 8 de septiembre de 2026 — Arranca el plan económico financiero (Fase 7)

**Qué se hizo.** El motor de números del plan a 12 y 36 meses:
`PlanEconomicoFinanciero_NuestroAlfajor_2026-09.xlsx` (11 hojas, todo lo que se
carga está en amarillo en la hoja 01) y el tablero para presentarlo,
[plan-economico-financiero-2026-09-08.html](plan-economico-financiero-2026-09-08.html).
El punto de partida no es una estimación: **son las ventas reales de agosto
leídas de la base del sistema** — 103 pedidos, 6.521 paquetes, 80 clientes,
$23.107.200.

**El hallazgo.** En agosto se usaron **77,4 de los 78 amasijos** que entran en
un mes: el **99,3% de la capacidad**. La fábrica está llena. Ninguna decisión
comercial (Santa Fe, distribuidor, empujar los chocolates) se puede tomar antes
de destrabar producción, porque hoy una venta nueva le saca el lugar a una que
ya existe.

**Lo que el plan todavía no tiene.** De los costos fijos solo están cargados los
sueldos de amasijo (sin confirmar) y la luz. Faltan alquiler, combustible,
impuestos, seguros y **cuánto retiran Javier y Mercedes**. Mientras falten, todo
resultado que muestre el plan es optimista por construcción, y así está dicho en
el tablero. Por decisión de Alejandro, el plan **no modela** el paso a
Responsable Inscripto: se armó con la situación fiscal tal como está hoy.

---

## 7 de septiembre de 2026 — Los dos chocolates se venden sin estar costeados

**Qué se descubrió.** El Chocolate Semiamargo (CN) y el Chocolate Blanco (CB)
ya están en el catálogo a $4.000 el x7 y ya se producen —figuran en la planilla
semanal— pero **nunca pasaron por la Fase 2 del Protocolo de Lanzamiento**: no
existe ficha técnica, ni precio del chocolate por escrito, ni gramaje del baño,
ni tiempo de bañado. Hoy nadie sabe cuánto cuestan.

**Por qué importa.** Es el mismo agujero que dejó a Pepas Frutos del Bosque con
margen casi cero, con la diferencia de que estos dos ya se están vendiendo. El
bañado además es **trabajo nuevo** que no está costeado en ninguna hoja: no es
amasijo, no es armado.

**Qué se hizo.** Hoja `08 · Chocolates CN y CB` en el mismo archivo de costos,
con la cuenta ya armada y las celdas de carga marcadas en amarillo, más el
checklist de lo que hay que traer de la fábrica (Fase 1 del protocolo). Mientras
falte un dato, el total dice **FALTAN DATOS** en vez de mostrar un número
tranquilizador y falso. El único supuesto puesto por nosotros es que la masa es
la misma que la del maicena — está marcado como "confirmar con Javier".

**Nombres.** Van los del packaging ya impreso: Chocolate Semiamargo y Chocolate
Blanco. En producción les dicen CN y CB. No se usa "bañado negro".

---

## 7 de septiembre de 2026 — El amasijo pasa de destajo a dos sueldos fijos

**Qué cambió en la realidad.** Se fue la persona a cargo del amasijo. Hoy lo
hacen Francisco (~$900.000/mes) y un primo de él (~$500.000/mes) y entre los dos
llegan a 3 amasijos por día. Los dos montos son de memoria de la charla en
fábrica del 04/09/2026 y **están sin confirmar**.

**Por qué importa.** El AS-IS de junio costeaba el amasijo a destajo: $13.000
por amasijo hecho. Era un costo variable — si no se amasijaba, no se
pagaba. Ahora son sueldos fijos: el costo por alfajor dejó de ser un dato del
proveedor y pasó a ser una consecuencia de la productividad del equipo. Con
3 amasijos/día y 26 días, el amasijo cuesta $17.949 en vez de $13.000 (+38%),
y harían falta 4,1 amasijos por día para volver al costo de antes. Con eso,
Pepas Frutos del Bosque pasa a margen negativo (-1,7%).

**Dónde vive.** Hoja nueva `07 · Amasijo por sueldos` en
`Costos_NuestroAlfajor_2026-09_amasijo-por-sueldos.xlsx` (carpeta "Nuestro
alfajor", fuera del repo). Es una copia del AS-IS de julio: las hojas 00 a 06
quedaron **sin tocar**. Las casillas amarillas son las únicas que se cargan a
mano (sueldos, amasijos por día, días por mes). El sistema todavía **no**
registra costos de personal — ver la Hoja de Ruta.

---

## 8 de septiembre de 2026 — Diseño de la línea de armado y envasado (Palanca Consultores)

**Qué se hizo.** Resumen de trabajo con Palanca Consultores sobre cómo ubicar
cada bien de uso en la zona de armado/envasado para optimizar el recorrido.
Define 6 puestos en orden: llegada de tapas desde zona 2 → mesa de armado (2 a
4 personas, con manga) → empanadora/coquera de 4 (encocado) → recepción +
bandejeado + envasado (1 persona) → selladora actual (con espacio reservado al
lado para la Smartpack SP55, compra todavía no cerrada) → armado de cajas x7 +
etiqueta. Regla del recorrido: entra por el lado de zona 2, sale por el lado
del depósito, nunca vuelve atrás.

**Cambios de proceso confirmados.**
- El enfriado pasó a ocurrir en zona 2 — las tapas llegan siempre frías a
  armado. Ya no hace falta lugar de enfriado en esta zona.
- El aire acondicionado tiene manguera de desagote a una rejilla — resuelto el
  riesgo de humedad/hongos que traía. Queda cuidar que el chorro no apunte a la
  mesa de armado ni al producto abierto.
- **El encocado dejó la bandeja de coco y pasó a una empanadora de milanesas
  (coquera de 4).**
- **El dulce de leche se coloca con manga (maicena incluida), no con
  cuchara** — se eliminó el dedo y la espátula para el excedente. Reduce el
  contacto de mano sobre dulce húmedo; corrige el hallazgo de Staphylococcus de
  los análisis bromatológicos de agosto. Quedaba pendiente registrar este
  cambio acá.

**Corrección importante sobre el plano.** La puerta que va a la calle en
realidad no da a la calle: está en un **costado** del salón (al lado del aire
acondicionado) y conecta con el **depósito**, que funciona a la vez como
despacho y recepción de mercadería. Esto cruza materia prima entrante y
producto terminado saliente en el depósito (se resuelve separando en el
tiempo, o con estanterías en lados opuestos) — y cambia la forma del recorrido
en el plano de zona 1 (deja de ser línea recta si la puerta no queda enfrentada
a la conexión con zona 2). **Pendiente corregir** en el artifact
`5d1c5c9a-03f6-466a-ba00-907b445bde45` en cuanto se sepa en qué pared exacta
está esa puerta.

**Datos que faltaban, ya resueltos.**
- **El ítem 4 del relevamiento ES la coquera**, no una sobadora — estaba mal
  identificado desde el primer relevamiento (la foto de la máquina de rodillos
  es la empanadora de milanesas). Es eléctrica y mide 0,80 × 0,40 × 0,14 m; ya
  quedó corregida y escalada en el plano, en el lugar donde estaba.
- **La puerta al depósito está en la pared izquierda, en el aire
  acondicionado** (el A/A ya estaba ubicado ahí), y **mide 920 mm de ancho**.
  La "puerta a la calle" que figuraba arriba a la derecha estaba inventada y se
  eliminó. En el editor la puerta pasó a ser un objeto más: se selecciona, se
  arrastra a lo largo de su pared y se afina con las flechas del teclado, y su
  posición se guarda junto con la de los muebles.
- **El botón "Guardar cambios" del plano puede aparecer deshabilitado** ("guardado
  no disponible") según desde qué vista se abra el artefacto, y así se perdió una
  tanda de ubicaciones el 8-Sep. Desde entonces el editor guarda cada movimiento
  en el navegador de la máquina (localStorage) y lo recupera al recargar, y tiene
  una tarjeta "Copia de seguridad" con un botón para copiar todas las posiciones
  como texto y pegárselas a Claude, que las publica desde su lado. Nunca más
  depender solo del botón.

**Qué se guarda debajo o encima de otro mueble (no ocupa piso).** Al revisar los
solapamientos del plano, Alejandro aclaró que no son errores de dibujo:

- La **batidora (13) va guardada debajo de la mesa de dulce de leche (6)**.
- La **bañadora de chocolate (7) va apoyada sobre esa misma mesa**.
- Los **canastos blancos (11) y negros (12) se guardan debajo de la mesada de
  acero (3)**. Entran: la mesada tiene 600 mm de profundidad y los canastos
  miden 360 y 300 mm de ancho.
- **En el pasillo solo quedan los canastos que llegan fríos de horneado**, con
  las tapas embolsadas adentro. Esos son los que están dibujados en el plano
  (11 y 12), y **pueden estar apilados hasta 4 canastos de alto**. El resto va
  debajo de la mesada.
- La **selladora (14) se guarda en el estante en diagonal, a unos 45°** — por eso
  el editor ahora permite girar cualquier mueble al ángulo que sea, no solo de
  a 90°.

Esto cambia el cálculo de circulación: hay que contar el piso libre **sin** esos
cuatro ítems. Con la mesa de armado donde está hoy (x 1350-2150, y 700-3100), el
paso libre queda en **0,94 m del lado derecho** a lo largo de casi toda la mesa,
angostándose a **0,64 m** donde arranca la mesada de acero; y **0,95 / 0,90 m del
lado izquierdo**, angostándose a **0,75 m** en la selladora y a **0,69 m** en la
sobadora de respaldo — ese es el punto más estrecho de la zona.
- La pileta de lavado es la de zona 2 (mesada con bacha, ítem 7): no hay pileta
  propia en armado. Pendiente confirmar con bromatología si la mucheta cuenta
  como "entrada al sector".
- En la mesa de armado (ítem 5, 0,80 × 2,40 m) trabajan 4 personas armando + la
  coquera + quien recibe y envasa: los puestos 2, 3 y 4 comparten esa mesa.

**Diagrama de recorrido.** Artifact `367e193a-f92f-4301-b859-345e573742db`, con
los 6 puestos sobre las posiciones reales. Los puestos 4 (envasado) y 6 (armado
de cajas) no tienen mueble propio: el 4 usa el extremo de la mesa, el 6 está
ubicado junto a la puerta del depósito, a confirmar en el piso.

**La SP55: el problema NO era el que yo había anotado.** Primero anoté que entre
la selladora y la mesa de armado quedaban 0,70 m y que la banda continua
necesitaba 1,5-2 m, como si la selladora fuera un puesto fijo contra la pared.
Alejandro corrigió: **la selladora no se usa donde está dibujada**. En el estante
solo se **guarda**, apoyada en diagonal (unos 45°); para trabajar **se la lleva a
la mesa de armado o a la mesada de acero, apoyada sobre los canastos**.

Con eso, el metro y medio de tirada recta hay que medirlo sobre la superficie
donde se la usa, y ahí entra: la **mesa de armado tiene 2,40 m de largo** y la
**mesada de acero 1,90 m**. La restricción real no es el espacio del salón sino
**la mesa compartida**: si la SP55 se monta a lo largo de la mesa de armado, ese
tramo se lo saca a los 4 armadores + la coquera + el que recibe y embasa. Eso es
lo que hay que resolver antes de cerrar la compra, no la distancia a la pared.

---

## 5 de septiembre de 2026 — Relevamiento de planta: plano de armado/embasado y amasijo/horneado

**Qué se hizo.** A partir de dos croquis a mano, dos planillas de equipamiento
(una por zona), fotos del local y el plano municipal (Dirección de
Planificación, Municipalidad de Paraná), se armó un plano esquemático a escala
de las dos zonas de producción y una planilla con los 29 ítems de equipamiento
relevados (15 en zona 1, numeración en círculo; 14 en zona 2, numeración en
cuadrado — son dos secuencias independientes, no continúan una a la otra).

**Medidas confirmadas.** Ancho interior 3,39 m. Zona 1 (armado y embasado):
4,83 m de fondo. Zona 2 (amasijo y horneado): 5,80 m de fondo, separada de la
zona 1 por una mucheta con cortina (sin puerta). La doble puerta exterior
(mosquitero + chapa maciza) está al fondo del terreno, al final de la zona 2 —
no en la mucheta, como se había asumido en un borrador anterior. La zona 2
tiene batidora, sobadora, dos amasadoras, mesada con bacha, horno rotativo,
mesa de corte y aire acondicionado (2800 frigorías), entre otros.

**Dónde vive.** Plano: artifact `5d1c5c9a-03f6-466a-ba00-907b445bde45`.
Planilla de equipamiento: enviada como archivo, no versionada en el repo.

---

## 28 de agosto de 2026 — Francisco propone el reparto inverso, empujado por Mercedes

**Qué llegó.** Tres audios de Francisco al WhatsApp Business (transcriptos).

1. **Cómo está armado su sistema.** Next.js + **Supabase** + **Vercel**, copiando y
   pegando de ChatGPT en VS Code (coincide con el informe del 18/08). Dato nuevo y
   preocupante: **Francisco no tiene las credenciales de su propia base** — perdió
   el correo con el que creó la cuenta de Supabase y va a intentar recuperarla por
   "olvidé mi contraseña". Tiene la cuenta de Vercel de Nuestro Alfajor, no la de
   Supabase.
2. **De dónde viene el impulso.** Francisco había dado su sistema por muerto
   ("con el laburo que fue y no lo íbamos a usar"). **Es Mercedes la que lo está
   empujando a reactivarlo** para usarlo ella.
3. **La propuesta.** Conectar los dos sistemas así: **nuestra** página pública de
   clientes (la que ya tiene los precios) + **su** panel administrativo para que
   Mercedes vea y gestione los pedidos.

**Por qué importa.** Esto **invierte el reparto del 18/08**, que decía: Francisco
se queda con la venta online (carrito + cobro) y **nosotros con el motor interno**
—pedidos, producción, stock, compras— entrando el pedido pagado a nuestra pantalla
de Pedidos. Ahora Francisco propone que la administración de pedidos sea la suya.

**Lo que hay que aclararle antes de contestar.**
- Francisco parte de un dato falso: dice "mi mamá no tiene una parte administrativa
  en tu página". **Sí la tiene** — Mercedes es la usuaria más intensiva de nuestra
  pantalla de Pedidos. Hay que confirmar si Francisco sabe que existe o si se
  refiere solo al catálogo público (`/catalogo`, que no tiene panel).
- Dice que su `/admin` "tiene un montón de funciones". El informe del 18/08 decía
  lo contrario: producción, recetas, insumos, orden de compra, costos, facturación
  y reportes están todos como "planeado / no hecho". Verificar con captura o link.
- Sin el **esquema de su base** (export de Supabase sin datos) o el **link al repo**
  no se puede diseñar ninguna conexión.

**Estado.** Sin decidir. Pendiente: responderle a Francisco con esos tres pedidos.

## 27 de agosto de 2026 — Etiqueta autoadhesiva de la caja de embalaje

**Qué se hizo.** Mercedes mandó a imprimir etiquetas autoadhesivas de 5×5 cm
para la caja de cartón de embalaje (la que lleva 15 paquetes x7). Se agregó como
insumo nuevo: **"Etiqueta caja embalaje x7"**, $65 la unidad (3 planchas A3 =
120 etiquetas por $7.800), proveedor "Impresora etiquetas".

**Cómo se calcula.** Se consume **1 etiqueta por cada "Caja x7"**, o sea la
misma cantidad que las cajas de cartón. Entra al cálculo de las líneas que van
en caja x7: **Maicena, Frutal y Santafesino**. Aparece en la Orden de Compra
como un renglón más, agrupado bajo el proveedor "Impresora etiquetas".

**Pendiente menor.** Con ~5% de merma por corte el unitario sube a ~$68,50.
Falta confirmar si el precio de $7.800 incluía el troquelado o solo la
impresión. Si incluía corte, $65 queda firme.

**Dónde vive.** `lib/costos.ts` (precio), `lib/produccion.ts`
(`packaging.etiquetaCajaX7`), `app/api/orden-compra/route.ts` (renglón).

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
