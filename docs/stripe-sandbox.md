# Compras de prueba

Implementación exclusivamente local. No se han publicado cambios ni alterado Stripe real. El sandbox autorizado es **Entorno de prueba de Adiestracaninos.es** (`acct_1RyFiA40PGFVl5hD`). Comunidad sigue sin checkout. La consulta vigente es de una hora y 75 €; la sesión antigua de tres horas queda fuera de la web.

## Arranque

Desde la raíz del workspace:

1. Crear `.env.stripe.local` tomando `backend/.env.stripe.local.example`. La copia local ya está configurada, con permisos 600, y no debe añadirse a Git. Introducir únicamente la clave de ese sandbox y la contraseña del buzón en ese archivo privado.
   Aplicar permisos privados con `chmod 600 .env.stripe.local`. Si MySQL está detenido, arrancar primero con `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db`.

2. Sincronizar el catálogo (solo crea o recupera productos/precios identificados por metadatos; conserva los productos anteriores):

   ```sh
   DOTENV_CONFIG_PATH=../.env.stripe.local pnpm --dir backend payments:sync
   ```

3. Mantener una terminal con el listener oficial de Stripe CLI:

   ```sh
   DOTENV_CONFIG_PATH=../.env.stripe.local pnpm --dir backend payments:listen
   ```

   El wrapper escribe la firma de webhook en el archivo privado y oculta las claves en su salida. No registra una URL pública ni expone el backend mediante un túnel.

4. Construir/arrancar con el override local y recrear backend si cambia la firma:

   ```sh
   docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.stripe.yml up -d --build
   ```

   MySQL y los uploads conservan sus volúmenes. Las migraciones se aplican antes de arrancar backend. No usar `down -v`. El override Stripe no debe utilizarse en el VPS.

Visitar `http://localhost:19080`, elegir programa y modalidad. Para Presencial y Completo es obligatorio elegir una edición abierta con plazas. El resumen permite revisar el total antes de abrir Checkout. Al cancelar en Stripe se restaura la elección. La URL de retorno contiene un identificador opaco del pedido, nunca datos del comprador.

La configuración rechaza claves reales y producción. Si faltan firma o SMTP de compras, la API bloquea nuevas sesiones de prueba. El modo sandbox nunca expone los Payment Links reales, incluidos los enlaces de ediciones y el antiguo falso pago único del pack.

## Modalidades

| Programa | Cobro inicial | Cobros siguientes | Total |
|---|---:|---:|---:|
| Online único | 1.000 € | — | 1.000 € |
| Online 3 meses | 350 € | 2 × 350 € | 1.050 € |
| Online 6 meses | 185 € | 5 × 185 € | 1.110 € |
| Online 12 meses | 99 € | 11 × 99 € | 1.188 € |
| Presencial completo | 1.500 € | — | 1.500 € |
| Presencial reserva | 350 € | 1.150 € presencialmente al comenzar | 1.500 € |
| Completo único | 2.000 € | — | 2.000 € |
| Completo 3 meses | 915 € (350 + 565) | 2 × 565 € | 2.045 € |
| Completo 6 meses | 640 € (350 + 290) | 5 × 290 € | 2.090 € |
| Completo 12 meses | 499 € (350 + 149) | 11 × 149 € | 2.138 € |
| Consulta presencial | 75 € | — | 75 € |
| Educación | 900 € | — | 900 € |
| Modificación de comportamiento | 1.300 € | — | 1.300 € |

La reserva del Completo es un concepto no recurrente en el mismo Checkout que la primera cuota. La programación de Stripe termina tras exactamente 3, 6 o 12 períodos mensuales, incluyendo la primera cuota. No se crea una mensualidad adicional por un impago; el saldo no abonado sigue pendiente de revisión. No se automatizan las plazas ni el acceso a Skool.

## Flujo y persistencia

- `POST /api/v1/checkout/sessions`: valida oferta, modalidad y disponibilidad; toma una instantánea de las condiciones y crea/reutiliza sesión mediante una clave UUID y bloqueo de MySQL. Los importes nunca proceden del navegador.
- `POST /api/v1/stripe/webhook`: verifica la firma sobre el cuerpo original y persiste el evento antes de responder. El worker recupera los objetos actuales de Stripe para soportar eventos atrasados. Los identificadores de evento, sesión y factura son únicos.
- El primer pago confirmado crea una única entrada de Compra en el CRM y una entrega de bienvenida. Las cuotas siguientes actualizan el mismo pedido y CRM. El pack es una oferta de dos servicios, por lo que no se inventa un séptimo código de servicio en la tabla histórica de solicitudes.
- `GET /api/v1/checkout/status`: lectura limitada por token opaco. No devuelve email, teléfono ni nombre. No crea CRM ni envía correos. `/compra/finalizada/` lleva `noindex` y `no-store`, está fuera del sitemap y consulta este endpoint.
- La cola de eventos reintenta con espera creciente; tras ocho fallos aparece en CRM → Compras para revisión y reintento. Los avisos usan la cola persistente existente; SMTP reintenta cinco veces y permite reintentar desde el detalle de la solicitud.
- Los pedidos, intentos, eventos y recibos sobreviven al reinicio. No se almacena información de tarjeta. Una copia SQL previa permite recuperar datos; la migración no elimina pedidos al hacer rollback.

