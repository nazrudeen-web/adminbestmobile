'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { Send, Loader, Brain, Zap, Trash2 } from 'lucide-react'

export function AiAssistant({ context = 'mobile specifications' }) {
  const { toast } = useToast()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiSource, setAiSource] = useState(null)
  const [tokenCount, setTokenCount] = useState({ used: 0, total: 50000 })
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
        tokens: data.usage?.total_tokens || data.usage?.input_tokens || 0
      }

      setMessages(prev => [...prev, assistantMessage])
      setAiSource(data.source)

      // Update token count for Claude
      if (data.source === 'claude' && data.usage?.total_tokens) {
        setTokenCount(prev => ({
          ...prev,
          used: prev.used + data.usage.total_tokens
        }))
      }

      toast({
        title: 'Success',
        description: `Response from ${data.source === 'claude' ? 'Claude' : 'Groq'} (${data.usage?.total_tokens || '?'} tokens)`
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
      setTokenCount({ ...tokenCount, used: 0 })
    }
  }

  const remainingTokens = tokenCount.total - tokenCount.used
  const tokenPercentage = (tokenCount.used / tokenCount.total) * 100

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle>AI Assistant (Claude + Groq)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {aiSource && (
              <span className="text-xs px-3 py-1 rounded-full bg-white border">
                {aiSource === 'claude' ? (
                  <>
                    <Brain className="h-3 w-3 inline mr-1" />
                    Claude (Quality)
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 inline mr-1" />
                    Groq (Fast)
                  </>
                )}
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ask questions about mobile specifications, data formatting, or get analysis help
        </p>
      </CardHeader>

      <CardContent className="p-0 flex flex-col h-[600px]">
        {/* Token Usage Bar */}
        <div className="px-4 pt-3 pb-2 border-b bg-gray-50">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-semibold">Claude Free Tier Usage</span>
            <span className="text-muted-foreground">
              {tokenCount.used.toLocaleString()} / {tokenCount.total.toLocaleString()} tokens
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                tokenPercentage > 80 ? 'bg-red-500' : tokenPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(tokenPercentage, 100)}%` }}
            />
          </div>
          {remainingTokens <= 1000 && tokenCount.used > 0 && (
            <p className="text-xs text-red-600 mt-1">
              ⚠️ Low tokens! {remainingTokens.toLocaleString()} remaining
            </p>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <Brain className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-lg font-semibold">AI Assistant Ready</p>
              <p className="text-sm max-w-xs mt-2">
                Ask me to help with mobile specifications, data formatting, analysis, or any mobile phone questions
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : msg.role === 'error'
                        ? 'bg-red-100 text-red-800 rounded-bl-none'
                        : 'bg-gray-100 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center justify-between mt-2 text-xs gap-2">
                      {msg.source && (
                        <span className="opacity-70">
                          {msg.source === 'claude' ? '🧠 Claude' : '⚡ Groq'}
                        </span>
                      )}
                      {msg.tokens && (
                        <span className="opacity-70">{msg.tokens} tokens</span>
                      )}
                      <span className="opacity-70">
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
                  <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none">
                    <div className="flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-600">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-gray-50 space-y-3">
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
              placeholder="Ask about mobile specs, data formatting, or any mobile phone question..."
              disabled={loading}
              className="text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-between items-center text-xs">
            <div className="flex gap-2">
              <span className="text-muted-foreground">
                {messages.length} messages
              </span>
              {messages.length > 0 && (
                <Button
                  onClick={clearChat}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <div className="text-muted-foreground">
              Shift+Enter for new line
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
