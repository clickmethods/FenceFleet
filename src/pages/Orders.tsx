import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Modal, inputCls, btnCls, Field } from '../components/ui'
import { fdate, usd } from '../lib/format'
import { Link } from 'react-router-dom'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [show, setShow] = useState(false)
  const [reqs, setReqs] = useState<any[]>([])
  const [f, setF] = useState<any>({ delivery_method: 'delivery' })
  const load = () => supabase.from('orders').select('*, customers(name)').order('created_at', { ascending: false }).then(({ data }) => setOrders(data ?? []))
  const loadReqs = () => supabase.from('booking_requests').select('*').eq('status', 'new').order('created_at').then(({ data }) => setReqs(data ?? []))
  useEffect(() => { load(); loadReqs(); supabase.from('customers').select('id,name,email').then(({ data }) => setCustomers(data ?? [])) }, [])
  const convert = async (r: any) => {
    let cust = customers.find((c: any) => c.email?.toLowerCase() === r.email.toLowerCase())
    if (!cust) {
      const { data, error } = await supabase.from('customers').insert({ name: r.company || r.name, contact_name: r.name, email: r.email, phone: r.phone, delivery_address: r.site_address }).select().single()
      if (error) return alert(error.message)
      cust = data
    }
    const { error } = await supabase.from('orders').insert({ customer_id: cust.id, start_date: r.start_date, end_date: r.end_date, site_address: r.site_address, notes: r.notes ? `Booking request: ${r.notes}` : null })
    if (error) return alert(error.message)
    await supabase.from('booking_requests').update({ status: 'converted' }).eq('id', r.id)
    load(); loadReqs()
  }
  const dismiss = async (r: any) => { await supabase.from('booking_requests').update({ status: 'dismissed' }).eq('id', r.id); loadReqs() }
  const save = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('orders').insert(f)
    if (error) return alert(error.message)
    setShow(false); setF({ delivery_method: 'delivery' }); load()
  }
  const shown = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <button className={btnCls} onClick={() => setShow(true)}>+ New Order</button>
      </div>
      <div className="flex gap-2">
        {['all', 'reserved', 'on_rent', 'returned', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? 'bg-ink text-white' : 'bg-white'}`}>{s.replaceAll('_', ' ')}</button>
        ))}
      </div>
      {reqs.length > 0 && <div className="rounded-2xl border-2 border-brand/40 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">New booking requests ({reqs.length})</h2>
        {reqs.map(r => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-2 text-sm">
            <div>
              <span className="font-semibold">{r.company || r.name}</span> · {r.email} · {r.site_address}
              <div className="text-xs text-gray-400">{fdate(r.start_date)} → {fdate(r.end_date)}{r.footage ? ` · ${r.footage} ft` : ''}{r.notes ? ` · ${r.notes}` : ''}</div>
            </div>
            <div className="flex gap-2">
              <button className={btnCls} onClick={() => convert(r)}>Convert to order</button>
              <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => dismiss(r)}>Dismiss</button>
            </div>
          </div>))}
      </div>}
      <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400"><th className="pb-2">Order</th><th>Customer</th><th>Site</th><th>Dates</th><th>Status</th><th>Payment</th></tr></thead>
          <tbody>{shown.map(o => (
            <tr key={o.id} className="border-t">
              <td className="py-2"><Link to={`/orders/${o.id}`} className="font-semibold text-brand-dark hover:underline">#{o.order_number}</Link></td>
              <td>{o.customers?.name}</td><td className="max-w-45 truncate">{o.site_address}</td>
              <td>{fdate(o.start_date)} → {fdate(o.end_date)}</td>
              <td><Badge status={o.status} /></td><td><Badge status={o.payment_status} /></td>
            </tr>))}
            {!shown.length && <tr><td colSpan={6} className="py-6 text-center text-gray-400">No orders.</td></tr>}
          </tbody>
        </table>
      </div>
      {show && <Modal title="New Order" onClose={() => setShow(false)}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Customer">
            <select className={inputCls} required value={f.customer_id ?? ''} onChange={e => setF({ ...f, customer_id: e.target.value })}>
              <option value="">Select…</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><input type="date" className={inputCls} required onChange={e => setF({ ...f, start_date: e.target.value })} /></Field>
            <Field label="End date"><input type="date" className={inputCls} required onChange={e => setF({ ...f, end_date: e.target.value })} /></Field>
          </div>
          <Field label="Site address"><input className={inputCls} required onChange={e => setF({ ...f, site_address: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Method">
              <select className={inputCls} value={f.delivery_method} onChange={e => setF({ ...f, delivery_method: e.target.value })}>
                <option value="delivery">Delivery</option><option value="pickup">Pickup</option>
              </select></Field>
            <Field label="Fuel fee"><input type="number" step="0.01" className={inputCls} onChange={e => setF({ ...f, fuel_fee: e.target.value })} /></Field>
            <Field label="Deposit"><input type="number" step="0.01" className={inputCls} onChange={e => setF({ ...f, deposit: e.target.value })} /></Field>
          </div>
          <Field label="Notes"><textarea className={inputCls} onChange={e => setF({ ...f, notes: e.target.value })} /></Field>
          <button className={btnCls + ' w-full'}>Create order</button>
        </form>
      </Modal>}
    </div>
  )
}
