"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Mark from "./Mark";
import { reducedMotion } from "./motion";
import styles from "./SlackShowcase.module.css";

/**
 * The Slack example in the homepage's gradient section: YovaSense takes one incident from alert to
 * resolved in #gpu-ops (copy deck, "Slack thread script"). A coded animation, not a video: every
 * message is server-rendered, and a beat only flips `data-shown` on the parts it reveals, which
 * CSS fades in (opacity and transform only, layout space reserved, so nothing shifts).
 *
 * The visual thread is aria-hidden; assistive tech gets the sr-only transcript, rendered once and
 * never changed (no aria-live, nothing re-announced per loop).
 *
 * Driver: a timeline with one setTimeout to the next beat. It runs only while the visitor hasn't
 * paused it, the panel is in view, the tab is visible and motion is allowed. Under
 * prefers-reduced-motion the complete thread rests still; Play then runs one opacity-only pass and
 * returns to the complete thread. Server render, no JS and pre-hydration: the complete thread.
 */

/** Beat times in seconds from the start of a cycle; the index is the step (`data-step`). */
const BEATS = [0, 0.4, 1.2, 2.2, 3.0, 3.6, 6.4, 6.8, 7.0, 7.6, 8.6, 9.4, 10.4, 11.2, 12.2, 13.0, 14.4, 15.0] as const;
/** The step at which the thread is complete (Maya's reaction). */
const LAST = BEATS.length - 1;

/** What each step reveals (copy deck, "Beat timing"). */
const STEP = {
  m1: 2,
  m2: 4,
  card: 5,
  press: 6,
  approved: 7,
  m3: 9,
  m4: 11,
  m5: 13,
  m6: 15,
  resolved: 16,
  reaction: 17,
} as const;

/** Who is typing at a step (the line shows until the next beat). */
const TYPING: Partial<Record<number, string>> = { 1: "YovaSense", 3: "YovaSense", 8: "Maya", 10: "YovaSense", 12: "YovaSense", 14: "YovaSense" };

// Timeline events: k >= 0 shows step k; the others fade the thread out, loop to the start, or end a
// reduced-motion pass on the complete thread.
const FADE = -1;
const LOOP = -2;
const END = -3;
type Ev = { t: number; k: number };
/** The loop: the sequence, a 6 s hold on the complete thread, a 0.5 s fade, again. */
const CYCLE: readonly Ev[] = [...BEATS.map((t, k) => ({ t, k })), { t: 21.0, k: FADE }, { t: 21.5, k: LOOP }];
/** Index of the fade in CYCLE: resuming there starts the sequence over. */
const CYCLE_FADE = LAST + 1;
/** One visitor-started pass under reduced motion: fade the complete thread, play it once, rest. */
const ONCE: readonly Ev[] = [{ t: 0, k: FADE }, ...BEATS.map((t, k) => ({ t: t + 0.5, k })), { t: BEATS[LAST] + 0.9, k: END }];

type Phase = "static" | "ready" | "playing" | "paused" | "resetting";

type Msg = {
  key: string;
  beat: number;
  author: "YovaSense" | "Maya";
  /** consecutive message from the same author: no avatar or name, the time in the gutter */
  grouped: boolean;
  time: string;
  text: string;
  /** the transcript line (copy deck, "Transcript") */
  sr: string;
};

const THREAD: readonly Msg[] = [
  {
    key: "m1", beat: STEP.m1, author: "YovaSense", grouped: false, time: "10:42 AM",
    text: "New incident. A training job stalled on node r1n2.",
    sr: "YovaSense (app), 10:42 AM: New incident. A training job stalled on node r1n2. Status: resolved.",
  },
  {
    key: "m2", beat: STEP.m2, author: "YovaSense", grouped: true, time: "10:43",
    text: "Root cause found. GPU 4 on node r1n2 stopped responding, and the rest of the node is healthy.",
    sr: "YovaSense, 10:43 AM: Root cause found. GPU 4 on node r1n2 stopped responding, and the rest of the node is healthy. Proposed fix: reset GPU 4 and resume the job from its last checkpoint. Scope: one node, one job. Approval: required by your policy. Approved by Maya.",
  },
  {
    key: "m3", beat: STEP.m3, author: "Maya", grouped: false, time: "10:44 AM",
    text: "Looks right. Go ahead.",
    sr: "Maya, 10:44 AM: Looks right. Go ahead.",
  },
  {
    key: "m4", beat: STEP.m4, author: "YovaSense", grouped: false, time: "10:46 AM",
    text: "Fix applied. GPU 4 reset cleanly and the job picked up from its last checkpoint.",
    sr: "YovaSense, 10:46 AM: Fix applied. GPU 4 reset cleanly and the job picked up from its last checkpoint.",
  },
  {
    key: "m5", beat: STEP.m5, author: "YovaSense", grouped: true, time: "10:47",
    text: "Recovery verified. GPU 4 passed its health checks and node r1n2 is back in service.",
    sr: "YovaSense, 10:47 AM: Recovery verified. GPU 4 passed its health checks and node r1n2 is back in service.",
  },
  {
    key: "m6", beat: STEP.m6, author: "YovaSense", grouped: true, time: "10:48",
    text: "One item needs a person. GPU 4 should be inspected at the next maintenance window, and the ticket is open with the evidence attached.",
    sr: "YovaSense, 10:48 AM: One item needs a person. GPU 4 should be inspected at the next maintenance window, and the ticket is open with the evidence attached. Ticket OPS-2047, inspect GPU 4 on node r1n2, hardware, normal priority. Maya reacted with a check mark.",
  },
];

