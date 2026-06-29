const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

exports.handler = async (event) => {
  const signature = event.headers['stripe-signature']

  // Stripe needs the exact raw request body to verify the signature.
  // Netlify sometimes base64-encodes the body — handle both cases.
  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature verification failed: ${err.message}` }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const appointmentId = session.metadata?.appointment_id

    if (appointmentId) {
      await supabase
        .from('appointments')
        .update({
          payment_status: 'paid_online',
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
        })
        .eq('id', appointmentId)
    }
  }

  return { statusCode: 200, body: 'ok' }
}
