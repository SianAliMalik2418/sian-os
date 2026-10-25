export function formatMoney(value: number) {
  return `Rs ${value.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`
}