const CARD_FIELDS = [
  ["Action", "Reset GPU 4 and resume the job from its last checkpoint"],
  ["Scope", "One node, one job"],
  ["Approval", "Required by your policy"],
] as const;

const TICKET = { id: "OPS-2047", title: "Inspect GPU 4 on node r1n2", meta: ["Hardware", "Normal priority", "Evidence attached"] } as const;

/** The attributes that reveal an element from step `from` until (not including) step `until`. */
function beat(step: number, from: number, until = Infinity) {
  return { "data-beat": from, "data-shown": step >= from && step < until ? "" : undefined };
}

const noSubscribe = () => () => {};

/* ---------- glyphs (inline SVG, never emoji: emoji fonts differ by engine) ---------- */

function CheckBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect width="16" height="16" rx="3.5" fill="var(--ys-ctl)" />
      <path d="M4.2 8.3 6.8 10.8 11.8 5.4" fill="none" stroke="var(--ys-paper)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tick({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8.4 6.4 11.6 13 4.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Hash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M6.2 2.5 4.8 13.5M11.2 2.5 9.8 13.5M2.8 5.8h11M2.2 10.2h11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TicketGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v2a2.5 2.5 0 0 0 0 5v2a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5v-2a2.5 2.5 0 0 0 0-5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 4.5v11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="1.6 1.9" />
    </svg>
  );
}

function ToolIcons() {
  return (
    <span className={styles.tools}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5v7M6.5 10h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7.4" cy="8.4" r="1" fill="currentColor" />
        <circle cx="12.6" cy="8.4" r="1" fill="currentColor" />
        <path d="M6.9 11.6a3.6 3.6 0 0 0 6.2 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <circle cx="10" cy="10" r="2.9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12.9 7.6v3.6a2 2 0 0 0 4 0V10a6.9 6.9 0 1 0-2.7 5.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M13.6 8.6 8.4 13.8a2.6 2.6 0 0 1-3.7-3.7l6-6a1.7 1.7 0 0 1 2.4 2.4l-5.7 5.7a.8.8 0 0 1-1.2-1.2l5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.send}>
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M3.6 10 16.4 4.2 13.2 16.4 9.6 11.2Zm6 1.2 6.8-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </span>
    </span>
  );
}

function ToggleIcon({ pause }: { pause: boolean }) {
  return (
    <svg className={styles.toggleIcon} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {pause ? (
        <path d="M4.5 3h2.4v10H4.5zM9.1 3h2.4v10H9.1z" fill="currentColor" />
      ) : (
        <path d="M4.5 2.8v10.4L13 8Z" fill="currentColor" />
      )}
    </svg>
  );
}

/* ---------- the panel ---------- */

