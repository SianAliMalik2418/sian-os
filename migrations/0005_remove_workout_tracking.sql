DROP TABLE workout_sets;
DROP TABLE workouts;
DROP TABLE exercises;

DELETE FROM agent_audit_log WHERE entity_type = 'workout';

CREATE TABLE weekly_reviews_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  body_weight_change REAL,
  nutrition_consistency INTEGER,
  water_consistency INTEGER,
  wins TEXT,
  lessons TEXT,
  focus_next_week TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO weekly_reviews_next (
  id, week_start, body_weight_change, nutrition_consistency, water_consistency,
  wins, lessons, focus_next_week, created_at
)
SELECT
  id, week_start, body_weight_change, nutrition_consistency, water_consistency,
  wins, lessons, focus_next_week, created_at
FROM weekly_reviews;

DROP TABLE weekly_reviews;
ALTER TABLE weekly_reviews_next RENAME TO weekly_reviews;
CREATE INDEX idx_weekly_reviews_week ON weekly_reviews(week_start);
