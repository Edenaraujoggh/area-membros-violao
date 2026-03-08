import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
 apiVersion: '2026-02-25.clover'
})

export async function POST(request: Request) {
  try {
    const { userId, email, nome, plano } = await request.json()

    // Preços em centavos (R$ 49,90 = 4990)
    const precos: Record<string, number> = {
      'mensal': 4990,
      'trimestral': 12990,
      'anual': 39990
    }

    const preco = precos[plano] || 4990

    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Curso de Violão - Plano ${plano}`,
              description: `Acesso completo por ${plano}`,
            },
            unit_amount: preco,
            recurring: {
              interval: plano === 'mensal' ? 'month' : plano === 'trimestral' ? 'month' : 'year',
              interval_count: plano === 'trimestral' ? 3 : 1
            }
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '') || 'http://localhost:3000'}/dashboard?canceled=true`,
      metadata: {
        userId: userId,
        plano: plano
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Erro Stripe:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}