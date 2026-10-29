-- SPDX-License-Identifier: BUSL-1.1
-- SPDX-FileCopyrightText: 2026 Gradion
--
-- The all-notes page lists the most recently edited first.

CREATE INDEX ext_sticky_note_page_note_by_edit
    ON ext.ext_sticky_note_page_note (updated_at DESC);
