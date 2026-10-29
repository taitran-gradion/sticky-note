import { problemMessageOf } from "@margince/frontend/api";
import { useLocale, useT } from "@margince/frontend/app";
import { Badge, Button, IconAction, Row, SegmentedControl } from "@margince/frontend/design-system";
import { List, StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { refusedForRole, signedOut, type Target, useSaveStickyNote, useStickyNotes } from "./api";
import { useCurrentPage } from "./route";

const maxLength = 2000;
const targets = ["page", "all"] as const;

// The sticky note floating over every page: a button at the bottom right that
// opens the page's own note and the note on all pages.
export function FloatingNote() {
  const t = useT();
  const page = useCurrentPage();
  const notes = useStickyNotes(page);
  const [open, setOpen] = useState(false);
  // Alt+N opens and closes the note from any page; Escape closes it.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === "KeyN") {
        event.preventDefault();
        setOpen((was) => !was);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  if (signedOut(notes.error)) return null;
  const onPage = Boolean(notes.data?.page);
  const onAll = Boolean(notes.data?.all);
  const label = [
    t("extStickyNote.openShortcut"),
    onPage && t("extStickyNote.has.page"),
    onAll && t("extStickyNote.has.all"),
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="ext-sticky-note">
      {open ? (
        <NoteEditor page={page} onClose={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          className="ext-sticky-note-fab"
          title={label}
          aria-label={label}
          onClick={() => setOpen(true)}
        >
          <StickyNote size={22} aria-hidden />
          {/* One badge per note: this page's at the top right, all pages' at the top left. */}
          {onPage && (
            <span className="ext-sticky-note-badge ext-sticky-note-badge-page" aria-hidden>
              <Badge variant="primary" tone="danger">
                1
              </Badge>
            </span>
          )}
          {onAll && (
            <span className="ext-sticky-note-badge ext-sticky-note-badge-all" aria-hidden>
              <Badge variant="primary" tone="info">
                1
              </Badge>
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function NoteEditor({ page, onClose }: Readonly<{ page: string; onClose: () => void }>) {
  const t = useT();
  const { locale } = useLocale();
  const notes = useStickyNotes(page);
  const save = useSaveStickyNote(page);
  // Opens on the page's own note, or on the note on all pages when only that one exists.
  const [target, setTarget] = useState<Target>("page");
  useEffect(() => {
    if (notes.data && !notes.data.page && notes.data.all) setTarget("all");
  }, [notes.data]);
  const note = notes.data?.[target] ?? null;
  const saved = note?.body ?? "";
  const [draft, setDraft] = useState(saved);
  // The draft follows the shown note: after a save, and on a change of page or tab.
  useEffect(() => setDraft(saved), [saved, page, target]);
  const failure = notes.error ?? save.error;
  // Short enough to sit beside the buttons: "29 Oct, 10:35".
  const shortTime = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return (
    <section className="ext-sticky-note-panel" aria-label={t("extStickyNote.title")}>
      <div className="ext-sticky-note-head">
        <SegmentedControl
          label={t("extStickyNote.which")}
          options={targets}
          value={target}
          onChange={setTarget}
          labels={{ page: t("extStickyNote.target.page"), all: t("extStickyNote.target.all") }}
        />
        <Row gap="1">
          <IconAction label={t("extStickyNote.allNotes")} icon={<List size={16} aria-hidden />} href="#/ext/sticky-note" />
          <IconAction label={t("extStickyNote.close")} icon={<X size={16} aria-hidden />} onClick={onClose} />
        </Row>
      </div>
      <textarea
        aria-label={target === "page" ? t("extStickyNote.target.page") : t("extStickyNote.target.all")}
        placeholder={t("extStickyNote.placeholder")}
        rows={6}
        maxLength={maxLength}
        disabled={notes.isPending}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      {failure && (
        <p className="t-meta" role="alert">
          {refusedForRole(failure) ? t("extStickyNote.needsGrant") : problemMessageOf(failure, t)}
        </p>
      )}
      <div className="ext-sticky-note-foot">
        <span className="t-meta">
          {note
            ? t("extStickyNote.updated", { when: shortTime.format(new Date(note.updated_at)) })
            : t("extStickyNote.empty")}
        </span>
        <Row gap="1">
          <IconAction
            label={t("extStickyNote.clear")}
            icon={<Trash2 size={16} aria-hidden />}
            disabled={save.isPending || saved === ""}
            onClick={() => save.mutate({ target, body: "" })}
          />
          <Button
            variant="primary"
            disabled={save.isPending || draft.trim() === saved}
            onClick={() => save.mutate({ target, body: draft })}
          >
            {t("extStickyNote.save")}
          </Button>
        </Row>
      </div>
    </section>
  );
}
