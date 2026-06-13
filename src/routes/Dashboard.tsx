import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import { clearAdminAuth, isAdminLoggedIn } from "../lib/auth";

interface ContactSubmission {
  id: string;
  email: string;
  message: string;
  date: string;
  read: boolean;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      navigate('/');
      return;
    }
    setIsLoggedIn(true);
    const saved = localStorage.getItem('contactSubmissions');
    if (saved) setSubmissions(JSON.parse(saved));
    setIsLoading(false);
  }, [navigate]);

  const save = (updated: ContactSubmission[]) => {
    setSubmissions(updated);
    localStorage.setItem('contactSubmissions', JSON.stringify(updated));
  };

  const markAsRead = (id: string) => save(submissions.map(s => s.id === id ? { ...s, read: true } : s));
  const markAsUnread = (id: string) => save(submissions.map(s => s.id === id ? { ...s, read: false } : s));
  const deleteSubmission = (id: string) => {
    if (!confirm('Delete this message?')) return;
    const updated = submissions.filter(s => s.id !== id);
    save(updated);
    if (selectedSubmission?.id === id) setSelectedSubmission(null);
  };
  const clearAll = () => {
    if (!confirm('Delete ALL messages? This cannot be undone.')) return;
    save([]);
    setSelectedSubmission(null);
  };
  const handleLogout = async () => {
    await clearAdminAuth();
    navigate('/');
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'unread') return !s.read;
    if (filter === 'read') return s.read;
    return true;
  });

  const unreadCount = submissions.filter(s => !s.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-subtle border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10"
        >
          <div>
            <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Admin</span>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold text-ink">Dashboard</h1>
            <p className="text-muted mt-1 text-sm">Manage contact form submissions</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all duration-200 text-[14px] font-medium self-start md:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {[
            { label: 'Total', value: submissions.length, color: '#E8971A', bg: 'rgba(232,151,26,0.1)' },
            { label: 'Unread', value: unreadCount, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
            { label: 'Read', value: submissions.length - unreadCount, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-subtle bg-surface p-5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: stat.bg }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: stat.color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-ink">{stat.value}</div>
              <div className="text-muted text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between gap-4 mb-5"
        >
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium capitalize transition-all duration-200 ${
                  filter === f
                    ? 'bg-accent text-on-accent'
                    : 'border border-subtle bg-surface text-muted hover:text-ink'
                }`}
              >
                {f}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-canvas font-bold">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {submissions.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[13px] font-medium transition-all duration-200"
            >
              Clear all
            </button>
          )}
        </motion.div>

        {/* Main panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        >
          {/* List */}
          <div className="rounded-2xl border border-subtle bg-surface overflow-hidden">
            <div className="px-4 py-3.5 border-b border-white/[0.05]">
              <h2 className="font-semibold text-[14px] text-ink">
                Messages {filteredSubmissions.length > 0 && <span className="text-muted font-normal ml-1">({filteredSubmissions.length})</span>}
              </h2>
            </div>
            <div className="overflow-y-auto max-h-[560px]">
              {filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-muted-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-muted text-sm">No {filter !== 'all' ? filter : ''} messages</p>
                </div>
              ) : (
                filteredSubmissions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      if (!sub.read) markAsRead(sub.id);
                    }}
                    className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all duration-200 ${
                      selectedSubmission?.id === sub.id ? 'bg-accent-subtle' : 'hover:bg-surface-alpha'
                    } ${!sub.read ? 'border-l-2 border-l-amber-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate ${!sub.read ? 'text-ink' : 'text-muted'}`}>
                          {sub.email}
                        </p>
                        <p className="text-[12px] text-muted-2 truncate mt-0.5">{sub.message}</p>
                        <p className="text-[11px] text-muted-3 mt-1">{formatDate(sub.date)}</p>
                      </div>
                      {!sub.read && <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-none" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-2 rounded-2xl border border-subtle bg-surface overflow-hidden min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              {selectedSubmission ? (
                <motion.div
                  key={selectedSubmission.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  {/* Detail header */}
                  <div className="px-6 py-5 border-b border-white/[0.05] flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink text-[15px]">{selectedSubmission.email}</p>
                      <p className="text-muted text-xs mt-0.5">{formatDate(selectedSubmission.date)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => selectedSubmission.read ? markAsUnread(selectedSubmission.id) : markAsRead(selectedSubmission.id)}
                        className="p-2 rounded-xl border border-subtle text-muted hover:text-ink hover:border-white/[0.12] transition-all"
                        title={selectedSubmission.read ? 'Mark unread' : 'Mark read'}
                      >
                        <svg className="w-4 h-4" fill={selectedSubmission.read ? 'none' : 'currentColor'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <a
                        href={`mailto:${selectedSubmission.email}`}
                        className="p-2 rounded-xl border border-accent-subtle-2 bg-accent-subtle-2 text-accent hover:bg-accent-subtle transition-all"
                        title="Reply"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </a>
                      <button
                        onClick={() => deleteSubmission(selectedSubmission.id)}
                        className="p-2 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Message body */}
                  <div className="flex-1 p-6">
                    <div className="rounded-xl bg-canvas/60 p-5">
                      <p className="text-muted whitespace-pre-wrap leading-relaxed text-sm">{selectedSubmission.message}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center p-12"
                >
                  <div className="text-center text-muted-2">
                    <svg className="w-14 h-14 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Select a message to view it</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
