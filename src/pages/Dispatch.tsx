import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Modal, inputCls, btnCls, Field } from '../components/ui'
import { fdate } from '../lib/format'

export default function Dispatch({ profile }: { profile: any }) {
  const [rows, setRows] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [show, setShow] = useState(false)
  const [f, setF] = useState<any>({ direction: 'going_out' })
  const load = () => supabase.from('deliveries').select('*, orders(order_number, site_address, customers(name)), profiles(full_name)').order('scheduled_date').then(({ data }) => setRows(data ?? []))
  useEffect(() => {
    load()
    supabase.from('profiles').select('id, full_name').then(({ data }) => setDrivers(data ?? []))
    supabase.from('orders').select('id, order_number, site_address').neq('status', 'cancelled').then(({ data }) => setOrders(data ?? []))
  }, [])
  const save = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('deliveries').insert({ ...f, status: f.driver_id ? 'assigned' : 'unassigned' })
    if (error) return alert(error.message)
    setShow(false); setF({ direction: 'going_out' }); load()
  }
  const advance = async (d: any) => {
    const next = d.status === 'assigned' ? 'in_transit' : 'completed'
    await supabase.from('deliveries').update({ status: next, ...(next === 'completed' ? { completed_at: new Date().toISOString() } : {}) }).eq('id', d.id)
    load()
  }
  const shown = rows.filter(r => filter === 'all' || r.direction === filter)
  const isAdmin = profile?.role === 'admin'
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dispatch</h1>
        {isAdmin && <button className={btnCls} onClick={() => setShow(true)}>+ Schedule</button>}
      </div>
      <div className="flex gap-2">
        {['all', 'going_out', 'coming_in'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === s ? 'bg-ink text-white' : 'bg-white'}`}>{s.replaceAll('_', ' ')}</button>))}
      </div>
      <div className="space-y-3">
        {shown.map(d => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <div>
              <div className="font-semibold">#{d.orders?.order_number} · {d.orders?.customers?.name}</div>
              <div className="text-sm text-gray-500">{d.orders?.site_address}</div>
              <div className="mt-1 flex gap-2 text-xs"><Badge status={d.direction} /><span className="text-gray-400">{fdate(d.scheduled_date)}</span><span className="text-gray-400">{d.profiles?.full_name ?? 'Unassigned'}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={d.status} />
              {d.status !== 'completed' && (isAdmin || d.driver_id === profile?.id) &&
                <button className={btnCls} onClick={() => advance(d)}>{d.status === 'in_transit' ? 'Complete' : 'Start'}</button>}
            </div>
          </div>))}
        {!shown.length && <p className="py-8 text-center text-sm text-gray-400">No deliveries scheduled.</p>}
      </div>
      {show && <Modal title="Schedule delivery" onClose={() => setShow(false)}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Order"><select className={inputCls} required value={f.order_id ?? ''} onChange={e => setF({ ...f, order_id: e.target.value })}>
            <option value="">Select…</option>{orders.map(o => <option key={o.id} value={o.id}>#{o.order_number} — {o.site_address}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Direction"><select className={inputCls} value={f.direction} onChange={e => setF({ ...f, direction: e.target.value })}>
              <option value="going_out">Going Out</option><option value="coming_in">Coming In</option></select></Field>
            <Field label="Date"><input type="date" className={inputCls} required onChange={e => setF({ ...f, scheduled_date: e.target.value })} /></Field>
          </div>
          <Field label="Driver"><select className={inputCls} value={f.driver_id ?? ''} onChange={e => setF({ ...f, driver_id: e.target.value || null })}>
            <option value="">Unassigned</option>{drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}</select></Field>
          <button className={btnCls + ' w-full'}>Schedule</button>
        </form>
      </Modal>}
    </div>
  )
}
