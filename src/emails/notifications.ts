import type {
  Lead,
  EventRegistration,
  TrainingEvent,
  RegistrationStatus,
} from '../database/entities';
import { brandedEmail, paragraph, htmlEscape } from './brand';
export const categoryNames: Record<string, string> = {
  online: 'Programa online',
  complete: 'Programa completo',
  contact: 'Contacto',
};
export const answerNames: Record<string, string> = {
  profile: 'Situación',
  problem: 'Problema',
  experience: 'Experiencia',
  goal: 'Objetivo',
  urgency: 'Urgencia',
  travel: 'Desplazamiento',
  budget: 'Presupuesto mensual',
};
export const answerValues: Record<string, string> = {
  personal: 'Particular',
  professional: 'Profesional / Futuro profesional',
  experienced: 'Tengo experiencia',
  starting: 'Estoy comenzando',
  future: 'Quiero empezar',
  now: 'Lo antes posible',
  month: 'Este mes',
  next_month: 'A partir del mes que viene',
  exploring: 'Estoy informándome',
  yes: 'Sí',
  no: 'No',
  low: '0–50 €/mes',
  medium: '50–200 €/mes',
  high: 'Más de 200 €/mes',
  community: 'Comunidad',
  online: 'Programa online',
  complete: 'Programa completo',
};
function message(subject: string, text: string, action?: { url: string; label: string }) {
  return {
    subject,
    text: text + (action ? `\n\n${action.label}: ${action.url}` : ''),
    html: brandedEmail({
      preheader: subject,
      eyebrow: 'El Neurocanino',
      title: subject,
      content:
        paragraph(text) +
        (action
          ? `<p><a href="${htmlEscape(action.url)}" style="color:#806211;font-weight:bold">${htmlEscape(action.label)}</a></p>`
          : ''),
    }),
  };
}
export function leadNotification(lead: Lead, origin: string) {
  const details = Object.entries(lead.answers || {})
    .map(
      ([key, value]) =>
        `${answerNames[key] || key}: ${['problem', 'goal'].includes(key) ? value : answerValues[value] || value}`,
    )
    .join('\n');
  return message(
    `Nueva solicitud · ${categoryNames[lead.category]}`,
    `${lead.name}\n${lead.email}\n${lead.phone || ''}\n${lead.city || ''}\n\n${lead.message || details}${lead.outcome ? `\n\nResultado: ${answerValues[lead.outcome]}` : ''}`,
    { url: `${origin}/admin/?tab=${lead.category}`, label: 'Revisar en el CRM' },
  );
}
const eventText = (event: TrainingEvent) =>
  `${event.title}\n${event.startDate.split('-').reverse().join('/')} – ${event.endDate.split('-').reverse().join('/')}\n${event.location}, ${event.city}`;
export function eventNotification(reg: EventRegistration, event: TrainingEvent, origin: string) {
  return message(
    'Nueva solicitud de evento',
    `${reg.name}\n${reg.email}\n${reg.phone}\n\n${eventText(event)}\n\n${reg.comment || ''}\n\nPendiente de aprobación. Todavía no tiene una plaza confirmada.`,
    { url: `${origin}/admin/?tab=events&event=${event.id}`, label: 'Gestionar solicitudes' },
  );
}
export function eventStatusEmail(
  reg: EventRegistration,
  event: TrainingEvent,
  status: RegistrationStatus,
) {
  const copy = {
    pending: [
      'Solicitud de evento recibida',
      'Hemos recibido tu solicitud. Revisaremos tu inscripción y te comunicaremos la decisión por correo. Este mensaje no confirma una plaza.',
    ],
    accepted: [
      'Tu plaza está confirmada',
      'Tu solicitud ha sido aceptada y tu plaza está confirmada. Para cualquier consulta sobre tu asistencia, responde a este correo.',
    ],
    rejected: [
      'Sobre tu solicitud de evento',
      'En esta ocasión no hemos podido aceptar tu solicitud. Si quieres consultar otras opciones, responde a este correo.',
    ],
    cancelled: [
      'Inscripción cancelada',
      'Tu inscripción ha sido cancelada y ya no tienes una plaza reservada en este evento. Si necesitas aclarar cualquier detalle, responde a este correo.',
    ],
  }[status];
  return message(
    copy[0],
    `Hola, ${reg.name}.\n\n${copy[1]}\n\n${eventText(event)}\n\nEquipo de El Neurocanino`,
  );
}
