import type { Membership } from './useMemberships';

export type CheckInIneligibilityReason = 'not_started' | 'expired' | 'sessions_exhausted';

export type CheckInEligibility =
  | { eligible: true }
  | { eligible: false; reason: CheckInIneligibilityReason };

/** 회원권의 시작일·만료일·횟수 한도를 기준으로 출석 가능 여부를 판단한다. */
export function getCheckInEligibility(
  membership: Membership,
  now = new Date(),
): CheckInEligibility {
  const today = now.toISOString().slice(0, 10);
  if (membership.startDate > today) return { eligible: false, reason: 'not_started' };
  if (membership.endDate < today) return { eligible: false, reason: 'expired' };
  if (membership.type === 'session' && membership.remainingVisits === 0) {
    return { eligible: false, reason: 'sessions_exhausted' };
  }
  return { eligible: true };
}
