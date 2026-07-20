import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls, btnCls, Field } from '../components/ui'
import { Fence } from 'lucide-react'

const STATES = ['CO','AZ','CA','ID','KS','MT','NE','NM','NV','OK','TX','UT','WY']
const PANEL_FT = 12

export default function Book() {
  const [f, setF] = useState<any>({ fence_type: 'panels', fence_height: '6', opt_gates: false, opt_windscreen: false })
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [avail, setAvail] = useState<number | null>(null)
  useEffect(() => { supabase.rpc('panel_availability').then(({ data }) => setAvail(data)) }, [])
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const panelsNeeded = f.footage ? Math.ceil(Number(f.footage) / PANEL_FT) : 0
  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true)
    const { error } = await supabase.rpc('submit_booking', { p: f })
    setBusy(false)
    if (error) return alert(error.message)
    setDone(true)
  }
  const radio = (k: string, v: string, l: string) => (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${f[k] === v ? 'border-brand bg-brand/10' : 'border-gray-300'}`}>
      <input type="radio" className="accent-[#00D084]" checked={f[k] === v} onChange={() => setF({ ...f, [k]: v })} />{l}
    </label>)
  const check = (k: string, l: string) => (
    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${f[k] ? 'border-brand bg-brand/10' : 'border-gray-300'}`}>
      <input type="checkbox" className="accent-[#00D084]" checked={!!f[k]} onChange={set(k)} />{l}
    </label>)
  if (done) return (
    <div className="mx-auto max-w-xl p-4 md:p-8">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mb-2 text-3xl">✅</div>
        <h2 className="text-lg font-bold">Quote request received</h2>
        <p className="mt-2 text-sm text-gray-500">We'll confirm availability and pricing within one business day.</p>
      </div>
    </div>)
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xl font-extrabold"><Fence className="text-brand" /> Temporary Fence Quote</div>
      <form onSubmit={submit} className="grid gap-6 md:grid-cols-5">
        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-bold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">1</span>Fence Details</h2>
          <Field label="Linear feet *"><input type="number" min="1" className={inputCls} required value={f.footage ?? ''} onChange={set('footage')} /></Field>
          {panelsNeeded > 0 && <p className="text-xs text-gray-500">≈ {panelsNeeded} panels{avail !== null && (panelsNeeded <= avail
            ? <span className="font-semibold text-emerald-600"> · in stock for your dates</span>
            : <span className="font-semibold text-amber-600"> · high demand — we'll confirm availability</span>)}</p>}
          <div><div className="mb-1 text-sm font-medium text-gray-700">Fence type</div>
            <div className="flex gap-2">{radio('fence_type', 'chain_link', 'Chain Link')}{radio('fence_type', 'panels', 'Fence Panels')}</div></div>
          <div><div className="mb-1 text-sm font-medium text-gray-700">Fence height</div>
            <div className="flex gap-2">{radio('fence_height', '6', "6'")}{radio('fence_height', '8', "8'")}</div></div>
          <div><div className="mb-1 text-sm font-medium text-gray-700">Options</div>
            <div className="flex gap-2">{check('opt_windscreen', 'Windscreen')}{check('opt_gates', 'Gates')}</div></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date *"><input type="date" className={inputCls} required onChange={set('start_date')} /></Field>
            <Field label="End date *"><input type="date" className={inputCls} required onChange={set('end_date')} /></Field>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm md:col-span-3">
          <h2 className="font-bold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">2</span>Request a Quote</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name *"><input className={inputCls} required onChange={set('first_name')} /></Field>
            <Field label="Last name *"><input className={inputCls} required onChange={set('last_name')} /></Field>
          </div>
          <Field label="Company"><input className={inputCls} onChange={set('company')} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone number *"><input type="tel" className={inputCls} required onChange={set('phone')} /></Field>
            <Field label="Email *"><input type="email" className={inputCls} required onChange={set('email')} /></Field>
          </div>
          <Field label="Project address *"><input className={inputCls} required onChange={set('site_address')} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City *"><input className={inputCls} required onChange={set('city')} /></Field>
            <Field label="State *"><select className={inputCls} required value={f.state ?? ''} onChange={set('state')}>
              <option value="">State</option>{STATES.map(s => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Zip *"><input className={inputCls} required onChange={set('zip')} /></Field>
          </div>
          <Field label="Comments"><textarea className={inputCls} rows={3} onChange={set('notes')} placeholder="Site conditions, access, timeline…" /></Field>
          <div className="rounded-lg bg-soft p-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Specifications selected: </span>
            {f.footage ? `${f.footage} linear ft · ` : ''}{f.fence_type === 'panels' ? 'Fence Panels' : 'Chain Link'} · {f.fence_height}'
            {f.opt_gates ? ' · Gates' : ''}{f.opt_windscreen ? ' · Windscreen' : ''}
          </div>
          <button className={btnCls + ' w-full'} disabled={busy}>{busy ? 'Sending…' : 'Send It'}</button>
          <p className="text-center text-xs text-gray-400">No account needed. We'll reply with pricing and availability.</p>
        </div>
      </form>
    </div>
  )
}
