import { dataSource } from '../database/source';
import { seed } from '../database/seed';
async function main() {
  await dataSource.initialize();
  try {
    await seed(dataSource);
    console.log('Contenidos iniciales preparados.');
  } finally {
    await dataSource.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
