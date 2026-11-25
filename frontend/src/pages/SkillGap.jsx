import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Flame, TrendingUp } from 'lucide-react';
import AnalysisGate from '../components/AnalysisGate';
import { PageHeader, SkillChip } from '../components/ui';

const evidenceTone = { Demonstrated: 'green', Mentioned: 'indigo', Listed: 'gray' };

export default function SkillGap() {
  return (
    <>
      <PageHeader title="Skill Gap Analysis" subtitle="Compare the skills in your resume with what your best-matched roles and the market commonly expect." />
      <AnalysisGate emptyText="Upload your resume to see which skills you have and which to prioritize.">
        {(data) => {
          const g = data.skillGap;
          const top = data.recommendations?.[0];
          const have = top ? top.skills_you_have.length : 0;
          const miss = top ? top.missing_skills.length : 0;
          const pie = [{ name: 'Have', value: have, fill: '#059669' }, { name: 'Missing', value: miss, fill: '#F59E0B' }];
          const demand = [
            { name: 'In-demand skills', Have: g.in_demand_have.length, Missing: g.in_demand_missing.length },
          ];
          return (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="card">
                  <h2 className="font-bold">Coverage for {g.target_role || 'your top role'}</h2>
                  <div className="h-60">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                          {pie.map((p) => <Cell key={p.name} fill={p.fill} />)}
                        </Pie>
                        <Tooltip /><Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm text-navy-500">{have} of {have + miss} role skills found in your resume</p>
                </div>
                <div className="card">
                  <h2 className="font-bold">Common in-demand skills</h2>
                  <p className="text-xs text-navy-500">From a curated list of skills frequently requested in tech postings; not live market data.</p>
                  <div className="h-48">
                    <ResponsiveContainer>
                      <BarChart data={demand} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EAECF0" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip /><Legend />
                        <Bar dataKey="Have" stackId="a" fill="#059669" radius={[6, 0, 0, 6]} />
                        <Bar dataKey="Missing" stackId="a" fill="#F59E0B" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.in_demand_have.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>)}
                    {g.in_demand_missing.map((s) => <SkillChip key={s} tone="amber">{s}</SkillChip>)}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="card">
                  <h2 className="mb-3 font-bold text-emerald-700">Existing skills ({g.existing_skills.length})</h2>
                  <div className="flex flex-wrap gap-2">{g.existing_skills.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>)}</div>
                </section>
                <section className="card">
                  <h2 className="mb-3 font-bold text-amber-700">Missing skills ({g.missing_skills.length})</h2>
                  <div className="flex flex-wrap gap-2">{g.missing_skills.map((s) => <SkillChip key={s} tone="amber">{s}</SkillChip>)}</div>
                  <p className="mt-3 text-xs text-navy-500">Gaps across your top four matched roles.</p>
                </section>
              </div>

              <section className="card">
                <h2 className="mb-4 flex items-center gap-2 font-bold"><Flame className="h-5 w-5 text-indigo" aria-hidden /> Skills to prioritize</h2>
                {g.prioritized.length === 0 ? <p className="text-sm text-navy-500">No gaps found against your top roles.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="border-b border-navy-200 text-xs uppercase tracking-wide text-navy-500">
                        <th className="py-2 pr-4">Skill</th><th className="py-2 pr-4">Needed by top roles</th><th className="py-2 pr-4">In demand</th><th className="py-2">Priority</th>
                      </tr></thead>
                      <tbody>
                        {g.prioritized.map((p, i) => (
                          <tr key={p.skill} className="border-b border-navy-100">
                            <td className="py-3 pr-4 font-semibold">{p.skill}</td>
                            <td className="py-3 pr-4">{p.needed_by_top_roles} of 4</td>
                            <td className="py-3 pr-4">{p.in_demand ? <SkillChip tone="green">Yes</SkillChip> : <SkillChip tone="gray">—</SkillChip>}</td>
                            <td className="py-3">{p.core_for_best_match ? <SkillChip tone="red">High: core for {g.target_role}</SkillChip> : i < 5 ? <SkillChip tone="amber">Medium</SkillChip> : <SkillChip tone="gray">Later</SkillChip>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section className="card">
                  <h2 className="mb-1 font-bold">Skill proficiency overview</h2>
                  <p className="mb-4 text-xs text-navy-500">{g.proficiency_note}</p>
                  <ul className="space-y-3">
                    {g.proficiency.map((p) => (
                      <li key={p.skill} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{p.skill}</span>
                        <span className="flex items-center gap-2"><span className="text-xs text-navy-500">{p.mentions}× in resume</span><SkillChip tone={evidenceTone[p.evidence_level]}>{p.evidence_level}</SkillChip></span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="card">
                  <h2 className="mb-4 flex items-center gap-2 font-bold"><TrendingUp className="h-5 w-5 text-indigo" aria-hidden /> Personalized learning plan{g.target_role ? ` for ${g.target_role}` : ''}</h2>
                  <ol className="space-y-3">
                    {g.learning_recommendations.map((l, i) => (
                      <li key={l} className="flex gap-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo">{i + 1}</span>{l}</li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
          );
        }}
      </AnalysisGate>
    </>
  );
}
