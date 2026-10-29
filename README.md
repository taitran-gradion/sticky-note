# sticky-note

A Margince extension: a sticky note floating over every page of the app.

- A round button sits at the bottom right of every page, with a badge counting the notes on that page.
- **This page** keeps one note per page, keyed by the app route without its query
  (`#/contacts/<id>?tab=x` is `/contacts/<id>`), so each contact, deal or report has its own.
- **All pages** keeps one note shown everywhere.
- Notes are shared by the team. Saving a blank note clears it. Every change is audited.

It ships:

- `GET /v1/ext/sticky-note/notes?page=…` (agent tool `sticky_note_read`): the page's note and the note on all pages;
- `POST /v1/ext/sticky-note/notes` (agent tool `sticky_note_save`): `{page, target: "page" | "all", body}`;
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
