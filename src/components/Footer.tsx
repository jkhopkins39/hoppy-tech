import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socialLinks, contactInfo } from '../config/socialLinks';
import {
  AUTH_CHANGE_EVENT,
  clearAdminAuth,
  isAdminLoggedIn,
  signInAdmin,
} from '../lib/auth';
import { supabaseConfigured } from '../lib/supabase';
import { LETTERMARK_URL, WEBSITE_LOGO_ALT } from '../config/brand';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      await signInAdmin(loginForm.email, loginForm.password);
      setIsLoggedIn(true);
      setLoginForm({ email: '', password: '' });
      setShowLogin(false);
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await clearAdminAuth();
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const syncAuth = () => setIsLoggedIn(isAdminLoggedIn());
    syncAuth();
    window.addEventListener(AUTH_CHANGE_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, syncAuth);
  }, []);

  const navLinks = [
    { label: 'About', path: '/about' },
    { label: 'Portfolio', path: '/portfolio' },
    { label: 'Blog', path: '/blog' },
    { label: 'Start a Project', path: '/contact' },
    { label: 'Refer a Business', path: '/refer' },
  ];

  const socials = [
    {
      name: 'GitHub',
      url: socialLinks.github,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      url: socialLinks.linkedin,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      url: socialLinks.instagram,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    },
    {
      name: 'Facebook',
      url: socialLinks.facebook,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="border-t bg-canvas" style={{ borderTopColor: 'var(--border-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4 group w-fit">
              <img src={LETTERMARK_URL} alt={WEBSITE_LOGO_ALT} className="brand-lettermark h-9 w-auto object-contain" />
              <span className="font-semibold text-ink text-[15px]">Hoppy Tech</span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              AI & Web Developer
            </p>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Check me out here ↓
            </p>
            <div className="flex gap-3 mt-5">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted transition-all duration-200 bg-surface"
                  style={{ borderColor: 'var(--border-color)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)';
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-color)';
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-4">Navigate</h4>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-muted hover:text-ink transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + Admin */}
          <div>
            <h4 className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="text-sm text-muted hover:text-ink transition-colors duration-200 break-all"
                >
                  {contactInfo.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contactInfo.phone}`}
                  className="text-sm text-muted hover:text-ink transition-colors duration-200"
                  onClick={(e) => {
                    if (typeof window.gtag_report_conversion !== "function") return;
                    e.preventDefault();
                    window.gtag_report_conversion(`tel:${contactInfo.phone}`);
                  }}
                >
                  {contactInfo.phone}
                </a>
              </li>
            </ul>

            {/* Admin (discrete) */}
            <div className="mt-6 pt-6 border-t" style={{ borderTopColor: 'var(--border-color)' }}>
              {!isLoggedIn ? (
                <div>
                  <button
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-[11px] text-muted-2 hover:text-muted transition-colors tracking-widest uppercase"
                  >
                    {showLogin ? '— close' : 'Admin'}
                  </button>
                  {showLogin && (
                    <form onSubmit={handleLogin} className="mt-3 space-y-2">
                      {!supabaseConfigured && (
                        <p className="text-[11px] text-red-400" role="alert">
                          Admin login is unavailable — Supabase is not configured.
                        </p>
                      )}
                      {loginError && (
                        <p className="text-[11px] text-red-400" role="alert">
                          {loginError}
                        </p>
                      )}
                      <input
                        type="email"
                        placeholder="jeremy@hoppytech.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-xs text-ink placeholder-muted-2 focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-color)',
                        }}
                        required
                        autoComplete="username"
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg text-xs text-ink placeholder-muted-2 focus:outline-none transition-colors"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border-color)',
                        }}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="submit"
                        disabled={isLoggingIn}
                        className="w-full py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                      >
                        {isLoggingIn ? 'Signing in…' : 'Login'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="text-xs text-accent hover:text-accent transition-colors"
                  >
                    ● Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderTopColor: 'var(--border-color)' }}>
          <p className="text-muted-2 text-xs">
            © {new Date().getFullYear()} Jeremy Hopkins. All rights reserved.
          </p>
          <p className="text-muted-2 text-xs">
            Built with React & TypeScript
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
