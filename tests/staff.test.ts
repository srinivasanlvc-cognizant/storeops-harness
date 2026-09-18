import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

function uniqueEmail(): string {
  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe('staff module', () => {
  it('creates a staff member', async () => {
    const res = await request(app).post('/api/staff').send({
      name: 'Ada Lovelace',
      email: uniqueEmail(),
      role: 'manager',
      storeId: 'store-1',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Ada Lovelace', role: 'manager', active: true });
  });

  it('rejects a missing name with a typed validation error', async () => {
    const res = await request(app).post('/api/staff').send({
      email: uniqueEmail(),
      role: 'manager',
      storeId: 'store-1',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects a duplicate email with a conflict error', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/staff').send({ name: 'A', email, role: 'associate', storeId: 'store-1' });
    const res = await request(app).post('/api/staff').send({ name: 'B', email, role: 'associate', storeId: 'store-1' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 404 for an unknown staff id', async () => {
    const res = await request(app).get('/api/staff/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('deactivates a staff member', async () => {
    const created = await request(app)
      .post('/api/staff')
      .send({ name: 'C', email: uniqueEmail(), role: 'associate', storeId: 'store-1' });

    const res = await request(app).delete(`/api/staff/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.active).toBe(false);
  });

  it('filters staff by storeId', async () => {
    const storeId = `store-${Math.random().toString(36).slice(2)}`;
    await request(app).post('/api/staff').send({ name: 'D', email: uniqueEmail(), role: 'associate', storeId });

    const res = await request(app).get('/api/staff').query({ storeId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].storeId).toBe(storeId);
  });
});
