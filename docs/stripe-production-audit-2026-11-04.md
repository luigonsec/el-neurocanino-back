# Valoración de pagos reales · 4 de noviembre de 2026

## Dictamen

**No está listo para activar la compra real completa.** El catálogo real está casi preparado y el flujo completo está desarrollado/probado localmente en sandbox. Falta adaptar ese flujo a modo real, publicarlo y configurar HTTPS, secretos y webhooks en el VPS. Cambiar únicamente la clave de Stripe o hacer push del código actual no resuelve esos pasos.

Auditoría de lectura del dashboard de Stripe, repositorios locales, referencias `main` de GitHub y VPS Hostinger `72.62.210.87`. No se han realizado cobros, modificado productos/precios, actualizado claves ni desplegado código. Se añade únicamente este informe local.

## Stripe real

Cuenta real observada: `acct_1RyFi0QRmMtBGnJp`. Sandbox: `acct_1RyFiA40PGFVl5hD`. Los recursos de ambas cuentas deben mantenerse separados. El catálogo activo real muestra 15 productos: las 13 modalidades previstas, más la sesión antigua de tres horas y la Academia antigua.

| Oferta/modalidad prevista | Precio observado en Stripe real | Valoración |
|---|---|---|
| Online único | 1.000 € no recurrentes | Importe y tipo correctos |
| Online 3 meses | 350 €/mes | Base correcta; falta asociar el cierre tras 3 cuotas a las nuevas compras web |
| Online 6 meses | 185 €/mes | Base correcta; cierre tras 6 cuotas |
| Online 12 meses | 99 €/mes | Base correcta; cierre tras 12 cuotas |
| Presencial completo | 1.500 € no recurrentes | Correcto |
| Reserva presencial | 350 € no recurrentes | Correcto; quedan 1.150 € presenciales |
| Completo único | **2.000 €/mes** | **Incorrecto: debe existir un precio nuevo no recurrente de 2.000 €** |
| Completo 3 meses | 565 €/mes, reserva no incluida | Base correcta; primer checkout debe sumar 350 € una vez: 915 € iniciales, total 2.045 € |
| Completo 6 meses | 290 €/mes, reserva no incluida | Base correcta; 640 € iniciales, total 2.090 € |
| Completo 12 meses | 149 €/mes, reserva no incluida | Base correcta; 499 € iniciales, total 2.138 € |
| Consulta de una hora | 75 € no recurrentes | Correcto |
| Educación 4 semanas | 900 € no recurrentes | Correcto |
| Modificación 6 semanas | 1.300 € no recurrentes | Correcto |

El producto del Completo único es `prod_VWZXzU6ueAY20J`; su única tarifa visible es `price_1UVWNyQRmMtBGnJpO7AIINU8`, mensual, con cero suscripciones activas mostradas. El Payment Link conocido de ese precio ya está bloqueado por el código local. No se ha cambiado ni archivado.

Los nombres «3 meses», «6 meses» y «12 meses» no sustituyen una programación de suscripción. Hay que portar a modo real el calendario de cancelación que ya se utiliza en sandbox. La reserva del Completo puede reutilizar el precio único de 350 €, como segundo concepto no recurrente en el mismo Checkout que la primera cuota; no hace falta crear otro precio que repita el depósito cada mes.

Comunidad no tiene precio/periodicidad confirmados en la web y permanece sin checkout. La sesión antigua de tres horas/250 € y Academia son productos históricos; no se deben borrar ni modificar suscripciones existentes al preparar las nuevas ventas.

Workbench mostró finalmente la pantalla para añadir un destino («Añade un destino…», «Create webhook»). No se ha obtenido un listado verificable de otros endpoints, ni se ha identificado un destino de esta aplicación. Sí se ha comprobado que el VPS no tiene el receptor de esta integración ni su firma configurados. Tampoco se certifica el estado completo de verificación/transferencias de la cuenta; la existencia de suscripciones reales no sustituye esa comprobación antes del lanzamiento.

## Código y ramas

- Configuración local: `STRIPE_MODE` acepta solamente `disabled` y `sandbox` (`src/config.ts`). No existe modo real.
- El SDK rechaza claves reales y `APP_ENV=production`; `assertTest()` rechaza objetos `livemode=true` (`src/payments/stripe-client.ts`).
- Worker, pedidos, estado público y envío de confirmaciones filtran actualmente `isTest=true` y/o se activan solo en sandbox.
- El frontend usa el nuevo `POST /api/v1/checkout/sessions` únicamente cuando `checkoutMode=sandbox`; fuera de él conserva el flujo anterior de Payment Links.
- Correos, CRM y página final están identificados como pruebas. Deben distinguir la modalidad real sin retirar esas protecciones en local.
- El catálogo local relaciona precios por huellas y metadatos del sandbox; la adaptación debe vincular explícitamente los `price_...` reales existentes, validando importe, EUR, tipo y periodicidad, en lugar de generar duplicados de todo el catálogo real.
- Es necesario rechazar también ediciones de demostración en el POST de checkout real. La lectura pública las oculta en producción, pero el checkout local actual no tiene esa condición explícita en la consulta de la edición.

`main` remoto coincide con las imágenes desplegadas:

- Backend: `0e7cd49ee54e70039a1d57d7ee508de8e6290667`.
- Frontend: `65140a829bb91130ebd66ef03d9f0366f434c290`.

Las ramas locales se llaman `main`, pero están un commit por delante de las remotas para los últimos Payment Links y además tienen sin commitear el checkout completo, los webhooks, la gestión de compras y los correos nuevos. **Que algo esté en la carpeta local de la rama main no significa que esté en GitHub o Hostinger.**

