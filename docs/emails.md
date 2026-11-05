# Correos corporativos

Las confirmaciones de compra y los avisos de solicitudes del CRM usan la misma plantilla de marca en `src/emails/brand.ts`: negro carbón `#0a0a0a`, dorado `#d4af37`, panel blanco y fondo cálido. Se conserva el logo original AC, ADIESTRACANINOS.ES y la firma «by El Neurocanino».

El logo de `assets/email/ac-blanco-dorado.png` es una copia optimizada para correo del PNG utilizado en la cabecera de la web, sin modificar su diseño. Se envía como imagen inline con Content-ID (CID), sin consultas a localhost ni imágenes remotas. Docker copia los assets a la imagen final y el entorno de desarrollo los monta junto al código.

La estructura utiliza tablas de presentación, estilos inline y una adaptación para pantallas pequeñas. Las tipografías tienen alternativas del sistema: no se depende de que el lector de correo cargue las fuentes de la web. Hay versión de texto plano y vista previa del mensaje. Los valores del comprador, mensaje y edición se escapan antes de generar HTML.

La compra incluye servicio y modalidad, pago inicial, total, saldo pendiente, condiciones de las cuotas, edición cuando corresponda y siguientes pasos. La etiqueta de pruebas y la ausencia de acceso automático a Skool se mantienen. No se han cambiado precios, entregas ni reintentos.

Para generar ejemplos independientes con el logo incrustado, sin enviar mensajes ni crear pedidos:

```sh
pnpm --dir backend emails:preview
```

Abrir `backend/artifacts/emails/compra-programa-completo.html`, `compra-consulta.html` o `solicitud-contacto.html`. Los ejemplos son ficticios y los artefactos están excluidos de Git.

Verificación: vistas de escritorio y móvil sin desbordamiento; generación MIME con multipart/alternative, multipart/related, imagen PNG inline y Content-ID; pruebas de escape y conservación de texto plano. La apariencia final puede variar según el lector de correo.
