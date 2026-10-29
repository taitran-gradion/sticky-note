// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: 2026 Gradion

// Package stickynote keeps a sticky note on every page of the app: one note
// per page, and one shown on all pages.
//
//	note.go       its two routes: read the notes a page shows, and save or clear one
//	migrations/   its table, one row per page that has a note
//	api/          its routes, merged into core's contract
//	frontend/     the note that floats over every page
package stickynote

import (
	"embed"

	"github.com/margince/margince/backend/pkg/extension"
)

//go:embed migrations
var migrations embed.FS

// New returns the unit's declaration: everything it gives core, in one place.
func New() extension.Extension {
	return extension.Extension{
		Name:        "sticky-note",
		Version:     "0.2.0",
		Description: "A sticky note floating over every page: one note per page, and one shown on all pages.",
		Tools: []extension.Tool{
			{Name: "sticky_note_read", Handle: readNotes},
			{Name: "sticky_note_save", Handle: saveNote},
		},
		Migrations: migrations,
	}
}
