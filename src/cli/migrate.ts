import { dataSource } from '../database/source';
async function main() {
  await dataSource.initialize();
  try {
    if (process.argv.includes('--revert')) {
      await dataSource.undoLastMigration({ transaction: 'each' });
      console.log('Última migración revertida.');
      return;
    }
    const migrations = await dataSource.runMigrations({ transaction: 'each' });
    console.log(`Migraciones aplicadas: ${migrations.length}`);
  } finally {
    await dataSource.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
