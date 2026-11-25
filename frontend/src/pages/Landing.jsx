import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, FileSearch, ShieldCheck, Target, Compass, Briefcase, Wand2,
  UploadCloud, Cpu, BarChart3, Rocket, Quote, CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { ProgressBar } from '../components/ui';

const features = [
  { icon: FileSearch, title: 'AI Resume Analysis', text: 'NLP parses your PDF or DOCX and scores structure, skills, experience, and projects.' },
  { icon: ShieldCheck, title: 'ATS Compatibility Score', text: 'Ten concrete checks show how reliably applicant-tracking systems can read your resume.' },
  { icon: Target, title: 'Skill Gap Detection', text: 'See which skills you have, which top roles expect, and what to learn first.' },
  { icon: Compass, title: 'Personalized Career Recommendations', text: 'Ranked roles with a match percentage and a plain-language explanation of why.' },
  { icon: Briefcase, title: 'Job Role Matching', text: 'Compare yourself against eight role profiles using TF-IDF similarity and weighted skill coverage.' },
  { icon: Wand2, title: 'Resume Improvement Suggestions', text: 'Actionable fixes with before-and-after rewrites drawn from your own bullet points.' },
];

const steps = [
  { icon: UploadCloud, title: 'Upload Your Resume', text: 'Drag and drop a PDF or DOCX.' },
  { icon: Cpu, title: 'AI Analyzes Your Profile', text: 'Text is extracted and processed by the NLP pipeline.' },
  { icon: BarChart3, title: 'Discover Your Skills and Gaps', text: 'Review scores, detected skills, and what is missing.' },
  { icon: Rocket, title: 'Get Personalized Career Recommendations', text: 'Explore matched roles and learning paths.' },
];

// Real facts about the current build (taxonomy sizes), not user statistics.
const stats = [
  { value: 8, suffix: '', label: 'Career role profiles' },
  { value: 70, suffix: '+', label: 'Skills in the taxonomy' },
  { value: 10, suffix: '', label: 'ATS checks per resume' },
  { value: 10, suffix: '', label: 'Report sections' },
];

const testimonials = [
  { quote: 'Placeholder testimonial: the skill-gap view helped me decide what to learn next.', name: 'Sample User', role: 'Final-year student (placeholder)' },
  { quote: 'Placeholder testimonial: before-and-after bullet rewrites made my experience section clearer.', name: 'Sample User', role: 'Career switcher (placeholder)' },
  { quote: 'Placeholder testimonial: seeing why a role was recommended made the results easy to trust.', name: 'Sample User', role: 'Junior developer (placeholder)' },
];

const sampleRadar = [
  { k: 'Skills', v: 82 }, { k: 'Education', v: 90 }, { k: 'Experience', v: 64 }, { k: 'Projects', v: 74 }, { k: 'ATS', v: 88 },
];

function Counter({ value, suffix }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(value); return undefined; }
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / 1200);
        setN(Math.round(value * (1 - (1 - p) ** 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{n}{suffix}</span>;
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl animate-floaty">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-brand-gradient opacity-20 blur-3xl" />
      <div className="glass rounded-3xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1.5"><span className="h-3 w-3 rounded-full bg-red-300" /><span className="h-3 w-3 rounded-full bg-amber-300" /><span className="h-3 w-3 rounded-full bg-emerald-300" /></div>
          <span className="badge-gray">Sample data · illustrative</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-medium text-navy-500">Overall Resume Score</p>
            <p className="mt-1 text-4xl font-extrabold">78<span className="text-lg text-navy-400">/100</span></p>
            <div className="mt-3"><ProgressBar value={78} showValue={false} label="" /></div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="text-xs font-medium text-navy-500">ATS Compatibility</p>
            <p className="mt-1 text-4xl font-extrabold">88<span className="text-lg text-navy-400">%</span></p>
            <div className="mt-3"><ProgressBar value={88} showValue={false} label="" color="#059669" /></div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-soft" aria-hidden>
            <p className="text-xs font-medium text-navy-500">Profile Breakdown</p>
            <div className="h-36">
              <ResponsiveContainer>
                <RadarChart data={sampleRadar} outerRadius="70%">
                  <PolarGrid stroke="#EAECF0" />
                  <PolarAngleAxis dataKey="k" tick={{ fontSize: 10, fill: '#667085' }} />
                  <Radar dataKey="v" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-soft">
            <p className="mb-3 text-xs font-medium text-navy-500">Top Career Matches</p>
            <div className="space-y-3">
              <ProgressBar value={86} label="Data Scientist" />
              <ProgressBar value={71} label="Data Analyst" />
              <ProgressBar value={58} label="NLP Engineer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <section id="home" className="relative overflow-hidden bg-hero-glow">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <span className="badge-indigo mb-5">NLP + machine learning career toolkit</span>
            <h1 className="text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              Your Career Journey, <span className="gradient-text">Powered by AI.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-600">
              Analyze your resume, discover your strengths, identify skill gaps, and find the career opportunities that match your potential.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/app/analyze" className="btn-primary btn-lg">Analyze Resume <ArrowRight className="h-5 w-5" aria-hidden /></Link>
              <Link to="/#features" className="btn-secondary btn-lg">Explore Features</Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-navy-600">
              {['PDF & DOCX supported', 'Explainable recommendations', 'No fabricated results'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden /> {t}</li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>
      </section>

      <section id="features" className="scroll-mt-20 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo">Features</p>
            <h2 className="section-title mt-2">Everything you need to get hired</h2>
            <p className="mt-3 text-navy-500">From a first upload to a concrete learning plan, in one workspace.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card card-hover">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft"><Icon className="h-6 w-6" aria-hidden /></span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo">How it works</p>
            <h2 className="section-title mt-2">Four steps to clarity</h2>
          </div>
          <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="card relative">
                <span className="absolute -top-3 left-6 rounded-full bg-navy px-3 py-1 text-xs font-bold text-white">Step {i + 1}</span>
                <Icon className="mt-3 h-8 w-8 text-indigo" aria-hidden />
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-1 text-sm text-navy-500">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-navy-400">What&apos;s inside the platform (current build)</p>
          <dl className="mt-8 grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dd className="text-4xl font-extrabold sm:text-5xl"><span className="gradient-text"><Counter value={s.value} suffix={s.suffix} /></span></dd>
                <dt className="mt-2 text-sm text-navy-300">{s.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-center text-xs text-navy-400">Figures describe the product&apos;s built-in taxonomy, not user counts.</p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">Loved by learners and professionals</h2>
          <p className="mt-2 text-center text-sm text-navy-500">Testimonials below are placeholders to be replaced with real customer quotes.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="card">
                <Quote className="h-7 w-7 text-indigo/40" aria-hidden />
                <blockquote className="mt-3 text-navy-700">{t.quote}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 font-bold text-indigo">S</span>
                  <span><span className="block text-sm font-semibold">{t.name}</span><span className="block text-xs text-navy-500">{t.role}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-lift sm:p-14">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to see where you stand?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">Create a free account and upload your resume to get your first report.</p>
          <Link to="/register" className="btn mt-8 bg-white text-indigo hover:bg-navy-50 btn-lg">Get Started <ArrowRight className="h-5 w-5" aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}