El correo usa `debug@gonseclabs.com`, Hostinger 465/TLS y asunto `[PRUEBA]`. **Los pagos son simulados; los correos sí se envían** al email escrito en Checkout. La bienvenida explica pago inicial, total, cuotas o saldo, edición y próximos pasos. No afirma que el acceso a Skool sea automático. La deduplicación y un Message-ID estable evitan la repetición normal; SMTP no proporciona una garantía transaccional de entrega exactamente una vez si se interrumpe la conexión después de aceptar el mensaje.

## Probar

Tarjetas de Stripe, fecha futura y CVC de prueba:

- Aprobada: `4242 4242 4242 4242`.
- Rechazada: `4000 0000 0000 0002`.
- Autenticación adicional: `4000 0025 0000 3155`; completar o rechazar el desafío de prueba de Stripe.

Introducir un teléfono con prefijo válido. No utilizar tarjetas reales.

```sh
pnpm --dir backend test
pnpm --dir backend check
pnpm --dir backend build
pnpm --dir frontend test
pnpm --dir frontend check
pnpm --dir frontend build
pnpm --dir frontend test:e2e tests/e2e/sandbox-checkout.spec.ts
```

La suite anterior de Payment Links se omite cuando el sandbox está activo; no se sustituye la nueva suite por pruebas que sigan enlaces reales. Para repetir pruebas de relojes, usar clientes de prueba vinculados a un reloj y avanzar cada mes, esperando a su estado `ready` y a la finalización de la factura (una hora del reloj después de crearla). Comparar número de facturas, total, cancelación y CRM, no solo la configuración del calendario.

Referencias: [Checkout y retorno](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=stripe-hosted), [webhooks locales](https://docs.stripe.com/webhooks#local-listener), [calendarios de suscripción](https://docs.stripe.com/billing/subscriptions/subscription-schedules), [relojes de prueba](https://docs.stripe.com/billing/testing/test-clocks).

## Antes de activar pagos reales

Esta fase no habilita producción ni transforma los enlaces reales. Requiere una fase posterior para claves y webhook de producción, dominio HTTPS, revisión de condiciones/correos, medios de pago compatibles y pruebas de incidencias. Las confirmaciones de plazas, citas y acceso se coordinan manualmente con el equipo.

## Verificación local realizada · 28/10/2026

- 13 sesiones de Checkout comprobadas contra las modalidades vigentes, incluyendo importes iniciales y reutilización por clave idempotente. Catálogo: 15 productos gestionados nuevos y los 6 anteriores conservados; todos de prueba.
- Compra alojada de Consulta (75 €): rechazo de tarjeta, reintento aprobado, webhook, CRM, correo y retorno comprobados.
- Compra alojada del Completo en 3 meses: autenticación 3D Secure completada y primer cargo conjunto de 915 € confirmado.
- Relojes de Stripe: Online 3 meses → 3 cargos y 1.050 €; Online 6 meses → 6 cargos y 1.110 €; Completo 12 meses → 12 cargos y 2.138 €. En los tres casos la suscripción terminó automáticamente y el CRM reflejó todos los cobros.
- Reenvío de evento y evento de impago atrasado, seguido de reinicio real del backend: sin duplicar recibos, compras ni bienvenida. La cola quedó sin eventos fallidos.
- SMTP autenticado y cinco confirmaciones de órdenes de prueba enviadas, una por pedido. El fallo y reintento de SMTP también están cubiertos en la suite del worker.
- 18 migraciones y seed sobre una base vacía; segunda ejecución con cero migraciones pendientes. La base temporal de QA se eliminó al terminar.
- 39 pruebas backend, 22 pruebas unitarias frontend y 6 pruebas de navegador aprobadas. Tipos, compilaciones e imágenes Docker de runtime construidas correctamente. No se han probado compras reales ni la aprobación de financiación por terceros.
