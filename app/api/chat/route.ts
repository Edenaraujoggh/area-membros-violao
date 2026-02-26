import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { message, userId } = await req.json()

    if (!message || !userId) {
      return NextResponse.json({ error: 'Dados faltando' }, { status: 400 })
    }

    // Client Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar histórico
    const { data: history } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Configurar modelo (ele escolhe o melhor disponível)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Você é um professor de violão experiente, paciente e encourajador. 
Ajude alunos iniciantes com dicas práticas de violão, acordes, batidas e técnica. 
Use emojis 🎸 quando apropriado e mantenha respostas curtas (máximo 2-3 parágrafos).`
    })

    // Montar conversa
    const chat = model.startChat({
      history: [
        ...(history?.reverse().map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })) || []),
      ]
    })

    // Gerar resposta
    const result = await chat.sendMessage(message)
    const fullResponse = result.response.text()

    // Salvar no Supabase
    await supabase.from('chat_messages').insert([
      { user_id: userId, content: message, role: 'user' },
      { user_id: userId, content: fullResponse, role: 'assistant' }
    ])

    return NextResponse.json({ response: fullResponse })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
  }
}