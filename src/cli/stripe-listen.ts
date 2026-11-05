import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config';
if (config.STRIPE_MODE !== 'sandbox') throw new Error('Solo se admite Stripe sandbox.');
const envFile = path.resolve(process.cwd(), '../.env.stripe.local');
const child = spawn(
  'npx',
  [
    '--yes',
    '@stripe/cli',
    'listen',
    '--forward-to',
    'http://localhost:19080/api/v1/stripe/webhook',
    '--events',
    'checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed,invoice.paid,invoice.payment_failed,customer.subscription.updated,customer.subscription.deleted',
  ],
  {
    env: { ...process.env, STRIPE_API_KEY: config.STRIPE_SECRET_KEY },
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);
let ready = false;
function consume(chunk: Buffer) {
  const text = chunk.toString();
  const match = text.match(/whsec_[A-Za-z0-9]+/);
  if (match && !ready) {
    const old = fs.readFileSync(envFile, 'utf8');
    fs.writeFileSync(
      envFile,
      old.replace(/^STRIPE_WEBHOOK_SECRET=.*\n?/m, '') + `STRIPE_WEBHOOK_SECRET=${match[0]}\n`,
      { mode: 0o600 },
    );
    fs.chmodSync(envFile, 0o600);
    ready = true;
    console.log(
      'Escucha de webhooks sandbox preparada. Recrea el backend para leer la firma local.',
    );
  } else if (ready)
    process.stdout.write(
      text.replace(/(?:sk|rk|pk)_test_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+/g, '[OCULTO]'),
    );
}
child.stdout.on('data', consume);
child.stderr.on('data', consume);
child.on('exit', (code) => (process.exitCode = code || 0));
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => child.kill(signal));
