import { db } from './db'
import type {
  FinanceCategoryInput,
  FinanceDebtInput,
  FinanceDebtUpdateInput,
  FinanceSettingsInput,
  FinanceTransactionInput,
} from './schemas'
import { nullable } from './sql'
import type {
  FinanceCategory,
  FinanceDebt,
  FinanceLevel,
  FinanceSettings,
  FinanceSummary,
  FinanceTransaction,
} from './types'

const levelPctColumns: Record<FinanceLevel, { family: keyof FinanceSettings; self: keyof FinanceSettings; service: keyof FinanceSettings }> = {
  muslim: { family: 'muslim_family_pct', self: 'muslim_self_pct', service: 'muslim_service_pct' },
  mumin: { family: 'mumin_family_pct', self: 'mumin_self_pct', service: 'mumin_service_pct' },
  muhsin: { family: 'muhsin_family_pct', self: 'muhsin_self_pct', service: 'muhsin_service_pct' },
}

export async function listFinanceCategories() {
  const result = await db().prepare('SELECT * FROM finance_categories ORDER BY bucket, name').all<FinanceCategory>()
  return result.results
}

export async function createFinanceCategory(input: FinanceCategoryInput) {
  return db().prepare(`
    INSERT INTO finance_categories (name, bucket, color) VALUES (?, ?, ?) RETURNING *
  `).bind(input.name, input.bucket, nullable(input.color)).first<FinanceCategory>()
}

export async function deleteFinanceCategory(id: number) {
  await db().prepare('DELETE FROM finance_categories WHERE id = ?').bind(id).run()
}

export async function listFinanceTransactions({ from, to, limit = 500 }: { from?: string; to?: string; limit?: number }) {
  const database = db()
  if (from && to) {
    const result = await database.prepare('SELECT * FROM finance_transactions WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC LIMIT ?').bind(from, to, limit).all<FinanceTransaction>()
    return result.results
  }
  const result = await database.prepare('SELECT * FROM finance_transactions ORDER BY date DESC, id DESC LIMIT ?').bind(limit).all<FinanceTransaction>()
  return result.results
}

export async function createFinanceTransaction(input: FinanceTransactionInput) {
  return db().prepare(`
    INSERT INTO finance_transactions (date, type, amount, category_id, note, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    RETURNING *
  `).bind(input.date, input.type, input.amount, nullable(input.category_id), nullable(input.note)).first<FinanceTransaction>()
}

export async function deleteFinanceTransaction(id: number) {
  await db().prepare('DELETE FROM finance_transactions WHERE id = ?').bind(id).run()
}

export async function listFinanceDebts() {
  const result = await db().prepare('SELECT * FROM finance_debts ORDER BY status, due_date IS NULL, due_date, id DESC').all<FinanceDebt>()
  return result.results
}

export async function createFinanceDebt(input: FinanceDebtInput) {
  return db().prepare(`
    INSERT INTO finance_debts (counterparty, direction, principal, balance, due_date, note, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    RETURNING *
  `).bind(input.counterparty, input.direction, input.principal, input.principal, nullable(input.due_date), nullable(input.note)).first<FinanceDebt>()
}

export async function updateFinanceDebt(id: number, input: FinanceDebtUpdateInput) {
  const existing = await db().prepare('SELECT * FROM finance_debts WHERE id = ?').bind(id).first<FinanceDebt>()
  if (!existing) return null
  const balance = input.balance ?? existing.balance
  const status = input.status ?? (balance <= 0 ? 'paid' : existing.status)
  return db().prepare(`
    UPDATE finance_debts SET balance = ?, status = ?, due_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? RETURNING *
  `).bind(balance, status, nullable(input.due_date ?? existing.due_date ?? undefined), nullable(input.note ?? existing.note ?? undefined), id).first<FinanceDebt>()
}

export async function deleteFinanceDebt(id: number) {
  await db().prepare('DELETE FROM finance_debts WHERE id = ?').bind(id).run()
}

