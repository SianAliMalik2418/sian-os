CREATE TABLE IF NOT EXISTS goal_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phase_type TEXT NOT NULL,              -- 'lean_gain' | 'bulk' | 'cut' | 'recomp' | 'maintain'
  target_rate_kg_per_week REAL,          -- negative = losing, positive = gaining, NULL = no numeric target
  note TEXT,                             -- short free-text reason
  started_at TEXT NOT NULL,              -- YYYY-MM-DD
  ended_at TEXT,                         -- YYYY-MM-DD, NULL while active
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goal_phases_active ON goal_phases (is_active, started_at DESC);
