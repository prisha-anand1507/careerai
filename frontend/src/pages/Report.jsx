import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, GraduationCap, Briefcase, FolderGit2, Award, FileText, Compass, Wand2, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import api, { errorMessage } from '../api/client';
import useAnalysis from '../hooks/useAnalysis';
import { ErrorState, PageHeader, ScoreRing, Skeleton, SkillChip, TabPanel, Tabs, fmtDate } from '../components/ui';

const catLabel = (c) => c.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
const TAB_IDS = ['overview', 'skills', 'sections', 'text'];

function Block({ icon: Icon, title, children }) {
  return (
    <section className="card">
      <h2 className="mb-4 flex items-center gap-2 font-bold"><Icon className="h-5 w-5 text-indigo" aria-hidden /> {title}</h2>
      {children}
    </section>
  );
}

function Notes({ notes }) {
  if (!notes?.length) return <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden /> Nothing to fix here.</p>;
  return <ul className="space-y-2">{notes.map((n) => <li key={n} className="flex gap-2 text-sm text-navy-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />{n}</li>)}</ul>;
}

const Stat = ({ label, value }) => (
  <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">{label}</p><p className="mt-0.5 font-bold">{value}</p></div>
);

function ReportSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading report">
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-64" /><Skeleton className="h-64 lg:col-span-2" /></div>
      <Skeleton className="h-40" />
    </div>
  );
}

