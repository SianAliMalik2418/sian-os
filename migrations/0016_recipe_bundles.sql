CREATE TABLE IF NOT EXISTS recipe_bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recipe_bundle_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bundle_id INTEGER NOT NULL REFERENCES recipe_bundles(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  default_quantity REAL NOT NULL DEFAULT 1 CHECK(default_quantity >= 0.25 AND default_quantity <= 20),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bundle_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_bundles_name ON recipe_bundles(name);
CREATE INDEX IF NOT EXISTS idx_recipe_bundle_items_bundle ON recipe_bundle_items(bundle_id, position);
CREATE INDEX IF NOT EXISTS idx_recipe_bundle_items_recipe ON recipe_bundle_items(recipe_id);
