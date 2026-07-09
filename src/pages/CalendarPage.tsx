import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge } from '../components/ui'
import { Link } from 'react-router-dom'

export default function CalendarPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  useEffect(() => { supabase.from('orders').select('*, customers(name)').neq('status', 'cancelled').then(({ data }) => setOrders(data ?? [])) }, [])
  const days: Date[] = []
  const start = new Date(month); start.setDate(1 - start.getDay())
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const forDay = (d: Date) => orders.filter(o => o.start_date <= iso(d) && o.end_date >= iso(d))
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-3">
          <button className="rounded-lg bg-white px-3 py-1 shadow-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>←</button>
          <span className="font-semibold">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button className="rounded-lg bg-white px-3 py-1 shadow-sm" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-gray-200 text-xs shadow-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="bg-white p-2 text-center font-semibold text-gray-400">{d}</div>)}
        {days.map(d => (
          <div key={+d} className={`min-h-24 bg-white p-1.5 ${d.getMonth() !== month.getMonth() ? 'opacity-40' : ''}`}>
            <div className="mb-1 text-gray-400">{d.getDate()}</div>
            {forDay(d).slice(0, 3).map(o => (
              <Link key={o.id} to={`/orders/${o.id}`} className="mb-0.5 block truncate rounded bg-brand/15 px-1 py-0.5 font-medium text-brand-dark hover:bg-brand/30">
                #{o.order_number} {o.customers?.name}
              </Link>))}
            {forDay(d).length > 3 && <div className="text-gray-400">+{forDay(d).length - 3} more</div>}
          </div>))}
      </div>
    </div>
  )
}