export default function Report() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TAB_IDS.includes(params.get('tab')) ? params.get('tab') : 'overview';
  const setTab = (t) => setParams(t === 'overview' ? {} : { tab: t }, { replace: true });
  const { data, loading, error } = useAnalysis(id);
  const [text, setText] = useState(null);
  const [textErr, setTextErr] = useState('');

  if (loading) return <ReportSkeleton />;
  if (error) return <ErrorState message={error} />;
  const a = data.analysis;

  const loadText = async () => {
    try { const r = await api.get(`/analyses/${id}/text`); setText(r.data.text || '(no text stored)'); }
    catch (e) { setTextErr(errorMessage(e)); }
  };

  const radar = Object.entries(a.score_breakdown).map(([k, v]) => ({ k, v }));
  const tech = {};
  a.technical_skills.forEach((s) => { (tech[s.category] ||= []).push(s); });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: 'Skills', badge: a.technical_skills.length },
    { id: 'sections', label: 'Sections', badge: a.missing_sections.length ? `${a.missing_sections.length} missing` : undefined },
    { id: 'text', label: 'Extracted text' },
  ];

  return (
    <div>
      <PageHeader title="Resume Analysis Report"
        subtitle={`${data.filename} · analyzed ${fmtDate(data.createdAt)}${data.label ? ` · ${data.label}` : ''}`}
        actions={<>
          <Link to={`/app/careers?id=${id}`} className="btn-secondary"><Compass className="h-4 w-4" aria-hidden /> Careers</Link>
          <Link to={`/app/skill-gap?id=${id}`} className="btn-secondary"><BarChart3 className="h-4 w-4" aria-hidden /> Skill gap</Link>
          <Link to={`/app/improvements?id=${id}`} className="btn-primary"><Wand2 className="h-4 w-4" aria-hidden /> Improve</Link>
        </>} />

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Report sections" />

      <TabPanel id="overview" value={tab}>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card flex items-center justify-around lg:col-span-1">
            <ScoreRing value={data.overallScore} label="Overall score" sublabel="out of 100" />
            <ScoreRing value={data.atsScore} label="ATS score" sublabel="compatibility" />
          </div>
          <div className="card lg:col-span-2">
            <h2 className="font-bold">Score breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <RadarChart data={radar} outerRadius="75%">
                  <PolarGrid stroke="#EAECF0" />
                  <PolarAngleAxis dataKey="k" tick={{ fontSize: 12, fill: '#475467' }} />
                  <Radar name="Score" dataKey="v" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card">
            <h2 className="mb-3 font-bold text-emerald-700">Resume strengths</h2>
            <ul className="space-y-2">{a.strengths.map((s) => <li key={s} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{s}</li>)}</ul>
          </section>
          <section className="card">
            <h2 className="mb-3 font-bold text-amber-700">Areas for improvement</h2>
            {a.improvements.length ? <Notes notes={a.improvements} /> : <p className="text-sm text-navy-500">No major gaps detected.</p>}
            <Link to={`/app/improvements?id=${id}`} className="mt-4 inline-flex text-sm font-semibold text-indigo hover:underline">See how to fix these →</Link>
          </section>
        </div>
      </TabPanel>

      <TabPanel id="skills" value={tab}>
        <Block icon={FileText} title={`Technical skills (${a.technical_skills.length})`}>
          {a.technical_skills.length === 0 && <p className="text-sm text-navy-500">No technical skills detected. List tools explicitly in a Skills section.</p>}
          {Object.entries(tech).map(([cat, items]) => (
            <div key={cat} className="mb-4 last:mb-0">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400">{catLabel(cat)}</p>
              <div className="flex flex-wrap gap-2">{items.map((s) => <SkillChip key={s.name}>{s.name}</SkillChip>)}</div>
            </div>
          ))}
        </Block>
        <Block icon={FileText} title={`Soft skills (${a.soft_skills.length})`}>
          <div className="flex flex-wrap gap-2">
            {a.soft_skills.length ? a.soft_skills.map((s) => <SkillChip key={s} tone="green">{s}</SkillChip>) : <p className="text-sm text-navy-500">None detected. Show them through outcomes in your bullets.</p>}
          </div>
        </Block>
      </TabPanel>

      <TabPanel id="sections" value={tab}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Block icon={GraduationCap} title="Education analysis">
            <div className="mb-4 grid grid-cols-2 gap-3">
              <Stat label="Highest level" value={a.education.highest_level || 'Not detected'} />
              <Stat label="CGPA" value={a.education.cgpa ? `${a.education.cgpa.value}/${a.education.cgpa.scale}` : 'Not found'} />
            </div>
            {a.education.institutions.length > 0 && <p className="mb-3 text-sm text-navy-600">{a.education.institutions.join(' · ')}</p>}
            <Notes notes={a.education.notes} />
          </Block>
          <Block icon={Briefcase} title="Experience analysis">
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Roles" value={a.experience.roles_detected} />
              <Stat label="≈ Years" value={a.experience.approx_years} />
              <Stat label="Action verbs" value={`${a.experience.action_verb_bullets}/${a.experience.bullet_count}`} />
              <Stat label="With metrics" value={`${a.experience.quantified_bullets}/${a.experience.bullet_count}`} />
            </div>
            <Notes notes={a.experience.notes} />
          </Block>
          <Block icon={FolderGit2} title="Project analysis">
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Stat label="Projects" value={a.projects.project_count} />
              <Stat label="Links" value={a.projects.has_links ? 'Yes' : 'No'} />
              <Stat label="With metrics" value={a.projects.quantified_bullets} />
            </div>
            {a.projects.technologies.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{a.projects.technologies.map((t) => <SkillChip key={t} tone="gray">{t}</SkillChip>)}</div>}
            <Notes notes={a.projects.notes} />
          </Block>
          <Block icon={Award} title="Certifications">
            {a.certifications.count ? <ul className="list-disc space-y-1 pl-5 text-sm">{a.certifications.items.map((c) => <li key={c}>{c}</li>)}</ul>
              : <p className="text-sm text-navy-500">No certifications section found.</p>}
          </Block>
        </div>
        <Block icon={XCircle} title="Missing important sections">
          {a.missing_sections.length === 0 ? <p className="flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" aria-hidden /> All key sections are present.</p> : (
            <ul className="grid gap-3 sm:grid-cols-2">{a.missing_sections.map((m) => (
              <li key={m.section} className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-sm"><span className="font-semibold text-red-700">{m.section}</span><span className="block text-navy-600">{m.why}</span></li>
            ))}</ul>
          )}
        </Block>
      </TabPanel>

      <TabPanel id="text" value={tab}>
        <Block icon={FileText} title="Document details & extracted text">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Words" value={a.document.words} />
            <Stat label="Characters" value={a.document.characters} />
            <Stat label="Pages" value={a.document.pages ?? 'n/a (DOCX)'} />
            <Stat label="Sections found" value={a.sections_found.length} />
          </div>
          <p className="mb-3 text-sm text-navy-500">This is what the analyzer actually read. If something is missing here, an ATS will miss it too.</p>
          {text === null ? (
            <button className="btn-secondary" onClick={loadText}>Show extracted text</button>
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-navy-50 p-4 text-xs text-navy-700">{text}</pre>
          )}
          {textErr && <p className="mt-2 text-sm text-red-600" role="alert">{textErr}</p>}
        </Block>
      </TabPanel>
    </div>
  );
}
