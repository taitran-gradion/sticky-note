-- SPDX-License-Identifier: BUSL-1.1
-- SPDX-FileCopyrightText: 2026 Gradion
--
-- Notes move from contacts to pages: one note per page of the app, keyed by
-- its route (a contact's page is a page too), and one for all pages ('*').
-- Clearing a note deletes its row. The contact notes were never released.

DROP TABLE IF EXISTS ext.ext_sticky_note_note;

CREATE TABLE ext.ext_sticky_note_page_note (
    id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page        text        NOT NULL UNIQUE CHECK (page = '*' OR (page LIKE '/%' AND length(page) <= 300)),
    body        text        NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
    updated_by  uuid        NOT NULL,
    updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON ext.ext_sticky_note_page_note TO margince_app;
