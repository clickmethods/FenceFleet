// Supabase Edge Function: email notifications via Resend.
// Deploy: supabase functions deploy notify
// Secret: supabase secrets set RESEND_API_KEY=re_xxx
// Call from a DB webhook (Database > Webhooks) on orders/deliveries changes,
// or invoke directly from the app.
Deno.serve(async (req) => {
  const { to, subject, html } = await req.json()
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'FenceFlow <notifications@yourdomain.com>', to, subject, html }),
  })
  return new Response(await r.text(), { status: r.status })
})
