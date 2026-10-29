import { useSyncExternalStore } from "react";

// The page the reader is on, as the app routes it: "#/contacts/abc?tab=x"
// is "/contacts/abc". Notes are kept per page under this key.
function currentPage(): string {
  const route = window.location.hash.replace(/^#/, "").split("?")[0] ?? "";
  return route.startsWith("/") ? route.slice(0, 300) : "/";
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function useCurrentPage(): string {
  return useSyncExternalStore(subscribe, currentPage);
}
