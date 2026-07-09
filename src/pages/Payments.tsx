import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { StatCard, Badge } from '../components/ui'
import { usd } from '../lib/format'
import { Link } from 'react-router-dom'

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => {
    supabase.from('payments').select('*, orders(order_number, id, customers(name))').order('paid_at', { ascending: false }).then(({ data }) => setPayments(data ?? []))
    supabase.from('orders').select('*, customers(name)').in('payment_status', ['unpaid', 'partial']).neq('status', 'cancelled').then(({ data }) => setOrders(data ?? []))
  }, [])
  const collected = payments.reduce((s, p) => s + Number(p.amount), 0)
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard title="Collected (all time)" value={usd(collected)} />
        <StatCard title="Open balances" value={orders.length} sub="orders unpaid or partial" />
        <StatCard title="Payments logged" value={payments.length} />
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Outstanding orders</h2>
        {orders.map(o => (
          <div key={o.id} className="flex justify-between border-t py-2 text-sm">
            <Link to={`/orders/${o.id}`} className="font-semibold text-brand-dark hover:underline">#{o.order_number} · {o.customers?.name}</Link>
            <Badge status={o.payment_status} />
          </div>))}
        {!orders.length && <p className="text-sm text-gray-400">Nothing outstanding.</p>}
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Recent payments</h2>
        {payments.slice(0, 20).map(p => (
          <div key={p.id} className="flex justify-between border-t py-2 text-sm">
            <span>{new Date(p.paid_at).toLocaleDateString()} · #{p.orders?.order_number} · {p.orders?.customers?.name} · {p.method}</span>
            <span className="font-semibold">{usd(p.amount)}</span>
          </div>))}
        {!payments.length && <p className="text-sm text-gray-400">No payments yet.</p>}
      </div>
    </div>
  )
}
