import type { Tone } from "./components/StatusPill";

/** Many planners aim for at least this chance that savings last. */
export const ON_TRACK_RATE = 0.85;

/** How a "will my money last?" percentage reads at a glance. */
export function successTone(rate: number): { tone: Tone; label: string } {
  if (rate >= ON_TRACK_RATE) return { tone: "good", label: "On track" };
  if (rate >= 0.7) return { tone: "warning", label: "Borderline" };
  return { tone: "critical", label: "At risk" };
}

/**
 * The label for "Your savings last". Steady growth alone can look reassuring when
 * there's almost no room to spare, so the green tick also needs real markets to
 * work out often enough.
 */
export function savingsStatus(
  runsOutAtAge: number | null,
  planToAge: number,
  successRate: number,
): { tone: Tone; label: string } {
  if (runsOutAtAge !== null) {
    return { tone: "critical", label: `Runs out ${planToAge - runsOutAtAge + 1} years early` };
  }
  if (successRate < ON_TRACK_RATE) return { tone: "warning", label: "Little room to spare" };
  return { tone: "good", label: "Covers your plan" };
}
