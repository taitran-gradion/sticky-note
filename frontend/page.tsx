import { problemMessageOf } from "@margince/frontend/api";
import { useLocale, useT } from "@margince/frontend/app";
import { Badge, Callout, Card, DataTable, EmptyState, SectionHeader } from "@margince/frontend/design-system";
import { refusedForRole, useAllStickyNotes } from "./api";

// #/ext/sticky-note: every note, the most recently edited first. A row opens
// the page its note is on.
export function AllNotesPage() {
  const t = useT();
  const { locale } = useLocale();
  const notes = useAllStickyNotes();
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="wrap">
      <SectionHeader title={t("extStickyNote.list.title")} level={1} />
      <p>{t("extStickyNote.list.sub")}</p>
      {notes.error && (
        <Callout tone="danger" title={t("extStickyNote.list.failed")}>
          {refusedForRole(notes.error) ? t("extStickyNote.needsGrant") : problemMessageOf(notes.error, t)}
        </Callout>
      )}
      {notes.data?.length === 0 && <EmptyState title={t("extStickyNote.list.empty")}>{t("extStickyNote.where.body")}</EmptyState>}
      {notes.data && notes.data.length > 0 && (
        <Card>
          <DataTable
            label={t("extStickyNote.list.title")}
            rows={notes.data}
            rowKey={(note) => note.id}
            onRowClick={(note) => {
              if (note.page !== "*") window.location.hash = `#${note.page}`;
            }}
            rowOpens={(note) => note.page !== "*"}
            columns={[
              {
                key: "page",
                header: t("extStickyNote.list.page"),
                render: (note) =>
                  note.page === "*" ? <Badge tone="info">{t("extStickyNote.target.all")}</Badge> : <code>{note.page}</code>,
              },
              { key: "body", header: t("extStickyNote.list.note"), grow: true, render: (note) => note.body },
              {
                key: "edited",
                header: t("extStickyNote.list.edited"),
                align: "end",
                render: (note) => when.format(new Date(note.updated_at)),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
