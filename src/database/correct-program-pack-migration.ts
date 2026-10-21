import { MigrationInterface, QueryRunner } from 'typeorm';
import { PACK_ROUTE } from '../content/commerce-data';

export class CorrectProgramPack1792600000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    // The Community bundle was a mistaken offer, not a second commercial product.
    // Cascades remove only its payment options and service associations.
    await q.query(`DELETE FROM commercial_offers WHERE code = 'comunidad-online'`);
    // Preserve the existing Online + Presencial prices, payment IDs and edition links.
    await q.query(
      `UPDATE commercial_offers SET route = ?, title = ?, seo_title = ?, seo_description = ? WHERE code = 'online-presencial'`,
      [
        PACK_ROUTE,
        'Programa Online + Programa presencial de 4 días',
        'Pack Programa Online + Presencial de 4 días | El Neurocanino',
        'Combina el Programa Online con cuatro días de formación presencial. Conoce el pack, sus opciones de pago y elige tu edición.',
      ],
    );
    await q.query(`UPDATE services SET description = ? WHERE code = 'online' AND description = ?`, [
      'Formación a distancia alojada en Skool para integrar la metodología en tu práctica. Puedes contratar el Programa Online de forma independiente o combinarlo con el Programa presencial de 4 días.',
      'Formación a distancia alojada en Skool para integrar la metodología en tu práctica. Puedes contratar el Programa Online de forma independiente o combinarlo con la Comunidad o una edición presencial.',
    ]);
  }

  async down(q: QueryRunner) {
    // Do not recreate a commercial offer that the client has explicitly withdrawn.
    await q.query(`UPDATE commercial_offers SET route = NULL WHERE code = 'online-presencial'`);
  }
}
