"use client";

import { toast as sonnerToast } from "sonner";

/**
 * Toast notification hook — wraps sonner's toast API.
 *
 * CONVENTION: Use sonner for all toast notifications. Do NOT use
 * window.alert(), custom toast implementations, or other toast libraries.
 *
 * Toasts are ephemeral UI feedback only. Persistent notifications
 * use the async digest delivery system (see notifications table / ADR-007).
 */
export function useToast() {
  return {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    info: (message: string) => sonnerToast.info(message),
    warning: (message: string) => sonnerToast.warning(message),
    loading: (message: string) => sonnerToast.loading(message),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  };
}
