// SPDX-License-Identifier: BUSL-1.1
// SPDX-FileCopyrightText: 2026 Gradion

package stickynote

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"

	"github.com/margince/margince/backend/pkg/extension"
)

func TestNewNamesTheUnitAfterItsModulePath(t *testing.T) {
	if got := New().Name; got != "sticky-note" {
		t.Fatalf("Name = %q, want sticky-note: the composer takes the name from the module path", got)
	}
}

// Both routes refuse a bad argument before they touch the runtime, so a nil
// runtime is enough to hold the checks.
func TestRoutesRefuseBadArguments(t *testing.T) {
	cases := map[string]struct {
		handle extension.ToolHandler
		args   map[string]string
	}{
		"read with no page":          {readNotes, map[string]string{"page": ""}},
		"read the all-pages key":     {readNotes, map[string]string{"page": "*"}},
		"read a page not a route":    {readNotes, map[string]string{"page": "contacts"}},
		"read a page too long":       {readNotes, map[string]string{"page": "/" + strings.Repeat("x", maxPageLength)}},
		"save to an unknown target":  {saveNote, map[string]string{"page": "/home", "target": "team", "body": "hi"}},
		"save to a page not a route": {saveNote, map[string]string{"page": "*", "target": "all", "body": "hi"}},
		"save a note too long":       {saveNote, map[string]string{"page": "/home", "target": "page", "body": strings.Repeat("x", maxNoteLength+1)}},
	}
	for name, c := range cases {
		t.Run(name, func(t *testing.T) {
			in, err := json.Marshal(c.args)
			if err != nil {
				t.Fatal(err)
			}
			if _, err := c.handle(context.Background(), nil, in); !errors.Is(err, extension.ErrInvalid) {
				t.Fatalf("err = %v, want ErrInvalid", err)
			}
		})
	}
}
