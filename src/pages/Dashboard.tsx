import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard, Badge } from '../components/ui'
import { fdate, usd } from '../lib/format'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [items, setItems] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => {
    supabase.from('inventory_items').select('status').then(({ data }) => setItems(data ?? []))
    supabase.from('orders').select('*, customers(name)').neq('status', 'cancelled').order('created_at', { ascending: false }).then(({ data }) => setOrders(data ?? []))
  }, [])
  const count = (s: string) => items.filter(i => i.status === s).length
  const today = new Date().toISOString().slice(0, 10)
  const overdue = orders.filter(o => o.status === 'on_rent' && o.end_date < today)
  const active = orders.filter(o => ['reserved', 'on_rent'].includes(o.status))
  const util = items.length ? Math.round((count('on_rent') / items.length) * 100) : 0
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="On Rent" value={count('on_rent')} sub={`${util}% utilization`} />
        <StatCard title="Available" value={count('available')} />
        <StatCard title="Reserved" value={orders.filter(o => o.status === 'reserved').length} sub="orders" />
        <StatCard title="Overdue" value={overdue.length} sub="orders past end date" />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Active rentals</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400"><th className="pb-2">Order</th><th>Customer</th><th>Dates</th><th>Status</th><th className="text-right">Deposit</th></tr></thead>
          <tbody>
            {active.slice(0, 10).map(o => (
              <tr key={o.id} className="border-t">
                <td className="py-2"><Link to={`/orders/${o.id}`} className="font-semibold text-brand-dark hover:underline">#{o.order_number}</Link></td>
                <td>{o.customers?.name}</td>
                <td>{fdate(o.start_date)} → {fdate(o.end_date)}</td>
                <td><Badge status={o.end_date < today && o.status === 'on_rent' ? 'overdue' : o.status} /></td>
                <td className="text-right">{usd(o.deposit)}</td>
              </tr>
            ))}
            {!active.length && <tr><td colSpan={5} className="py-6 text-center text-gray-400">No active rentals yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
