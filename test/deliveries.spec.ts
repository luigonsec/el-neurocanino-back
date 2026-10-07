import { DeliveryWorker } from '../src/leads/deliveries';
describe('Reintentos de avisos', () => {
  it('un fallo SMTP conserva la solicitud y programa otro intento', async () => {
    const update = jest.fn();
    const lead = { id: 'lead-1', email: 'persona@example.test' };
    const delivery = { id: 1, leadId: lead.id, channel: 'email', status: 'pending', attempts: 0 };
    const repo = {
      find: jest.fn().mockResolvedValue([delivery]),
      findOneByOrFail: jest.fn().mockResolvedValue(lead),
      update,
      delete: jest.fn(),
    };
    const runner = {
      connect: jest.fn(),
      query: jest.fn().mockResolvedValue([{ acquired: 1 }]),
      manager: { getRepository: () => repo },
      release: jest.fn(),
    };
    const db = { createQueryRunner: () => runner };
    const worker = new DeliveryWorker(db as any, { upsertLead: jest.fn() } as any);
    jest.spyOn(worker, 'sendEmail').mockRejectedValue(new Error('SMTP desconectado'));
    await worker.flush();
    expect(update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'pending', attempts: 1, lastError: 'SMTP desconectado' }),
    );
    expect(lead.id).toBe('lead-1');
    expect(runner.release).toHaveBeenCalled();
  });
});
