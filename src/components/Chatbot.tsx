import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

function parseInline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4)
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2)
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2)
      return <code key={i} className="px-1 rounded font-mono text-[11px] bg-black/10">{part.slice(1, -1)}</code>;
    return part;
  });
}

function MsgContent({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      listType === 'ol'
        ? <ol key={nodes.length} className="list-decimal pl-4 space-y-0.5 my-1">{[...listItems]}</ol>
        : <ul key={nodes.length} className="list-disc pl-4 space-y-0.5 my-1">{[...listItems]}</ul>
    );
    listItems = [];
    listType = null;
  };

  for (const line of text.split('\n')) {
    const ul = line.match(/^[ \t]*[-*]\s+(.*)/);
    const ol = line.match(/^[ \t]*\d+\.\s+(.*)/);
    if (ul) {
      if (listType === 'ol') flushList();
      listType = 'ul';
      listItems.push(<li key={listItems.length}>{parseInline(ul[1])}</li>);
    } else if (ol) {
      if (listType === 'ul') flushList();
      listType = 'ol';
      listItems.push(<li key={listItems.length}>{parseInline(ol[1])}</li>);
    } else {
      flushList();
      if (line.trim()) nodes.push(<p key={nodes.length}>{parseInline(line)}</p>);
    }
  }
  flushList();

  return <div className="space-y-1">{nodes}</div>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'system';
}

const INTAKE_RE = /\[SUBMIT_INTAKE]([\s\S]*?)\[\/SUBMIT_INTAKE]/;

const Chatbot: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm Jeremy's AI assistant. Ask me anything about his education, skills, or projects.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const sentValue = inputValue;
    setInputValue('');
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: sentValue, timestamp: new Date() }]);

    try {
      const apiUrl = '/api/chat';

      // Skip index 0 (initial greeting) — Gemini requires conversations to start with a user turn.
      const history = messages.slice(1).map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: sentValue }],
        }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Server error ${response.status}`);
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const obj = JSON.parse(line) as { t?: string; done?: boolean; error?: string };
            if (obj.error) throw new Error(obj.error);
            if (obj.t) {
              acc += obj.t;
              setMessages((prev) => {
                const next = [...prev];
                next[next.length - 1] = { ...next[next.length - 1], content: acc };
                return next;
              });
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // Flush any final chunk that did not end with a newline
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer) as { t?: string; done?: boolean; error?: string };
          if (obj.error) throw new Error(obj.error);
          if (obj.t) {
            acc += obj.t;
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = { ...next[next.length - 1], content: acc };
              return next;
            });
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e;
        }
      }
      // Detect and process intake submission marker
      const intakeMatch = INTAKE_RE.exec(acc);
      const cleanText = intakeMatch ? acc.replace(INTAKE_RE, '').trim() : null;

      if (intakeMatch && cleanText !== null) {
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { ...next[next.length - 1], content: cleanText };
          return next;
        });
        try {
          const data = JSON.parse(intakeMatch[1]) as Record<string, string>;
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const result = await res.json() as { success: boolean };
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: result.success
                ? "Your details have been sent to Jeremy. He'll be in touch soon!"
                : "I couldn't submit your details. Please email Jeremy at jeremy@hoppytech.com.",
              timestamp: new Date(),
              type: 'system',
            },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: "I couldn't submit your details. Please email Jeremy at jeremy@hoppytech.com.",
              timestamp: new Date(),
              type: 'system',
            },
          ]);
        }
      }

      // Log conversation to Supabase (fire and forget)
      const logMessages = [
        ...messages.slice(1).filter((m) => !m.type).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: sentValue },
        { role: 'assistant' as const, content: cleanText ?? acc },
      ];
      fetch('/api/chat-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: logMessages }),
      }).catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `${msg} Try again or email Jeremy directly.`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleChat = () => setIsOpen((open) => !open);

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 16 },
      };

  if (!mounted) return null;

  return createPortal(
    <div className="chatbot-root pointer-events-none fixed inset-0 z-[60]">
      {/* Floating button */}
      <button
        type="button"
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="chatbot-fab pointer-events-auto fixed bottom-6 right-6 z-[61] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-200 hover:scale-105 active:scale-95"
        style={{
          background: isOpen
            ? 'var(--surface)'
            : 'linear-gradient(135deg, var(--accent-light), var(--accent))',
          border: isOpen ? '1px solid var(--border-color)' : 'none',
          boxShadow: isOpen ? 'none' : '0 8px 32px color-mix(in srgb, var(--accent) 40%, transparent)',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--accent-foreground)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      {/* Chat window — opacity/y only (no scale) to avoid compositor glitches over hero blend layers */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            {...panelMotion}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="chatbot-panel pointer-events-auto fixed bottom-24 right-6 z-[61] w-[340px]"
            style={{ height: '440px' }}
          >
          <div
            className="w-full h-full flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 border-b flex-none"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-none"
                style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent))' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-foreground)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-ink">Jeremy's AI Assistant</p>
                <p className="mt-1.5 text-[10px] leading-snug text-muted opacity-[0.85]">
                  Chat bots can make mistakes.{' '}
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="underline decoration-muted underline-offset-2 transition-colors hover:text-ink hover:decoration-ink"
                  >
                    Reach out to me directly
                  </Link>{' '}
                  for any in-depth questions.
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) =>
                msg.type === 'system' ? (
                  <div key={i} className="flex justify-center">
                    <div
                      className="px-3.5 py-1.5 rounded-full text-[11px] text-center"
                      style={{
                        background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                        color: 'var(--accent)',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                        msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
                      }`}
                      style={{
                        background:
                          msg.role === 'user'
                            ? 'linear-gradient(135deg, var(--accent-light), var(--accent))'
                            : 'var(--surface-alpha)',
                        border: msg.role === 'assistant' ? '1px solid var(--border-color)' : 'none',
                        color: msg.role === 'user' ? 'var(--accent-foreground)' : 'var(--ink)',
                      }}
                    >
                      {msg.role === 'assistant' ? <MsgContent text={msg.content} /> : msg.content}
                    </div>
                  </div>
                )
              )}

              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-bl-sm"
                    style={{
                      background: 'var(--surface-alpha)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map((n) => (
                        <motion.div
                          key={n}
                          className="w-1.5 h-1.5 rounded-full bg-muted"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: n * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="flex items-center gap-2 px-3 py-3 border-t flex-none"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2.5 rounded-xl text-base sm:text-[13px] text-ink placeholder-muted-2 disabled:opacity-50 transition-colors focus:outline-none"
                style={{
                  background: 'var(--surface-alpha)',
                  border: '1px solid var(--border-color)',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-none"
                style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--accent))' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--accent-foreground)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};

export default Chatbot;
