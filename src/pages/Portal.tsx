import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls, btnCls, Field, Badge } from '../components/ui'
import { usd, fdate } from '../lib/format'
import { Fence } from 'lucide-react'

export default function Portal() {
  const [email, setEmail] = useState('')
  const [num, setNum] = useState('')
  const [o, setO] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const lookup = async (e: any) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { data, error } = await supabase.rpc('portal_lookup', { p_email: email, p_order: Number(num) })
    setBusy(false)
    if (error) return setErr(error.message)
    if (!data) return setErr('No order found for that email and order number.')
    setO(data)
  }
  const payBalance = async () => {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: { amount: o.balance, order_number: o.order_number, success_url: window.location.href.split('?')[0] + '?paid=1' },
    })
    setBusy(false)
    if (error || !data?.url) return alert('Online payment is not available yet — please contact us to pay your balance.')
    window.location.href = data.url
  }
  return (
    <div className="mx-auto max-w-xl p-4 md:p-8">
      <div className="mb-6 flex items-center gap-2 text-xl font-extrabold"><Fence className="text-brand" /> Customer Portal</div>
      {!o ? (
        <form onSubmit={lookup} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Look up your rental with the email on file and your order number (on your invoice or confirmation email).</p>
          <Field label="Email"><input type="email" className={inputCls} required value={email} onChange={e => setEmail(e.target.value)} /></Field>
          <Field label="Order number"><input type="number" className={inputCls} required value={num} onChange={e => setNum(e.target.value)} /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className={btnCls + ' w-full'} disabled={busy}>{busy ? 'Looking up…' : 'View my rental'}</button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Order #{o.order_number}</h2>
              <Badge status={o.status} />
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div>{o.customer}</div>
              <div>{o.site_address}</div>
              <div>{fdate(o.start_date)} → {fdate(o.end_date)} ({o.days} days)</div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-bold">Charges</h3>
            {o.lines.map((l: any, i: number) => (
              <div key={i} className="flex justify-between border-t py-1.5 text-sm"><span>{l.unit} ({l.category})</span><span>{usd(Number(l.rate) * o.days)}</span></div>))}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Rental</span><span>{usd(o.rental)}</span></div>
              {Number(o.waiver) > 0 && <div className="flex justify-between"><span>Damage waiver</span><span>{usd(o.waiver)}</span></div>}
              <div className="flex justify-between"><span>Tax</span><span>{usd(o.tax)}</span></div>
              <div className="flex justify-between"><span>Fuel fee</span><span>{usd(o.fuel_fee)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold"><span>Total</span><span>{usd(o.total)}</span></div>
              <div className="flex justify-between text-emerald-700"><span>Paid</span><span>{usd(o.paid)}</span></div>
              <div className="flex justify-between text-base font-bold"><span>Balance due</span><span>{usd(o.balance)}</span></div>
            </div>
            {Number(o.balance) > 0 && <button className={btnCls + ' mt-4 w-full'} onClick={payBalance} disabled={busy}>{busy ? 'Opening checkout…' : `Pay ${usd(o.balance)} online`}</button>}
          </div>
          <button className="w-full text-center text-sm text-gray-400 hover:text-ink" onClick={() => setO(null)}>← Look up another order</button>
        </div>
      )}
    </div>
  )
}
