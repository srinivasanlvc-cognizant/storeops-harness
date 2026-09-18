import * as staffPublicApi from '../src/staff';
import * as activitiesPublicApi from '../src/activities';
import * as programmesPublicApi from '../src/programmes';

describe('module boundaries', () => {
  it('does not expose staff write operations to other modules', () => {
    const exposed = staffPublicApi as Record<string, unknown>;
    expect(exposed.createStaff).toBeUndefined();
    expect(exposed.updateStaff).toBeUndefined();
    expect(exposed.deactivateStaff).toBeUndefined();
  });

  it('does not expose activities write operations outside the module', () => {
    const exposed = activitiesPublicApi as Record<string, unknown>;
    expect(exposed.createActivity).toBeUndefined();
    expect(exposed.updateActivityStatus).toBeUndefined();
    expect(exposed.bulkUpdateActivityStatus).toBeUndefined();
  });

  it('does not expose programmes write operations outside the module', () => {
    const exposed = programmesPublicApi as Record<string, unknown>;
    expect(exposed.createProgramme).toBeUndefined();
    expect(exposed.updateProgrammeStatus).toBeUndefined();
  });
});
