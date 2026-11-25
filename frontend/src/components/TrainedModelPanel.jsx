import { Brain, CheckCircle2, XCircle, Info, PlugZap } from 'lucide-react';
import { ProgressBar, SkillChip } from './ui';

/** Shows output of the Colab-trained model (domain classifier + match-score regressor). */
export default function TrainedModelPanel({ tm }) {
  if (!tm || !tm.available) {
    return (
      <section className="card border-dashed" aria-label="Trained model status">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy-100 text-navy-500"><PlugZap className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="font-bold">Trained model not connected</h2>
            <p className="mt-1 text-sm text-navy-500">
              Put <code className="rounded bg-navy-100 px-1.5 py-0.5 text-xs">resume_analyzer_v2_bundle.pkl</code> in <code className="rounded bg-navy-100 px-1.5 py-0.5 text-xs">ml-service/models/</code> and restart the ML service to add domain prediction and trained match scores. The role matches below still work without it.
            </p>
            {tm?.reason && <p className="mt-2 text-xs text-navy-400">Reason: {tm.reason}</p>}
          </div>
        </div>
      </section>
    );
  }

  const acc = Math.round((tm.model_info?.reported_metrics?.classifier_accuracy || 0) * 100);
  const top = tm.domain_candidates || [];

  return (
    <section className="card space-y-6" aria-label="Trained model results">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white"><Brain className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 className="font-bold">Trained model results</h2>
            <p className="text-sm text-navy-500">{tm.model_info.classifier} classifier · {tm.model_info.regressor} match scorer</p>
          </div>
        </div>
        <SkillChip tone="gray">~{acc}% domain accuracy on held-out data</SkillChip>
      </div>

      {tm.warnings?.length > 0 && (
        <ul className="space-y-1.5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          {tm.warnings.map((w) => <li key={w} className="flex gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{w}</li>)}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy-600">Predicted industry domain</h3>
          <div className="space-y-3">
            {top.map((d, i) => <ProgressBar key={d.domain} label={d.domain.replace(/-/g, ' ')} value={Math.round(d.probability * 100)} color={i === 0 ? undefined : '#93C5FD'} />)}
          </div>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold text-navy-600">Benchmark role matches</h3>
          <div className="space-y-3">
            {tm.benchmark_matches.slice(0, 5).map((m, i) => (
              <ProgressBar key={m.category} label={`${m.role_title}`} value={Math.round(m.match_score)} color={i === 0 ? undefined : '#93C5FD'} />
            ))}
          </div>
        </div>
      </div>

      {tm.jd_match && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 className="font-bold">Your target job description</h3>
          <p className="mt-1 text-3xl font-extrabold">{Math.round(tm.jd_match.score)}<span className="text-lg text-navy-400">% match</span></p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden /> You have</p>
              <div className="flex flex-wrap gap-1.5">{tm.jd_match.matched_skills.length ? tm.jd_match.matched_skills.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <span className="text-sm text-navy-500">None detected</span>}</div>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-red-700"><XCircle className="h-4 w-4" aria-hidden /> Missing</p>
              <div className="flex flex-wrap gap-1.5">{tm.jd_match.missing_skills.length ? tm.jd_match.missing_skills.map((s) => <SkillChip key={s} tone="red">{s}</SkillChip>) : <span className="text-sm text-emerald-700">Nothing missing</span>}</div>
            </div>
          </div>
        </div>
      )}

      <details className="text-sm text-navy-600">
        <summary className="cursor-pointer font-semibold text-navy-700">How to read these results</summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>{tm.coverage_note}</li>
          <li>{tm.model_info.labels_note}</li>
          <li>Reported on held-out data: classifier accuracy {acc}%, match-score R² {tm.model_info.reported_metrics.regressor_r2}, mean error ±{tm.model_info.reported_metrics.regressor_mae} points.</li>
        </ul>
      </details>
    </section>
  );
}
