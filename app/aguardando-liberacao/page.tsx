'use client'

import { useRouter } from 'next/navigation'
import { Clock, MessageCircle, Mail } from 'lucide-react'

export default function AguardandoLiberacao() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl border border-gray-700 p-8 text-center">
        
        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-orange-500" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Quase lá! ⏳
        </h1>

        <p className="text-gray-400 mb-6">
          Seu cadastro foi realizado com sucesso! Estamos aguardando a confirmação do pagamento para liberar seu acesso.
        </p>

        <div className="bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Próximos passos:</strong>
          </p>
          <ul className="text-sm text-gray-400 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Entre em contato pelo WhatsApp para realizar o pagamento
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Assim que confirmarmos, você receberá acesso imediato
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <a 
           href="https://wa.me/5569993668783"
            target="_blank"
            className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chamar no WhatsApp
          </a>

          <button 
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Mail className="w-5 h-5" />
            Voltar para Login
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Dúvidas? Envie um email para musicainfor34@gmail.com
        </p>
      </div>
    </div>
  )
}