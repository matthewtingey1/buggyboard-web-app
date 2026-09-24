import { useState, useEffect, useLayoutEffect, FormEvent, useRef } from "react";
import { useDialogFocus } from "./useDialogFocus";
import { isBlank } from "./text";

export type Severity = "high" | "mid" | "low";

interface CreateBugModalProps {
  isOpen: boolean;
  defaultOwner: string;
  onClose: () => void;
  onSaved: () => void;
}

const SEVERITIES: Severity[] = ["high", "mid", "low"];

function severitySelectClass(severity: Severity): string {
  return `severity-select-${severity}`;
}

export function CreateBugModal({
  isOpen,
  defaultOwner,
  onClose,
  onSaved,
}: CreateBugModalProps) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<Severity>("mid");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // State updates are async, so a second submit in the same tick would still see loading === false.
  const submittingRef = useRef(false);

  // Layout effect: the reset must land before the first paint, or the previous draft flashes and
  // keystrokes typed in that frame are lost.
  useLayoutEffect(() => {
    if (isOpen) {
      setTitle("");
      setSeverity("mid");
      setOwner(defaultOwner);
      setDescription("");
      setValidationErrors([]);
      setInvalidFields(new Set());
      setLoading(false);
      submittingRef.current = false;
    }
  }, [isOpen, defaultOwner]);

  useDialogFocus(isOpen, dialogRef, titleInputRef);

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      // Escape acts like Cancel (spec 06), except while a save is in flight.
      if (e.key !== "Escape" || loading) return;
      e.preventDefault();
      onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, loading]);

  function validate(): { errors: string[]; fields: Set<string> } {
    const errors: string[] = [];
    const fields = new Set<string>();
    if (isBlank(title)) {
      errors.push("Title is required.");
      fields.add("title");
    }
    if (isBlank(owner)) {
      errors.push("Owner is required.");
      fields.add("owner");
    }
    if (isBlank(description)) {
      errors.push("Description is required.");
      fields.add("description");
    }
    if (!SEVERITIES.includes(severity)) {
      errors.push("Severity is required.");
      fields.add("severity");
    }
    return { errors, fields };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    const { errors, fields } = validate();
    setInvalidFields(fields);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    submittingRef.current = true;
    setValidationErrors([]);
    setLoading(true);
    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          severity,
          owner: owner.trim(),
          description: description.trim(),
        }),
      });
      if (res.ok) {
        onSaved();
        onClose();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setValidationErrors([data.message ?? "Failed to save bug."]);
    } catch {
      setValidationErrors(["Something went wrong. Please try again."]);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  // After a failed save the fields re-enable; put focus back in the form instead of leaving it on <body>.
  useEffect(() => {
    if (!isOpen || loading || validationErrors.length === 0) return;
    if (!dialogRef.current?.contains(document.activeElement)) titleInputRef.current?.focus();
  }, [isOpen, loading, validationErrors]);

  function handleCancel() {
    if (loading) return;
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="bug-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-bug-modal-title"
    >
      <div className="bug-modal-panel">
        <div className="bug-modal-header">
          <h2 id="create-bug-modal-title" className="text-lg font-semibold text-stone-800">
            Create bug
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 disabled:opacity-50"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // A held-down Enter (for example from the New Bug button) must not submit the form.
            if (e.key === "Enter" && e.repeat) e.preventDefault();
          }}
          className="bug-modal-body space-y-4"
        >
          <div>
            <label htmlFor="bug-title" className="block text-sm font-medium text-stone-700 mb-1">
              Title
            </label>
            <input
              id="bug-title"
              aria-invalid={invalidFields.has("title") || undefined}
              aria-describedby={invalidFields.has("title") ? "create-bug-errors" : undefined}
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-stone-500 px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="bug-severity" className="block text-sm font-medium text-stone-700 mb-1">
              Severity
            </label>
            <select
              id="bug-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className={`w-full rounded border border-stone-500 px-3 py-2 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 ${severitySelectClass(severity)}`}
              disabled={loading}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bug-owner" className="block text-sm font-medium text-stone-700 mb-1">
              Owner
            </label>
            <input
              id="bug-owner"
              aria-invalid={invalidFields.has("owner") || undefined}
              aria-describedby={invalidFields.has("owner") ? "create-bug-errors" : undefined}
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded border border-stone-500 px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="bug-description" className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              id="bug-description"
              aria-invalid={invalidFields.has("description") || undefined}
              aria-describedby={invalidFields.has("description") ? "create-bug-errors" : undefined}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-stone-500 px-3 py-2 text-stone-800 focus:border-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-600 resize-y"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {validationErrors.length > 0 && (
            <ul id="create-bug-errors" className="text-sm text-red-600" role="alert">
              {validationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded px-4 py-2 text-sm font-medium text-stone-700 bg-stone-200 hover:bg-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-medium text-stone-800 bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-stone-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
