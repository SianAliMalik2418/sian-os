ALTER TABLE daily_checkins ADD COLUMN calories INTEGER;
ALTER TABLE daily_checkins ADD COLUMN workout_text TEXT;

CREATE TABLE IF NOT EXISTS agent_state (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