export default function SlackThread() {
  const ref = useRef<HTMLElement>(null);
  const toggle = useRef<() => void>(() => {});
  const [step, setStep] = useState<number>(LAST);
  const [phase, setPhase] = useState<Phase>("static");
  /** the visitor's choice; the label shows the action it offers (Pause while true) */
  const [wanted, setWanted] = useState(false);
  /** false on the server and during hydration: the control does nothing before then */
  const live = useSyncExternalStore(noSubscribe, () => true, () => false);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mq = reducedMotion();
    let reduce = mq.matches;
    let booted = false;
    let want = false; // the visitor wants it playing
    let pass = false; // a reduced-motion pass the visitor started
    let inView = false;
    let onScreen = false; // any part of the panel is in the viewport
    let running = false;
    let evs: readonly Ev[] = CYCLE;
    let next = 0; // index of the next event in evs
    let elapsed = 0; // seconds into evs, banked while not running
    let since = 0; // performance.now() when it last started running
    let timer = 0;
    let cur: number = LAST;
    let ph: Phase = "static";

    const set = (s: number, p: Phase) => {
      if (s !== cur) {
        cur = s;
        setStep(s);
      }
      if (p !== ph) {
        ph = p;
        setPhase(p);
      }
    };
    const choose = (w: boolean) => {
      want = w;
      setWanted(w);
    };
    const pos = () => elapsed + (running ? (performance.now() - since) / 1000 : 0);
    const clear = () => {
      if (timer) window.clearTimeout(timer);
      timer = 0;
    };

    function tick() {
      timer = 0;
      if (!running) return;
      let t = pos();
      while (next < evs.length && evs[next].t <= t + 0.002) {
        const { k } = evs[next++];
        if (k >= 0) set(k, "playing");
        else if (k === FADE) set(cur, "resetting");
        else if (k === LOOP) {
          elapsed = 0;
          since = performance.now();
          next = 0;
          t = 0;
        } else {
          finishPass();
          return;
        }
      }
      if (next < evs.length) timer = window.setTimeout(tick, Math.max(0, (evs[next].t - t) * 1000));
    }

    function run() {
      if (running) return;
      running = true;
      since = performance.now();
      if (ph === "paused" || ph === "ready") set(cur, "playing");
      tick();
    }

    /** Back to the complete, still thread (the reduced-motion rest), the pass over. */
    function finishPass() {
      running = false;
      clear();
      pass = false;
      evs = CYCLE;
      next = 0;
      elapsed = 0;
      choose(false);
      set(LAST, "static");
    }

    /** Paused with nothing worth freezing on: rest on the complete thread instead. Play from
     * there starts the sequence over (after the half-second fade). */
    function restComplete() {
      if (pass || reduce) {
        finishPass();
        return;
      }
      evs = CYCLE;
      next = CYCLE_FADE;
      elapsed = CYCLE[CYCLE_FADE].t;
      set(LAST, "paused");
    }

    function halt(byVisitor: boolean) {
      if (!running) return;
      elapsed = pos();
      running = false;
      clear();
      if (ph === "resetting" || cur < STEP.m1) {
        // a fading or still-empty thread
        if (byVisitor) restComplete();
        else {
          // off-screen: start from the top when it comes back
          next = evs === ONCE ? 1 : 0;
          elapsed = evs[next].t;
          set(0, "ready");
        }
      } else set(cur, "paused");
    }

    function update() {
      if (want && inView && !document.hidden && (!reduce || pass)) run();
      else halt(false);
    }

    toggle.current = () => {
      if (!booted) return;
      if (want) {
        choose(false);
        if (running) halt(true);
        else if (cur < STEP.m1 || ph === "ready") restComplete();
        return;
      }
      choose(true);
      if (reduce && !pass) {
        pass = true;
        evs = ONCE;
        next = 0;
        elapsed = 0;
      }
      update();
    };

    /** Motion allowed: start from the empty thread and wait for the panel to come into view. If the
     * complete thread is already on screen (a reload or back/forward with the panel in view, /#slack),
     * join the loop at its hold on the complete thread instead, so the thread never blanks in front
     * of the visitor: the hold, then the loop's fade starts the sequence.
     * Reduced: rest on the complete thread with Play. */
    function boot() {
      booted = true;
      running = false;
      clear();
      pass = false;
      evs = CYCLE;
      next = 0;
      elapsed = 0;
      if (reduce) {
        choose(false);
        set(LAST, "static");
      } else {
        choose(true);
        if (onScreen && cur === LAST) {
          next = CYCLE_FADE;
          elapsed = BEATS[LAST];
          set(LAST, "paused");
        } else set(0, "ready");
      }
      update();
    }

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[entries.length - 1];
        const vh = e.rootBounds?.height ?? window.innerHeight;
        onScreen = e.isIntersecting;
        inView = onScreen && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= vh * 0.5);
        if (!booted) boot();
        else update();
      },
      { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] },
    );
    io.observe(root);
    const onVisibility = () => {
      if (booted) update();
    };
    const onReduce = () => {
      reduce = mq.matches;
      if (booted) boot();
    };
    document.addEventListener("visibilitychange", onVisibility);
    mq.addEventListener("change", onReduce);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      mq.removeEventListener("change", onReduce);
      running = false;
      clear();
      toggle.current = () => {};
    };
  }, []);

  const typer = phase === "playing" || phase === "paused" ? TYPING[step] : undefined;
  const label = wanted ? "Pause" : "Play";

  return (
    <figure ref={ref} className={styles.panel} data-slack-anim data-state={phase} data-step={step}>
      <figcaption className="sr-only">
        Example Slack thread in #gpu-ops. YovaSense handles one incident from alert to resolved.
      </figcaption>

      <div className={styles.bar}>
        <p className={styles.channel}>
          <span className={styles.channelName} aria-hidden="true">
            <Hash className={styles.hash} />
            gpu-ops
          </span>
          <span className={styles.chip} aria-hidden="true">Example</span>
        </p>
        <p className={styles.topic}>
          <span className="sr-only">Channel topic: </span>
          Incidents and approvals
        </p>
        <button
          type="button"
          className={styles.toggle}
          data-anim-toggle
          data-live={live ? "" : undefined}
          onClick={() => toggle.current()}
        >
          <ToggleIcon pause={wanted} />
          <span>{label}</span>
          <span className="sr-only"> the Slack example</span>
        </button>
      </div>

      <div className={styles.thread} aria-hidden="true">
        {THREAD.map((m) => (
          <div key={m.key} className={styles.msg} data-grouped={m.grouped ? "" : undefined} {...beat(step, m.beat)}>
            <div className={styles.gutter}>
              {m.grouped ? (
                <span className={styles.gutterTime}>{m.time}</span>
              ) : m.author === "YovaSense" ? (
                <Mark size={36} className={styles.avatar} />
              ) : (
                <span className={`${styles.avatar} ${styles.avatarMaya}`}>M</span>
              )}
            </div>
            <div className={styles.body}>
              {!m.grouped && (
                <p className={styles.meta}>
                  <span className={styles.name}>{m.author}</span>
                  {m.author === "YovaSense" && <span className={styles.app}>APP</span>}
                  <span className={styles.time}>{m.time}</span>
                </p>
              )}
              <p className={styles.text}>
                {m.key === "m5" && <CheckBox className={styles.inlineCheck} />}
                {m.text}
                {m.key === "m1" && (
                  <span className={styles.status}>
                    <span className={styles.statusOpen} data-anim-transient {...beat(step, STEP.m1, STEP.resolved)}>
                      Investigating
                    </span>
                    <span className={styles.statusDone} {...beat(step, STEP.resolved)}>
                      Resolved
                    </span>
                  </span>
                )}
              </p>

              {m.key === "m2" && (
                <div className={styles.card} {...beat(step, STEP.card)}>
                  <p className={styles.cardTitle}>Proposed fix</p>
                  <dl className={styles.fields}>
                    {CARD_FIELDS.map(([k, v]) => (
                      <div key={k} className={styles.field}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className={styles.actions}>
                    <span className={styles.buttons} data-anim-transient {...beat(step, STEP.card, STEP.approved)}>
                      <span className={styles.btnPrimary} data-pressed={step === STEP.press ? "" : undefined}>Approve fix</span>
                      <span className={styles.btnSecondary}>Escalate</span>
                    </span>
                    <span className={styles.approved} {...beat(step, STEP.approved)}>
                      <Tick className={styles.tick} />
                      Approved by Maya
                    </span>
                  </div>
                </div>
              )}

              {m.key === "m6" && (
                <>
                  <div className={styles.ticket}>
                    <TicketGlyph className={styles.ticketGlyph} />
                    <div>
                      <p className={styles.ticketTitle}>
                        <span className={styles.ticketId}>{TICKET.id}</span>
                        <span className={styles.sep}> · </span>
                        {TICKET.title}
                      </p>
                      <p className={styles.ticketMeta}>
                        {TICKET.meta.map((x, i) => (
                          <span key={x}>
                            {i > 0 && <span className={styles.sep}> · </span>}
                            {x}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                  <span className={styles.reaction} {...beat(step, STEP.reaction)}>
                    <CheckBox className={styles.reactionGlyph} />
                    <span>1</span>
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.foot} aria-hidden="true">
        <div className={styles.composer}>
          <span className={styles.placeholder} data-placeholder="Message #gpu-ops" />
          <ToolIcons />
        </div>
        <p className={styles.typingRow} data-anim-transient>
          {typer && (
            <span className={styles.typing}>
              <span className={styles.dots}>
                <span />
                <span />
                <span />
              </span>
              <span>
                <b>{typer}</b> is typing…
              </span>
            </span>
          )}
        </p>
      </div>

      <ol className="sr-only">
        {THREAD.map((m) => (
          <li key={m.key}>{m.sr}</li>
        ))}
      </ol>
    </figure>
  );
}
