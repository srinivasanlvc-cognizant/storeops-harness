import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

function uniqueEmail(): string {
  return `staff-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

async function createStaffMember(storeId: string): Promise<string> {
  const res = await request(app)
    .post('/api/staff')
    .send({ name: 'Staffer', email: uniqueEmail(), role: 'associate', storeId });
  return res.body.id;
}

describe('activities module', () => {
  it('creates an activity for an active staff member', async () => {
    const storeId = 'store-activities-1';
    const staffId = await createStaffMember(storeId);

    const res = await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      description: 'Restock the front aisle',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ status: 'pending', storeId, assignedStaffId: staffId });
  });

  it('rejects an activity assigned to an unknown staff member', async () => {
    const res = await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId: 'store-1',
      assignedStaffId: 'unknown-staff',
      dueDate: new Date().toISOString(),
    });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects an activity assigned to a deactivated staff member', async () => {
    const storeId = 'store-activities-2';
    const staffId = await createStaffMember(storeId);
    await request(app).delete(`/api/staff/${staffId}`);

    const res = await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('walks an activity through valid status transitions', async () => {
    const storeId = 'store-activities-3';
    const staffId = await createStaffMember(storeId);
    const created = await request(app).post('/api/activities').send({
      title: 'Audit inventory',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    const inProgress = await request(app)
      .patch(`/api/activities/${created.body.id}/status`)
      .send({ status: 'in_progress' });
    expect(inProgress.status).toBe(200);
    expect(inProgress.body.status).toBe('in_progress');

    const completed = await request(app)
      .patch(`/api/activities/${created.body.id}/status`)
      .send({ status: 'completed' });
    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe('completed');
  });

  it('rejects an invalid status transition', async () => {
    const storeId = 'store-activities-4';
    const staffId = await createStaffMember(storeId);
    const created = await request(app).post('/api/activities').send({
      title: 'Audit inventory',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    const res = await request(app)
      .patch(`/api/activities/${created.body.id}/status`)
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
