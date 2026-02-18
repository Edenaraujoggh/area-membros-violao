import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    const fileName = searchParams.get('name') || 'download.pdf'

    if (!filePath) {
      return NextResponse.json({ error: 'Caminho não fornecido' }, { status: 400 })
    }

    // Gera URL assinada do Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from('materiais')
      .createSignedUrl(filePath, 60)

    if (error || !data?.signedUrl) {
      throw new Error('Não foi possível gerar link')
    }

    return NextResponse.redirect(data.signedUrl)

  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao acessar arquivo' }, { status: 500 })
  }
}