import { LocaleProvider, useT } from "@margince/frontend/app";
import { EmptyState, SectionHeader } from "@margince/frontend/design-system";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { FloatingNote } from "./floating";
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

// #/ext/sticky-note: says where the note is.
export default function StickyNotePage() {
  const t = useT();
  return (
    <div className="wrap narrow">
      <SectionHeader title={t("extStickyNote.title")} level={1} />
      <EmptyState title={t("extStickyNote.where.title")}>{t("extStickyNote.where.body")}</EmptyState>
    </div>
  );
}
