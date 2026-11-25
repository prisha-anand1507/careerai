import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, Trash2, History as HistoryIcon, ArrowUp, ArrowDown, Minus, Search } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { EmptyState, ErrorState, PageHeader, PageLoader, SkillChip, Spinner, fmtDate } from '../components/ui';

function Delta({ v }) {
  if (v === 0) return <span className="inline-flex items-center gap-1 text-navy-500"><Minus className="h-4 w-4" aria-hidden /> no change</span>;
  const up = v > 0;
  return <span className={`inline-flex items-center gap-1 font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>{up ? <ArrowUp className="h-4 w-4" aria-hidden /> : <ArrowDown className="h-4 w-4" aria-hidden />}{up ? '+' : ''}{v}</span>;
}

export default function History() {
  const toast = useToast();
  const [state, setState] = useState({ loading: true, error: null, items: [] });
  const [selected, setSelected] = useState([]);
  const [cmp, setCmp] = useState(null);
  const [cmpBusy, setCmpBusy] = useState(false);
  const [query, setQuery] = useState('');

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get('/analyses').then((r) => setState({ loading: false, error: null, items: r.data.analyses }))
      .catch((e) => setState({ loading: false, error: errorMessage(e), items: [] }));
  };
  useEffect(load, []);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= 2 ? [s[1], id] : [...s, id]));

  const compare = async () => {
    // compare older → newer so deltas read as progress
    const [x, y] = state.items.filter((i) => selected.includes(i.id)).sort((p, q) => new Date(p.createdAt) - new Date(q.createdAt));
    setCmpBusy(true);
    try { const { data } = await api.get('/analyses/compare', { params: { a: x.id, b: y.id } }); setCmp(data); }
    catch (e) { toast.error(errorMessage(e)); }
    finally { setCmpBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this analysis? This cannot be undone.')) return;
    try {
      await api.delete(`/analyses/${id}`);
      toast.success('Analysis deleted.');
      setSelected((s) => s.filter((x) => x !== id)); setCmp(null); load();
    } catch (e) { toast.error(errorMessage(e)); }
  };

  if (state.loading) return <PageLoader label="Loading history…" />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const items = state.items;
  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((i) => `${i.label} ${i.filename} ${i.topRole || ''}`.toLowerCase().includes(q)) : items;
  const trend = [...items].reverse().map((i) => ({ date: fmtDate(i.createdAt), Overall: i.overallScore, ATS: i.atsScore }));

  return (
    <div className="space-y-6">
      <PageHeader title="Analysis History" subtitle="Revisit past reports, compare resume versions, and track your progress."
        actions={<button className="btn-primary" disabled={selected.length !== 2 || cmpBusy} onClick={compare}>{cmpBusy ? <Spinner className="h-4 w-4" /> : <GitCompare className="h-4 w-4" aria-hidden />} Compare selected ({selected.length}/2)</button>} />

      {items.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No analyses yet" text="Your resume analyses will appear here so you can compare versions over time."
          action={<Link to="/app/analyze" className="btn-primary">Analyze a resume</Link>} />
      ) : (
        <>
          {items.length > 1 && (
            <div className="card">
              <h2 className="font-bold">Score trend</h2>
              <div className="h-56">
                <ResponsiveContainer>
                  <LineChart data={trend} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                    <Line type="monotone" dataKey="Overall" stroke="#6366F1" strokeWidth={2.5} dot />
                    <Line type="monotone" dataKey="ATS" stroke="#3B82F6" strokeWidth={2.5} dot />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-navy-400" aria-hidden />
            <input type="search" className="input pl-10" placeholder="Search by label, file, or top role" aria-label="Search analyses" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="card p-0">
            {shown.length === 0 && <p className="p-8 text-center text-sm text-navy-500">No analyses match &ldquo;{query}&rdquo;.</p>}
            <ul className="divide-y divide-navy-100">
              {shown.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
                  <input type="checkbox" className="h-4 w-4 rounded border-navy-300 text-indigo" checked={selected.includes(i.id)} onChange={() => toggle(i.id)} aria-label={`Select ${i.label || i.filename} for comparison`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{i.label || i.filename}</p>
                    <p className="text-xs text-navy-500">{i.label ? `${i.filename} · ` : ''}{fmtDate(i.createdAt)} · {i.skillCount} skills{i.topRole ? ` · Top match: ${i.topRole} (${i.topMatch}%)` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2"><SkillChip tone="indigo">Overall {i.overallScore}</SkillChip><SkillChip tone="gray">ATS {i.atsScore}</SkillChip></div>
                  <div className="flex items-center gap-1">
                    <Link to={`/app/report/${i.id}`} className="btn-ghost px-3 py-1.5">Report</Link>
                    <Link to={`/app/careers?id=${i.id}`} className="btn-ghost px-3 py-1.5">Careers</Link>
                    <button className="btn-ghost px-3 py-1.5 text-red-600 hover:bg-red-50" onClick={() => remove(i.id)} aria-label={`Delete ${i.label || i.filename}`}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {cmp && (
        <section className="card space-y-5" aria-live="polite">
          <h2 className="text-lg font-bold">Version comparison</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Earlier', cmp.a], ['Later', cmp.b]].map(([lbl, d]) => (
              <div key={lbl} className="rounded-xl bg-navy-50 p-4">
                <p className="text-xs font-semibold uppercase text-navy-500">{lbl} · {fmtDate(d.createdAt)}</p>
                <p className="mt-1 truncate font-semibold">{d.label || d.filename}</p>
                <p className="mt-2 text-sm">Overall <b>{d.overallScore}</b> · ATS <b>{d.atsScore}</b></p>
                <p className="text-sm text-navy-600">Top role: {d.recommendations?.[0]?.role || 'n/a'}</p>
              </div>
            ))}
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between rounded-xl border border-navy-200 p-3"><dt>Overall score</dt><dd><Delta v={cmp.diff.overallScore} /></dd></div>
            <div className="flex justify-between rounded-xl border border-navy-200 p-3"><dt>ATS score</dt><dd><Delta v={cmp.diff.atsScore} /></dd></div>
          </dl>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="mb-2 text-sm font-semibold text-emerald-700">Skills added</h3><div className="flex flex-wrap gap-2">{cmp.diff.skillsAdded.length ? cmp.diff.skillsAdded.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <span className="text-sm text-navy-500">None</span>}</div></div>
            <div><h3 className="mb-2 text-sm font-semibold text-red-700">Skills no longer detected</h3><div className="flex flex-wrap gap-2">{cmp.diff.skillsRemoved.length ? cmp.diff.skillsRemoved.map((s) => <SkillChip key={s} tone="red">{s}</SkillChip>) : <span className="text-sm text-navy-500">None</span>}</div></div>
          </div>
        </section>
      )}
    </div>
  );
}
