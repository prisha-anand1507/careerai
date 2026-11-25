import { ArrowRight, CheckCircle2, XCircle, Info } from 'lucide-react';
import AnalysisGate from '../components/AnalysisGate';
import { PageHeader, ScoreRing } from '../components/ui';

const prio = { high: 'badge-red', medium: 'badge-amber', low: 'badge-gray' };

export default function Improvements() {
  return (
    <>
      <PageHeader title="Resume Improvement Suggestions" subtitle="Specific fixes based on your resume's own text. Rewrites are templates: replace bracketed parts with your real facts and numbers." />
      <AnalysisGate emptyText="Upload your resume to get tailored suggestions with before-and-after examples.">
        {(data) => {
          const items = data.analysis.suggestions.items;
          const checks = data.analysis.ats_checks;
          return (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="card flex justify-center lg:col-span-1"><ScoreRing value={data.atsScore} label="ATS readability" sublabel={`${checks.filter((c) => c.passed).length} of ${checks.length} checks passed`} /></div>
                <div className="card lg:col-span-2">
                  <h2 className="mb-3 font-bold">ATS readability checks</h2>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {checks.map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-sm">
                        {c.passed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />}
                        <span><span className={c.passed ? '' : 'font-semibold'}>{c.label}</span>{!c.passed && <span className="block text-xs text-navy-500">{c.tip}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {items.length === 0 && <div className="card text-sm text-navy-600">No major improvements flagged. Nice work.</div>}

              {items.map((s) => (
                <section key={s.area} className="card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">{s.area}</h2>
                    <span className={prio[s.priority] || 'badge-gray'}>{s.priority} priority</span>
                  </div>
                  <p className="mt-2 text-sm text-navy-700">{s.tip}</p>

                  {s.example_template && (
                    <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm"><p className="mb-1 text-xs font-semibold uppercase text-indigo-700">Template</p>{s.example_template}</div>
                  )}

                  {s.examples?.length > 0 && (
                    <div className="mt-5 space-y-4">
                      {s.examples.map((ex) => (
                        <div key={ex.before} className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
                          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                            <p className="mb-1 text-xs font-semibold uppercase text-red-700">Before (from your resume)</p>
                            <p className="text-sm">{ex.before}</p>
                          </div>
                          <ArrowRight className="hidden self-center text-navy-400 md:block" aria-hidden />
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                            <p className="mb-1 text-xs font-semibold uppercase text-emerald-700">After (template)</p>
                            <p className="text-sm">{ex.after}</p>
                          </div>
                          <p className="flex items-start gap-1.5 text-xs text-navy-500 md:col-span-3"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{ex.why}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {s.details?.length > 0 && (
                    <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-navy-700">{s.details.map((d) => <li key={d}>{d}</li>)}</ul>
                  )}
                </section>
              ))}
            </div>
          );
        }}
      </AnalysisGate>
    </>
  );
}
