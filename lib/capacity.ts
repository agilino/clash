export type ParticipationDecision = "accepted" | "waitlisted";

/**
 * Decide whether a new join request is accepted or waitlisted, given a
 * clash's capacity (null = unlimited) and how many participants are
 * already accepted.
 */
export function decideParticipation(
  capacity: number | null,
  acceptedCount: number,
): ParticipationDecision {
  return "waitlisted";
}
