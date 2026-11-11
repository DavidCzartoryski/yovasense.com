"use client";

import { useState, type FormEvent } from "react";
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

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; email: string } | { kind: "failed" };

/** The "Get access" form at the end of the page: a work email and Send. */
export default function AccessForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const email = (fields.email || "").trim();
    // The honeypot is hidden from people; a filled one is a bot, so it gets the thank-you and no request.
    if (fields._honey) {
      setState({ kind: "sent", email });
      return;
    }
    setState({ kind: "sending" });
    try {
      const response = await fetch(AJAX_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...fields, email, _replyto: email, page: window.location.href }),
      });
      const data = (await response.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
      if (response.ok && String(data.success) === "true") {
        setState({ kind: "sent", email });
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
      <p className="ys-access-done" role="status">
        Thanks. We&apos;ll be in touch{state.email ? <> at <strong>{state.email}</strong></> : null}.
      </p>
    );
  }

  const sending = state.kind === "sending";
  return (
    <form className="ys-access-form" action={ENDPOINT} method="POST" onSubmit={onSubmit} data-access-form>
      <label className="ys-access-label" htmlFor="access-email">Work email</label>
      <div className="ys-access-row">
        <input
          id="access-email"
          className="ys-access-input"
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@company.com"
          aria-describedby={state.kind === "failed" ? "access-error" : undefined}
        />
        <button type="submit" className="ys-btn ys-btn-primary ys-btn-lg ys-access-send" disabled={sending}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
      <input type="hidden" name="_subject" value="YovaSense: get access request" />
      <input type="hidden" name="_template" value="table" />
      <div className="ys-access-trap" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="_honey" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <p className="ys-access-error" id="access-error" role="alert">
        {state.kind === "failed" ? (
          <>
            That didn&apos;t send. Try again, or email{" "}
            <a href={mailto(GET_ACCESS_SUBJECT)}>{yovasense.email}</a>.
          </>
        ) : null}
      </p>
    </form>
  );
}
