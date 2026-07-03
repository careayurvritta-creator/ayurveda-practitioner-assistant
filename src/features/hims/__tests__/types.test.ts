import { canTransition, VALID_STATUS_TRANSITIONS } from '../types';

describe('OPD Visit Status Transitions', () => {
  it('should allow waiting → in-progress', () => {
    expect(canTransition('waiting', 'in-progress')).toBe(true);
  });

  it('should allow waiting → cancelled', () => {
    expect(canTransition('waiting', 'cancelled')).toBe(true);
  });

  it('should not allow waiting → completed', () => {
    expect(canTransition('waiting', 'completed')).toBe(false);
  });

  it('should allow in-progress → completed', () => {
    expect(canTransition('in-progress', 'completed')).toBe(true);
  });

  it('should allow in-progress → cancelled', () => {
    expect(canTransition('in-progress', 'cancelled')).toBe(true);
  });

  it('should not allow in-progress → waiting', () => {
    expect(canTransition('in-progress', 'waiting')).toBe(false);
  });

  it('should not allow completed → any status', () => {
    expect(canTransition('completed', 'waiting')).toBe(false);
    expect(canTransition('completed', 'in-progress')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
  });

  it('should not allow cancelled → any status', () => {
    expect(canTransition('cancelled', 'waiting')).toBe(false);
    expect(canTransition('cancelled', 'in-progress')).toBe(false);
    expect(canTransition('cancelled', 'completed')).toBe(false);
  });

  it('should have correct transition map', () => {
    expect(VALID_STATUS_TRANSITIONS['waiting']).toEqual(['in-progress', 'cancelled']);
    expect(VALID_STATUS_TRANSITIONS['in-progress']).toEqual(['completed', 'cancelled']);
    expect(VALID_STATUS_TRANSITIONS['completed']).toEqual([]);
    expect(VALID_STATUS_TRANSITIONS['cancelled']).toEqual([]);
  });
});
