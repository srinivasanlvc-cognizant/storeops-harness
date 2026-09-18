import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

function uniqueEmail(): string {
  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function createStaffMember(storeId: string): Promise<string> {
  const res = await request(app)
    .post('/api/staff')
    .send({ name: 'Owner', email: uniqueEmail(), role: 'manager', storeId });
  return res.body.id;
}

describe('programmes module', () => {
  it('creates a programme owned by an active staff member', async () => {
    const storeId = 'store-programmes-1';
    const ownerStaffId = await createStaffMember(storeId);

    const res = await request(app).post('/api/programmes').send({
      name: 'Summer promo',
      storeId,
      ownerStaffId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'draft', name: 'Summer promo' });
  });

  it('rejects an endDate before startDate', async () => {
    const storeId = 'store-programmes-2';
    const ownerStaffId = await createStaffMember(storeId);

    const res = await request(app).post('/api/programmes').send({
      name: 'Broken dates',
      storeId,
      ownerStaffId,
      startDate: '2026-06-30T00:00:00.000Z',
      endDate: '2026-06-01T00:00:00.000Z',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('walks a programme through valid status transitions', async () => {
    const storeId = 'store-programmes-3';
    const ownerStaffId = await createStaffMember(storeId);
    const created = await request(app).post('/api/programmes').send({
      name: 'Loyalty drive',
      storeId,
      ownerStaffId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    });

    const active = await request(app)
      .patch(`/api/programmes/${created.body.id}/status`)
      .send({ status: 'active' });
    expect(active.body.status).toBe('active');

    const completed = await request(app)
      .patch(`/api/programmes/${created.body.id}/status`)
      .send({ status: 'completed' });
    expect(completed.body.status).toBe('completed');
  });

  it('rejects an invalid status transition', async () => {
    const storeId = 'store-programmes-4';
    const ownerStaffId = await createStaffMember(storeId);
    const created = await request(app).post('/api/programmes').send({
      name: 'Loyalty drive',
      storeId,
      ownerStaffId,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    });

    const res = await request(app)
      .patch(`/api/programmes/${created.body.id}/status`)
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
