/**
 * One frame of the workflow storyboard: the same illustrated incident at every
 * station. Eight ranks of one job run a step and meet at the all-reduce (the
 * dashed gate); rank 2 is slow. Static SVG, drawn on the server. Decorative:
 * the station's text says what the frame shows.
 */

export type Step = "detect" | "diagnose" | "fix" | "verify" | "escalate";

const RANKS = 8;
const LATE = 2;
const X0 = 18;
const rowY = (i: number) => 16 + i * 12;

export default function IncidentFrame({ step }: { step: Step }) {
  const aligned = step === "fix" || step === "verify";
  const gate = aligned ? 178 : 206;
  const bars = Array.from({ length: RANKS }, (_, i) => {
    const late = i === LATE;
    let end = late ? 200 : 150 + ((i * 7) % 5) * 2;
    if (aligned) end = 172 + ((i * 5) % 3);
    return { i, late, end, y: rowY(i) };
  });
  const lateY = rowY(LATE);
  return (
    <svg className="ys-frame" viewBox="0 0 240 132" aria-hidden="true" data-step={step}>
      <rect x="0.5" y="0.5" width="239" height="131" className="ys-frame-plate" />
      {/* the all-reduce gate */}
      <line x1={gate} y1="8" x2={gate} y2="108" className={step === "verify" ? "ys-frame-gate is-on" : "ys-frame-gate"} />
      {bars.map((b) => (
        <g key={b.i}>
          {/* waiting at the gate */}
          {b.end < gate - 4 && <line x1={b.end + 3} y1={b.y} x2={gate - 3} y2={b.y} className="ys-frame-wait" />}
          <line
            x1={X0}
            y1={b.y}
            x2={b.end}
            y2={b.y}
            className={b.late && step !== "verify" ? "ys-frame-bar is-late" : "ys-frame-bar"}
            strokeDasharray={b.late && step === "escalate" ? "3 3" : undefined}
          />
        </g>
      ))}
      {step === "detect" && <circle cx={200} cy={lateY} r="6.5" className="ys-frame-ring" />}
      {step === "diagnose" && (
        <>
          <path d={`M${X0 - 6} ${lateY - 6} h-4 v12 h4 M206 ${lateY - 6} h4 v12 h-4`} className="ys-frame-bracket" />
          <g className="ys-frame-tags" fontSize="11">
            <text x={X0} y="124" className="is-picked">GPU</text>
            <text x={X0 + 44} y="124">link</text>
            <text x={X0 + 86} y="124">host</text>
            <text x={X0 + 130} y="124">change</text>
          </g>
        </>
      )}
      {step === "fix" && (
        <g className="ys-frame-move">
          <path d={`M150 ${lateY} q12 -14 22 -18 M150 ${lateY} q12 14 22 18`} />
          <path d={`M168 ${lateY - 20} l4 2 -2 4 M168 ${lateY + 20} l4 -2 -2 -4`} />
        </g>
      )}
      {step === "verify" && (
        <g>
          <polyline points="18,124 60,124 76,118 98,116 236,116" className="ys-frame-spark" />
          <path d="M214 104 l5 5 9 -11" className="ys-frame-check" />
        </g>
      )}
      {step === "escalate" && (
        <g>
          <path d={`M200 ${lateY + 4} v40 q0 22 22 22 h4`} className="ys-frame-branch" />
          <circle cx="230" cy="86" r="5" className="ys-frame-person" />
          <path d="M221 104 q9 -14 18 0" className="ys-frame-person" />
        </g>
      )}
    </svg>
  );
}
