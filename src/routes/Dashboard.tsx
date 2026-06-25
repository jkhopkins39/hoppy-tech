import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { AUTH_CHANGE_EVENT, clearAdminAuth, isAdminLoggedIn } from '../lib/auth';
import {
  type ChatSession,
  type ContactSubmission,
  deleteChatSession,
  deleteSubmissions,
  fetchChatSessions,
  fetchSubmissions,
  submissionLabel,
  submissionPreview,
  updateSubmissionRead,
} from '../lib/admin-dashboard';
import { BRAND, SKY_BLUE_A14, NAVY_MID_A14 } from '../config/brandColors';

type Tab = 'messages' | 'conversations';
type Filter = 'all' | 'unread' | 'read';

const formatDate = (ds: string) =>
  new Date(ds).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const [filter, setFilter] = useState<Filter>('all');

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [nextSubmissions, nextSessions] = await Promise.all([
        fetchSubmissions(),
        fetchChatSessions(),
      ]);
      setSubmissions(nextSubmissions);
      setSessions(nextSessions);
      setSelectedSubmission((current) =>
        current ? nextSubmissions.find((s) => s.id === current.id) ?? null : null,
      );
      setSelectedSession((current) =>
        current ? nextSessions.find((s) => s.id === current.id) ?? null : null,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/');
      return;
    }
    setAuthorized(true);
    void loadData();

    const onAuthChange = () => {
      if (!isAdminLoggedIn()) navigate('/');
    };
    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange);
  }, [loadData, navigate]);

  const unreadCount = submissions.filter((s) => !s.read).length;
  const filteredSubmissions = submissions.filter((s) => {
    if (filter === 'unread') return !s.read;
    if (filter === 'read') return !!s.read;
    return true;
  });

  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.created_at);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }).length;

  const totalMessages = sessions.reduce((n, s) => n + s.messages.length, 0);

  const markAsRead = async (id: string, read: boolean) => {
    try {
      const updated = await updateSubmissionRead(id, read);
      setSubmissions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSelectedSubmission((current) => (current?.id === id ? updated : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message');
    }
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await deleteSubmissions([id]);
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  };

  const clearAll = async () => {
    if (!confirm('Delete ALL messages? This cannot be undone.')) return;
    const ids = submissions.map((s) => s.id);
    if (!ids.length) return;
    try {
      await deleteSubmissions(ids);
      setSubmissions([]);
      setSelectedSubmission(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear messages');
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSession?.id === id) setSelectedSession(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  const handleLogout = async () => {
    await clearAdminAuth();
    navigate('/');
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
        >
          <div>
            <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Admin</span>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold text-ink">Dashboard</h1>
            <p className="text-muted mt-1 text-sm">Contact submissions and chat conversations</p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-subtle bg-surface text-muted hover:text-ink text-[14px] font-medium transition-all disabled:opacity-50"
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              onClick={() => void handleLogout()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all text-[14px] font-medium"
            >
              Logout
            </button>
          </div>
        </motion.div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400" role="alert">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-8">
          {(['messages', 'conversations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[14px] font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-accent text-on-accent shadow-sm'
                  : 'border border-subtle bg-surface text-muted hover:text-ink'
              }`}
            >
              {tab}
              {tab === 'messages' && unreadCount > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab ? 'bg-white/20' : 'bg-accent/10 text-accent'}`}>
                  {unreadCount}
                </span>
              )}
              {tab === 'conversations' && sessions.length > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${activeTab === tab ? 'bg-white/20' : 'bg-accent/10 text-accent'}`}>
                  {sessions.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && submissions.length === 0 && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-accent-subtle border-t-accent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'messages' ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total', value: submissions.length, color: BRAND.skyBlue, bg: SKY_BLUE_A14 },
                { label: 'Unread', value: unreadCount, color: BRAND.orange, bg: 'rgba(251, 133, 0, 0.14)' },
                { label: 'Read', value: submissions.length - unreadCount, color: BRAND.navyMid, bg: NAVY_MID_A14 },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-subtle bg-surface p-5">
                  <div className="text-2xl font-bold text-ink">{stat.value}</div>
                  <div className="text-muted text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex gap-2">
                {(['all', 'unread', 'read'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-medium capitalize transition-all ${
                      filter === f ? 'bg-accent text-on-accent' : 'border border-subtle bg-surface text-muted hover:text-ink'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {submissions.length > 0 && (
                <button
                  onClick={() => void clearAll()}
                  className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[13px] font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-subtle bg-surface overflow-hidden">
                <div className="px-4 py-3.5 border-b border-white/[0.05] font-semibold text-[14px]">
                  Messages ({filteredSubmissions.length})
                </div>
                <div className="overflow-y-auto max-h-[560px]">
                  {filteredSubmissions.length === 0 ? (
                    <p className="p-8 text-center text-muted text-sm">No messages yet</p>
                  ) : (
                    filteredSubmissions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedSubmission(sub);
                          if (!sub.read) void markAsRead(sub.id, true);
                        }}
                        className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all ${
                          selectedSubmission?.id === sub.id ? 'bg-accent-subtle' : 'hover:bg-surface-alpha'
                        } ${!sub.read ? 'border-l-2 border-l-accent' : ''}`}
                      >
                        <p className={`text-[13px] font-medium truncate ${!sub.read ? 'text-ink' : 'text-muted'}`}>
                          {submissionLabel(sub)}
                        </p>
                        <p className="text-[12px] text-muted-2 truncate mt-0.5">{submissionPreview(sub)}</p>
                        <p className="text-[11px] text-muted-3 mt-1">{formatDate(sub.created_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-subtle bg-surface overflow-hidden min-h-[400px] flex flex-col">
                <AnimatePresence mode="wait">
                  {selectedSubmission ? (
                    <motion.div
                      key={selectedSubmission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col h-full"
                    >
                      <div className="px-6 py-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink text-[15px]">{submissionLabel(selectedSubmission)}</p>
                          <p className="text-muted text-xs mt-0.5">{formatDate(selectedSubmission.created_at)}</p>
                          <div className="text-muted-2 text-xs mt-2 space-y-1">
                            {selectedSubmission.email && <p>Email: {selectedSubmission.email}</p>}
                            {selectedSubmission.phone && <p>Phone: {selectedSubmission.phone}</p>}
                            {(selectedSubmission.company || selectedSubmission.project_type || selectedSubmission.timeline || selectedSubmission.budget) && (
                              <p>
                                {[selectedSubmission.company, selectedSubmission.project_type, selectedSubmission.timeline, selectedSubmission.budget]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => void markAsRead(selectedSubmission.id, !selectedSubmission.read)}
                            className="p-2 rounded-xl border border-subtle text-muted hover:text-ink"
                            title={selectedSubmission.read ? 'Mark unread' : 'Mark read'}
                          >
                            {selectedSubmission.read ? 'Unread' : 'Read'}
                          </button>
                          {(selectedSubmission.email || selectedSubmission.phone) && (
                            <a
                              href={
                                selectedSubmission.email
                                  ? `mailto:${selectedSubmission.email}`
                                  : `tel:${selectedSubmission.phone}`
                              }
                              className="p-2 rounded-xl border border-accent-subtle-2 bg-accent-subtle-2 text-accent text-[12px] font-medium"
                            >
                              Reply
                            </a>
                          )}
                          <button
                            onClick={() => void deleteSubmission(selectedSubmission.id)}
                            className="p-2 rounded-xl border border-red-500/20 text-red-400 text-[12px] font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="rounded-xl bg-canvas/60 p-5">
                          <p className="text-muted whitespace-pre-wrap leading-relaxed text-sm">
                            {submissionPreview(selectedSubmission)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-12 text-muted-2">
                      Select a message to view it
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total', value: sessions.length },
                { label: 'Today', value: todaySessions },
                { label: 'Messages', value: totalMessages },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-subtle bg-surface p-5">
                  <div className="text-2xl font-bold text-ink">{stat.value}</div>
                  <div className="text-muted text-xs mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-subtle bg-surface overflow-hidden">
                <div className="px-4 py-3.5 border-b border-white/[0.05] font-semibold text-[14px]">
                  Conversations ({sessions.length})
                </div>
                <div className="overflow-y-auto max-h-[560px]">
                  {sessions.length === 0 ? (
                    <p className="p-8 text-center text-muted text-sm">No conversations yet</p>
                  ) : (
                    sessions.map((session) => {
                      const preview = session.messages.find((m) => m.role === 'user')?.content ?? 'New conversation';
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all ${
                            selectedSession?.id === session.id ? 'bg-accent-subtle' : 'hover:bg-surface-alpha'
                          }`}
                        >
                          <p className="text-[13px] font-medium text-ink truncate">{preview.slice(0, 60)}</p>
                          <p className="text-[11px] text-muted-3 mt-1">
                            {formatDate(session.updated_at)} · {session.messages.length} msgs
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-subtle bg-surface overflow-hidden min-h-[400px] flex flex-col">
                <AnimatePresence mode="wait">
                  {selectedSession ? (
                    <motion.div
                      key={selectedSession.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col h-full"
                    >
                      <div className="px-6 py-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink text-[15px]">Chat Session</p>
                          <p className="text-muted text-xs mt-0.5">
                            {formatDate(selectedSession.created_at)} · {selectedSession.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={() => void deleteSession(selectedSession.id)}
                          className="p-2 rounded-xl border border-red-500/20 text-red-400 text-[12px] font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                        {selectedSession.messages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                                msg.role === 'user' ? 'rounded-br-sm bg-accent text-on-accent' : 'rounded-bl-sm border border-subtle bg-surface-alpha text-ink'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center p-12 text-muted-2">
                      Select a conversation to view it
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
