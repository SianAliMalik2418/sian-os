CREATE TABLE daily_checkins_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL,
  sleep_hours REAL,
  water_liters REAL,
  protein_grams INTEGER,
  mood TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO daily_checkins_next (
  id, date, weight_kg, sleep_hours, water_liters, protein_grams, mood, notes, created_at, updated_at
)
SELECT
  id, date, weight_kg, sleep_hours, water_liters, protein_grams, mood, notes, created_at, updated_at
FROM daily_checkins;

DROP TABLE daily_checkins;
ALTER TABLE daily_checkins_next RENAME TO daily_checkins;
CREATE INDEX idx_checkins_date ON daily_checkins(date);

CREATE TABLE weekly_reviews_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  workouts_completed INTEGER DEFAULT 0,
  missed_workouts INTEGER DEFAULT 0,
  strength_improvements TEXT,
  body_weight_change REAL,
  nutrition_consistency INTEGER,
  water_consistency INTEGER,
  best_workout TEXT,
  weakest_area TEXT,
  wins TEXT,
  lessons TEXT,
  focus_next_week TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO weekly_reviews_next (
  id, week_start, workouts_completed, missed_workouts, strength_improvements,
  body_weight_change, nutrition_consistency, water_consistency, best_workout,
  weakest_area, wins, lessons, focus_next_week, created_at
)
SELECT
  id, week_start, workouts_completed, missed_workouts, strength_improvements,
  body_weight_change, nutrition_consistency, water_consistency, best_workout,
  weakest_area, wins, lessons, focus_next_week, created_at
FROM weekly_reviews;

DROP TABLE weekly_reviews;
ALTER TABLE weekly_reviews_next RENAME TO weekly_reviews;
CREATE INDEX idx_weekly_reviews_week ON weekly_reviews(week_start);
