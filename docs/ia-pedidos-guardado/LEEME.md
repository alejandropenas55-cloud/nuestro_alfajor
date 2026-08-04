# Leer pedidos con IA — guardado, no activo

Acá adentro está un camino que se llegó a escribir pero **no está en uso**:
leer con inteligencia artificial los pedidos que el cliente escribe a mano por
WhatsApp (y hasta transcribir notas de voz).

**Por qué no está activo**: en agosto de 2026 Alejandro eligió resolver primero
lo que se puede hacer sin IA, sin costo y sin errores — leer los pedidos que
arman los propios catálogos de la casa (`/catalogo`, `/mayorista`,
`/distribuidor`). Eso es lo que hace hoy `lib/leerPedidoPegado.ts` y el panel
"Pegar un pedido de WhatsApp" de Pedidos.

Los archivos están con extensión `.txt` a propósito, para que el sistema no los
compile ni los publique.

## Qué hay acá

| Archivo | Qué era |
|---|---|
| `interpretarPedido.ts.txt` | Le manda el texto a Claude (modelo Haiku) con el catálogo y la lista de clientes, y le pide de vuelta cliente, fecha y cantidades. Descarta cualquier producto o cliente que el modelo se haya inventado. |
| `transcribirAudio.ts.txt` | Pasa una nota de voz de WhatsApp a texto con Whisper (OpenAI). |
| `api-interpretar-route.ts.txt` | El endpoint `POST /api/pedidos/interpretar` que ataba las dos cosas. |

## Qué haría falta para activarlo

1. Crear una cuenta y una API key en `console.anthropic.com` (y en
   `platform.openai.com` si además se quiere el audio). Eso lo tiene que hacer
   una persona: son cuentas pagas a nombre del negocio.
2. Cargar `ANTHROPIC_API_KEY` (y `OPENAI_API_KEY`) como variables de entorno,
   también en Vercel.
3. Volver a instalar las dos librerías: `@anthropic-ai/sdk` y `openai`.
4. Devolver los archivos a su lugar (`lib/` y `app/api/pedidos/interpretar/`)
   con extensión `.ts`.
5. Sumar el botón en el panel de Pedidos, al lado del que ya lee los pedidos del
   catálogo. La idea es que convivan: primero se intenta leer sin IA (gratis y
   exacto) y la IA queda para lo que se escribió a mano.

**Nota de diseño que conviene no perder**: la IA nunca guarda un pedido sola.
Solo llena el formulario, y la persona revisa y confirma. Lo que la IA no
entienda tiene que mostrarse como aviso, nunca descartarse en silencio.
