import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Bot, Send, Info, Sparkles, Trash2 } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { aiChatApi } from '@/lib/api'
import Button from '@/components/ui/Button'

export default function AIChatPage() {
  const { locale } = useTranslation()
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<'en' | 'ta' | 'hi'>(locale as 'en' | 'ta' | 'hi')
  const containerRef = useRef<HTMLDivElement>(null)

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)
    
    try {
      const result = await aiChatApi.send(userMessage, language)
      setMessages(prev => [...prev, { role: 'ai', content: result.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }])
    } finally {
      setLoading(false)
      setTimeout(() => {
        containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Incomiq AI Chat</h1>
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                BETA
              </span>
            </div>
            <p className="text-gray-500 text-sm">Your personal AI financial advisor</p>
          </div>
        </div>
        
        {messages.length > 0 && (
          <Button variant="outline" icon={<Trash2 className="w-4 h-4" />} onClick={clearChat}>
            Clear Chat
          </Button>
        )}
      </motion.div>

      {/* Beta Notice */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-red-50 border-2 border-red-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Under Development for Judges</p>
            <p className="text-xs text-red-600 mt-1">
              This feature is in beta. The AI uses your real financial data (income, expenses, goals) to provide personalized advice.
              Supports English, Tamil (தமிழ்), and Hindi (हिंदी).
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden"
      >
        {/* Language Selector */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-medium text-gray-600">Chat Language:</span>
          <div className="flex gap-2">
            {[
              { value: 'en' as const, label: 'English', emoji: '🇬🇧' },
              { value: 'ta' as const, label: 'தமிழ்', emoji: '🇮🇳' },
              { value: 'hi' as const, label: 'हिंदी', emoji: '🇮🇳' },
            ].map((lang) => (
              <button
                key={lang.value}
                onClick={() => setLanguage(lang.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                  language === lang.value
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                }`}
              >
                <span>{lang.emoji}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div
          ref={containerRef}
          className="h-[450px] overflow-y-auto p-5 space-y-4 scroll-smooth"
        >
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full text-gray-400"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4 shadow-lg shadow-purple-200/50">
                <Bot className="w-10 h-10 text-purple-500" />
              </div>
              <p className="text-lg font-semibold text-gray-700">Hi! I'm Incomiq AI</p>
              <p className="text-sm text-center max-w-sm mt-2 text-gray-500">
                Ask me about your income, expenses, savings goals, or get personalized financial advice!
              </p>
              <p className="text-xs mt-3 text-gray-400">
                मुझसे हिंदी में पूछें | தமிழில் கேளுங்கள்
              </p>
              
              {/* Quick Prompts */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  'How much did I spend this month?',
                  'What are my top expenses?',
                  'How can I save more money?',
                  'Am I on track with my goals?'
                ].map((prompt, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => setInput(prompt)}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 text-xs rounded-full transition-all duration-300 border border-purple-200/50 hover:border-purple-300 hover:shadow-md"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-br-md shadow-purple-200/50'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
                }`}
              >
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-2">
                    <Bot className="w-3.5 h-3.5" />
                    <span className="font-medium">Incomiq AI</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 px-5 py-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Input */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={
                language === 'en' ? 'Ask about your finances...' :
                language === 'ta' ? 'உங்கள் நிதி பற்றி கேளுங்கள்...' :
                'अपने वित्त के बारे में पूछें...'
              }
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 bg-white"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 disabled:shadow-none disabled:scale-100 active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            AI uses your real income & expense data. Powered by Groq Llama 3.3.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
