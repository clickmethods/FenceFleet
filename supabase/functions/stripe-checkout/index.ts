// Stripe Checkout for portal balance payments.
// Deploy: supabase functions deploy stripe-checkout --no-verify-jwt
// Secret: supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
Deno.serve(async (req) => {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const { amount, order_number, success_url } = await req.json()
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][product_data][name]': `FenceFlow Order #${order_number} balance`,
    'line_items[0][price_data][unit_amount]': String(Math.round(Number(amount) * 100)),
    'line_items[0][quantity]': '1',
    success_url: success_url ?? 'https://example.com/portal?paid=1',
    cancel_url: success_url ?? 'https://example.com/portal',
  })
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const session = await r.json()
  return new Response(JSON.stringify({ url: session.url, error: session.error?.message }), { headers: { ...cors, 'Content-Type': 'application/json' } })
})
