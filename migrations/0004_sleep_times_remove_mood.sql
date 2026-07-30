CREATE TABLE daily_checkins_next (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  weight_kg REAL,
  sleep_time TEXT,
  wake_time TEXT,
  sleep_hours REAL,
  water_liters REAL,
  protein_grams INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO daily_checkins_next (
  id, date, weight_kg, sleep_hours, water_liters, protein_grams, notes, created_at, updated_at
)
SELECT
  id, date, weight_kg, sleep_hours, water_liters, protein_grams, notes, created_at, updated_at
FROM daily_checkins;

DROP TABLE daily_checkins;
ALTER TABLE daily_checkins_next RENAME TO daily_checkins;
CREATE INDEX idx_checkins_date ON daily_checkins(date);
