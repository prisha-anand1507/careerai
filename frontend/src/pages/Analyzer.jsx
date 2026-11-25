import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { PageHeader, Spinner } from '../components/ui';

const MAX = 5 * 1024 * 1024;
const stages = ['Uploading resume', 'Extracting text', 'Detecting skills and sections', 'Scoring and matching careers'];

const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function Analyzer() {
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('');
  const [jd, setJd] = useState('');
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const inputRef = useRef(null);
  const toast = useToast();
  const navigate = useNavigate();

  const pick = (f) => {
    setError('');
    if (!f) return;
    if (!/\.(pdf|docx)$/i.test(f.name)) { setError('Only PDF and DOCX files are supported.'); return; }
    if (f.size > MAX) { setError('File is larger than 5 MB.'); return; }
    setFile(f);
  };

  const analyze = async () => {
    if (!file) { setError('Choose a resume first.'); return; }
    setBusy(true); setError(''); setProgress(0); setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 1800);
    const fd = new FormData();
    fd.append('resume', file);
    if (label.trim()) fd.append('label', label.trim());
    if (jd.trim()) fd.append('jobDescription', jd.trim());
    try {
      const { data } = await api.post('/analyses', fd, {
        onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      toast.success('Analysis complete.');
      navigate(`/app/report/${data.analysis._id}`);
    } catch (e) {
      const msg = errorMessage(e, 'Analysis failed.');
      setError(msg); toast.error(msg);
    } finally { clearInterval(timer); setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Analyze Resume" subtitle="Upload a PDF or DOCX. Your report includes scores, skills, section analysis, career matches, and improvement tips." />

      {busy ? (
        <div className="card py-12 text-center" role="status" aria-live="polite">
          <Spinner className="mx-auto h-10 w-10 text-indigo" />
          <h2 className="mt-5 text-lg font-bold">Analyzing your resume…</h2>
          <ol className="mx-auto mt-6 max-w-xs space-y-3 text-left">
            {stages.map((s, i) => (
              <li key={s} className={`flex items-center gap-3 text-sm ${i <= stage ? 'text-navy' : 'text-navy-400'}`}>
                {i < stage ? <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden /> : i === stage ? <Spinner className="h-5 w-5 text-indigo" /> : <span className="h-5 w-5 rounded-full border border-navy-300" />}
                {s}{i === 0 && progress > 0 && progress < 100 ? ` (${progress}%)` : ''}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
            className={`card border-2 border-dashed text-center transition ${drag ? 'border-indigo bg-indigo-50' : 'border-navy-300'}`}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-indigo" aria-hidden />
            <p className="mt-4 font-semibold">Drag and drop your resume here</p>
            <p className="mt-1 text-sm text-navy-500">PDF or DOCX · up to 5 MB</p>
            <input ref={inputRef} type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} aria-label="Choose resume file" />
            <button type="button" className="btn-secondary mt-5" onClick={() => inputRef.current?.click()}>Browse files</button>
          </div>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {file && (
            <div className="card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-500">Selected file</h2>
              <div className="mt-3 flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo"><FileText className="h-6 w-6" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{file.name}</p>
                  <p className="text-sm text-navy-500">{file.name.split('.').pop().toUpperCase()} · {fmtSize(file.size)} · modified {new Date(file.lastModified).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setFile(null)} aria-label="Remove file" className="rounded-lg p-2 text-navy-400 hover:bg-navy-100 hover:text-navy"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-5">
                <label htmlFor="label" className="label">Version label (optional)</label>
                <input id="label" className="input" maxLength={60} placeholder="e.g. Data roles v2" value={label} onChange={(e) => setLabel(e.target.value)} />
                <p className="mt-1 text-xs text-navy-500">Labels help you compare versions later in History.</p>
              </div>
              <div className="mt-5">
                <label htmlFor="jd" className="label">Target job description (optional)</label>
                <textarea id="jd" className="input" rows={4} maxLength={8000} placeholder="Paste a job posting to get a match score and the skills you are missing for it." value={jd} onChange={(e) => setJd(e.target.value)} />
                <p className="mt-1 text-xs text-navy-500">Scored by the trained model when it is installed on the ML service.</p>
              </div>
              <button className="btn-primary mt-6 w-full btn-lg" onClick={analyze}>Analyze resume</button>
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-navy-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Scanned or image-only PDFs can&apos;t be read. If extraction fails, export a text-based PDF or use DOCX.</p>
        </div>

        <aside className="card h-fit lg:sticky lg:top-6" aria-label="What your report includes">
          <h2 className="font-bold">What you&apos;ll get</h2>
          <ul className="mt-4 space-y-3 text-sm text-navy-700">
            {['Overall and ATS scores with the checks behind them', 'Technical and soft skills detected', 'Education, experience, and project analysis', 'Ranked career matches with reasons', 'Skill gaps and a learning path', 'Before-and-after rewrite templates'].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />{t}</li>
            ))}
          </ul>
          <p className="mt-5 border-t border-navy-100 pt-4 text-xs text-navy-500">Takes about 5–15 seconds. Your file is processed on your own ML service and only its text is stored.</p>
        </aside>
        </div>
      )}
    </div>
  );
}
