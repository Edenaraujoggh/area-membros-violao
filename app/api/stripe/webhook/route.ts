import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature!, webhookSecret)
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  // Pagamento aprovado!
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    
    const userId = session.metadata?.userId
    const plano = session.metadata?.plano
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    if (userId) {
      const { error } = await supabaseAdmin
        .from('assinaturas')
        .upsert({
          user_id: userId,
          status: 'ativo',
          plano: plano,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          ativado_em: new Date().toISOString(),
          expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) {
        console.error('Erro ao atualizar assinatura:', error)
      } else {
        console.log('✅ Assinatura ativada:', userId)
      }
    }
  }

  return NextResponse.json({ received: true })
}