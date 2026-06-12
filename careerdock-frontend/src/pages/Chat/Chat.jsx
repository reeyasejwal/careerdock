import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { RiAddLine, RiDeleteBinLine, RiSendPlaneLine, RiRobot2Line } from 'react-icons/ri';
import api from '../../services/api';

const SUGGESTIONS = [
  'How do I crack Google SWE?',
  'Explain Dynamic Programming with examples',
  'Tell me about yourself — sample answer',
  'Resume tips for ATS optimization',
  'System design: URL shortener',
  'How to negotiate salary as a fresher?',
];

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const diff = today.setHours(0,0,0,0) - d.setHours(0,0,0,0);
  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadConversations = async () => {
    try {
      const r = await api.get('/chat/conversations');
      setConversations(r.data);
      if (r.data.length > 0 && !activeConvId) {
        selectConv(r.data[0].id);
      }
    } catch {}
  };

  const selectConv = async (id) => {
    setActiveConvId(id);
    try {
      const r = await api.get(`/chat/${id}/messages`);
      setMessages(r.data);
    } catch {}
  };

  const newChat = async () => {
    try {
      const r = await api.post('/chat/new');
      const id = r.data.id;
      setActiveConvId(id);
      setMessages([]);
      const convR = await api.get('/chat/conversations');
      setConversations(convR.data);
      textareaRef.current?.focus();
    } catch {
      toast.error('Could not create chat');
    }
  };

  const deleteConv = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/chat/${id}`);
      const convR = await api.get('/chat/conversations');
      setConversations(convR.data);
      if (activeConvId === id) {
        if (convR.data[0]) selectConv(convR.data[0].id);
        else { setActiveConvId(null); setMessages([]); }
      }
    } catch {}
  };

  const handleSend = async (msgContent) => {
    const content = (msgContent || input).trim();
    if (!content || sending) return;
    setInput('');
    setSending(true);

    let convId = activeConvId;
    if (!convId) {
      try {
        const r = await api.post('/chat/new');
        convId = r.data.id;
        setActiveConvId(convId);
        const convR = await api.get('/chat/conversations');
        setConversations(convR.data);
      } catch {
        toast.error('Could not create chat');
        setSending(false);
        return;
      }
    }

    setMessages(m => [...m, { id: Date.now(), role: 'user', content, created_at: new Date().toISOString() }]);

    try {
      const r = await api.post('/chat/message', { conversation_id: convId, content });
      setMessages(m => [...m, r.data]);
      const convR = await api.get('/chat/conversations');
      setConversations(convR.data);
    } catch {
      toast.error('Failed to send message');
      setMessages(m => m.filter(msg => msg.content !== content || msg.role !== 'user'));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    handleSend();
  };

  return (
    <div>
      <Helmet><title>DockAI | CareerDock</title></Helmet>
      <div className="page-header">
        <div>
          <h1 className="page-title">DockAI</h1>
          <p className="page-subtitle">Your personal placement co-pilot</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="chat-layout" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
          {/* Sidebar */}
          <div className="chat-sidebar">
            <button className="btn btn-primary w-full justify-center btn-sm" style={{ marginBottom: 12 }} onClick={newChat}>
              <RiAddLine size={14} /> New Chat
            </button>
            {conversations.length === 0 ? (
              <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 20 }}>No chats yet</p>
            ) : conversations.map(c => (
              <div
                key={c.id}
                onClick={() => selectConv(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  background: activeConvId === c.id ? 'var(--surface)' : 'transparent',
                  marginBottom: 2, transition: 'background 0.2s',
                  border: activeConvId === c.id ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <RiRobot2Line size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDate(c.updated_at)}</div>
                </div>
                <button
                  className="btn btn-ghost btn-icon"
                  style={{ padding: 3, flexShrink: 0, opacity: 0.6 }}
                  onClick={(e) => deleteConv(c.id, e)}
                >
                  <RiDeleteBinLine size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="chat-main" style={{ borderLeft: '1px solid var(--border)' }}>
            {!activeConvId ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 24px', gap: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <RiRobot2Line size={30} color="#fff" />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>DockAI</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 13.5, margin: '0 0 4px' }}>Your personal placement co-pilot</p>
                  <p style={{ color: 'var(--muted)', fontSize: 12 }}>Ask anything about interviews, DSA, resumes, or company research</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 520 }}>
                  {SUGGESTIONS.map(q => (
                    <button key={q} className="btn btn-outline btn-sm" style={{ fontSize: 12 }} onClick={() => handleSend(q)}>{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="chat-messages">
                  {messages.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 20px', gap: 16 }}>
                      <RiRobot2Line size={40} style={{ opacity: 0.3 }} />
                      <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center' }}>Ask me anything about your placement journey!</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 460 }}>
                        {SUGGESTIONS.slice(0, 4).map(q => (
                          <button key={q} className="btn btn-outline btn-sm" style={{ fontSize: 11.5 }} onClick={() => handleSend(q)}>{q}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
                          {msg.role === 'assistant' ? (
                            <ReactMarkdown
                              components={{
                                p: ({ children }) => <p style={{ marginBottom: 8, marginTop: 0 }}>{children}</p>,
                                ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 8 }}>{children}</ul>,
                                ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 8 }}>{children}</ol>,
                                li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                                code: ({ children }) => <code style={{ background: 'rgba(0,0,0,0.15)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{children}</code>,
                                blockquote: ({ children }) => <blockquote style={{ borderLeft: '3px solid var(--accent)', paddingLeft: 10, margin: '8px 0', opacity: 0.85 }}>{children}</blockquote>,
                                strong: ({ children }) => <strong style={{ color: 'var(--primary)' }}>{children}</strong>,
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          ) : msg.content}
                        </div>
                        {msg.created_at && (
                          <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, marginLeft: msg.role === 'user' ? 0 : 4, marginRight: msg.role === 'user' ? 4 : 0 }}>
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {sending && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="message-bubble message-ai" style={{ width: 'fit-content' }}>
                        <div className="typing-indicator">
                          <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-bar" onSubmit={handleSubmit}>
                  <textarea
                    ref={textareaRef}
                    className="form-textarea"
                    style={{ flex: 1, resize: 'none', minHeight: 44, maxHeight: 140, borderRadius: 12 }}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                    placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-icon"
                    disabled={!input.trim() || sending}
                    style={{ padding: 12 }}
                  >
                    <RiSendPlaneLine size={18} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
