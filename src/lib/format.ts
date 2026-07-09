export const usd = (n: number | string | null | undefined) =>
  Number(n ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
export const fdate = (d: string | null | undefined) =>
  d ? new Date(d + (d.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
export const STATUS_COLORS: Record<string, string> = {
  reserved: 'bg-amber-100 text-amber-800',
  on_rent: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-gray-200 text-gray-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
  available: 'bg-emerald-100 text-emerald-800',
  soft_down: 'bg-orange-100 text-orange-800',
  unassigned: 'bg-gray-200 text-gray-700',
  assigned: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-gray-200 text-gray-700',
  going_out: 'bg-blue-100 text-blue-800',
  coming_in: 'bg-purple-100 text-purple-800',
}
export const label = (s: string) => s.replaceAll('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
