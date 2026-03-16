'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, User, Circle, MoreVertical, Phone, Video, Paperclip, Smile } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  receiverId: string
  createdAt: string
}

interface User {
  id: string
  username: string
  online?: boolean
}

const MOCK_USERS: User[] = [
  { id: '1', username: 'Kayou Code', online: true },
  { id: '2', username: 'Aimar', online: true },
  { id: '3', username: 'Berenice', online: false },
  { id: '4', username: 'Elite ICT', online: true },
]

export default function Home() {
  const [selectedUser, setSelectedUser] = useState<User | null>(MOCK_USERS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [currentUserId] = useState('2') // Aimar
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load messages from localStorage or API
    const saved = localStorage.getItem(`messages-${currentUserId}-${selectedUser?.id}`)
    if (saved) {
      setMessages(JSON.parse(saved))
    }
  }, [selectedUser, currentUserId])

  useEffect(() => {
    // Save messages to localStorage
    if (selectedUser && messages.length > 0) {
      localStorage.setItem(`messages-${currentUserId}-${selectedUser.id}`, JSON.stringify(messages))
    }
  }, [messages, selectedUser, currentUserId])

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!inputValue.trim() || !selectedUser) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      senderId: currentUserId,
      receiverId: selectedUser.id,
      createdAt: new Date().toISOString(),
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue('')

    // Simulate response after 1-2 seconds
    if (selectedUser.id === '1') { // Kayou Code
      setTimeout(() => {
        const response: Message = {
          id: (Date.now() + 1).toString(),
          content: getAutoResponse(inputValue.trim()),
          senderId: selectedUser.id,
          receiverId: currentUserId,
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, response])
      }, 1000 + Math.random() * 1000)
    }
  }

  const getAutoResponse = (msg: string): string => {
    const lower = msg.toLowerCase()
    if (lower.includes('hello') || lower.includes('hey')) return "Hey! 👋 What's up?"
    if (lower.includes('build') || lower.includes('code')) return "Let's build something cool. What's the plan?"
    if (lower.includes('help')) return "I'm here. What do you need?"
    return "Got it. Let me think about that..."
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredMessages = messages.filter(
    m => (m.senderId === currentUserId && m.receiverId === selectedUser?.id) ||
         (m.senderId === selectedUser?.id && m.receiverId === currentUserId)
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[280px] bg-surface border-r border-border flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight flex items-center gap-2">
            <span className="w-8 h-8 bg-text-primary text-background rounded-lg flex items-center justify-center text-sm font-bold">
              K
            </span>
            Kayou
          </h1>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto py-2">
          {MOCK_USERS.filter(u => u.id !== currentUserId).map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-surface-hover transition-colors ${
                selectedUser?.id === user.id ? 'bg-surface-hover' : ''
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-text-secondary" />
                </div>
                {user.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-surface" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-text-primary">{user.username}</p>
                <p className="text-xs text-text-secondary">
                  {user.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Current User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Aimar</p>
              <p className="text-xs text-text-secondary">You</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-surface/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-border rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-text-secondary" />
                  </div>
                  {selectedUser.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">{selectedUser.username}</h2>
                  <p className="text-xs text-text-secondary">
                    {selectedUser.online ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <Phone className="w-5 h-5 text-text-secondary" />
                </button>
                <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <Video className="w-5 h-5 text-text-secondary" />
                </button>
                <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-secondary text-sm">
                    No messages yet. Say hello to {selectedUser.username}!
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => {
                  const isOwn = msg.senderId === currentUserId
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} message-enter`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                          isOwn
                            ? 'bg-message-out text-text-primary'
                            : 'bg-message-in text-text-primary'
                        }`}
                      >
                        <p className="text-[15px] leading-relaxed">{msg.content}</p>
                        <p className={`text-[11px] mt-1 text-right ${
                          isOwn ? 'text-text-secondary' : 'text-text-secondary'
                        }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-surface/30">
              <div className="flex items-end gap-3">
                <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-text-secondary" />
                </button>
                <div className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    className="w-full bg-transparent text-text-primary placeholder-text-secondary text-[15px] resize-none focus:outline-none"
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                  />
                </div>
                <button className="p-2 hover:bg-surface-hover rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-text-secondary" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className="p-3 bg-text-primary text-background rounded-xl hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-text-secondary" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Kayou Chat</h2>
              <p className="text-text-secondary">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
