CREATE TABLE IF NOT EXISTS agent_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  payload TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_created ON agent_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_body_measurements_date ON body_measurements(date);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_date ON nutrition_logs(date);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_week ON weekly_reviews(week_start);
CREATE INDEX IF NOT EXISTS idx_sets_workout ON workout_sets(workout_id);

-- Merge any case-only exercise duplicates created before names became case-insensitive.
UPDATE workout_sets
SET exercise_id = (
  SELECT MIN(canonical.id) FROM exercises canonical
  WHERE canonical.name = (SELECT duplicate.name FROM exercises duplicate WHERE duplicate.id = workout_sets.exercise_id) COLLATE NOCASE
)
WHERE exercise_id IN (SELECT id FROM exercises);

DELETE FROM exercises
WHERE id NOT IN (SELECT MIN(id) FROM exercises GROUP BY name COLLATE NOCASE);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_nocase ON exercises(name COLLATE NOCASE);
