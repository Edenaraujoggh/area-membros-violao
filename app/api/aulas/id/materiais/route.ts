import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Listar materiais da aula
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: materiais, error } = await supabase
      .from('materiais')
      .select('*')
      .eq('aula_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Gerar URLs assinadas para download (válidas por 1 hora)
    const materiaisComUrl = await Promise.all(
      materiais.map(async (material) => {
        const { data: urlData } = await supabase
          .storage
          .from('materiais')
          .createSignedUrl(material.arquivo_path, 3600)
        
        return {
          ...material,
          download_url: urlData?.signedUrl || null
        }
      })
    )

    return NextResponse.json({ materiais: materiaisComUrl })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar materiais' }, 
      { status: 500 }
    )
  }
}

// POST - Upload de novo material
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const nome = formData.get('nome') as string

    if (!file) {
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    }

    // Upload para Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${params.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('materiais')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    // Salvar referência no banco
    const { data: material, error: dbError } = await supabase
      .from('materiais')
      .insert({
        aula_id: params.id,
        nome: nome || file.name,
        arquivo_path: fileName,
        tipo: fileExt?.toLowerCase() || 'arquivo',
        tamanho: file.size
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ material }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao fazer upload' }, 
      { status: 500 }
    )
  }
}

// DELETE - Remover material
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const materialId = searchParams.get('materialId')

    if (!materialId) {
      return NextResponse.json({ error: 'ID do material não fornecido' }, { status: 400 })
    }

    // Buscar path do arquivo
    const { data: material } = await supabase
      .from('materiais')
      .select('arquivo_path')
      .eq('id', materialId)
      .single()

    if (material) {
      // Deletar do Storage
      await supabase.storage.from('materiais').remove([material.arquivo_path])
    }

    // Deletar do banco
    await supabase.from('materiais').delete().eq('id', materialId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao deletar' }, 
      { status: 500 }
    )
  }
}