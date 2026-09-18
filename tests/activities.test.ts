import request from 'supertest';
import { createApp } from '../src/app';
import { eventBus, type ActivityUpdatedEvent } from '../src/shared/events';

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

async function createActivityRecord(storeId: string, staffId: string): Promise<Record<string, unknown>> {
  const res = await request(app).post('/api/activities').send({
    title: 'Handover task',
    storeId,
    assignedStaffId: staffId,
    dueDate: new Date().toISOString(),
  });
  return res.body as Record<string, unknown>;
}

function captureActivityUpdatedEvents(): ActivityUpdatedEvent[] {
  const received: ActivityUpdatedEvent[] = [];
  eventBus.subscribe('activity.updated', (event) => {
    received.push(event);
  });
  return received;
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

  describe('bulk-status', () => {
    it('AC1: fully updates all items and publishes one activity.updated event per item', async () => {
      const storeId = `store-bulk-1-${Math.random().toString(36).slice(2)}`;
      const staffId = await createStaffMember(storeId);
      const a1 = await createActivityRecord(storeId, staffId);
      const a2 = await createActivityRecord(storeId, staffId);
      await request(app).patch(`/api/activities/${a2.id}/status`).send({ status: 'in_progress' });

      const received = captureActivityUpdatedEvents();

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send([
          { id: a1.id, status: 'DONE' },
          { id: a2.id, status: 'BLOCKED', notes: 'waiting on delivery' },
        ]);

      expect(res.status).toBe(200);
      expect(res.body.errors).toEqual([]);
      expect(res.body.updated).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: a1.id, status: 'DONE' }),
          expect.objectContaining({ id: a2.id, status: 'BLOCKED', notes: 'waiting on delivery' }),
        ]),
      );

      const getA1 = await request(app).get(`/api/activities/${a1.id}`);
      expect(getA1.body.status).toBe('DONE');
      const getA2 = await request(app).get(`/api/activities/${a2.id}`);
      expect(getA2.body.status).toBe('BLOCKED');
      expect(getA2.body.notes).toBe('waiting on delivery');

      const relevant = received.filter((e) => e.activityId === a1.id || e.activityId === a2.id);
      expect(relevant).toHaveLength(2);
      expect(relevant).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ activityId: a1.id, previousStatus: 'pending', newStatus: 'DONE' }),
          expect.objectContaining({
            activityId: a2.id,
            previousStatus: 'in_progress',
            newStatus: 'BLOCKED',
            notes: 'waiting on delivery',
          }),
        ]),
      );
    });

    it('AC2: reports a per-item NOT_FOUND error alongside a successful update', async () => {
      const storeId = `store-bulk-2-${Math.random().toString(36).slice(2)}`;
      const staffId = await createStaffMember(storeId);
      const a1 = await createActivityRecord(storeId, staffId);

      const received = captureActivityUpdatedEvents();

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send([
          { id: a1.id, status: 'DONE' },
          { id: 'missing-id', status: 'DONE' },
        ]);

      expect(res.status).toBe(200);
      expect(res.body.updated).toHaveLength(1);
      expect(res.body.updated[0]).toMatchObject({ id: a1.id, status: 'DONE' });
      expect(res.body.errors).toEqual([
        expect.objectContaining({ id: 'missing-id', code: 'NOT_FOUND', message: expect.stringContaining('missing-id') }),
      ]);

      const getA1 = await request(app).get(`/api/activities/${a1.id}`);
      expect(getA1.body.status).toBe('DONE');

      const relevant = received.filter((e) => e.activityId === a1.id);
      expect(relevant).toHaveLength(1);
    });

    it('AC3: an inactive assigned staff member on one item does not block others', async () => {
      const storeId = `store-bulk-3-${Math.random().toString(36).slice(2)}`;
      const staffId1 = await createStaffMember(storeId);
      const staffId2 = await createStaffMember(storeId);
      const a1 = await createActivityRecord(storeId, staffId1);
      const a2 = await createActivityRecord(storeId, staffId2);
      await request(app).delete(`/api/staff/${staffId2}`);

      const received = captureActivityUpdatedEvents();

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send([
          { id: a1.id, status: 'DONE' },
          { id: a2.id, status: 'DONE' },
        ]);

      expect(res.status).toBe(200);
      expect(res.body.updated).toEqual([expect.objectContaining({ id: a1.id, status: 'DONE' })]);
      expect(res.body.errors).toEqual([expect.objectContaining({ id: a2.id, code: 'VALIDATION_ERROR' })]);

      const getA2 = await request(app).get(`/api/activities/${a2.id}`);
      expect(getA2.body.status).toBe('pending');

      const relevant = received.filter((e) => e.activityId === a1.id || e.activityId === a2.id);
      expect(relevant).toHaveLength(1);
      expect(relevant[0]).toMatchObject({ activityId: a1.id });
    });

    it('AC4: an unsupported status value is a per-item error, not a request-level failure', async () => {
      const storeId = `store-bulk-4-${Math.random().toString(36).slice(2)}`;
      const staffId = await createStaffMember(storeId);
      const a1 = await createActivityRecord(storeId, staffId);

      const received = captureActivityUpdatedEvents();

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send([{ id: a1.id, status: 'FINISHED' }]);

      expect(res.status).toBe(200);
      expect(res.body.updated).toEqual([]);
      expect(res.body.errors).toEqual([
        expect.objectContaining({
          id: a1.id,
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('DONE'),
        }),
      ]);

      const getA1 = await request(app).get(`/api/activities/${a1.id}`);
      expect(getA1.body.status).toBe('pending');

      expect(received.filter((e) => e.activityId === a1.id)).toHaveLength(0);
    });

    it('AC5: a non-array request body is a request-level validation error', async () => {
      const received = captureActivityUpdatedEvents();
      const beforeCount = received.length;

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send({ id: 'A1', status: 'DONE' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: { code: 'VALIDATION_ERROR', message: expect.stringContaining('array') },
      });
      expect(received).toHaveLength(beforeCount);
    });

    it('AC6: an empty array request body is a request-level validation error', async () => {
      const received = captureActivityUpdatedEvents();
      const beforeCount = received.length;

      const res = await request(app).patch('/api/activities/bulk-status').send([]);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: { code: 'VALIDATION_ERROR', message: expect.stringContaining('empty') },
      });
      expect(received).toHaveLength(beforeCount);
    });

    it('AC7: an illegal transition from a terminal status is a per-item error, not a request-level failure', async () => {
      const storeId = `store-bulk-7-${Math.random().toString(36).slice(2)}`;
      const staffId = await createStaffMember(storeId);
      const a1 = await createActivityRecord(storeId, staffId);
      await request(app).patch(`/api/activities/${a1.id}/status`).send({ status: 'in_progress' });
      await request(app).patch(`/api/activities/${a1.id}/status`).send({ status: 'completed' });

      const received = captureActivityUpdatedEvents();

      const res = await request(app)
        .patch('/api/activities/bulk-status')
        .send([{ id: a1.id, status: 'DONE' }]);

      expect(res.status).toBe(200);
      expect(res.body.updated).toEqual([]);
      expect(res.body.errors).toEqual([
        expect.objectContaining({
          id: a1.id,
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('completed'),
        }),
      ]);

      const getA1 = await request(app).get(`/api/activities/${a1.id}`);
      expect(getA1.body.status).toBe('completed');

      expect(received.filter((e) => e.activityId === a1.id)).toHaveLength(0);
    });
  });
});
