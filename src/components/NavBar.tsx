import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import DarkModeToggle from "./DarkModeToggle";
import { AUTH_CHANGE_EVENT, isAdminLoggedIn } from "../lib/auth";
import { LETTERMARK_URL, WEBSITE_LOGO_ALT } from "../config/brand";
import { useCrackMode } from "../context/CrackModeContext";

const NAV_LINKS = [
  { label: "About", path: "/about" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Blog", path: "/blog" },
  { label: "Quote", path: "/quote" },
];

const CONTACT_PATH = "/contact";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { registerLogoClick } = useCrackMode();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkLogin = () => setIsLoggedIn(isAdminLoggedIn());
    checkLogin();
    window.addEventListener(AUTH_CHANGE_EVENT, checkLogin);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, checkLogin);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const outsideHamburger = menuRef.current && !menuRef.current.contains(target);
      const outsideDrawer = drawerRef.current && !drawerRef.current.contains(target);
      if (outsideHamburger && outsideDrawer) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    if (isMenuOpen) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [isMenuOpen]);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isMenuOpen);
    return () => document.body.classList.remove("menu-open");
  }, [isMenuOpen]);

  const handleNav = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl border-b shadow-xl shadow-black/20"
            : "backdrop-blur-md"
        }`}
        style={{
          height: "68px",
          backgroundColor: scrolled ? "color-mix(in srgb, var(--canvas) 95%, transparent)" : "color-mix(in srgb, var(--canvas) 85%, transparent)",
          borderBottomColor: scrolled ? "var(--border-color)" : "transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            aria-label="Home"
            className="flex items-center group"
            onClick={() => {
              setIsMenuOpen(false);
              registerLogoClick();
            }}
          >
            <div className="relative">
              <img
                src={LETTERMARK_URL}
                alt={WEBSITE_LOGO_ALT}
                className="brand-lettermark h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`relative px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            ))}
            {isLoggedIn && (
              <button
                onClick={() => handleNav("/dashboard")}
                className={`relative px-4 py-2 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                  isActive("/dashboard")
                    ? "text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                Dashboard
                {isActive("/dashboard") && (
                  <span className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full bg-accent" />
                )}
              </button>
            )}

            <button
              onClick={() => handleNav(CONTACT_PATH)}
              className="ml-2 px-5 py-2 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] text-[14px]"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 30px color-mix(in srgb, var(--accent) 30%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              Contact Me
            </button>

            {/* Theme toggle */}
            <div className="ml-2 flex items-center">
              <DarkModeToggle />
            </div>
          </div>

          {/* Mobile: toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2" ref={menuRef}>
            <DarkModeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col gap-[5px] p-2.5 rounded-lg transition-colors"
              style={{ backgroundColor: "var(--surface-alpha)" }}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              <span
                className={`block w-5 h-[1.5px] bg-ink transition-all duration-300 origin-center ${
                  isMenuOpen ? "rotate-45 translate-y-[6.5px]" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1.5px] bg-ink transition-all duration-300 ${
                  isMenuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block w-5 h-[1.5px] bg-ink transition-all duration-300 origin-center ${
                  isMenuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 border-l z-50 md:hidden transform transition-transform duration-300 ease-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--surface)",
          borderLeftColor: "var(--border-color)",
          zIndex: 9999,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Drawer header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-subtle">
            <Link
              to="/"
              className="flex items-center gap-2"
              onClick={() => {
                setIsMenuOpen(false);
                registerLogoClick();
              }}
            >
              <img src={LETTERMARK_URL} alt={WEBSITE_LOGO_ALT} className="brand-lettermark h-9 w-auto object-contain" />
              <span className="font-sans font-semibold text-[15px] text-ink">Hoppy Tech</span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:text-ink transition-colors"
              style={{ backgroundColor: "var(--surface-alpha)" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer links */}
          <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
            {NAV_LINKS.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNav(link.path)}
                className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 flex items-center justify-between group ${
                  isActive(link.path)
                    ? "text-accent"
                    : "text-muted hover:text-ink"
                }`}
                style={{
                  backgroundColor: isActive(link.path)
                    ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                    : undefined,
                }}
              >
                {link.label}
                <svg
                  className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${
                    isActive(link.path) ? "text-accent" : "opacity-0 group-hover:opacity-100"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            {isLoggedIn && (
              <button
                onClick={() => handleNav("/dashboard")}
                className={`w-full text-left px-4 py-3 rounded-xl text-[15px] font-medium transition-all duration-200 flex items-center gap-3 ${
                  isActive("/dashboard") ? "text-accent" : "text-muted hover:text-ink"
                }`}
                style={{
                  backgroundColor: isActive("/dashboard")
                    ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                    : undefined,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Dashboard
              </button>
            )}
            <button
              onClick={() => handleNav(CONTACT_PATH)}
              className="w-full py-3 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] text-[15px]"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 8px 30px color-mix(in srgb, var(--accent) 30%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              Contact Me
            </button>
          </div>

          {/* Drawer footer */}
          <div className="px-4 pb-8">
            <p className="text-center text-muted text-xs">
              © {new Date().getFullYear()} Jeremy Hopkins
            </p>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div style={{ height: "68px" }} />
    </>
  );
};

export default NavBar;
