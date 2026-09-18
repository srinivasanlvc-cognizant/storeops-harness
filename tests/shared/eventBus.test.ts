import { eventBus } from '../../src/shared/events';

describe('eventBus', () => {
  it('delivers published payloads to subscribers', () => {
    const handler = jest.fn();
    eventBus.subscribe('activity.created', handler);

    eventBus.publish('activity.created', {
      activityId: 'a1',
      storeId: 's1',
      assignedStaffId: 'st1',
      title: 'Restock shelves',
      dueDate: new Date().toISOString(),
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ activityId: 'a1', storeId: 's1' }),
    );
  });
});
