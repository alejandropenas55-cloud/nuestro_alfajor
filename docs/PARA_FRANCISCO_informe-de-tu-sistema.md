# Para Francisco — pedirle a ChatGPT el informe de tu sistema

Hola Francisco. Antes que nada: **muy bueno lo que estás armando.** La idea es
que los dos desarrollos no se pisen y que lo que hiciste sume, así que
necesitamos entender bien qué construiste.

Lo más rápido es que se lo pidas a tu propio ChatGPT, que ya conoce tu código.

---

## Qué tenés que hacer (3 pasos)

1. Abrí **la misma conversación de ChatGPT** donde venís armando tu sistema (es
   importante que sea esa, porque ahí está todo el historial de tu código).
2. Copiá **todo el texto del recuadro de abajo** y pegalo tal cual.
3. Cuando ChatGPT te conteste, mandanos la respuesta completa por WhatsApp o
   como archivo. Si te la corta por la mitad, escribile "seguí" y pegá también
   la segunda parte.

**Un aviso importante:** cuando nos mandes la respuesta, fijate que **no vayan
contraseñas, tokens ni claves** (esas líneas que empiezan con cosas tipo
`API_KEY=`, `SECRET=`, `PASSWORD=` o `TOKEN=`). Si aparece alguna, borrala
antes de mandarla. Eso vale también para nosotros: nunca compartas el archivo
`.env` de tu proyecto con nadie.

---

## COPIÁ DESDE ACÁ 👇

Necesito que armes un **informe técnico y funcional completo del sistema que
venimos desarrollando en esta conversación**. Lo van a leer dos personas: un
consultor y otro desarrollador, que tienen su propio sistema para el mismo
negocio (una fábrica de alfajores) y necesitan entender el mío para no
duplicar trabajo y ver dónde se integran.

Reglas para tu respuesta:

- Escribí en **español rioplatense, claro y sin jerga innecesaria**. Cuando uses
  un término técnico, explicalo entre paréntesis la primera vez.
- **No inventes ni completes huecos.** Si algo no está construido, decí "no
  está hecho". Si está a medias, decí exactamente hasta dónde llega. Si no
  estás seguro, escribí "no me consta". Un informe con huecos declarados es
  infinitamente más útil que uno completo pero optimista.
- Distinguí siempre entre **lo que ya funciona**, **lo que está empezado** y
  **lo que está planeado pero no existe todavía**.
- **No incluyas contraseñas, claves de API, tokens ni datos de acceso.**

Organizá el informe con estos títulos:

**1. Resumen en 10 renglones**
Qué es el sistema, para quién, qué problema resuelve y en qué estado está hoy.

**2. Alcance funcional**
Lista de todo lo que el sistema hace o va a hacer, y al lado de cada ítem:
`FUNCIONA` / `A MEDIAS` / `PLANEADO`. Incluí específicamente si toca:
pedidos, producción, stock, compras, facturación/contable, administración,
clientes, catálogo web, carrito de compras online, pagos, envíos, reportes.

**3. Tecnología**
Lenguaje, framework, versiones, base de datos, dónde está alojado, qué
servicios externos usa (pagos, mails, WhatsApp, IA, etc.) y qué de todo eso es
pago. Si hay algo que todavía no está definido, decilo.

**4. Modelo de datos**
Todas las tablas o colecciones con sus campos principales y cómo se relacionan.
Este punto es el más importante para poder integrar los dos sistemas: sé lo
más completo y literal posible acá, copiá los nombres reales de tablas y
campos.

**5. Pantallas y direcciones**
Qué pantallas existen, qué hace cada una, y quién la usa.

**6. Usuarios y permisos**
Cómo se entra al sistema, qué roles hay y qué puede hacer cada uno. Aclarará
si los permisos se validan en el servidor o solamente se esconden los botones
en pantalla.

**7. Reglas de negocio que programaste**
Toda cuenta, fórmula o regla que hayas metido: cómo se calculan los precios,
descuentos, mínimos de compra, cálculos de producción, stock, impuestos,
comisiones. Escribí las fórmulas explícitas y de dónde salió cada número.
**Este punto es crítico**: si tu sistema y el otro calculan distinto el mismo
precio, el negocio factura mal.

**8. Estado real y qué falta**
Qué está desplegado y en uso real (¿lo usa alguien de la fábrica hoy?), qué
está a medias, y qué falta para que se pueda usar en serio. Sé honesto con los
tiempos.

**9. Problemas conocidos**
Bugs abiertos, cosas frágiles, partes que sabés que hay que rehacer, decisiones
que tomaste sabiendo que no eran las mejores pero resolvían el momento.

**10. Decisiones que tomaste y por qué**
Qué caminos elegiste y qué descartaste. Esto es lo que más sirve para no
repetir discusiones ya saldadas.

**11. Qué necesitás de terceros**
Datos, permisos, accesos, definiciones del negocio o plata que estás esperando
para poder seguir.

**12. Puntos de integración**
Dónde tocaría tu sistema a otro que maneje pedidos, producción, catálogo y
precios: qué datos tendrían que compartir, en qué dirección, y qué te
convendría a vos que el otro sistema resuelva para no hacerlo dos veces.

Terminá con una sección **"Las 5 preguntas que hay que definir con el negocio
antes de seguir"**.

## HASTA ACÁ ☝️

---

## Después de esto

Cuando nos mandes el informe te vamos a pasar un archivo con todo el contexto
de nuestro desarrollo —el porqué de cada decisión, las reglas de producción,
cómo se calculan los precios, qué caminos ya probamos y descartamos— para que
se lo des a tu ChatGPT. Con eso los dos sistemas van a estar hablando el mismo
idioma y vas a poder aprovechar todo lo que ya está resuelto.
