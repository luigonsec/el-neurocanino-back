import { dataSource } from '../database/source';
import { checkedStripe } from '../payments/stripe-client';
import { syncCatalog } from '../payments/catalog';
async function main() {
  await dataSource.initialize();
  try {
    const stripe = await checkedStripe();
    console.log(
      `Catálogo sandbox sincronizado: ${await syncCatalog(dataSource, stripe)} modalidades vigentes. Productos antiguos conservados.`,
    );
  } finally {
    await dataSource.destroy();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
