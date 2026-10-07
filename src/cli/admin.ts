import * as argon2 from 'argon2';
import { dataSource } from '../database/source';
import { Administrator } from '../database/entities';
import { z } from 'zod';
async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
  const password = z.string().min(14).parse(process.env.ADMIN_PASSWORD);
  await dataSource.initialize();
  try {
    if (await dataSource.getRepository(Administrator).findOneBy({ email }))
      throw new Error('Ese administrador ya existe.');
    await dataSource
      .getRepository(Administrator)
      .save({ email, passwordHash: await argon2.hash(password) });
    console.log(`Administrador creado: ${email}`);
  } finally {
    await dataSource.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
