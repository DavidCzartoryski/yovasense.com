import type { CSSProperties } from "react";
import {
  EDGE_FROM, EDGE_TO, STILL_POSE, TOP_POSE,
  creaseAlpha, faceGeometry, faces, ribbons, type Face, type FieldMode, type Len, type Pose,
} from "./fieldGeometry";

/**
 * The scroll field's first frame without the canvas: the pose at the top of the
 * page and the reduced-motion still, for phone and desktop, from the geometry
 * the canvas uses (fieldGeometry.ts). Server-rendered into ScrollField's
 * fallback slot; CSS shows the one that matches the field's width (a container
 * query, like the canvas's W < 760) and the motion preference, and hides them
 * all once the canvas is live.
 *
 * Each ribbon's shape goes on a wrapper as custom properties (lengths as a·W +
 * b·H in the fallback's cqw/cqh); each face, crease and warm edge is one
 * element carrying only where it sits along the ribbon (--s0, H units) and how
 * bright it is (--k). globals.css (.ys-fr) turns that into the box, the cut and
 * the light, with the colours of fieldGeometry.ts's stops.
 */

const MODES: FieldMode[] = ["phone", "desk"];
/** Field sizes the still is built for: a face is kept if it shows at any of them. */
const SAMPLES: Record<FieldMode, [number, number][]> = {
  phone: [[320, 568], [360, 740], [390, 844], [430, 932], [600, 900], [759, 1100], [740, 360], [600, 400]],
  desk: [[760, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [1024, 1366], [1366, 600]],
};
/** The size the warm edge's crease is picked at (the canvas picks it at the actual size, the same one there). */
const REF: Record<FieldMode, [number, number]> = { phone: [390, 844], desk: [1440, 900] };

const n = (x: number, d = 4) => +x.toFixed(d);
function css(l: Len) {
  const a = n(l[0] * 100, 3), b = n(l[1] * 100, 3);
  if (!b) return `${a}cqw`;
  if (!a) return `${b}cqh`;
  return `calc(${a}cqw ${b < 0 ? "-" : "+"} ${Math.abs(b)}cqh)`;
}
const vars = (v: Record<string, string | number>) => v as CSSProperties;

function FieldPose({ mode, kind, pose }: { mode: FieldMode; kind: "top" | "still"; pose: Pose }) {
  const [rw, rh] = REF[mode];
  const per = ribbons(mode, pose.p).map((R, i) => {
    const all = faces(R, i, pose.p, pose.scroll, 4);
    const shown = all.filter((f) => SAMPLES[mode].some(([w, h]) => faceGeometry(R, f, w, h)));
    let edge: Face | null = null;
    let best = Infinity;
    for (const f of all) {
      if (f.lit && f.dist < best && faceGeometry(R, f, rw, rh)) {
        best = f.dist;
        edge = f;
      }
    }
    const style = vars({
      "--ox": css(R.ox),
      "--oy": css(R.oy),
      "--rot": `${n(R.angle * (180 / Math.PI))}deg`,
      "--turn": `${n(90 + R.skew * (180 / Math.PI))}deg`,
      "--h": css(R.half),
      "--pl": css([0, R.panel]),
      "--sin": n(Math.sin(R.skew), 5),
      "--as": n(Math.abs(Math.sin(R.skew)), 5),
      "--cos": n(Math.cos(R.skew), 5),
    });
    return { i, shown, edge, style, a: pose.gain * R.gain, warmth: i === 0 ? pose.warmth : pose.warmth * 0.45 };
  });
  return (
    <div className="ys-fs" data-mode={mode} data-pose={kind}>
      {per.map(({ i, shown, style, a }) => (
        <div key={`f${i}`} className="ys-fr" style={style}>
          {shown.map((f) => (
            <i key={n(f.s0)} data-f={f.lit ? "lit" : "shade"} style={vars({ "--s0": n(f.s0, 5), "--k": n(f.lit ? f.b * a : a) })} />
          ))}
        </div>
      ))}
      {per.map(({ i, shown, edge, style, a, warmth }) => (
        <div key={`c${i}`} className="ys-fr" style={style}>
          {shown
            .filter((f) => f.lit)
            .map((f) => (
              <i key={n(f.s0)} data-f="crease" style={vars({ "--s0": n(f.s0, 5), "--k": n(creaseAlpha(f.b * a)) })} />
            ))}
          {edge && warmth > 0.02
            ? (["edge", "glow"] as const).map((e) => (
                <i key={e} data-f={e} style={vars({ "--s0": n(edge.s0, 5), "--k": n(warmth), "--from": EDGE_FROM, "--to": EDGE_TO })} />
              ))
            : null}
        </div>
      ))}
    </div>
  );
}

export default function FieldStill() {
  return MODES.map((m) => [
    <FieldPose key={`${m}-top`} mode={m} kind="top" pose={TOP_POSE(m)} />,
    <FieldPose key={`${m}-still`} mode={m} kind="still" pose={STILL_POSE(m)} />,
  ]);
}
