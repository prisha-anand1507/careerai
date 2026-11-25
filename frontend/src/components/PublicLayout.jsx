import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from './ui';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/#features', label: 'Features' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About' },
];

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const linkCls = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-indigo' : 'text-navy-600 hover:text-navy'}`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-navy-200/70 bg-white/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
          <Logo />
          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              l.to.includes('#')
                ? <Link key={l.label} to={l.to} className="rounded-lg px-3 py-2 text-sm font-medium text-navy-600 transition hover:text-navy">{l.label}</Link>
                : <NavLink key={l.label} to={l.to} end={l.end} className={linkCls}>{l.label}</NavLink>
            ))}
          </div>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to="/app" className="btn-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">Login</Link>
                <Link to="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </nav>
        {open && (
          <div className="border-t border-navy-200 bg-white px-4 pb-4 md:hidden">
            <div className="flex flex-col py-2">
              {links.map((l) => (
                <Link key={l.label} to={l.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 font-medium text-navy-700 hover:bg-navy-50">{l.label}</Link>
              ))}
            </div>
            <div className="flex gap-2">
              {user ? (
                <Link to="/app" onClick={() => setOpen(false)} className="btn-primary flex-1">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1">Login</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1">Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      <main id="main" className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}

function Footer() {
  const col = 'text-sm text-navy-300 hover:text-white transition';
  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-navy-300">Resume analysis, skill-gap detection, and career recommendations powered by NLP and machine learning.</p>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-4 space-y-2.5">
            <li><Link className={col} to="/#features">Features</Link></li>
            <li><Link className={col} to="/#how-it-works">How It Works</Link></li>
            <li><Link className={col} to="/register">Get Started</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2.5">
            <li><Link className={col} to="/about">About</Link></li>
            <li><Link className={col} to="/contact">Contact</Link></li>
            <li><Link className={col} to="/privacy">Privacy Policy</Link></li>
            <li><Link className={col} to="/terms">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-navy-400">© {new Date().getFullYear()} CareerAI. All rights reserved.</div>
    </footer>
  );
}
