import { describe, expect, it } from 'vitest';

import { getCheckInEligibility } from './checkInEligibility';
import type { Membership } from './useMemberships';

function membership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'membership-1',
    name: '테스트 회원권',
    type: 'session',
    cost: 100_000,
    period: 'month',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    maxVisits: 10,
    weeklyGoal: null,
    inputMethod: 'manual',
    createdAt: '2026-08-01T00:00:00.000Z',
    usedVisits: 3,
    remainingVisits: 7,
    status: 'active',
    ...overrides,
  };
}

describe('getCheckInEligibility', () => {
  it('allows an active membership with remaining sessions', () => {
    expect(getCheckInEligibility(membership(), new Date('2026-08-20T12:00:00Z'))).toEqual({ eligible: true });
  });

  it('rejects a membership before its start date', () => {
    expect(getCheckInEligibility(membership({ startDate: '2026-08-21' }), new Date('2026-08-20T12:00:00Z'))).toEqual({
      eligible: false,
      reason: 'not_started',
    });
  });

  it('rejects an expired membership', () => {
    expect(getCheckInEligibility(membership({ endDate: '2026-08-19' }), new Date('2026-08-20T12:00:00Z'))).toEqual({
      eligible: false,
      reason: 'expired',
    });
  });

  it('rejects a session membership with no remaining visits', () => {
    expect(getCheckInEligibility(membership({ usedVisits: 10, remainingVisits: 0 }), new Date('2026-08-20T12:00:00Z'))).toEqual({
      eligible: false,
      reason: 'sessions_exhausted',
    });
  });

  it('allows an active period membership', () => {
    expect(
      getCheckInEligibility(
        membership({ type: 'period', maxVisits: null, remainingVisits: null }),
        new Date('2026-08-20T12:00:00Z'),
      ),
    ).toEqual({ eligible: true });
  });

  it('allows a legacy session membership without a visit cap', () => {
    expect(
      getCheckInEligibility(
        membership({ type: 'session', maxVisits: null, remainingVisits: null }),
        new Date('2026-08-20T12:00:00Z'),
      ),
    ).toEqual({ eligible: true });
  });
});
