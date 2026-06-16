import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "../components/Footer";
import { authHeaders, isAdminLoggedIn } from "../lib/auth";
import { BRAND, BLOG_TAG_STYLES_DARK, BLOG_TAG_STYLES_LIGHT } from "../config/brandColors";
import { useTheme } from "../context/ThemeContext";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  date: string;
  tags: string[];
  readTime?: number;
}

const Blog: React.FC = () => {
  const { isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [postForm, setPostForm] = useState({ title: "", content: "", excerpt: "", tags: "" });

  const calcReadTime = (content: string) => Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/data/blogPosts.json');
        if (res.ok) setBlogPosts(await res.json());
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetchPosts();
    setIsLoggedIn(isAdminLoggedIn());
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setStatusMessage(null);

    const post: BlogPost = {
      id: Date.now().toString(),
      title: postForm.title,
      content: postForm.content,
      excerpt: postForm.excerpt,
      author: "Jeremy Hopkins",
      date: new Date().toISOString().split('T')[0],
      tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      readTime: calcReadTime(postForm.content),
    };

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'create', post }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Published! "${result.commitMessage}"` });
        setBlogPosts([post, ...blogPosts]);
        setPostForm({ title: "", content: "", excerpt: "", tags: "" });
        setIsCreatingPost(false);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to publish' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPostId) return;
    setIsPublishing(true);
    setStatusMessage(null);

    const existingPost = blogPosts.find(p => p.id === editingPostId);
    const updatedPost: BlogPost = {
      id: editingPostId,
      title: postForm.title,
      content: postForm.content,
      excerpt: postForm.excerpt,
      author: existingPost?.author || "Jeremy Hopkins",
      date: existingPost?.date || new Date().toISOString().split('T')[0],
      tags: postForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      readTime: calcReadTime(postForm.content),
    };

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'update', post: updatedPost, postId: editingPostId }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Updated! "${result.commitMessage}"` });
        setBlogPosts(blogPosts.map(p => p.id === editingPostId ? updatedPost : p));
        setPostForm({ title: "", content: "", excerpt: "", tags: "" });
        setEditingPostId(null);
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to update' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const startEditing = (post: BlogPost) => {
    setPostForm({ title: post.title, content: post.content, excerpt: post.excerpt, tags: post.tags.join(', ') });
    setEditingPostId(post.id);
    setIsCreatingPost(false);
  };

  const deletePost = async (id: string) => {
    const post = blogPosts.find(p => p.id === id);
    if (!post || !window.confirm(`Delete "${post.title}"?`)) return;
    setIsPublishing(true);
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'delete', postId: id }),
      });
      const result = await res.json();
      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Deleted! "${result.commitMessage}"` });
        setBlogPosts(blogPosts.filter(p => p.id !== id));
      } else {
        setStatusMessage({ type: 'error', text: result.error || 'Failed to delete' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-canvas border border-subtle rounded-xl text-ink placeholder-muted-3 focus:border-accent-subtle transition-colors text-sm";
  const labelClass = "block text-[11px] uppercase tracking-widest text-muted font-semibold mb-2";

  const tagColors = isDark ? BLOG_TAG_STYLES_DARK : BLOG_TAG_STYLES_LIGHT;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Status toast */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border text-sm font-medium shadow-xl backdrop-blur-xl ${
              statusMessage.type === 'success'
                ? 'bg-accent-subtle border-accent-subtle text-accent'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {statusMessage.type === 'success'
              ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            }
            {statusMessage.text}
            <button onClick={() => setStatusMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publishing overlay */}
      <AnimatePresence>
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-surface rounded-2xl border border-subtle p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-accent-subtle border-t-accent rounded-full animate-spin" />
              <p className="text-ink font-semibold">Publishing to GitHub…</p>
              <p className="text-muted text-sm mt-1">Committing and pushing changes</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-accent text-[13px] font-mono uppercase tracking-widest">Latest thoughts</span>
          <h1 className="mt-2 text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.1] tracking-tight">
            The{' '}
            <span
              style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontStyle: "italic",
                background: "linear-gradient(135deg, var(--accent-light), var(--accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Blog
            </span>
          </h1>
          <p className="mt-3 text-muted text-lg leading-relaxed">
            Exploring the intersection of AI, code, and creativity.
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Admin controls */}
        {isLoggedIn && !editingPostId && (
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => { setIsCreatingPost(!isCreatingPost); if (!isCreatingPost) setPostForm({ title: "", content: "", excerpt: "", tags: "" }); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-subtle bg-surface hover:border-accent-subtle hover:bg-accent-subtle-2 text-[14px] font-medium text-ink transition-all duration-200"
            >
              {isCreatingPost
                ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>Cancel</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>New Post</>
              }
            </button>
          </div>
        )}

        {/* Create/edit form */}
        <AnimatePresence>
          {(isCreatingPost || editingPostId) && isLoggedIn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-10"
            >
              <div className="rounded-2xl border border-subtle bg-surface p-6 md:p-8">
                <h2 className="font-bold text-lg text-ink mb-6">{editingPostId ? 'Edit Post' : 'Create New Post'}</h2>
                <form onSubmit={editingPostId ? handleEditPost : handleCreatePost} className="space-y-5">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input type="text" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} className={inputClass} placeholder="An engaging title..." required />
                  </div>
                  <div>
                    <label className={labelClass}>Excerpt</label>
                    <textarea value={postForm.excerpt} onChange={e => setPostForm({...postForm, excerpt: e.target.value})} className={`${inputClass} resize-none`} rows={2} placeholder="A brief hook for readers..." required />
                  </div>
                  <div>
                    <label className={labelClass}>Content</label>
                    <textarea value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} className={`${inputClass} resize-none font-mono`} rows={14} placeholder="Write your post..." required />
                  </div>
                  <div>
                    <label className={labelClass}>Tags (comma-separated)</label>
                    <input type="text" value={postForm.tags} onChange={e => setPostForm({...postForm, tags: e.target.value})} className={inputClass} placeholder="AI, React, Web Development" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={isPublishing} className="flex-1 py-3.5 bg-accent hover:bg-accent-light text-on-accent font-semibold rounded-xl transition-colors duration-200 text-[14px] disabled:opacity-50">
                      {editingPostId ? 'Update & Publish' : 'Publish Post'}
                    </button>
                    {editingPostId && (
                      <button type="button" onClick={() => { setPostForm({ title: "", content: "", excerpt: "", tags: "" }); setEditingPostId(null); }} className="px-6 py-3.5 border border-subtle text-muted hover:text-ink rounded-xl transition-all duration-200 text-[14px]">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts list */}
        {isLoading ? (
          <div className="text-center py-24">
            <div className="w-10 h-10 mx-auto mb-4 border-2 border-accent-subtle border-t-accent rounded-full animate-spin" />
            <p className="text-muted">Loading posts…</p>
          </div>
        ) : blogPosts.length === 0 ? (
          <div className="text-center py-24">
            <svg className="w-14 h-14 mx-auto mb-5 text-muted-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="text-xl font-bold text-ink mb-2">No posts yet</h3>
            <p className="text-muted">The blog awaits its first story.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {blogPosts.map((post, i) => {
              const isExpanded = expandedPostId === post.id;
              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group rounded-2xl border border-subtle bg-surface overflow-hidden hover:border-subtle-hover transition-all duration-300"
                >
                  <div className="p-6 md:p-8">
                    {/* Meta row */}
                    <div className="flex items-center justify-between gap-4 mb-5">
                      <div className="flex items-center gap-3 text-[13px] text-muted">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
                          style={{ background: 'rgba(142, 202, 230, 0.14)', color: BRAND.skyBlue }}
                        >
                          #{String(blogPosts.length - i).padStart(2, '0')}
                        </span>
                        <span>{formatDate(post.date)}</span>
                        <span>·</span>
                        <span>{post.readTime || calcReadTime(post.content)} min read</span>
                      </div>

                      {/* Admin actions */}
                      {isLoggedIn && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button onClick={() => startEditing(post)} className="p-1.5 rounded-lg border border-subtle text-muted hover:text-blue-400 hover:border-blue-400/20 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deletePost(post.id)} className="p-1.5 rounded-lg border border-subtle text-muted hover:text-red-400 hover:border-red-400/20 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h2
                      className="text-2xl md:text-3xl font-bold text-ink mb-3 leading-tight cursor-pointer hover:text-accent transition-colors duration-200"
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                    >
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-muted leading-relaxed mb-5">{post.excerpt}</p>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-5 mb-5 border-t border-white/[0.05]">
                            <p className="text-muted leading-loose whitespace-pre-wrap text-[15px]">{post.content}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Footer row */}
                    <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.05]">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, ti) => {
                          const tagStyle = tagColors[ti % tagColors.length];
                          return (
                          <span
                            key={ti}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                            style={{
                              background: tagStyle.bg,
                              color: tagStyle.color,
                              border: `1px solid ${tagStyle.border}`,
                            }}
                          >
                            {tag}
                          </span>
                          );
                        })}
                      </div>

                      {/* Read more */}
                      <button
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        className="flex items-center gap-1.5 text-[13px] font-medium transition-all duration-200 whitespace-nowrap flex-none"
                        style={{ color: isExpanded ? 'var(--muted-2)' : 'var(--accent)' }}
                      >
                        {isExpanded ? (
                          <>Collapse <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></>
                        ) : (
                          <>Read more <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Blog;
