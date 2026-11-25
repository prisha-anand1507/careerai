import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Field, Spinner } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validatePassword = (p) => {
  if (!p) return 'Enter a password.';
  if (p.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(p) || !/\d/.test(p)) return 'Include letters and at least one number.';
  return '';
};

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center bg-hero-glow px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="card p-8 shadow-lift">
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mt-1 text-sm text-navy-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-6 text-center text-sm text-navy-500">{footer}</p>
      </div>
    </div>
  );
}

function PasswordInput({ id, value, onChange, error, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-navy-400" aria-hidden />
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete}
        placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        className={`input pl-10 pr-10 ${error ? 'input-error' : ''}`} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-2.5 text-navy-400 hover:text-navy">
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

function IconInput({ icon: Icon, id, error, ...props }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-navy-400" aria-hidden />
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`input pl-10 ${error ? 'input-error' : ''}`} {...props} />
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setErrors({ form: errorMessage(err, 'Login failed.') });
    } finally { setBusy(false); }
  };

  return (
    <Shell title="Welcome back" subtitle="Log in to continue your career journey."
      footer={<>New to CareerAI? <Link to="/register" className="font-semibold text-indigo hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
        <Field label="Email" htmlFor="email" error={errors.email}>
          <IconInput icon={Mail} id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="current-password" placeholder="Your password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-indigo hover:underline">Forgot password?</Link></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" /> Logging in…</> : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email)) errs.email = 'Enter a valid email address.';
    const pw = validatePassword(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success('Account created. Upload your resume to get started.');
      navigate('/app', { replace: true });
    } catch (err) {
      setErrors({ ...(err.response?.data?.errors || {}), form: errorMessage(err, 'Registration failed.') });
    } finally { setBusy(false); }
  };

  return (
    <Shell title="Create your account" subtitle="Start analyzing your resume in minutes."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-indigo hover:underline">Log in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <IconInput icon={User} id="name" autoComplete="name" placeholder="Asha Rao" value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <IconInput icon={Mail} id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="8+ characters with letters and a number.">
          <PasswordInput id="password" autoComplete="new-password" placeholder="Create a password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" placeholder="Repeat password" value={form.confirm} error={errors.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        </Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" /> Creating account…</> : 'Create account'}</button>
        <p className="text-center text-xs text-navy-500">By signing up you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) { setError('Enter a valid email address.'); return; }
    setError(''); setBusy(true);
    try { await api.post('/auth/forgot-password', { email }); setSent(true); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Forgot your password?" subtitle="Enter your email and we'll send a reset link."
      footer={<Link to="/login" className="inline-flex items-center gap-1 font-semibold text-indigo hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to login</Link>}>
      {sent ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          If that email is registered, a reset link has been sent. It expires in 30 minutes.
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field label="Email" htmlFor="email" error={error}>
            <IconInput icon={Mail} id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" /> Sending…</> : 'Send reset link'}</button>
        </form>
      )}
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    const pw = validatePassword(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (err) { setErrors({ form: errorMessage(err) }); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Set a new password" subtitle="Choose a strong password for your account."
      footer={<Link to="/login" className="font-semibold text-indigo hover:underline">Back to login</Link>}>
      {!token ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">This reset link is missing its token. Request a new one from the Forgot password page.</div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          {errors.form && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
          <Field label="New password" htmlFor="password" error={errors.password}>
            <PasswordInput id="password" autoComplete="new-password" value={form.password} error={errors.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
            <PasswordInput id="confirm" autoComplete="new-password" value={form.confirm} error={errors.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? <><Spinner className="h-4 w-4" /> Saving…</> : 'Update password'}</button>
        </form>
      )}
    </Shell>
  );
}