El mismo código puede admitir ambos entornos: producción con modo real explícito y claves reales en el servidor; local/staging de pruebas con sandbox. La rama determina qué versión se despliega, mientras que la configuración del entorno determina con qué cuenta se cobra. La configuración incompleta debe bloquear el checkout, sin recurrir a enlaces reales por defecto.

## VPS y versión pública

Comprobado directamente por SSH, sin imprimir contraseñas ni claves:

- Backend, frontend y MySQL sanos. Caddy publica 80/443.
- `APP_ENV=staging`, `PUBLIC_ORIGIN=http://72.62.210.87`, `SITE_ADDRESS=:80`.
- No están configurados `STRIPE_MODE`, clave, cuenta ni firma de webhook, ni SMTP de compras. SMTP general y destinatario de avisos también están vacíos.
- El Compose de servidor tampoco transmite las variables Stripe ni `PURCHASE_SMTP_*` a backend/migrate: no basta con añadirlas al `.env` del VPS.
- No existen en la imagen desplegada el controlador nuevo de checkout, los correos de compra ni el logo de email.
- No existe la tabla `purchase_orders`. La última migración es `ProgramPresentation1793182000000`: faltan `StripeLinks1793183000000` y `Purchases1793184000000`.
- `/compra/finalizada/` devuelve 404. `/api/v1/public-config` no devuelve `checkoutMode`. Las ofertas públicas no tienen enlaces de pago activos; Consulta sigue como Intensiva sin modalidad de pago.
- Las tres ediciones publicadas son demostraciones, con fecha de un solo día; dos tienen plazas y una está completa. No hay una edición real publicada para vender Presencial o Completo. Al pasar a `APP_ENV=production` se ocultarían las tres.
- El despliegue automático desde push a main está definido en ambos repositorios y las imágenes actuales coinciden con main remoto. El temporizador de copias está activo y el último servicio de copia terminó correctamente (Result=success, ExecMainStatus=0).
- La web antigua `https://www.adiestracaninos.es/` continúa respondiendo; no se ha modificado su dominio ni DNS.

## Secuencia propuesta para activar producción

1. Adaptar en una revisión local/PR los modos `disabled/sandbox/live`, validación de cuenta y claves, aislamiento de datos, frontend, workers, correos y página final. Mantener las pruebas existentes y añadir rechazo de cruces de entorno y ediciones demo.
2. Crear el precio correcto único de 2.000 € en la cuenta real y vincular las 13 modalidades a precios reales, sin tocar los clientes/suscripciones anteriores. Comprobar reservas, primer cargo y duración limitada del plan.
3. Preparar un nombre público con certificado HTTPS para la nueva aplicación. Puede ser un subdominio si se mantiene la web antigua durante la revisión. Configurar origen/retornos en ese host; no apuntar aún a la web antigua una ruta de webhook que ella no atiende.
4. Incorporar al Compose y configurar en el VPS las credenciales reales del backend y SMTP de compras. Los secretos quedan fuera de Git y del frontend. Utilizar un remitente autorizado, con `debug@gonseclabs.com` solo si se decide mantenerlo temporalmente.
5. Dar de alta/verificar el destino real `https://<host-publicado>/api/v1/stripe/webhook`, con firma y eventos adecuados al formato/versionado del handler. Sustituye al listener local de Stripe CLI. El webhook, no la visita a la página final, confirma el pago y dispara CRM/correo.
6. Cargar ediciones reales de cuatro días con fechas, lugar y plazas; confirmar el procedimiento manual de plazas/citas/acceso. Mantener Comunidad sin checkout hasta cerrar su oferta.
7. Publicar front y back revisados en main mediante el flujo actual, con copia y migraciones; verificar salud, precios, retornos y comunicaciones. Realizar después una compra real controlada por el titular, con presupuesto y condiciones acordadas, para comprobar el circuito completo. No se ha realizado durante esta auditoría.

La primera activación debe comprobar también impagos, pagos duplicados, fin de cuotas y gestión de devoluciones. El sistema local actual no tiene reconciliación específica de reembolsos/disputas; si se gestionan manualmente en Stripe, debe reflejarse su estado en CRM o quedar definido el procedimiento operativo. Plazas, citas y acceso a Skool continúan manuales según el alcance acordado.

## Referencias

- [Claves y separación de entornos](https://docs.stripe.com/keys).
- [Webhooks: URL HTTPS pública y firma](https://docs.stripe.com/webhooks).
- [Cancelación al finalizar calendarios de suscripción](https://docs.stripe.com/billing/subscriptions/subscription-schedules).
- [Confirmación de compra independiente del retorno del navegador](https://docs.stripe.com/payments/checkout/custom-success-page?payment-ui=stripe-hosted).

La revisión del catálogo se ha hecho desde el dashboard real, sin extraer claves. La configuración del VPS se ha contrastado con el entorno efectivo del contenedor, la base de datos y las rutas públicas; no se basa únicamente en los archivos locales.



Vale, varias cosas.

En stripe me gustaría dejar todo configurado en la cuenta real, sin borrar nada antiguo, simplemente crear las cosas nuevas que necesitemos. Si existe un producto con un pedido diferente al real, se crea otro con el precio correcto segun la web.

En hostinger no voy a tener el dominio ni https hasta dentro de un tiempo porque vamos a usar el dominio actual que apunta a otra web, hay que hacer una migracion en algun momento pero no tengo ningun dominio.