import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { inputCls } from '../components/ui'

export default function Admin() {
  const [users, setUsers] = useState<any[]>([])
  const load = () => supabase.from('profiles').select('*').order('created_at').then(({ data }) => setUsers(data ?? []))
  useEffect(() => { load() }, [])
  const setRole = async (id: string, role: string) => { await supabase.from('profiles').update({ role }).eq('id', id); load() }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-bold">Users & permissions</h2>
        <p className="mb-4 text-sm text-gray-500">New signups default to Driver. Promote teammates to Admin here. Invite users by having them sign up at your app URL.</p>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400"><th className="pb-2">Name</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-t">
              <td className="py-2 font-semibold">{u.full_name || '—'}</td>
              <td><select className={inputCls + ' w-32'} value={u.role} onChange={e => setRole(u.id, e.target.value)}>
                <option value="admin">Admin</option><option value="driver">Driver</option></select></td>
              <td>{new Date(u.created_at).toLocaleDateString()}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
