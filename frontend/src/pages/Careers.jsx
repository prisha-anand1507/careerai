import { useState } from 'react';
import { ChevronDown, Lightbulb, GraduationCap, BadgeCheck, CheckCircle2, XCircle, Cpu } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import AnalysisGate from '../components/AnalysisGate';
import { Callout, PageHeader, ProgressBar, ScoreRing, SkillChip, TabPanel, Tabs } from '../components/ui';

function RoleCard({ r, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className="card card-hover">
      <button className="flex w-full items-center gap-5 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <ScoreRing value={r.match_percentage} size={72} stroke={7} />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{r.role}</h2>
          <p className="mt-0.5 text-sm text-navy-500">{r.description}</p>
          <p className="mt-2 text-xs font-medium text-navy-600">{r.skills_you_have.length} skills matched · {r.missing_skills.length} to learn</p>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-navy-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div className="mt-6 space-y-6 border-t border-navy-100 pt-6">
          <section className="rounded-xl bg-indigo-50 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-700"><Lightbulb className="h-4 w-4" aria-hidden /> Why this role was recommended</h3>
            <ul className="space-y-1.5 text-sm text-navy-700">{r.why.map((w) => <li key={w}>• {w}</li>)}</ul>
          </section>

          <div className="grid gap-6 md:grid-cols-3">
            <section>
              <h3 className="mb-2 text-sm font-bold">Required skills</h3>
              <div className="flex flex-wrap gap-1.5">{r.required_skills.map((s) => <SkillChip key={s} tone={r.skills_you_have.includes(s) ? 'green' : 'gray'}>{s}</SkillChip>)}</div>
            </section>
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden /> Skills you have</h3>
              <div className="flex flex-wrap gap-1.5">{r.skills_you_have.length ? r.skills_you_have.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <p className="text-sm text-navy-500">None yet.</p>}</div>
            </section>
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-red-700"><XCircle className="h-4 w-4" aria-hidden /> Missing skills</h3>
              <div className="flex flex-wrap gap-1.5">{r.missing_skills.length ? r.missing_skills.map((s) => <SkillChip key={s} tone={r.missing_core_skills.includes(s) ? 'red' : 'amber'}>{s}</SkillChip>) : <p className="text-sm text-navy-500">Nothing missing.</p>}</div>
              {r.missing_core_skills.length > 0 && <p className="mt-2 text-xs text-navy-500">Red = core skill for this role.</p>}
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><GraduationCap className="h-4 w-4 text-indigo" aria-hidden /> Suggested learning path</h3>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-navy-700">{r.learning_path.map((p) => <li key={p}>{p}</li>)}</ol>
            </section>
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><BadgeCheck className="h-4 w-4 text-indigo" aria-hidden /> Relevant certifications</h3>
              <ul className="list-disc space-y-1.5 pl-5 text-sm text-navy-700">{r.certifications.map((c) => <li key={c}>{c}</li>)}</ul>
            </section>
          </div>
        </div>
      )}
    </article>
  );
}

