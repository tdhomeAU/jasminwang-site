-- Separate Cloudflare D1 binding: MAMA_DB. Do NOT run on FREEDOM_DB.
-- Records represent self-reported information; no medical diagnosis or instructions.
CREATE TABLE IF NOT EXISTS mama_health_records (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL,
 content TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mama_health_records_created ON mama_health_records(created_at DESC);
CREATE TABLE IF NOT EXISTS mama_login_failures (
 ip_hash TEXT NOT NULL,
 occurred_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mama_login_failures_ip ON mama_login_failures(ip_hash,occurred_at);
CREATE TABLE IF NOT EXISTS mama_voice_sessions (
 id TEXT PRIMARY KEY,
 day TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mama_voice_sessions_day ON mama_voice_sessions(day);
