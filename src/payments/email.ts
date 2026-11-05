import { PurchaseOrder } from './entities';
import {
  brandedEmail,
  brandLogo,
  htmlEscape,
  paragraph,
  detailRow,
  blockTitle,
} from '../emails/brand';
export const euro = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n / 100);
export function nextSteps(order: PurchaseOrder) {
  const code = order.snapshot.code;
  if (code === 'online')
    return 'El equipo coordinará contigo las instrucciones de acceso al programa online, que incluye acceso de por vida al contenido y tres meses de seguimiento personalizado.';
  if (code === 'online-presencial')
    return 'El equipo coordinará el acceso a la preparación online y confirmará tu plaza en la edición elegida. Tras finalizar los cuatro días presenciales comenzarán los tres meses de seguimiento personalizado online.';
  if (code === 'presencial')
    return 'El equipo comprobará tu inscripción y confirmará tu plaza en la edición elegida. Si has abonado la reserva, los 1.150 € restantes se abonan presencialmente al comenzar.';
  return code === 'intensiva'
    ? 'Acuerda con el instructor la fecha de tu consulta presencial de una hora en Sevilla.'
    : `Acuerda con el instructor las fechas del programa de ${code === 'educacion' ? 'cuatro' : 'seis'} semanas, con una sesión individual de tres horas cada semana.`;
}
export function purchaseEmail(order: PurchaseOrder) {
  const s = order.snapshot;
  const text = `[PRUEBA — SIN COBRO REAL]\n\nHola ${order.name || ''},\n\nHemos recibido tu pago de prueba para ${s.title}.\nModalidad: ${s.optionLabel}\nPago recibido inicialmente: ${euro(s.amount + s.deposit)}\nTotal contratado: ${euro(s.total)}\nSaldo pendiente tras el primer pago: ${euro(s.total - s.amount - s.deposit)}\n${s.count > 1 ? `${s.count} mensualidades de ${euro(s.amount)}, incluida la primera ya cobrada.${s.deposit ? ` La reserva de ${euro(s.deposit)} está incluida en el primer pago y en el total.` : ''}\nEl plan finaliza automáticamente al terminar las ${s.count} mensualidades.\n` : ''}${s.edition ? `\nEdición: ${s.edition.title}\n${s.edition.startDate} — ${s.edition.endDate}\n${s.edition.location}, ${s.edition.city}\n` : ''}\nSiguientes pasos\n${nextSteps(order)}\n\nEsta compra pertenece al entorno de pruebas de Stripe. No se ha realizado ningún cobro real ni concedido acceso automático a Skool.\n\nAC by El Neurocanino`;
  const initial = s.amount + s.deposit;
  const remaining = Math.max(0, s.total - initial);
  const installmentNote =
    s.count > 1
      ? `${s.count} mensualidades de ${euro(s.amount)}, incluida la primera ya cobrada.${s.deposit ? ` La reserva de ${euro(s.deposit)} se incluye en el primer pago; no se suma de nuevo al total.` : ''} El plan finaliza automáticamente al terminar las ${s.count} mensualidades.`
      : s.balance > 0
        ? 'El saldo restante se abona presencialmente al comenzar la formación. La reserva está incluida en el precio total.'
        : '';
  const date = (value: string) =>
    new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Madrid',
    }).format(new Date(value + 'T12:00:00Z'));
  const edition = s.edition
    ? `<table role="presentation" width="100%" style="margin:26px 0;background-color:#f6f5f0;"><tr><td style="padding:22px 24px;border-left:3px solid #d4af37;">
<p style="margin:0 0 10px;font-size:11px;line-height:1.5;font-weight:700;letter-spacing:1.3px;color:#806211;">TU EDICIÓN PRESENCIAL</p>
<p style="margin:0 0 8px;font-size:16px;line-height:1.5;font-weight:700;color:#171915;">${htmlEscape(s.edition.title)}</p>
<p style="margin:0 0 6px;font-size:14px;line-height:1.7;color:#474943;">${htmlEscape(date(s.edition.startDate))}${s.edition.endDate !== s.edition.startDate ? `<br>al ${htmlEscape(date(s.edition.endDate))}` : ''}</p>
<p style="margin:0;font-size:14px;line-height:1.7;color:#575a53;">${htmlEscape(s.edition.location)} · ${htmlEscape(s.edition.city)}</p>
</td></tr></table>`
    : '';
  const content = `${paragraph(`Hola${order.name ? ` ${order.name}` : ''},`)}
${paragraph('Hemos recibido tu pago de prueba. Aquí tienes los detalles de tu contratación y los siguientes pasos.')}
<table role="presentation" width="100%" style="margin:28px 0 24px;border-top:2px solid #d4af37;"><tr><td style="padding:22px 0 8px;">
<p style="margin:0 0 8px;font-size:11px;line-height:1.5;letter-spacing:1.3px;font-weight:700;color:#806211;">TU ELECCIÓN</p>
<h2 style="margin:0 0 8px;font-size:23px;line-height:1.4;font-weight:700;letter-spacing:-.4px;color:#171915;">${htmlEscape(s.title)}</h2>
<p style="margin:0;font-size:14px;line-height:1.7;color:#575a53;">${htmlEscape(s.optionLabel)}</p>
</td></tr></table>
<table role="presentation" width="100%" aria-label="Resumen económico">
${detailRow('Pago inicial recibido', euro(initial), true)}
${detailRow('Total contratado', euro(s.total))}
${detailRow('Pendiente tras el primer pago', euro(remaining))}
</table>
${installmentNote ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.8;color:#575a53;">${htmlEscape(installmentNote)}</p>` : ''}
${edition}
<table role="presentation" width="100%" style="margin-top:28px;"><tr><td>
${blockTitle('Qué ocurre ahora')}${paragraph(nextSteps(order))}
</td></tr></table>
<p style="margin:16px 0 0;padding-top:20px;border-top:1px solid #e8e6de;font-size:12px;line-height:1.8;color:#686b63;">Esta compra pertenece al entorno de pruebas de Stripe. No se ha realizado ningún cobro real ni concedido acceso automático a Skool.</p>`;
  return {
    subject: `[PRUEBA] Confirmación · ${s.title}`,
    text,
    html: brandedEmail({
      preheader: `Pago de prueba de ${euro(initial)} recibido. Consulta tu contratación y los siguientes pasos.`,
      eyebrow: 'Confirmación de compra',
      title: 'Gracias por tu confianza.',
      content,
      test: true,
    }),
    attachments: [brandLogo],
  };
}
