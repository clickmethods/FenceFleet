import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Modal, inputCls, btnCls, Field } from '../components/ui'
import { usd } from '../lib/format'

export default function Inventory() {
  const [items, setItems] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<any>(null)
  const load = () => supabase.from('inventory_items').select('*').order('unit_number').then(({ data }) => setItems(data ?? []))
  useEffect(() => { load() }, [])
  const save = async (e: any) => {
    e.preventDefault()
    const { id, ...rest } = edit
    const { error } = id ? await supabase.from('inventory_items').update(rest).eq('id', id) : await supabase.from('inventory_items').insert(rest)
    if (error) return alert(error.message)
    setEdit(null); load()
  }
  const shown = items.filter(i => (i.unit_number + i.category + (i.serial_number ?? '') + i.location).toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <button className={btnCls} onClick={() => setEdit({ category: 'panel', status: 'available', location: 'Yard' })}>+ Add Unit</button>
      </div>
      <input className={inputCls + ' max-w-sm'} placeholder="Search units…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400"><th className="pb-2">Unit #</th><th>Category</th><th>Serial</th><th>Location</th><th>Status</th><th className="text-right">Rate/day</th></tr></thead>
          <tbody>{shown.map(i => (
            <tr key={i.id} className="cursor-pointer border-t hover:bg-soft" onClick={() => setEdit(i)}>
              <td className="py-2 font-semibold">{i.unit_number}</td><td className="capitalize">{i.category}</td>
              <td>{i.serial_number}</td><td>{i.location}</td><td><Badge status={i.status} /></td>
              <td className="text-right">{usd(i.daily_rate)}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
      {edit && <Modal title={edit.id ? `Edit ${edit.unit_number}` : 'Add Unit'} onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit #"><input className={inputCls} required value={edit.unit_number ?? ''} onChange={e => setEdit({ ...edit, unit_number: e.target.value })} /></Field>
            <Field label="Category"><select className={inputCls} value={edit.category} onChange={e => setEdit({ ...edit, category: e.target.value })}>
              {['panel', 'post', 'gate', 'base', 'sandbag', 'windscreen', 'barricade'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Serial #"><input className={inputCls} value={edit.serial_number ?? ''} onChange={e => setEdit({ ...edit, serial_number: e.target.value })} /></Field>
            <Field label="Location"><input className={inputCls} value={edit.location ?? ''} onChange={e => setEdit({ ...edit, location: e.target.value })} /></Field>
            <Field label="Status"><select className={inputCls} value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
              <option value="available">Available</option><option value="on_rent">On Rent</option><option value="reserved">Reserved</option><option value="soft_down">Soft Down</option></select></Field>
            <Field label="Daily rate"><input type="number" step="0.01" className={inputCls} value={edit.daily_rate ?? ''} onChange={e => setEdit({ ...edit, daily_rate: e.target.value })} /></Field>
          </div>
          <button className={btnCls + ' w-full'}>Save</button>
        </form>
      </Modal>}
    </div>
  )
}
