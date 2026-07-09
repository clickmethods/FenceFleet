import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Badge, btnCls, btn2Cls, inputCls, Modal, Field } from '../components/ui'
import { fdate, usd, label } from '../lib/format'

export default function OrderDetail() {
  const { id } = useParams()
  const [o, setO] = useState<any>(null)
  const [lines, setLines] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [avail, setAvail] = useState<any[]>([])
  const [addItem, setAddItem] = useState(false)
  const [pay, setPay] = useState(false)
  const [pf, setPf] = useState<any>({ method: 'card' })
  const load = async () => {
    const { data } = await supabase.from('orders').select('*, customers(*)').eq('id', id).single(); setO(data)
    supabase.from('order_items').select('*, inventory_items(*)').eq('order_id', id).then(r => setLines(r.data ?? []))
    supabase.from('payments').select('*').eq('order_id', id).order('paid_at').then(r => setPayments(r.data ?? []))
    supabase.from('deliveries').select('*, profiles(full_name)').eq('order_id', id).then(r => setDeliveries(r.data ?? []))
    supabase.from('inventory_items').select('*').eq('status', 'available').then(r => setAvail(r.data ?? []))
  }
  useEffect(() => { load() }, [id])
  if (!o) return null
  const days = Math.max(1, Math.round((+new Date(o.end_date) - +new Date(o.start_date)) / 86400000))
  const rental = lines.reduce((s, l) => s + Number(l.rate) * days, 0)
  const taxRate = o.customers?.tax_exempt ? 0 : Number(o.customers?.tax_rate ?? 0)
  const tax = rental * taxRate / 100
  const waiver = o.waiver_accepted ? rental * Number(o.waiver_pct ?? 0) / 100 : 0
  const total = rental + waiver + tax + Number(o.fuel_fee ?? 0)
  const paid = payments.reduce((s, p) => s + Number(p.amount), 0)
  const setStatus = async (status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    const itemStatus = status === 'on_rent' ? 'on_rent' : status === 'returned' ? 'available' : 'reserved'
    if (lines.length) await supabase.from('inventory_items').update({ status: itemStatus }).in('id', lines.map(l => l.item_id))
    load()
  }
  const attach = async (item: any) => {
    await supabase.from('order_items').insert({ order_id: id, item_id: item.id, rate: item.daily_rate })
    await supabase.from('inventory_items').update({ status: 'reserved' }).eq('id', item.id)
    load()
  }
  const recordPayment = async (e: any) => {
    e.preventDefault()
    await supabase.from('payments').insert({ ...pf, order_id: id })
    const newPaid = paid + Number(pf.amount)
    await supabase.from('orders').update({ payment_status: newPaid >= total ? 'paid' : 'partial' }).eq('id', id)
    setPay(false); setPf({ method: 'card' }); load()
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Order #{o.order_number} <Badge status={o.status} /></h1>
        <div className="flex gap-2">
          {o.status === 'reserved' && <button className={btnCls} onClick={() => setStatus('on_rent')}>Mark On Rent</button>}
          {o.status === 'on_rent' && <button className={btnCls} onClick={() => setStatus('returned')}>Mark Returned</button>}
          <button className={btn2Cls} onClick={() => window.print()}>Invoice PDF</button>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 hidden justify-between print:flex">
          <div><div className="text-xl font-extrabold">FenceFlow</div><div className="text-xs text-gray-500">Invoice — Order #{o.order_number}</div></div>
          <div className="text-right text-xs text-gray-500">{new Date().toLocaleDateString()}</div>
        </div>
        <div className="grid gap-4 text-sm sm:grid-cols-2">
          <div><div className="text-xs font-semibold text-gray-400">CUSTOMER</div>{o.customers?.name}<br />{o.customers?.email}<br />{o.customers?.phone}</div>
          <div><div className="text-xs font-semibold text-gray-400">SITE</div>{o.site_address}<br />{fdate(o.start_date)} → {fdate(o.end_date)} ({days} days)<br />{label(o.delivery_method)}</div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Items</h2>
          <button className={btn2Cls + ' no-print'} onClick={() => setAddItem(true)}>+ Add item</button>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400"><th>Unit</th><th>Category</th><th className="text-right">Rate/day</th><th className="text-right">Line ({days}d)</th></tr></thead>
          <tbody>{lines.map(l => (
            <tr key={l.id} className="border-t"><td className="py-1.5">{l.inventory_items?.unit_number}</td><td>{l.inventory_items?.category}</td>
              <td className="text-right">{usd(l.rate)}</td><td className="text-right">{usd(Number(l.rate) * days)}</td></tr>))}
          </tbody>
        </table>
        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between"><span>Rental</span><span>{usd(rental)}</span></div>
          {waiver > 0 && <div className="flex justify-between"><span>Damage waiver ({Number(o.waiver_pct)}%)</span><span>{usd(waiver)}</span></div>}
          <div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{usd(tax)}</span></div>
          <div className="flex justify-between"><span>Fuel fee</span><span>{usd(o.fuel_fee)}</span></div>
          <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{usd(total)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Paid</span><span>{usd(paid)}</span></div>
          <div className="flex justify-between font-semibold"><span>Balance</span><span>{usd(total - paid)}</span></div>
        </div>
      </div>
      <div className="no-print rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Payments <Badge status={o.payment_status} /></h2>
          <button className={btn2Cls} onClick={() => setPay(true)}>+ Record payment</button></div>
        {payments.map(p => <div key={p.id} className="flex justify-between border-t py-1.5 text-sm"><span>{new Date(p.paid_at).toLocaleDateString()} · {p.method}{p.reference ? ` · ${p.reference}` : ''}</span><span>{usd(p.amount)}</span></div>)}
        {!payments.length && <p className="text-sm text-gray-400">No payments recorded.</p>}
      </div>
      <div className="no-print rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-bold">Deliveries</h2>
        {deliveries.map(d => <div key={d.id} className="flex justify-between border-t py-1.5 text-sm">
          <span><Badge status={d.direction} /> {fdate(d.scheduled_date)} · {d.profiles?.full_name ?? 'Unassigned'}</span><Badge status={d.status} /></div>)}
        {!deliveries.length && <p className="text-sm text-gray-400">None scheduled — manage on the Dispatch page.</p>}
      </div>
      {addItem && <Modal title="Add inventory item" onClose={() => setAddItem(false)}>
        <div className="space-y-2">{avail.map(i => (
          <button key={i.id} onClick={() => { attach(i); setAddItem(false) }} className="flex w-full justify-between rounded-lg border p-3 text-sm hover:border-brand">
            <span className="font-semibold">{i.unit_number} <span className="font-normal text-gray-500">({i.category})</span></span><span>{usd(i.daily_rate)}/day</span>
          </button>))}
          {!avail.length && <p className="text-sm text-gray-400">No available items.</p>}
        </div>
      </Modal>}
      {pay && <Modal title="Record payment" onClose={() => setPay(false)}>
        <form onSubmit={recordPayment} className="space-y-3">
          <Field label="Amount"><input type="number" step="0.01" required className={inputCls} onChange={e => setPf({ ...pf, amount: e.target.value })} /></Field>
          <Field label="Method"><select className={inputCls} value={pf.method} onChange={e => setPf({ ...pf, method: e.target.value })}>
            <option value="card">Card</option><option value="check">Check</option><option value="cash">Cash</option><option value="ach">ACH</option></select></Field>
          <Field label="Reference"><input className={inputCls} onChange={e => setPf({ ...pf, reference: e.target.value })} /></Field>
          <button className={btnCls + ' w-full'}>Save</button>
        </form>
      </Modal>}
    </div>
  )
}
