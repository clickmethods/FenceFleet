import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls, btnCls, Field } from '../components/ui'
import { Fence } from 'lucide-react'

export default function Book() {
  const [f, setF] = useState<any>({})
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true)
    const { error } = await supabase.rpc('submit_booking', { p: f })
    setBusy(false)
    if (error) return alert(error.message)
    setDone(true)
  }
  return (
    <div className="mx-auto max-w-xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xl font-extrabold"><Fence className="text-brand" /> Request Temporary Fencing</div>
      {done ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mb-2 text-3xl">✅</div>
          <h2 className="text-lg font-bold">Request received</h2>
          <p className="mt-2 text-sm text-gray-500">We'll confirm availability and get back to you within one business day.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your name *"><input className={inputCls} required onChange={set('name')} /></Field>
            <Field label="Company"><input className={inputCls} onChange={set('company')} /></Field>
            <Field label="Email *"><input type="email" className={inputCls} required onChange={set('email')} /></Field>
            <Field label="Phone"><input className={inputCls} onChange={set('phone')} /></Field>
          </div>
          <Field label="Jobsite address *"><input className={inputCls} required onChange={set('site_address')} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Start date *"><input type="date" className={inputCls} required onChange={set('start_date')} /></Field>
            <Field label="End date *"><input type="date" className={inputCls} required onChange={set('end_date')} /></Field>
            <Field label="Linear feet"><input type="number" className={inputCls} onChange={set('footage')} /></Field>
          </div>
          <Field label="Notes"><textarea className={inputCls} rows={3} onChange={set('notes')} placeholder="Gates needed, terrain, timeline…" /></Field>
          <button className={btnCls + ' w-full'} disabled={busy}>{busy ? 'Sending…' : 'Request Quote'}</button>
          <p className="text-center text-xs text-gray-400">No account needed. We'll reply with pricing and availability.</p>
        </form>
      )}
    </div>
  )
}
