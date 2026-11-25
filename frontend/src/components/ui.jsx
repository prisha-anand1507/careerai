import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, AlertTriangle, Info } from 'lucide-react';

export const scoreTone = (v) => (v >= 75 ? '#059669' : v >= 50 ? '#D97706' : '#DC2626');

export function Logo({ light = false, className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-extrabold ${className}`} aria-label="CareerAI home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
        <Sparkles className="h-5 w-5" aria-hidden />
      </span>
      <span className={`text-xl ${light ? 'text-white' : 'text-navy'}`}>Career<span className="gradient-text">AI</span></span>
    </Link>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function ScoreRing({ value = 0, size = 120, stroke = 10, label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const [shown, setShown] = useState(0);

  // Animate the ring and number from 0 on mount (skipped when the user prefers reduced motion).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(pct); return undefined; }
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(Math.round(pct * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const fontSize = Math.max(16, Math.round(size * 0.28));
  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label || 'Score'}: ${pct} out of 100`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="#EAECF0" strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" strokeLinecap="round"
            stroke={scoreTone(pct)} strokeWidth={stroke}
            strokeDasharray={c} strokeDashoffset={c - (shown / 100) * c}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-extrabold tabular-nums text-navy" style={{ fontSize }}>{shown}</span>
        </div>
      </div>
      {label && <p className="mt-2 text-sm font-semibold text-navy">{label}</p>}
      {sublabel && <p className="text-xs text-navy-500">{sublabel}</p>}
    </div>
  );
}

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded-lg bg-navy-200/70 ${className}`} aria-hidden />;
}

/** Accessible tab list (arrow-key navigation). Pair with <TabPanel>. */
export function Tabs({ tabs, value, onChange, label }) {
  const onKey = (e, i) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-navy-100 p-1">
      {tabs.map((t, i) => {
        const on = t.id === value;
        return (
          <button key={t.id} id={`tab-${t.id}`} role="tab" type="button" aria-selected={on} aria-controls={`panel-${t.id}`}
            tabIndex={on ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => onChange(t.id)}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${on ? 'bg-white text-navy shadow-soft' : 'text-navy-600 hover:text-navy'}`}>
            {t.label}{t.badge != null && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ id, value, children }) {
  if (id !== value) return null;
  return <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} className="animate-fade-up space-y-6">{children}</div>;
}

export function Callout({ tone = 'info', title, children }) {
  const cls = {
    info: 'border-electric-100 bg-electric-50 text-electric-600',
    warn: 'border-amber-200 bg-amber-50 text-amber-700',
    good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[tone];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${cls}`} role={tone === 'warn' ? 'alert' : 'note'}>
      <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="text-sm text-navy-700">{title && <p className="mb-0.5 font-semibold text-navy">{title}</p>}{children}</div>
    </div>
  );
}

export function ProgressBar({ value = 0, color, label, showValue = true }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1.5 flex justify-between text-sm">
          <span className="font-medium text-navy-700">{label}</span>
          {showValue && <span className="font-semibold text-navy">{pct}%</span>}
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color || 'linear-gradient(90deg,#6366F1,#3B82F6)' }} />
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-navy-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo">
        {Icon && <Icon className="h-7 w-7" aria-hidden />}
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-navy-500">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card flex flex-col items-center py-12 text-center" role="alert">
      <AlertTriangle className="mb-3 h-8 w-8 text-red-500" aria-hidden />
      <p className="font-semibold">We couldn&apos;t load this</p>
      <p className="mt-1 text-sm text-navy-500">{message}</p>
      {onRetry && <button className="btn-secondary mt-5" onClick={onRetry}>Try again</button>}
    </div>
  );
}

/** Skeleton page placeholder: keeps layout stable while data loads. */
export function PageLoader({ label = 'Loading…' }) {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">{label}</span>
      <div className="space-y-2"><Skeleton className="h-8 w-64" /><Skeleton className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-6 md:grid-cols-3"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
      <Skeleton className="h-64" />
    </div>
  );
}

/** Plain-language reading of a 0-100 score. */
export function scoreVerdict(v) {
  if (v >= 85) return { label: 'Excellent', tone: 'green', text: 'Strong and ready to send.' };
  if (v >= 70) return { label: 'Good', tone: 'green', text: 'Solid. A few targeted fixes will lift it.' };
  if (v >= 50) return { label: 'Needs work', tone: 'amber', text: 'Fix the high-priority items first.' };
  return { label: 'Weak', tone: 'red', text: 'Significant gaps. Start with the missing sections.' };
}

export function Verdict({ value }) {
  const v = scoreVerdict(value);
  const cls = { green: 'badge-green', amber: 'badge-amber', red: 'badge-red' }[v.tone];
  return <span className={cls} title={v.text}>{v.label}</span>;
}

export function CopyButton({ text, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); }
    catch { /* clipboard blocked: nothing to do */ }
  };
  return <button type="button" onClick={copy} className="btn-ghost px-2.5 py-1 text-xs">{done ? 'Copied' : label}</button>;
}

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
      {error && <p id={`${htmlFor}-err`} className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export function SkillChip({ children, tone = 'indigo' }) {
  const cls = { indigo: 'badge-indigo', green: 'badge-green', amber: 'badge-amber', red: 'badge-red', gray: 'badge-gray' }[tone];
  return <span className={cls}>{children}</span>;
}

export function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        {Icon && <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo"><Icon className="h-5 w-5" aria-hidden /></span>}
      </div>
      <p className="mt-3 text-3xl font-extrabold">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
}

export const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
