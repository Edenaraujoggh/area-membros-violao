'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Loader2, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

interface ViolaoChatProps {
  userId: string
  userName?: string
}

export default function ViolaoChat({ userId, userName }: ViolaoChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Carregar mensagens ao abrir
  useEffect(() => {
    if (isOpen && userId) {
      loadMessages()
      subscribeToNewMessages()
    }
  }, [isOpen, userId])

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) setMessages(data)
  }

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Mensagem temporária do usuário
    const tempId = 'temp-' + Date.now()
    const tempUserMsg: Message = {
      id: tempId,
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, userId })
      })

      if (!response.ok) {
        throw new Error('Erro na resposta da API')
      }

      // Lê a resposta JSON (não streaming)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage = data.response

      // Adiciona mensagem do assistente
      const assistantMsg: Message = {
        id: 'assistant-' + Date.now(),
        content: assistantMessage,
        role: 'assistant',
        created_at: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, assistantMsg])

    } catch (error) {
      console.error('Erro:', error)
      // Remove mensagem temporária em caso de erro
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    "Como fazer o acorde de Lá maior?",
    "Dicas para dedos não doerem",
    "Como fazer batida de balada?",
    "Qual a ordem dos acordes?"
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center gap-2"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="hidden sm:inline font-medium">Tirar dúvida</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-full sm:w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-amber-100 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Professor Virtual 🤖</h3>
            <p className="text-xs opacity-90">Tire suas dúvidas sobre violão</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8 space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Bot className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Olá{userName ? `, ${userName}` : ''}! 👋</p>
              <p className="text-sm mt-1">Sou seu assistente de violão. 🎸</p>
            </div>
            
            <div className="space-y-2 px-4">
              <p className="text-xs text-gray-400 uppercase">Perguntas populares:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(q)}
                    className="text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full hover:bg-amber-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
            }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-md ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-none border border-amber-600'
                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 
            focus:ring-amber-500 text-gray-900 placeholder:text-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          IA pode cometer erros. Verifique informações importantes.
        </p>
      </form>
    </div>
  )
}