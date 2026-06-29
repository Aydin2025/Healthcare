const Stripe = require('stripe')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)

// Currency for this clinic. Change to 'usd', 'gbp', etc. if reusing
// this template elsewhere.
const CURRENCY = 'cad'

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { appointmentId, amountCents, serviceName, successUrl, cancelUrl } = JSON.parse(event.body)

    if (!appointmentId || !amountCents || !serviceName || !successUrl || !cancelUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            product_data: { name: serviceName },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: { appointment_id: appointmentId },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
