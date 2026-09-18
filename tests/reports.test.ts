import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

function uniqueEmail(): string {
  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe('reports module', () => {
  it('aggregates staff, activities, programmes, and alerts for a store', async () => {
    const storeId = `store-reports-${Math.random().toString(36).slice(2)}`;

    const staff = await request(app)
      .post('/api/staff')
      .send({ name: 'Owner', email: uniqueEmail(), role: 'manager', storeId });

    await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId,
      assignedStaffId: staff.body.id,
      dueDate: new Date().toISOString(),
    });

    await request(app).post('/api/programmes').send({
      name: 'Summer promo',
      storeId,
      ownerStaffId: staff.body.id,
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T00:00:00.000Z',
    });

    const generated = await request(app).post('/api/reports/generate').query({ storeId });
    expect(generated.status).toBe(201);
    expect(generated.body.summary).toMatchObject({
      staff: { total: 1, active: 1 },
      activities: { total: 1, pending: 1 },
      programmes: { total: 1, draft: 1 },
      alerts: { total: 2, unacknowledged: 2 },
    });

    const fetched = await request(app).get(`/api/reports/${generated.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(generated.body);

    const list = await request(app).get('/api/reports');
    expect(list.status).toBe(200);
    expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: generated.body.id })]));
  });

  it('returns 404 for an unknown report id', async () => {
    const res = await request(app).get('/api/reports/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
