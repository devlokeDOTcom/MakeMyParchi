"use client";

import { useEffect } from "react";

/**
 * In development, remove any service worker (and its caches) left behind by an
 * earlier production build on this origin. A stale worker serves old HTML/JS
 * against the new dev server, which leaves the app un-hydrated: buttons and
 * tabs stop responding.
 */
export function DevServiceWorkerReset() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    caches?.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }, []);

  return null;
}