/** Output of the Colab-trained bundle (classifier + match-score regressor), served by the ML service. */
function TrainedModelPanel({ tm }) {
  if (!tm || !tm.available) {
    return (
      <Callout tone="info" title="Trained model not installed">
        <p>This analysis ran without the Colab-trained model{tm?.reason ? ` (${tm.reason})` : ''}.</p>
        <p className="mt-2">To enable it: copy <code className="rounded bg-white px-1">resume_analyzer_v2_bundle.pkl</code> from Colab into <code className="rounded bg-white px-1">ml-service/models/</code>, restart the ML service, then analyze again.</p>
      </Callout>
    );
  }
  const info = tm.model_info || {};
  const m = info.reported_metrics || {};
  const top = tm.domain_candidates || [];
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-1">
          <h2 className="flex items-center gap-2 font-bold"><Cpu className="h-5 w-5 text-indigo" aria-hidden /> Predicted industry domain</h2>
          <p className="mt-3 text-2xl font-extrabold">{tm.predicted_domain.domain.replace(/-/g, ' ')}</p>
          <p className="text-xs text-navy-500">Confidence {Math.round(tm.predicted_domain.probability * 100)}%</p>
          <div className="mt-4 space-y-3">
            {top.map((d) => <ProgressBar key={d.domain} label={d.domain.replace(/-/g, ' ')} value={Math.round(d.probability * 100)} />)}
          </div>
        </section>

        <section className="card lg:col-span-2">
          <h2 className="font-bold">Benchmark role matches</h2>
          <p className="mb-4 text-xs text-navy-500">Predicted by the regressor from skill overlap, TF-IDF similarity, and skill breadth.</p>
          <div style={{ height: Math.max(200, tm.benchmark_matches.length * 34) }}>
            <ResponsiveContainer>
              <BarChart data={tm.benchmark_matches.map((x) => ({ role: x.role_title, match: x.match_score }))} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#667085' }} />
                <YAxis type="category" dataKey="role" width={190} tick={{ fontSize: 12, fill: '#344054' }} />
                <Tooltip cursor={{ fill: '#F2F4F7' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="match" name="Match" radius={[0, 6, 6, 0]}>
                  {tm.benchmark_matches.map((x, i) => <Cell key={x.category} fill={i === 0 ? '#6366F1' : '#93C5FD'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {tm.warnings?.map((w) => <Callout key={w} tone="warn">{w}</Callout>)}

      {tm.jd_match && (
        <section className="card">
          <h2 className="font-bold">Your target job description</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_1fr_1fr] md:items-start">
            <ScoreRing value={tm.jd_match.score} size={96} stroke={9} label="Predicted match" />
            <div><h3 className="mb-2 text-sm font-bold text-emerald-700">Matched skills</h3><div className="flex flex-wrap gap-1.5">{tm.jd_match.matched_skills.length ? tm.jd_match.matched_skills.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <p className="text-sm text-navy-500">None found.</p>}</div></div>
            <div><h3 className="mb-2 text-sm font-bold text-red-700">Missing skills</h3><div className="flex flex-wrap gap-1.5">{tm.jd_match.missing_skills.length ? tm.jd_match.missing_skills.map((s) => <SkillChip key={s} tone="red">{s}</SkillChip>) : <p className="text-sm text-navy-500">All required skills present.</p>}</div></div>
          </div>
        </section>
      )}

      <div className="space-y-3">
        {tm.benchmark_matches.slice(0, 5).map((m2) => (
          <details key={m2.category} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
              <span className="min-w-0"><span className="block truncate font-semibold">{m2.role_title}</span><span className="text-xs text-navy-500">{m2.category.replace(/-/g, ' ')} · {m2.matched_skills.length} matched · {m2.missing_skills.length} missing</span></span>
              <span className="flex items-center gap-3"><SkillChip tone={m2.match_score >= 60 ? 'green' : m2.match_score >= 35 ? 'amber' : 'gray'}>{m2.match_score}%</SkillChip><ChevronDown className="h-4 w-4 text-navy-400 transition group-open:rotate-180" aria-hidden /></span>
            </summary>
            <div className="grid gap-4 border-t border-navy-100 p-5 md:grid-cols-2">
              <div><h3 className="mb-2 text-sm font-bold text-emerald-700">Matched</h3><div className="flex flex-wrap gap-1.5">{m2.matched_skills.length ? m2.matched_skills.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <p className="text-sm text-navy-500">None.</p>}</div></div>
              <div><h3 className="mb-2 text-sm font-bold text-red-700">Missing</h3><div className="flex flex-wrap gap-1.5">{m2.missing_skills.slice(0, 14).map((s) => <SkillChip key={s} tone="amber">{s}</SkillChip>)}</div></div>
            </div>
          </details>
        ))}
      </div>

      <Callout title="How to read these results">
        <p>{tm.coverage_note}</p>
        <p className="mt-2">{info.labels_note}</p>
        <p className="mt-2 text-xs text-navy-500">
          {info.classifier} classifier ({Math.round((m.classifier_accuracy || 0) * 100)}% accuracy across {m.domains} domains) and {info.regressor} (R² {m.regressor_r2}, mean error ±{m.regressor_mae} points). {info.metrics_source}
        </p>
      </Callout>
    </>
  );
}

export default function Careers() {
  const [tab, setTab] = useState('roles');
  return (
    <>
      <PageHeader title="Career Recommendations" subtitle="Roles ranked by how closely your resume matches each role profile. Expand a role to see the evidence." />
      <AnalysisGate emptyText="Upload your resume and we'll rank roles against your skills, projects, and experience.">
        {(data) => {
          const recs = data.recommendations || [];
          const chart = recs.map((r) => ({ role: r.role, match: r.match_percentage }));
          const tm = data.trainedModel;
          return (
            <div>
              <Tabs label="Recommendation source" value={tab} onChange={setTab}
                tabs={[{ id: 'roles', label: 'Role profiles', badge: recs.length }, { id: 'trained', label: 'Trained model', badge: tm?.available ? 'on' : 'off' }]} />

              <TabPanel id="roles" value={tab}>
                <div className="card">
                  <h2 className="font-bold">Match overview</h2>
                  <p className="mb-2 text-xs text-navy-500">Based on {data.filename}. Scores are similarity to a role profile, not a hiring prediction.</p>
                  <div style={{ height: Math.max(220, recs.length * 36) }}>
                    <ResponsiveContainer>
                      <BarChart data={chart} layout="vertical" margin={{ left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#667085' }} />
                        <YAxis type="category" dataKey="role" width={150} tick={{ fontSize: 12, fill: '#344054' }} />
                        <Tooltip cursor={{ fill: '#F2F4F7' }} formatter={(v) => `${v}%`} />
                        <Bar dataKey="match" name="Match" radius={[0, 6, 6, 0]}>
                          {chart.map((c, i) => <Cell key={c.role} fill={i === 0 ? '#6366F1' : '#93C5FD'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="space-y-6">{recs.map((r, i) => <RoleCard key={r.role} r={r} defaultOpen={i === 0} />)}</div>
              </TabPanel>

              <TabPanel id="trained" value={tab}>
                <TrainedModelPanel tm={tm} />
              </TabPanel>
            </div>
          );
        }}
      </AnalysisGate>
    </>
  );
}
