import { useLayoutEffect, type RefObject } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, innermost last. Only the innermost one traps Tab, so a confirmation stacked over a modal works.
const openDialogs: HTMLElement[] = [];

/**
 * While `active`, moves focus into the dialog, keeps Tab inside it, and on close returns focus to
 * whatever had it before (or to `fallbackId` when that element is gone).
 */
export function useDialogFocus(
  active: boolean,
  dialogRef: RefObject<HTMLElement>,
  initialFocusRef?: RefObject<HTMLElement>,
  fallbackId = "board-heading"
) {
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!active || !dialog) return;
    const container: HTMLElement = dialog;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openDialogs.push(dialog);
    (initialFocusRef?.current ?? dialog.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || openDialogs[openDialogs.length - 1] !== dialog) return;
      const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const inside = container.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openDialogs.splice(openDialogs.indexOf(dialog), 1);
      // Deferred so the dialog has left the DOM and the previous element can take focus back.
      setTimeout(() => {
        if (previous && previous.isConnected && previous !== document.body) previous.focus();
        else document.getElementById(fallbackId)?.focus();
      });
    };
  }, [active, dialogRef, initialFocusRef, fallbackId]);
}
