"use client";

import { Toaster } from "sonner";

/**
 * Toast notification provider — renders the sonner Toaster.
 *
 * Mount this once in the root layout. All toast notifications are
 * triggered via the `useToast` hook or `sonner`'s `toast()` directly.
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        className: "text-sm",
      }}
      richColors
      closeButton
    />
  );
}
