# Notificaciones

Se conserva un único canal SMTP y una cola transaccional `deliveries`.

- Aviso interno de solicitud online, completa o de contacto, con enlace a la bandeja y respuestas.
- Aviso interno de solicitud de un evento.
- Recepción pendiente de aprobación dirigida al solicitante del evento.
- Aceptación, rechazo o cancelación cuando el administrador cambia el estado.
- Cancelación colectiva para solicitudes pendientes y aceptadas al cancelar una convocatoria.

Los correos incluyen HTML corporativo, texto plano y logo inline. Los campos introducidos por visitantes se escapan antes de incluirlos en HTML. Los reintentos del formulario no generan registros ni correos adicionales. Los correos fallidos pueden reintentarse desde el detalle del CRM.

La cola emplea un bloqueo MySQL y cinco intentos con espera creciente. Una caída después de la aceptación SMTP y antes de marcar la entrega puede producir un reenvío. Los fallos no impiden guardar solicitudes ni reservar plazas aceptadas.

Desarrollo y vista previa usan Mailpit. No hay correos de compras, pagos ni integraciones con un CRM externo.
