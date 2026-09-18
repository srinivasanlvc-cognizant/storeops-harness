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

describe('alerts module', () => {
  it('records an info alert via the event bus when an activity is created', async () => {
    const storeId = `store-alerts-${Math.random().toString(36).slice(2)}`;
    const staffId = await createStaffMember(storeId);

    const activity = await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    const alerts = await request(app).get('/api/alerts').query({ storeId });
    expect(alerts.status).toBe(200);
    expect(alerts.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'activity.created',
          severity: 'info',
          referenceId: activity.body.id,
          acknowledged: false,
        }),
      ]),
    );
  });

  it('records a warning alert when an activity is cancelled', async () => {
    const storeId = `store-alerts-${Math.random().toString(36).slice(2)}`;
    const staffId = await createStaffMember(storeId);

    const activity = await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    await request(app).patch(`/api/activities/${activity.body.id}/status`).send({ status: 'cancelled' });

    const alerts = await request(app).get('/api/alerts').query({ storeId, severity: 'warning' });
    expect(alerts.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'activity.cancelled', referenceId: activity.body.id }),
      ]),
    );
  });

  it('acknowledges an alert and rejects a second acknowledgement', async () => {
    const storeId = `store-alerts-${Math.random().toString(36).slice(2)}`;
    const staffId = await createStaffMember(storeId);
    await request(app).post('/api/activities').send({
      title: 'Restock shelves',
      storeId,
      assignedStaffId: staffId,
      dueDate: new Date().toISOString(),
    });

    const [alert] = (await request(app).get('/api/alerts').query({ storeId })).body;

    const ack = await request(app).patch(`/api/alerts/${alert.id}/acknowledge`);
    expect(ack.status).toBe(200);
    expect(ack.body.acknowledged).toBe(true);

    const secondAck = await request(app).patch(`/api/alerts/${alert.id}/acknowledge`);
    expect(secondAck.status).toBe(409);
    expect(secondAck.body.error.code).toBe('CONFLICT');
  });
});
