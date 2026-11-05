import fs from 'node:fs';
import path from 'node:path';
import { purchaseEmail } from '../payments/email';
import { leadNotificationEmail } from '../emails/lead-notification';
import { brandLogo } from '../emails/brand';
import type { PurchaseOrder } from '../payments/entities';
import type { Lead } from '../database/entities';
const output = path.resolve(process.cwd(), 'artifacts/emails');
fs.mkdirSync(output, { recursive: true });
const png = fs.readFileSync(brandLogo.path).toString('base64');
const examples = [
  [
    'compra-programa-completo',
    purchaseEmail({
      name: 'Luis',
      snapshot: {
        code: 'online-presencial',
        title: 'Programa completo — Online + Presencial',
        optionLabel: '12 meses + reserva',
        amount: 14900,
        deposit: 35000,
        total: 213800,
        count: 12,
        balance: 0,
        edition: {
          title: 'Integración Canina · Sevilla',
          startDate: '2027-03-12',
          endDate: '2027-03-15',
          location: 'Centro de formación',
          city: 'Sevilla',
        },
      },
    } as PurchaseOrder),
  ],
  [
    'compra-consulta',
    purchaseEmail({
      name: 'Luis',
      snapshot: {
        code: 'intensiva',
        title: 'Consulta presencial en Sevilla',
        optionLabel: 'Consulta individual · una hora',
        amount: 7500,
        deposit: 0,
        total: 7500,
        count: 1,
        balance: 0,
        edition: null,
      },
    } as PurchaseOrder),
  ],
  [
    'solicitud-contacto',
    leadNotificationEmail(
      {
        name: 'María López',
        email: 'maria@example.test',
        phone: '+34 600 123 456',
        city: 'Sevilla',
        message:
          'Me gustaría conocer la disponibilidad para organizar una formación para nuestro equipo.',
        kind: 'general',
        serviceCode: null,
      } as Lead,
      'http://localhost:19080/admin/',
    ),
  ],
] as const;
for (const [name, email] of examples) {
  fs.writeFileSync(
    path.join(output, name + '.html'),
    email.html.replace(`cid:${brandLogo.cid}`, `data:image/png;base64,${png}`),
  );
}
console.log('Tres vistas previas creadas, sin enviar correos.');
