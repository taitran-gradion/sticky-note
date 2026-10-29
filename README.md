# sticky-note

A Margince extension: a sticky note floating over every page of the app.

- A round button sits at the bottom right of every page. A red badge at its top right means this
  page has a note; a blue one at its top left means there is a note on all pages.
- **Alt+N** opens and closes the note from any page; **Escape** closes it.
- **This page** keeps one note per page, keyed by the app route without its query
  (`#/contacts/<id>?tab=x` is `/contacts/<id>`), so each contact, deal or report has its own.
- **All pages** keeps one note shown everywhere.
- Notes are shared by the team. Saving a blank note clears it. Every change is audited.
- The list button in the note opens `#/ext/sticky-note`: every note, the most recently edited
  first, each row opening its page.

It ships:

- `GET /v1/ext/sticky-note/notes?page=…` (agent tool `sticky_note_read`): the page's note and the note on all pages;
- `POST /v1/ext/sticky-note/notes` (agent tool `sticky_note_save`): `{page, target: "page" | "all", body}`;
- `GET /v1/ext/sticky-note/list` (agent tool `sticky_note_list`): up to 200 notes, the most recently edited first;
- the table `ext.ext_sticky_note_page_note`;
- the RBAC object `ext_sticky_note_note`, granted by default to every system role but Ops (Read-only gets read).

## Install

In the instance's `go.mod`:

```text
require github.com/taitran-gradion/sticky-note <version>
```

Then compose, build and migrate the instance.

## How the note reaches every page

Core gives an extension no slot on every page. It does import every extension's frontend entry
when the app starts, so `frontend/index.tsx` mounts the note beside the app itself, once, with its
own query client and locale. If core changes how it loads extension entries, this is the part to
revisit.

Core's sidebar and command palette take only core's own screens, so the all-notes page has no
entry there; it is reached from the note's list button, or at `#/ext/sticky-note`.
