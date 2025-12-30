'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { Send, Loader, Zap, Trash2, X } from 'lucide-react'

export function AiSheet({ isOpen, onClose, context = 'mobile specifications' }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tokenCount, setTokenCount] = useState({ used: 0, total: 0 })
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          context: context
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to get AI response')
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        source: data.source,
        timestamp: new Date(),
        tokens: data.usage?.total_tokens || 0
      }

      setMessages(prev => [...prev, assistantMessage])

      if (data.usage?.total_tokens) {
        setTokenCount(prev => ({
          ...prev,
          used: prev.used + data.usage.total_tokens
        }))
      }

      toast({
        title: 'Success',
        description: `Response from Groq (${data.usage?.total_tokens || '?'} tokens)`
      })
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    if (messages.length > 0 && confirm('Clear all messages?')) {
      setMessages([])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div className="absolute right-0 top-16 h-[calc(100vh-4rem)] w-full max-w-md bg-white shadow-xl flex flex-col border-l border-border/50">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-base">AI Helper</h2>
              <p className="text-xs text-muted-foreground">Write descriptions, articles & content</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Zap className="h-10 w-10 text-gray-300 mb-3" />
              <p className="font-semibold text-sm">AI Writing Assistant</p>
              <p className="text-xs max-w-xs mt-2 leading-relaxed">
                Get help writing:
              </p>
              <ul className="text-xs max-w-xs mt-2 space-y-1 leading-relaxed">
                <li>• Product descriptions</li>
                <li>• Device overviews</li>
                <li>• Marketing content</li>
                <li>• Articles & reviews</li>
                <li>• Comparison text</li>
              </ul>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : msg.role === 'error'
                        ? 'bg-red-100 text-red-800 rounded-bl-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center justify-between mt-1 text-xs gap-2 opacity-70">
                      {msg.source && (
                        <span>⚡ Groq</span>
                      )}
                      {msg.tokens && (
                        <span>{msg.tokens}t</span>
                      )}
                      <span>
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader className="h-3 w-3 animate-spin" />
                      <span className="text-xs text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-3 bg-gray-50 space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Write a product description for iPhone 16 Pro..."
              disabled={loading}
              className="h-9 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="h-9 w-9 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>

          {messages.length > 0 && (
            <Button
              onClick={clearChat}
              variant="ghost"
              size="sm"
              className="h-7 text-xs w-full"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Chat
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