export async function getFinanceSettings(): Promise<FinanceSettings> {
  const existing = await db().prepare('SELECT * FROM finance_settings WHERE id = 1').first<FinanceSettings>()
  if (existing) return existing
  // The migration seeds id=1, so this only runs if that row was somehow removed.
  const created = await db().prepare('INSERT INTO finance_settings (id) VALUES (1) RETURNING *').first<FinanceSettings>()
  return created!
}

export async function updateFinanceSettings(input: FinanceSettingsInput) {
  const current = await getFinanceSettings()
  const merged = { ...current, ...input }
  return db().prepare(`
    UPDATE finance_settings SET
      level = ?, muslim_family_pct = ?, muslim_self_pct = ?, muslim_service_pct = ?,
      mumin_family_pct = ?, mumin_self_pct = ?, mumin_service_pct = ?,
      muhsin_family_pct = ?, muhsin_self_pct = ?, muhsin_service_pct = ?,
      emergency_fund_target = ?, emergency_fund_balance = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1 RETURNING *
  `).bind(
    merged.level, merged.muslim_family_pct, merged.muslim_self_pct, merged.muslim_service_pct,
    merged.mumin_family_pct, merged.mumin_self_pct, merged.mumin_service_pct,
    merged.muhsin_family_pct, merged.muhsin_self_pct, merged.muhsin_service_pct,
    nullable(merged.emergency_fund_target), merged.emergency_fund_balance,
  ).first<FinanceSettings>()
}

export async function financeSummary({ from, to }: { from: string; to: string }): Promise<FinanceSummary> {
  const database = db()
  const [settings, incomeRow, expenseRow, bucketRows, debtRows, trendRows] = await Promise.all([
    getFinanceSettings(),
    database.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transactions WHERE type = 'income' AND date >= ? AND date <= ?").bind(from, to).first<{ total: number }>(),
    database.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM finance_transactions WHERE type = 'expense' AND date >= ? AND date <= ?").bind(from, to).first<{ total: number }>(),
    database.prepare(`
      SELECT c.bucket AS bucket, COALESCE(SUM(t.amount), 0) AS total
      FROM finance_transactions t
      JOIN finance_categories c ON c.id = t.category_id
      WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.bucket
    `).bind(from, to).all<{ bucket: 'family' | 'self' | 'service'; total: number }>(),
    database.prepare("SELECT direction, COALESCE(SUM(balance), 0) AS total FROM finance_debts WHERE status = 'outstanding' GROUP BY direction").all<{ direction: 'owed_by_me' | 'owed_to_me'; total: number }>(),
    database.prepare(`
      SELECT substr(date, 1, 7) AS period,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense
      FROM finance_transactions
      WHERE date >= date(?, '-5 months', 'start of month')
      GROUP BY period ORDER BY period
    `).bind(to).all<{ period: string; income: number; expense: number }>(),
  ])

  const income = incomeRow?.total ?? 0
  const expense = expenseRow?.total ?? 0
  const actual = { family: 0, self: 0, service: 0 }
  for (const row of bucketRows.results) actual[row.bucket] = row.total
  const owedByMe = debtRows.results.find((row) => row.direction === 'owed_by_me')?.total ?? 0
  const owedToMe = debtRows.results.find((row) => row.direction === 'owed_to_me')?.total ?? 0

  const cols = levelPctColumns[settings!.level]
  const targetPct = {
    family: settings![cols.family] as number,
    self: settings![cols.self] as number,
    service: settings![cols.service] as number,
  }
  const target = {
    family: income * (targetPct.family / 100),
    self: income * (targetPct.self / 100),
    service: income * (targetPct.service / 100),
  }

  return {
    from,
    to,
    income,
    expense,
    net: income - expense,
    actual,
    target,
    targetPct,
    owedByMe,
    owedToMe,
    settings: settings!,
    trend: trendRows.results,
  }
}
