CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT,
  category TEXT,
  serving_description TEXT,
  calories INTEGER NOT NULL,
  protein_grams INTEGER NOT NULL,
  ingredients TEXT,
  notes TEXT,
  photo_r2_key TEXT,
  photo_content_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
