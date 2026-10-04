export type Tone = "good" | "warning" | "critical";

const ICONS: Record<Tone, string> = {
  good: "M3 8.5l3 3 7-7", // tick
  warning: "M8 3v6M8 12.5v.5", // exclamation
  critical: "M4 4l8 8M12 4l-8 8", // cross
};

/** A coloured label that always pairs its colour with an icon and words. */
export function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`pill pill-${tone}`}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d={ICONS[tone]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}
