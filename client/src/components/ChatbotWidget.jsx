import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../api'

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: "👋 Hi! I'm the AIO FileFlow assistant. Ask me anything about our tools — file conversions, PDF editing, image processing, and more! How can I help you today?",
}

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([WELCOME_MESSAGE])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200)
        }
    }, [isOpen])

    const handleSend = async () => {
        const trimmed = input.trim()
        if (!trimmed || loading) return

        const userMsg = { role: 'user', content: trimmed }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            // Send history without the welcome message
            const history = messages.filter((m) => m !== WELCOME_MESSAGE)
            const data = await sendChatMessage(trimmed, history)
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: data.reply },
            ])
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <>
            {/* Chat Panel */}
            {isOpen && (
                <div style={styles.panel}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div style={styles.headerLeft}>
                            <div style={styles.headerDot}></div>
                            <span style={styles.headerTitle}>AIO FileFlow Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesContainer}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.messageBubble,
                                    ...(msg.role === 'user'
                                        ? styles.userBubble
                                        : styles.botBubble),
                                }}
                            >
                                {msg.role === 'assistant' && (
                                    <span style={styles.botIcon}>🤖</span>
                                )}
                                <div
                                    style={{
                                        ...styles.messageText,
                                        ...(msg.role === 'user'
                                            ? styles.userText
                                            : styles.botText),
                                    }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ ...styles.messageBubble, ...styles.botBubble }}>
                                <span style={styles.botIcon}>🤖</span>
                                <div style={{ ...styles.messageText, ...styles.botText }}>
                                    <span style={styles.typingDots}>
                                        <span style={styles.dot}>●</span>
                                        <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                                        <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={styles.inputContainer}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about our tools..."
                            style={styles.input}
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{
                                ...styles.sendBtn,
                                opacity: loading || !input.trim() ? 0.5 : 1,
                            }}
                        >
                            ➤
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    ...styles.fab,
                    ...(isOpen ? styles.fabOpen : {}),
                }}
                aria-label="Toggle chatbot"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Keyframe animation styles */}
            <style>{`
        @keyframes chatbot-dot-pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes chatbot-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatbot-fab-pulse {
          0% { box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 4px 32px rgba(99, 102, 241, 0.7); }
          100% { box-shadow: 0 4px 24px rgba(99, 102, 241, 0.4); }
        }
      `}</style>
        </>
    )
}

const styles = {
    fab: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
        color: '#fff',
        fontSize: '28px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 4px 24px rgba(99, 102, 241, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: 'chatbot-fab-pulse 3s ease-in-out infinite',
    },
    fabOpen: {
        background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
        boxShadow: '0 4px 24px rgba(239, 68, 68, 0.5)',
        animation: 'none',
        transform: 'rotate(90deg)',
    },
    panel: {
        position: 'fixed',
        bottom: '96px',
        right: '24px',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        height: '520px',
        maxHeight: 'calc(100vh - 140px)',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        animation: 'chatbot-slide-up 0.3s ease-out',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.15)',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    headerDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        background: '#22c55e',
        boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
    },
    headerTitle: {
        color: '#fff',
        fontSize: '15px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },
    closeBtn: {
        background: 'rgba(255,255,255,0.15)',
        border: 'none',
        color: '#fff',
        fontSize: '16px',
        cursor: 'pointer',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    messageBubble: {
        display: 'flex',
        gap: '8px',
        maxWidth: '88%',
        animation: 'chatbot-slide-up 0.2s ease-out',
    },
    userBubble: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    botBubble: {
        alignSelf: 'flex-start',
    },
    botIcon: {
        fontSize: '20px',
        flexShrink: 0,
        marginTop: '2px',
    },
    messageText: {
        padding: '10px 14px',
        borderRadius: '16px',
        fontSize: '14px',
        lineHeight: '1.5',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    },
    userText: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        borderBottomRightRadius: '4px',
    },
    botText: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottomLeftRadius: '4px',
    },
    typingDots: {
        display: 'inline-flex',
        gap: '4px',
        alignItems: 'center',
    },
    dot: {
        display: 'inline-block',
        animation: 'chatbot-dot-pulse 1.4s ease-in-out infinite',
        fontSize: '10px',
        color: '#8b5cf6',
    },
    inputContainer: {
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15, 23, 42, 0.8)',
    },
    input: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        background: 'rgba(255,255,255,0.06)',
        color: '#e2e8f0',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    sendBtn: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        width: '44px',
        height: '44px',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s, transform 0.15s',
        flexShrink: 0,
    },
}
