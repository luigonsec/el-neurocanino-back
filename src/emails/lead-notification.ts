import type { Lead } from '../database/entities';
import { brandLogo, brandedEmail, blockTitle, detailRow, htmlEscape, paragraph } from './brand';

export function leadNotificationEmail(lead: Lead, adminUrl: string) {
  const kind = lead.kind === 'regional' ? 'Edición en su zona' : lead.serviceCode || 'Información';
  const row = (label: string, value: string) => detailRow(label, value, false, true);
  const subject = `Nueva solicitud · ${kind}`;
  const text = `${lead.name}\n${lead.email || 'Sin email'}\n${lead.phone || ''}\n${lead.city || ''}\n\n${lead.message}\n\nConsulta la solicitud en ${adminUrl}`;
  return {
    subject,
    text,
    attachments: [brandLogo],
    html: brandedEmail({
      preheader: `${lead.name} ha enviado una nueva solicitud.`,
      eyebrow: 'Aviso del CRM',
      title: 'Una nueva solicitud.',
      content: `${paragraph('Se ha recibido una nueva solicitud en la web. Puedes revisar sus datos y continuar el seguimiento desde el panel.')}
${blockTitle('Datos de contacto')}
<table role="presentation" width="100%" style="table-layout:fixed;">${row('Nombre', lead.name)}${row('Email', lead.email || 'No indicado')}${row('Teléfono', lead.phone || 'No indicado')}${row('Ciudad', lead.city || 'No indicada')}${row('Solicitud', kind)}</table>
<table role="presentation" width="100%" style="margin-top:28px;"><tr><td>${blockTitle('Mensaje')}${paragraph(lead.message)}</td></tr></table>
<table role="presentation" style="margin-top:10px;"><tr><td bgcolor="#d4af37" style="background-color:#d4af37;border:1px solid #b99a2b;"><a href="${htmlEscape(adminUrl)}" style="display:inline-block;padding:15px 24px;font-size:14px;line-height:1.5;font-weight:700;text-decoration:none;color:#0a0a0a;">Ver solicitud en el CRM</a></td></tr></table>`,
    }),
  };
}
