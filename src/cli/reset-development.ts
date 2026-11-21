import * as argon2 from 'argon2';
import { z } from 'zod';
import { dataSource } from '../database/source';
import { config } from '../config';
import { seed } from '../database/seed';
import { Administrator } from '../database/entities';
async function main() {
  if (config.APP_ENV !== 'development' || !process.argv.includes('--discard-test-data'))
    throw new Error('Solo se permite reiniciar desarrollo con --discard-test-data.');
  // Validate access before discarding anything. No business data or historical copy is retained.
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const password = z.string().min(14).parse(process.env.ADMIN_PASSWORD);
  await dataSource.initialize();
  try {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
    await seed(dataSource);
    await dataSource
      .getRepository(Administrator)
      .save({ email, passwordHash: await argon2.hash(password) });
    console.log(
      'Base de desarrollo reiniciada. Bandejas y eventos vacíos; administrador y agendas iniciales preparados.',
    );
  } finally {
    await dataSource.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
