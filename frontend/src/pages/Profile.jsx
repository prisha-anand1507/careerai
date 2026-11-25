import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, PageHeader, ProgressBar, Spinner } from '../components/ui';

const ROLES = ['Data Scientist', 'Machine Learning Engineer', 'AI Engineer', 'Data Analyst', 'Python Developer', 'Software Developer', 'Business Analyst', 'NLP Engineer'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TagInput({ id, values, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim().replace(/,$/, '');
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-xl border border-navy-300 bg-white p-2 focus-within:border-indigo focus-within:ring-4 focus-within:ring-indigo/10">
        {values.map((v) => (
          <span key={v} className="badge-indigo gap-1.5">{v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input id={id} className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-sm outline-none" placeholder={placeholder} value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } else if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1)); }}
          onBlur={add} />
      </div>
      <p className="mt-1 text-xs text-navy-500">Press Enter or comma to add.</p>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name, email: user.email,
    education: user.education || [], experience: user.experience || [],
    technicalSkills: user.technicalSkills || [], careerInterests: user.careerInterests || [], preferredRoles: user.preferredRoles || [],
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updRow = (key, i, field, val) => set(key, form[key].map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.';
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Please fix the highlighted fields.'); return; }
    setBusy(true);
    try {
      const { data } = await api.put('/profile', form);
      setUser(data.user);
      toast.success('Profile saved.');
    } catch (err) {
      const msg = errorMessage(err);
      setErrors({ form: msg }); toast.error(msg);
    } finally { setBusy(false); }
  };

  const toggleRole = (r) => set('preferredRoles', form.preferredRoles.includes(r) ? form.preferredRoles.filter((x) => x !== r) : [...form.preferredRoles, r]);

  return (
    <form onSubmit={save} noValidate className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Your Profile" subtitle="Keep this up to date: your interests and preferred roles influence recommendations."
        actions={<button className="btn-primary" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" /> Saving…</> : 'Save changes'}</button>} />
      <div className="card"><ProgressBar label="Profile completion" value={user.profileCompletion} /></div>
      {errors.form && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}

      <section className="card grid gap-5 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Basic information</h2>
        <Field label="Name" htmlFor="p-name" error={errors.name}><input id="p-name" className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email" htmlFor="p-email" error={errors.email}><input id="p-email" type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between"><h2 className="font-bold">Education</h2>
          <button type="button" className="btn-secondary" onClick={() => set('education', [...form.education, { degree: '', institution: '', field: '', year: '' }])}><Plus className="h-4 w-4" aria-hidden /> Add</button></div>
        {form.education.length === 0 && <p className="text-sm text-navy-500">No education added yet.</p>}
        {form.education.map((r, i) => (
          <div key={i} className="grid gap-3 rounded-xl bg-navy-50 p-4 sm:grid-cols-2">
            <input className="input" aria-label="Degree" placeholder="Degree (e.g. B.Tech)" value={r.degree || ''} onChange={(e) => updRow('education', i, 'degree', e.target.value)} />
            <input className="input" aria-label="Field of study" placeholder="Field of study" value={r.field || ''} onChange={(e) => updRow('education', i, 'field', e.target.value)} />
            <input className="input" aria-label="Institution" placeholder="Institution" value={r.institution || ''} onChange={(e) => updRow('education', i, 'institution', e.target.value)} />
            <div className="flex gap-2">
              <input className="input" aria-label="Year" placeholder="Year" value={r.year || ''} onChange={(e) => updRow('education', i, 'year', e.target.value)} />
              <button type="button" className="btn-danger" aria-label="Remove education" onClick={() => set('education', form.education.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between"><h2 className="font-bold">Experience</h2>
          <button type="button" className="btn-secondary" onClick={() => set('experience', [...form.experience, { title: '', company: '', duration: '', description: '' }])}><Plus className="h-4 w-4" aria-hidden /> Add</button></div>
        {form.experience.length === 0 && <p className="text-sm text-navy-500">No experience added yet.</p>}
        {form.experience.map((r, i) => (
          <div key={i} className="grid gap-3 rounded-xl bg-navy-50 p-4 sm:grid-cols-2">
            <input className="input" aria-label="Job title" placeholder="Title" value={r.title || ''} onChange={(e) => updRow('experience', i, 'title', e.target.value)} />
            <input className="input" aria-label="Company" placeholder="Company" value={r.company || ''} onChange={(e) => updRow('experience', i, 'company', e.target.value)} />
            <input className="input sm:col-span-2" aria-label="Duration" placeholder="Duration (e.g. Jun 2024 – Aug 2024)" value={r.duration || ''} onChange={(e) => updRow('experience', i, 'duration', e.target.value)} />
            <textarea className="input sm:col-span-2" rows={2} aria-label="Description" placeholder="What you did and achieved" value={r.description || ''} onChange={(e) => updRow('experience', i, 'description', e.target.value)} />
            <button type="button" className="btn-danger sm:col-span-2" onClick={() => set('experience', form.experience.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4" aria-hidden /> Remove</button>
          </div>
        ))}
      </section>

      <section className="card space-y-5">
        <h2 className="font-bold">Skills & interests</h2>
        <Field label="Technical skills" htmlFor="p-skills"><TagInput id="p-skills" values={form.technicalSkills} onChange={(v) => set('technicalSkills', v)} placeholder="Python, SQL, React…" /></Field>
        <Field label="Career interests" htmlFor="p-interests"><TagInput id="p-interests" values={form.careerInterests} onChange={(v) => set('careerInterests', v)} placeholder="NLP, healthcare analytics, fintech…" /></Field>
        <div>
          <p className="label">Preferred job roles</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Preferred job roles">
            {ROLES.map((r) => {
              const on = form.preferredRoles.includes(r);
              return <button key={r} type="button" aria-pressed={on} onClick={() => toggleRole(r)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? 'border-indigo bg-indigo text-white' : 'border-navy-300 bg-white text-navy-700 hover:border-indigo'}`}>{r}</button>;
            })}
          </div>
        </div>
      </section>
    </form>
  );
}
