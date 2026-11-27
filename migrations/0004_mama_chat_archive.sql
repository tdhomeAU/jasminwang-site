-- Store only Mama's recognized speech text, never the raw audio or AI replies.
-- Rows are visible to the shared family account and can be deleted from the app.
CREATE TABLE IF NOT EXISTS mama_chat_archive (
 id TEXT PRIMARY KEY,
 content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
 source TEXT NOT NULL CHECK (source = 'mama_voice_transcript'),
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mama_chat_archive_created ON mama_chat_archive(created_at DESC);
