import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Boxes, Users, Truck, Calendar, CreditCard, Shield, LogOut, Fence } from 'lucide-react'
import { supabase } from '../lib/supabase'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders', label: 'Orders', icon: ClipboardList },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/dispatch', label: 'Dispatch', icon: Truck },
  { to: '/calendar', label: 'Calendar', icon: Calendar },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin', label: 'Admin', icon: Shield },
]

export default function Layout({ profile }: { profile: any }) {
  const navigate = useNavigate()
  const items = profile?.role === 'admin' ? nav : nav.filter(n => ['/', '/dispatch', '/calendar'].includes(n.to))
  return (
    <div className="flex min-h-screen">
      <aside className="no-print fixed inset-y-0 hidden w-56 flex-col bg-ink text-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5 text-lg font-extrabold">
          <Fence className="text-brand" size={22} /> FenceFlow
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand text-ink' : 'text-gray-300 hover:bg-white/10'}`}>
              <Icon size={17} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm">
          <div className="font-semibold">{profile?.full_name || 'User'}</div>
          <div className="text-xs text-gray-400 capitalize">{profile?.role}</div>
          <button onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
            className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-white"><LogOut size={14} /> Sign out</button>
        </div>
      </aside>
      <nav className="no-print fixed bottom-0 z-40 flex w-full justify-around border-t bg-white py-2 md:hidden">
        {items.slice(0, 5).map(({ to, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'text-brand' : 'text-gray-400'}>
            <Icon size={22} />
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-4 pb-20 md:ml-56 md:p-8 md:pb-8"><Outlet /></main>
    </div>
  )
}
