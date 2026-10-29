import { problemMessageOf } from "@margince/frontend/api";
import { useLocale, useT } from "@margince/frontend/app";
import { Badge, Button, IconAction, Row, SegmentedControl } from "@margince/frontend/design-system";
import { StickyNote, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { refusedForRole, signedOut, type Target, useSaveStickyNote, useStickyNotes } from "./api";
import { useCurrentPage } from "./page";

const maxLength = 2000;
const targets = ["page", "all"] as const;

// The sticky note floating over every page: a button at the bottom right that
// opens the page's own note and the note on all pages.
export function FloatingNote() {
  const t = useT();
  const page = useCurrentPage();
  const notes = useStickyNotes(page);
  const [open, setOpen] = useState(false);
  if (signedOut(notes.error)) return null;
  const count = Number(Boolean(notes.data?.page)) + Number(Boolean(notes.data?.all));
  return (
    <div className="ext-sticky-note">
      {open ? (
        <NoteEditor page={page} onClose={() => setOpen(false)} />
      ) : (
        <button
          type="button"
          className="ext-sticky-note-fab"
          title={t("extStickyNote.open")}
          aria-label={count > 0 ? t("extStickyNote.count", { count: String(count) }) : t("extStickyNote.open")}
          onClick={() => setOpen(true)}
        >
          <StickyNote size={22} aria-hidden />
          {count > 0 && (
            <span className="ext-sticky-note-badge" aria-hidden>
              <Badge variant="primary" tone="danger">
                {String(count)}
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
        <IconAction label={t("extStickyNote.close")} icon={<X size={16} aria-hidden />} onClick={onClose} />
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
