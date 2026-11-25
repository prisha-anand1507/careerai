import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, FileSearch, ShieldCheck, Layers, ArrowRight, UserCircle, Compass, CheckCircle2, Circle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EmptyState, ErrorState, ProgressBar, ScoreRing, Skeleton, SkillChip, StatCard, fmtDate } from '../components/ui';

function NextSteps({ steps }) {
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);
  return (
    <section className="card" aria-label="Next steps">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Your next steps</h2>
          <p className="text-sm text-navy-500">{next ? `Up next: ${next.label}` : 'You have completed every step. Nice work.'}</p>
        </div>
        <span className="badge-indigo">{done} of {steps.length} done</span>
      </div>
      <div className="mt-4"><ProgressBar value={Math.round((done / steps.length) * 100)} showValue={false} label="Checklist progress" /></div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className={`flex items-start gap-3 rounded-xl border p-3 text-sm transition hover:border-indigo ${s.done ? 'border-emerald-100 bg-emerald-50/50' : 'border-navy-200 bg-white'}`}>
              {s.done ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden /> : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-navy-300" aria-hidden />}
              <span><span className={`block font-semibold ${s.done ? 'text-navy-500 line-through' : ''}`}>{s.label}</span><span className="text-xs text-navy-500">{s.hint}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-9 w-80" />
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32 lg:col-span-2" /></div>
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-72" /><Skeleton className="h-72 lg:col-span-2" /></div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: null, latest: null, history: [] });

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.get('/analyses/latest'), api.get('/analyses')])
      .then(([l, h]) => setState({ loading: false, error: null, latest: l.data.analysis, history: h.data.analyses }))
      .catch((e) => setState({ loading: false, error: errorMessage(e), latest: null, history: [] }));
  };
  useEffect(load, []);

  if (state.loading) return <DashboardSkeleton />;
  if (state.error) return <ErrorState message={state.error} onRetry={load} />;

  const { latest, history } = state;
  const completion = user?.profileCompletion ?? 0;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const skills = latest?.analysis?.technical_skills || [];
  const byCategory = Object.entries(skills.reduce((acc, s) => ({ ...acc, [s.category]: (acc[s.category] || 0) + 1 }), {}))
    .map(([name, count]) => ({ name: name.replace('_', ' '), count }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {firstName} 👋</h1>
          <p className="mt-1 text-navy-500">{latest ? 'Here is where your latest resume stands.' : 'Upload your resume to get your first analysis.'}</p>
        </div>
        <Link to="/app/analyze" className="btn-primary"><UploadCloud className="h-4 w-4" aria-hidden /> Upload Resume</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card flex items-center gap-5 lg:col-span-1">
          <ScoreRing value={completion} size={96} stroke={9} />
          <div>
            <h2 className="font-bold">Profile completion</h2>
            <p className="mt-1 text-sm text-navy-500">{completion < 100 ? 'Complete your profile to sharpen recommendations.' : 'Your profile is complete.'}</p>
            <Link to="/app/profile" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo hover:underline"><UserCircle className="h-4 w-4" aria-hidden /> Edit profile</Link>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-3 lg:col-span-2">
          <StatCard icon={FileSearch} label="Overall score" value={latest ? `${latest.overallScore}/100` : '—'} hint={latest ? fmtDate(latest.createdAt) : 'No analysis yet'} />
          <StatCard icon={ShieldCheck} label="ATS compatibility" value={latest ? `${latest.atsScore}%` : '—'} hint={latest ? 'From 10 readability checks' : 'No analysis yet'} />
          <StatCard icon={Layers} label="Skills detected" value={latest ? skills.length : '—'} hint={`${history.length} analysis${history.length === 1 ? '' : 'es'} run`} />
        </div>
      </div>

      <NextSteps steps={[
        { label: 'Upload your first resume', hint: 'Get scores, skills, and career matches.', to: '/app/analyze', done: history.length > 0 },
        { label: 'Complete your profile', hint: 'Interests and preferred roles tune your matches.', to: '/app/profile', done: completion >= 100 },
        { label: 'Fix your top improvements', hint: 'Rewrite weak bullets, then upload the revised version.', to: '/app/improvements', done: history.length > 1 },
        { label: 'Reach an ATS score of 80+', hint: 'Follow the failed readability checks.', to: '/app/improvements', done: (latest?.atsScore ?? 0) >= 80 },
      ]} />

      {!latest ? (
        <EmptyState icon={FileSearch} title="No resume uploaded yet"
          text="Upload a PDF or DOCX to see your resume score, ATS compatibility, skills, and career matches."
          action={<Link to="/app/analyze" className="btn-primary">Analyze my resume</Link>} />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-1">
              <h2 className="font-bold">Latest analysis</h2>
              <p className="mt-0.5 truncate text-sm text-navy-500">{latest.filename}</p>
              <div className="mt-5 flex justify-around">
                <ScoreRing value={latest.overallScore} label="Overall" />
                <ScoreRing value={latest.atsScore} label="ATS" />
              </div>
              <Link to={`/app/report/${latest._id}`} className="btn-secondary mt-6 w-full">View full report <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>

            <div className="card lg:col-span-2">
              <h2 className="font-bold">Skills overview</h2>
              <div className="mt-4 h-48">
                <ResponsiveContainer>
                  <BarChart data={byCategory} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#667085' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#667085' }} />
                    <Tooltip cursor={{ fill: '#F2F4F7' }} />
                    <Bar dataKey="count" name="Skills" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.slice(0, 12).map((s) => <SkillChip key={s.name}>{s.name}</SkillChip>)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Recommended career paths</h2>
                <Link to="/app/careers" className="text-sm font-semibold text-indigo hover:underline">See all</Link>
              </div>
              <div className="mt-5 space-y-4">
                {(latest.recommendations || []).slice(0, 4).map((r) => <ProgressBar key={r.role} label={r.role} value={r.match_percentage} />)}
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <h2 className="font-bold">Recent analysis history</h2>
                <Link to="/app/history" className="text-sm font-semibold text-indigo hover:underline">View all</Link>
              </div>
              <ul className="mt-4 divide-y divide-navy-100">
                {history.slice(0, 5).map((h) => (
                  <li key={h.id}>
                    <Link to={`/app/report/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-indigo">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{h.label || h.filename}</span>
                        <span className="text-xs text-navy-500">{fmtDate(h.createdAt)}{h.topRole ? ` · ${h.topRole}` : ''}</span>
                      </span>
                      <SkillChip tone={h.overallScore >= 75 ? 'green' : h.overallScore >= 50 ? 'amber' : 'red'}>{h.overallScore}</SkillChip>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      {!latest && (
        <div className="card flex items-center gap-4"><Compass className="h-6 w-6 text-indigo" aria-hidden />
          <p className="text-sm text-navy-600">Tip: add your career interests and preferred roles in your profile so recommendations reflect what you want.</p>
        </div>
      )}
    </div>
  );
}
