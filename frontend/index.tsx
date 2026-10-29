import { LocaleProvider } from "@margince/frontend/app";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { FloatingNote } from "./floating";
import { AllNotesPage } from "./page";
import "./sticky-note.css";

// Core imports every extension's entry when the app starts, and gives a unit
// no place on every page. So the note mounts itself beside the app, once, with
// its own query client and locale.
const hostId = "ext-sticky-note-host";
if (typeof document !== "undefined" && !document.getElementById(hostId)) {
  const host = document.createElement("div");
  host.id = hostId;
  document.body.append(host);
  createRoot(host).render(
    <QueryClientProvider client={new QueryClient()}>
      <LocaleProvider>
        <FloatingNote />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

// #/ext/sticky-note: every note, opened from the floating note's list button.
export default AllNotesPage;
