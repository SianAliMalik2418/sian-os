import type { FinanceLevel } from './types'

export const levelLabels: Record<FinanceLevel, string> = {
  muslim: 'Muslim (baseline)',
  mumin: "Mu'min (believer)",
  muhsin: 'Muhsin (excellence)',
}

export const levelDescriptions: Record<FinanceLevel, string> = {
  muslim: 'Family necessities and debt payoff first, then Self growth and lifestyle, then Service.',
  mumin: 'After Family, split the rest equally between Self and Service.',
  muhsin: 'After Family, keep Self minimal and dedicate most of the rest to Service, trusting in Baraka.',
}
