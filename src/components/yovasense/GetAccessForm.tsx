"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { yovasense, mailto } from "@/data/yovasense";
import { GET_ACCESS_SUBJECT } from "./Header";

/**
 * FormSubmit (formsubmit.co) relays each request to the inbox in the address; no account, but the
 * first submission sends that inbox an "Activate Form" email, and nothing is delivered until it's
 * clicked. Without JavaScript the form posts to the plain endpoint (FormSubmit's own captcha and
 * thank-you pages); with it, the same fields go to the /ajax/ endpoint and the answer shows here.
 */
const ENDPOINT = `https://formsubmit.co/${yovasense.email}`;
const AJAX_ENDPOINT = `https://formsubmit.co/ajax/${yovasense.email}`;

/** Ranges for the optional GPU question; the value is what lands in the email. */
export const GPU_RANGES = ["Under 100", "100 to 1,000", "1,000 to 10,000", "Over 10,000"];

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; first: string; email: string }
  | { kind: "failed" };

function Chevron() {
  return (
    <svg className="ys-ga-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3.5 6 8 10.5 12.5 6" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="ys-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

/** The /get-access/ form: first and last name, work email, an optional GPU count, Get access. */
export default function GetAccessForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const thanks = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.kind === "sent") thanks.current?.focus();
  }, [state.kind]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const first = (fields.first_name || "").trim();
    const last = (fields.last_name || "").trim();
    const email = (fields.email || "").trim();
    // The honeypot is hidden from people; a filled one is a bot, so it gets the thank-you and no request.
    if (fields._honey) {
      setState({ kind: "sent", first, email });
      return;
    }
    setState({ kind: "sending" });
    try {
      const response = await fetch(AJAX_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...fields,
          first_name: first,
          last_name: last,
          name: `${first} ${last}`.trim(),
          email,
          gpus: fields.gpus || "not given",
          _replyto: email,
          _subject: `YovaSense get access: ${`${first} ${last}`.trim()} (${email})`,
          page: window.location.href,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
      if (response.ok && String(data.success) === "true") {
        setState({ kind: "sent", first, email });
      } else {
        console.warn("Get access form:", response.status, data.message);
        setState({ kind: "failed" });
      }
    } catch (error) {
      console.warn("Get access form:", error);
      setState({ kind: "failed" });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="ys-ga-card ys-ga-done" role="status">
        <h2 ref={thanks} tabIndex={-1} className="ys-display ys-ga-done-title">
          Thanks{state.first ? `, ${state.first}` : ""}.
        </h2>
        <p className="ys-ga-done-text">
          We&apos;ll email{state.email ? <> <strong>{state.email}</strong></> : " you"} to set up a call.
        </p>
      </div>
    );
  }

  const sending = state.kind === "sending";
  return (
    <form className="ys-ga-card ys-ga-form" action={ENDPOINT} method="POST" onSubmit={onSubmit} data-access-form>
      <div className="ys-ga-names">
        <div className="ys-ga-field">
          <label className="sr-only" htmlFor="ga-first">First name (required)</label>
          <input id="ga-first" className="ys-ga-input" type="text" name="first_name" required
            autoComplete="given-name" placeholder="First name *" />
        </div>
        <div className="ys-ga-field">
          <label className="sr-only" htmlFor="ga-last">Last name (required)</label>
          <input id="ga-last" className="ys-ga-input" type="text" name="last_name" required
            autoComplete="family-name" placeholder="Last name *" />
        </div>
      </div>
      <div className="ys-ga-field">
        <label className="sr-only" htmlFor="ga-email">Work email (required)</label>
        <input id="ga-email" className="ys-ga-input" type="email" name="email" required
          autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="Work email *" />
      </div>
      <div className="ys-ga-field">
        <label className="ys-ga-label" htmlFor="ga-gpus">How many GPUs do you run today?</label>
        <div className="ys-ga-select-wrap">
          <select id="ga-gpus" className="ys-ga-input ys-ga-select" name="gpus" defaultValue="">
            <option value="">Select a range (optional)</option>
            {GPU_RANGES.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
          <Chevron />
        </div>
      </div>
      <input type="hidden" name="_subject" value="YovaSense: get access request" />
      <input type="hidden" name="_template" value="table" />
      <div className="ys-ga-trap" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <button type="submit" className="ys-btn ys-btn-primary ys-btn-lg ys-ga-submit" disabled={sending}>
        {sending ? "Sending…" : <>Get access <ArrowRight /></>}
      </button>
      <p className="ys-ga-error" id="ga-error" role="alert">
        {state.kind === "failed" ? (
          <>
            That didn&apos;t send. Try again, or email{" "}
            <a href={mailto(GET_ACCESS_SUBJECT)}>{yovasense.email}</a>.
          </>
        ) : null}
      </p>
      <p className="ys-ga-note">We&apos;ll email you to set up a call.</p>
    </form>
  );
}
