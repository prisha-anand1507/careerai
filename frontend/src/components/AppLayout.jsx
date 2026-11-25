import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileSearch, Compass, BarChart3, Wand2, History, UserCircle, LogOut, Menu, X } from 'lucide-react';
import { Logo } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const nav = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/analyze', label: 'Analyze Resume', icon: FileSearch },
  { to: '/app/careers', label: 'Career Matches', icon: Compass },
  { to: '/app/skill-gap', label: 'Skill Gap', icon: BarChart3 },
  { to: '/app/improvements', label: 'Improvements', icon: Wand2 },
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/profile', label: 'Profile', icon: UserCircle },
];

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logout();
    toast.success('You have been logged out.');
    navigate('/login');
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-navy p-4 text-white">
      <div className="px-2 py-3"><Logo light /></div>
      <nav className="mt-6 flex-1 space-y-1" aria-label="App">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white shadow-inner' : 'text-navy-300 hover:bg-white/5 hover:text-white'}`}>
            <Icon className="h-5 w-5" aria-hidden /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="rounded-xl bg-white/5 p-3">
        <p className="truncate text-sm font-semibold">{user?.name}</p>
        <p className="truncate text-xs text-navy-400">{user?.email}</p>
        <button onClick={onLogout} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-medium hover:bg-white/20">
          <LogOut className="h-4 w-4" aria-hidden /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <a href="#app-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-navy/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-navy-200 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <button onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} className="rounded-lg p-2">
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <main id="app-main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10"><Outlet /></main>
    </div>
  );
}
