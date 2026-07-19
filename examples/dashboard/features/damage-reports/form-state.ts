// One FormState shape shared by every form in the app (Chapter 6):
// expected errors are VALUES the form renders — never thrown.

// The error variant carries the submitted values: React 19 resets uncontrolled
// fields when a form action completes — even on returned validation errors —
// so the form must re-apply them via defaultValue or the user's input is lost.

export type FormState<FieldErrors> =
  | { status: "idle" }
  | {
      status: "error";
      fieldErrors: FieldErrors;
      formError?: string;
      values?: Record<string, string>;
    }
  | { status: "success"; message: string };

export const idle = { status: "idle" } as const;
