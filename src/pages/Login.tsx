import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { btnCls, inputCls, Field } from '../components/ui'
import { Fence } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [name, setName] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const submit = async (e: any) => {
    e.preventDefault(); setBusy(true); setErr('')
    const { error } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name } } })
    if (error) setErr(error.message); else window.location.href = '/'
    setBusy(false)
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2 text-2xl font-extrabold"><Fence className="text-brand" /> FenceFlow</div>
        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && <Field label="Full name"><input className={inputCls} value={name} onChange={e => setName(e.target.value)} required /></Field>}
          <Field label="Email"><input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required /></Field>
          <Field label="Password"><input type="password" className={inputCls} value={pw} onChange={e => setPw(e.target.value)} required /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className={btnCls + ' w-full'} disabled={busy}>{mode === 'signin' ? 'Sign in' : 'Create account'}</button>
        </form>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="mt-3 w-full rounded-lg border py-2 text-sm font-semibold hover:bg-gray-50">Continue with Google</button>
        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-ink">
          {mode === 'signin' ? "Need an account? Sign up" : 'Have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
