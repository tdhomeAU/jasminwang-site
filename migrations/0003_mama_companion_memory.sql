-- A family-confirmed companion profile. It is separate from health records and
-- is readable/writable only through member-authenticated API routes.
CREATE TABLE IF NOT EXISTS mama_companion_memory (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK (kind IN ('preference','life_story','family_context')),
 content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 800),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mama_companion_memory_updated ON mama_companion_memory(updated_at DESC);
