"use client";

import { useActionState } from "react";
import { createDamageReport, type DamageReportFieldErrors } from "../actions";
import { idle, type FormState } from "../form-state";

const initialState: FormState<DamageReportFieldErrors> = idle;

export function DamageReportForm() {
  const [state, formAction, isPending] = useActionState(createDamageReport, initialState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  // React 19 resets uncontrolled fields after every action — re-applying the
  // echoed values via defaultValue is what preserves the user's input.
  const values = state.status === "error" ? (state.values ?? {}) : {};

  return (
    <form action={formAction} className="form">
      {state.status === "error" && state.formError && (
        <p role="alert" className="error-text">{state.formError}</p>
      )}

      <label htmlFor="title">Title</label>
      <input
        id="title"
        name="title"
        placeholder="What broke?"
        defaultValue={values.title}
        aria-invalid={!!fieldErrors.title}
        aria-describedby={fieldErrors.title ? "title-error" : undefined}
      />
      {fieldErrors.title && (
        <p id="title-error" className="error-text">{fieldErrors.title}</p>
      )}

      <label htmlFor="severity">Severity</label>
      <select
        id="severity"
        name="severity"
        // Unlike input/textarea, a select only reads defaultValue at MOUNT —
        // React 19's post-action reset would snap it back to the placeholder.
        // Changing the key remounts it so the echoed value is re-applied.
        key={values.severity ?? "unset"}
        defaultValue={values.severity ?? ""}
        aria-invalid={!!fieldErrors.severity}
        aria-describedby={fieldErrors.severity ? "severity-error" : undefined}
      >
        <option value="" disabled>Select severity…</option>
        <option value="minor">Minor</option>
        <option value="moderate">Moderate</option>
        <option value="severe">Severe</option>
      </select>
      {fieldErrors.severity && (
        <p id="severity-error" className="error-text">{fieldErrors.severity}</p>
      )}

      <label htmlFor="description">Description</label>
      <textarea
        id="description"
        name="description"
        rows={4}
        placeholder="Describe the damage…"
        defaultValue={values.description}
        aria-invalid={!!fieldErrors.description}
        aria-describedby={fieldErrors.description ? "description-error" : undefined}
      />
      {fieldErrors.description && (
        <p id="description-error" className="error-text">{fieldErrors.description}</p>
      )}

      <button className="button" disabled={isPending}>
        {isPending ? "Submitting…" : "Create report"}
      </button>
      <p className="hint">
        Tip: leave fields empty to see expected (returned) errors; put “boom” in the
        title to see an unexpected (thrown) error hit the app-wide boundary.
      </p>
    </form>
  );
}
