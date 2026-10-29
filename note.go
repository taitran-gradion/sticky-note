// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: 2026 Gradion

package stickynote

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/margince/margince/backend/pkg/extension"
)

const (
	noteEntity    = "ext_sticky_note_page_note"
	maxNoteLength = 2000
	maxPageLength = 300
	listedNotes   = 200
	// allPages keys the note shown on every page.
	allPages = "*"
)

type note struct {
	ID        string    `json:"id"`
	Page      string    `json:"page"`
	Body      string    `json:"body"`
	UpdatedBy string    `json:"updated_by"`
	UpdatedAt time.Time `json:"updated_at"`
}

// notesAnswer is what both routes return: the note on the page and the note
// on all pages, each null when there is none.
type notesAnswer struct {
	Page *note `json:"page"`
	All  *note `json:"all"`
}

// readNotes answers GET /ext/sticky-note/notes: the notes one page shows.
func readNotes(ctx context.Context, rt extension.Runtime, in json.RawMessage) (json.RawMessage, error) {
	args, err := extension.DecodeArgs[struct {
		Page string `json:"page"`
	}](in)
	if err != nil {
		return nil, err
	}
	if err := checkPage(args.Page); err != nil {
		return nil, err
	}
	var out notesAnswer
	err = rt.Tx(ctx, func(ctx context.Context, tx extension.Tx) error {
		out, err = notesOf(ctx, tx, args.Page)
		return err
	})
	if err != nil {
		return nil, err
	}
	return json.Marshal(out)
}

// listNotes answers GET /ext/sticky-note/list: every note, the most recently
// edited first.
func listNotes(ctx context.Context, rt extension.Runtime, _ json.RawMessage) (json.RawMessage, error) {
	notes := []note{}
	err := rt.Tx(ctx, func(ctx context.Context, tx extension.Tx) error {
		rows, err := tx.Query(ctx, `
			SELECT id::text, page, body, updated_by::text, updated_at
			FROM ext.ext_sticky_note_page_note
			ORDER BY updated_at DESC
			LIMIT $1`, listedNotes)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			var n note
			if err := rows.Scan(&n.ID, &n.Page, &n.Body, &n.UpdatedBy, &n.UpdatedAt); err != nil {
				return err
			}
			notes = append(notes, n)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, err
	}
	return json.Marshal(map[string][]note{"notes": notes})
}

// saveNote answers POST /ext/sticky-note/notes: it writes one page's note, or
// the note on all pages when page is "*", and clears it when the body is
// blank. It answers the notes the page shows after the write.
func saveNote(ctx context.Context, rt extension.Runtime, in json.RawMessage) (json.RawMessage, error) {
	args, err := extension.DecodeArgs[struct {
		Page   string `json:"page"`
		Target string `json:"target"`
		Body   string `json:"body"`
	}](in)
	if err != nil {
		return nil, err
	}
	body := strings.TrimSpace(args.Body)
	if err := checkPage(args.Page); err != nil {
		return nil, err
	}
	switch {
	case args.Target != "page" && args.Target != "all":
		return nil, fmt.Errorf("%w: target is page or all", extension.ErrInvalid)
	case len(body) > maxNoteLength:
		return nil, fmt.Errorf("%w: a sticky note is at most %d characters", extension.ErrInvalid, maxNoteLength)
	}
	member := rt.Caller().UserID
	if member == "" {
		return nil, fmt.Errorf("%w: a sticky note needs a member behind it", extension.ErrForbidden)
	}
	key := args.Page
	if args.Target == "all" {
		key = allPages
	}
	var out notesAnswer
	err = rt.Tx(ctx, func(ctx context.Context, tx extension.Tx) error {
		before, err := noteOf(ctx, tx, key)
		if err != nil {
			return err
		}
		if body == "" {
			err = clearNote(ctx, tx, before)
		} else {
			err = writeNote(ctx, tx, before, key, body, member)
		}
		if err != nil {
			return err
		}
		out, err = notesOf(ctx, tx, args.Page)
		return err
	})
	if err != nil {
		return nil, err
	}
	return json.Marshal(out)
}

// checkPage holds a page to a route of the app: "/contacts/…", never "*".
func checkPage(page string) error {
	if !strings.HasPrefix(page, "/") || len(page) > maxPageLength {
		return fmt.Errorf("%w: page is the app route, starting with / and at most %d characters", extension.ErrInvalid, maxPageLength)
	}
	return nil
}

func notesOf(ctx context.Context, tx extension.Tx, page string) (notesAnswer, error) {
	var out notesAnswer
	var err error
	if out.Page, err = noteOf(ctx, tx, page); err != nil {
		return notesAnswer{}, err
	}
	if out.All, err = noteOf(ctx, tx, allPages); err != nil {
		return notesAnswer{}, err
	}
	return out, nil
}

// noteOf reads the note kept under one key, or nil when there is none.
func noteOf(ctx context.Context, tx extension.Tx, key string) (*note, error) {
	n := note{Page: key}
	err := tx.QueryRow(ctx, `
		SELECT id::text, body, updated_by::text, updated_at
		FROM ext.ext_sticky_note_page_note
		WHERE page = $1`, key).Scan(&n.ID, &n.Body, &n.UpdatedBy, &n.UpdatedAt)
	if errors.Is(err, extension.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &n, nil
}

// writeNote creates or replaces a note, with its ledger row and event.
func writeNote(ctx context.Context, tx extension.Tx, before *note, key, body, member string) error {
	n := note{Page: key, Body: body, UpdatedBy: member}
	err := tx.QueryRow(ctx, `
		INSERT INTO ext.ext_sticky_note_page_note (page, body, updated_by)
		VALUES ($1, $2, $3::uuid)
		ON CONFLICT (page) DO UPDATE
		SET body = EXCLUDED.body, updated_by = EXCLUDED.updated_by, updated_at = now()
		RETURNING id::text, updated_at`, key, body, member).Scan(&n.ID, &n.UpdatedAt)
	if err != nil {
		return err
	}
	change := extension.Change{Action: extension.AuditCreate, Entity: noteEntity, ID: n.ID}
	if before != nil {
		change.Action = extension.AuditUpdate
		if change.Before, err = json.Marshal(before); err != nil {
			return err
		}
	}
	if change.After, err = json.Marshal(n); err != nil {
		return err
	}
	return record(ctx, tx, change, key, "note_saved")
}

// clearNote deletes a note, if there is one, with its ledger row and event.
func clearNote(ctx context.Context, tx extension.Tx, before *note) error {
	if before == nil {
		return nil
	}
	if _, err := tx.Exec(ctx, `
		DELETE FROM ext.ext_sticky_note_page_note WHERE id = $1::uuid`, before.ID); err != nil {
		return err
	}
	prior, err := json.Marshal(before)
	if err != nil {
		return err
	}
	change := extension.Change{Action: extension.AuditErase, Entity: noteEntity, ID: before.ID, Before: prior}
	return record(ctx, tx, change, before.Page, "note_cleared")
}

func record(ctx context.Context, tx extension.Tx, change extension.Change, page, verb string) error {
	payload, err := json.Marshal(map[string]string{"note_id": change.ID, "page": page})
	if err != nil {
		return err
	}
	return tx.Record(ctx, change, extension.Event{Verb: verb, Payload: payload})
}
