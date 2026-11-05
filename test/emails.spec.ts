import 'reflect-metadata';
import nodemailer from 'nodemailer';
import { purchaseEmail } from '../src/payments/email';
import { leadNotificationEmail } from '../src/emails/lead-notification';
import { brandLogo } from '../src/emails/brand';
import type { PurchaseOrder } from '../src/payments/entities';
import type { Lead } from '../src/database/entities';
const order = {
  name: '<script>bad()</script>',
  snapshot: {
    code: 'online',
    title: 'Programa online',
    optionLabel: 'Pago único',
    amount: 100000,
    deposit: 0,
    balance: 0,
    total: 100000,
    count: 1,
    edition: null,
  },
} as PurchaseOrder;
describe('Correos corporativos', () => {
  it('incluye el logo inline en el MIME sin depender del dominio o de localhost', async () => {
    const template = purchaseEmail(order);
    const transport = nodemailer.createTransport({
      streamTransport: true,
      buffer: true,
      newline: 'unix',
    });
    const mail = await transport.sendMail({
      from: 'brand@example.test',
      to: 'buyer@example.test',
      ...template,
    });
    const raw = (mail.message as Buffer).toString();
    expect(raw).toContain('multipart/alternative');
    expect(raw).toContain('multipart/related');
    expect(raw).toContain(`Content-ID: <${brandLogo.cid}>`);
    expect(raw).toContain('Content-Type: image/png');
    expect(raw).toContain('Content-Disposition: inline');
    expect(template.html).toContain(`src="cid:${brandLogo.cid}"`);
    expect(template.html).not.toMatch(/<img[^>]+src="https?:/);
    expect(template.html).toContain('#d4af37');
    expect(template.html).toContain('#0a0a0a');
    expect(template.html).not.toContain('<script>');
    expect(template.html).toContain('&lt;script&gt;');
    expect(template.text).toContain('Siguientes pasos');
  });
  it('los avisos del CRM conservan los datos y escapan mensajes y URLs', () => {
    const lead = {
      name: '<Luis>',
      email: 'very.long.address@example.test',
      phone: null,
      city: null,
      message: 'Primera línea\n<img src=x onerror=alert(1)>',
      kind: 'regional',
      serviceCode: null,
    } as Lead;
    const template = leadNotificationEmail(lead, 'http://localhost:19080/admin/?a=1&b=2');
    expect(template.subject).toContain('Edición en su zona');
    expect(template.html).toContain('&lt;Luis&gt;');
    expect(template.html).toContain('Primera línea<br>&lt;img');
    expect(template.html).not.toContain('<img src=x');
    expect(template.html).toContain('?a=1&amp;b=2');
    expect(template.html).toContain('Ver solicitud en el CRM');
    expect(template.attachments[0]).toEqual(brandLogo);
    expect(template.text).toContain(lead.message);
  });
});
