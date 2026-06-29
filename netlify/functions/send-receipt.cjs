const Stripe = require('stripe')
const { createClient } = require('@supabase/supabase-js')
const PDFDocument = require('pdfkit')

const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function generateReceiptPdf(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const buffers = []
    doc.on('data', (chunk) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    doc.font('Helvetica-Bold').fontSize(16).text(data.clinicName || 'Physiotherapy Clinic')
    doc.font('Helvetica').fontSize(10)
    if (data.clinicAddress) doc.text(data.clinicAddress)
    if (data.clinicPhone) doc.text(data.clinicPhone)
    if (data.businessNumber) doc.text(`GST/HST #: ${data.businessNumber}`)
    doc.moveDown(1.5)

    doc.font('Helvetica-Bold').fontSize(14).text('Receipt — Physiotherapy Services')
    doc.moveDown(0.5)
    doc.font('Helvetica').fontSize(10)
    doc.text(`Receipt #: ${data.receiptNumber}`)
    doc.text(`Date issued: ${data.issuedDate}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Patient')
    doc.font('Helvetica').text(data.patientName)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Practitioner')
    doc.font('Helvetica').text(`${data.practitionerName}${data.title ? ', ' + data.title : ''}`)
    if (data.registrationNumber) doc.text(`Registration #: ${data.registrationNumber}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('Service Details')
    doc.font('Helvetica')
    doc.text(`Date of treatment: ${data.treatmentDate}`)
    doc.text(`Description: ${data.serviceName}`)
    doc.text(`Amount charged: $${data.amount}`)
    doc.text(`Amount paid: $${data.amount}`)
    doc.text(`Payment date: ${data.paidDate}`)
    doc.text(`Payment method: ${data.paymentMethodLabel}`)
    doc.moveDown()

    doc.font('Helvetica-Bold').text('PAID IN FULL')
    doc.moveDown(2)

    doc.font('Helvetica-Oblique').fontSize(10).text(data.practitionerName)
    doc.font('Helvetica').fontSize(8).fillColor('#666')
      .text('Electronically generated receipt — no signature required.')

    doc.end()
  })
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { appointmentId } = JSON.parse(event.body)

    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, amount_cents, payment_status, payment_method,
        paid_at, stripe_session_id, patient_id, receipt_number,
        services(name),
        practitioners(registration_number, title, profiles(full_name))
      `)
      .eq('id', appointmentId)
      .single()

    if (apptError || !appt) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Appointment not found' }) }
    }

    const { data: patientProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', appt.patient_id)
      .single()

    const { data: patientUserResult } = await supabase.auth.admin.getUserById(appt.patient_id)
    const patientEmail = patientUserResult?.user?.email

    if (!patientEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No patient email found' }) }
    }

    const { data: clinic } = await supabase.from('clinic_settings').select('*').limit(1).maybeSingle()

    // Work out a human-friendly payment method label.
    // Never show full card numbers — only brand + last 4, and only for
    // online payments where Stripe actually gives us that detail.
    let paymentMethodLabel = 'Cash'
    if (appt.payment_status === 'paid_online') {
      paymentMethodLabel = 'Credit Card'
      try {
        const session = await stripe.checkout.sessions.retrieve(appt.stripe_session_id, {
          expand: ['payment_intent.payment_method'],
        })
        const card = session.payment_intent?.payment_method?.card
        if (card) {
          paymentMethodLabel = `Credit Card (${card.brand.toUpperCase()} ending in ${card.last4})`
        }
      } catch (e) {
        console.error('Could not fetch Stripe card details:', e.message)
      }
    } else if (appt.payment_method === 'stripe' || appt.payment_method === 'square') {
      paymentMethodLabel = 'Credit Card'
    } else if (appt.payment_method === 'cash') {
      paymentMethodLabel = 'Cash'
    } else if (appt.payment_method === 'other') {
      paymentMethodLabel = 'Other'
    }

    const receiptNumber = appt.receipt_number || `RCPT-${appt.id.slice(0, 8).toUpperCase()}`

    const pdfBuffer = await generateReceiptPdf({
      clinicName: clinic?.clinic_name,
      clinicAddress: clinic?.address,
      clinicPhone: clinic?.phone,
      businessNumber: clinic?.business_number,
      receiptNumber,
      issuedDate: new Date().toLocaleDateString(),
      patientName: patientProfile?.full_name || 'Patient',
      practitionerName: appt.practitioners?.profiles?.full_name || 'Practitioner',
      title: appt.practitioners?.title,
      registrationNumber: appt.practitioners?.registration_number,
      treatmentDate: appt.appointment_date,
      serviceName: appt.services?.name || 'Physiotherapy treatment',
      amount: (appt.amount_cents / 100).toFixed(2),
      paidDate: appt.paid_at ? new Date(appt.paid_at).toLocaleDateString() : new Date().toLocaleDateString(),
      paymentMethodLabel,
    })

    const base64Pdf = pdfBuffer.toString('base64')

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RECEIPT_FROM_EMAIL || 'onboarding@resend.dev',
        to: patientEmail,
        subject: `Your Receipt — ${receiptNumber}`,
        html: `<p>Hi ${patientProfile?.full_name || ''},</p><p>Thanks for your visit. Your receipt is attached for your records or insurance claim.</p>`,
        attachments: [
          {
            filename: `${receiptNumber}.pdf`,
            content: base64Pdf,
          },
        ],
      }),
    })

    if (!emailResponse.ok) {
      const errText = await emailResponse.text()
      throw new Error(`Resend error: ${errText}`)
    }

    await supabase
      .from('appointments')
      .update({ receipt_number: receiptNumber, receipt_sent_at: new Date().toISOString() })
      .eq('id', appointmentId)

    return { statusCode: 200, body: JSON.stringify({ success: true, receiptNumber }) }
  } catch (err) {
    console.error('send-receipt error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
