-- SPDX-License-Identifier: BUSL-1.1
-- SPDX-FileCopyrightText: 2026 Gradion

DROP TABLE IF EXISTS ext.ext_sticky_note_page_note;

CREATE TABLE ext.ext_sticky_note_note (
    contact_id  uuid        NOT NULL PRIMARY KEY,
    body        text        NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
    updated_by  uuid        NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ext.ext_sticky_note_note TO margince_app;
