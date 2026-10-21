import { EntityManager } from 'typeorm';
import { CommercialOffer, PaymentOption, Service } from './entities';
import { commercialDefaults } from '../content/commerce-data';

export async function seedCommerce(manager: EntityManager) {
  const services = await manager.getRepository(Service).find();
  for (const defaults of commercialDefaults) {
    if (await manager.getRepository(CommercialOffer).existsBy({ code: defaults.code })) continue;
    const linked = services.filter((s) =>
      (defaults.serviceCodes as readonly string[]).includes(s.code),
    );
    if (linked.length !== defaults.serviceCodes.length) continue;
    const row = defaults as any;
    const offer = await manager.getRepository(CommercialOffer).save({
      code: row.code,
      title: row.title,
      description: row.description,
      route: row.route || null,
      seoTitle: row.seoTitle || null,
      seoDescription: row.seoDescription || null,
      published: true,
      provisional: Boolean(row.provisional),
      bookingUrl: null,
      klarnaEnabled: false,
      services: linked,
    });
    if (row.options.length)
      await manager.getRepository(PaymentOption).save(
        row.options.map((option: any, sortOrder: number) => ({
          ...option,
          offerId: offer.id,
          currency: 'EUR',
          installmentCount: option.installmentCount || 1,
          depositCents: option.depositCents || 0,
          sortOrder,
          paymentUrl: null,
          transferInstructions: null,
          whatsappUrl: null,
        })),
      );
  }
}
