import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, inputCls, btnCls, Field } from '../components/ui'
import { usd } from '../lib/format'

export default function Customers() {
  const [rows, setRows] = useState<any[]>([])
  const [edit, setEdit] = useState<any>(null)
  const load = () => supabase.from('customers').select('*, orders(id, payment_status)').order('name').then(({ data }) => setRows(data ?? []))
  useEffect(() => { load() }, [])
  const save = async (e: any) => {
    e.preventDefault()
    const { id, orders, ...rest } = edit
    const { error } = id ? await supabase.from('customers').update(rest).eq('id', id) : await supabase.from('customers').insert(rest)
    if (error) return alert(error.message)
    setEdit(null); load()
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button className={btnCls} onClick={() => setEdit({})}>+ Add Customer</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(c => (
          <button key={c.id} onClick={() => setEdit(c)} className="rounded-2xl bg-white p-5 text-left shadow-sm hover:ring-2 hover:ring-brand">
            <div className="font-bold">{c.name}</div>
            <div className="text-sm text-gray-500">{c.contact_name} · {c.phone}</div>
            <div className="text-sm text-gray-500">{c.email}</div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>Credit: {usd(c.credit_limit)}</span><span>{c.orders?.length ?? 0} orders</span>
            </div>
          </button>
        ))}
      </div>
      {edit && <Modal title={edit.id ? edit.name : 'Add Customer'} onClose={() => setEdit(null)}>
        <form onSubmit={save} className="space-y-3">
          <Field label="Company name"><input className={inputCls} required value={edit.name ?? ''} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact"><input className={inputCls} value={edit.contact_name ?? ''} onChange={e => setEdit({ ...edit, contact_name: e.target.value })} /></Field>
            <Field label="Phone"><input className={inputCls} value={edit.phone ?? ''} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Email"><input className={inputCls} value={edit.email ?? ''} onChange={e => setEdit({ ...edit, email: e.target.value })} /></Field>
            <Field label="Secondary contact"><input className={inputCls} value={edit.secondary_contact ?? ''} onChange={e => setEdit({ ...edit, secondary_contact: e.target.value })} /></Field>
            <Field label="Credit limit"><input type="number" className={inputCls} value={edit.credit_limit ?? ''} onChange={e => setEdit({ ...edit, credit_limit: e.target.value })} /></Field>
            <Field label="Tax rate %"><input type="number" step="0.001" className={inputCls} value={edit.tax_rate ?? ''} onChange={e => setEdit({ ...edit, tax_rate: e.target.value })} /></Field>
          </div>
          <Field label="Billing address"><input className={inputCls} value={edit.billing_address ?? ''} onChange={e => setEdit({ ...edit, billing_address: e.target.value })} /></Field>
          <Field label="Delivery address"><input className={inputCls} value={edit.delivery_address ?? ''} onChange={e => setEdit({ ...edit, delivery_address: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.tax_exempt} onChange={e => setEdit({ ...edit, tax_exempt: e.target.checked })} /> Tax exempt</label>
          <button className={btnCls + ' w-full'}>Save</button>
        </form>
      </Modal>}
    </div>
  )
}
