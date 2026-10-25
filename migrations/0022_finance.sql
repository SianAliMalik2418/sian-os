CREATE TABLE IF NOT EXISTS finance_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL,                  -- 'family' | 'self' | 'service'
  color TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                    -- YYYY-MM-DD
  type TEXT NOT NULL,                    -- 'income' | 'expense'
  amount REAL NOT NULL,
  category_id INTEGER REFERENCES finance_categories(id),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON finance_transactions (date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_category ON finance_transactions (category_id);

CREATE TABLE IF NOT EXISTS finance_debts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  counterparty TEXT NOT NULL,
  direction TEXT NOT NULL,               -- 'owed_by_me' | 'owed_to_me'
  principal REAL NOT NULL,
  balance REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'outstanding', -- 'outstanding' | 'paid'
  due_date TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_finance_debts_status ON finance_debts (status, due_date);

-- Singleton settings row: the active allocation level plus editable Family/Self/Service
-- percentages for all three framework levels (Muslim baseline, Mu'min, Muhsin), so
-- switching levels doesn't lose the percentages tuned for the others.
CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  level TEXT NOT NULL DEFAULT 'muslim',
  muslim_family_pct REAL NOT NULL DEFAULT 50,
  muslim_self_pct REAL NOT NULL DEFAULT 40,
  muslim_service_pct REAL NOT NULL DEFAULT 10,
  mumin_family_pct REAL NOT NULL DEFAULT 50,
  mumin_self_pct REAL NOT NULL DEFAULT 25,
  mumin_service_pct REAL NOT NULL DEFAULT 25,
  muhsin_family_pct REAL NOT NULL DEFAULT 50,
  muhsin_self_pct REAL NOT NULL DEFAULT 5,
  muhsin_service_pct REAL NOT NULL DEFAULT 45,
  emergency_fund_target REAL,
  emergency_fund_balance REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO finance_settings (id) VALUES (1) ON CONFLICT(id) DO NOTHING;
