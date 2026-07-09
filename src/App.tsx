import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Inventory from './pages/Inventory'
import Customers from './pages/Customers'
import Dispatch from './pages/Dispatch'
import CalendarPage from './pages/CalendarPage'
import Payments from './pages/Payments'
import Admin from './pages/Admin'
import Book from './pages/Book'
import Portal from './pages/Portal'

export default function App() {
  const [session, setSession] = useState<any>(undefined)
  const [profile, setProfile] = useState<any>(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (session?.user) supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
  }, [session])
  if (session === undefined) return null
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/book" element={<Book />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
        <Route element={session ? <Layout profile={profile} /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/dispatch" element={<Dispatch profile={profile} />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
