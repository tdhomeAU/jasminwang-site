CREATE TABLE IF NOT EXISTS freedom_registrations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 ticket TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 wechat TEXT NOT NULL,
 email TEXT NOT NULL,
 city TEXT NOT NULL,
 goals TEXT NOT NULL,
 barrier TEXT NOT NULL,
 expectation TEXT NOT NULL,
 consented_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_freedom_created_at ON freedom_registrations(created_at);
