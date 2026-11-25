import { Link } from 'react-router-dom';
import { Mail, Compass } from 'lucide-react';

function Doc({ title, intro, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold">{title}</h1>
      {intro && <p className="mt-3 text-lg text-navy-500">{intro}</p>}
      <div className="mt-8 space-y-6 leading-relaxed text-navy-700 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1">{children}</div>
    </div>
  );
}

export function About() {
  return (
    <Doc title="About CareerAI" intro="A resume and career toolkit built around transparent NLP and machine learning.">
      <section><h2>What we do</h2><p>CareerAI extracts text from your resume, detects skills and sections, scores structure and ATS readability, and ranks career roles against your profile. Every score comes with the evidence behind it so you can act on it.</p></section>
      <section><h2>How recommendations work</h2><p>Roles are represented by required and optional skills. Your detected skills are compared with each role using TF-IDF cosine similarity and weighted skill coverage. The result is similarity to a role profile, not a prediction of hiring outcomes.</p></section>
      <section><h2>Limits to keep in mind</h2><ul><li>Skill detection depends on the wording in your resume.</li><li>Rewrite suggestions are templates; fill in your own real figures.</li><li>Skill evidence reflects mentions, not tested proficiency.</li></ul></section>
      <Link to="/register" className="btn-primary inline-flex">Get Started</Link>
    </Doc>
  );
}

export function Contact() {
  return (
    <Doc title="Contact" intro="Questions, feedback, or partnership ideas.">
      <div className="card flex items-start gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo"><Mail className="h-5 w-5" aria-hidden /></span>
        <div>
          <p className="font-semibold">Email us</p>
          <a className="text-indigo hover:underline" href="mailto:hello@careerai.example">hello@careerai.example</a>
          <p className="mt-1 text-sm text-navy-500">Placeholder address: replace with your real support inbox before launch.</p>
        </div>
      </div>
    </Doc>
  );
}

export function Privacy() {
  return (
    <Doc title="Privacy Policy" intro="Template text. Have it reviewed by a qualified professional before launch.">
      <section><h2>Data we handle</h2><p>Account details (name, email, hashed password), uploaded resumes&apos; extracted text, and the analysis results generated from them.</p></section>
      <section><h2>How it is used</h2><p>Only to provide analysis, recommendations, and history inside your account.</p></section>
      <section><h2>Your controls</h2><ul><li>Delete any analysis from History.</li><li>Update or correct profile details at any time.</li></ul></section>
    </Doc>
  );
}

export function Terms() {
  return (
    <Doc title="Terms of Service" intro="Template text. Have it reviewed by a qualified professional before launch.">
      <section><h2>Use of the service</h2><p>CareerAI provides informational resume feedback and career suggestions. It does not guarantee interviews or employment.</p></section>
      <section><h2>Your content</h2><p>You are responsible for the resumes you upload and must have the right to upload them.</p></section>
      <section><h2>Availability</h2><p>The service is provided as is and may change over time.</p></section>
    </Doc>
  );
}

export function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4 text-center">
      <div>
        <Compass className="mx-auto h-12 w-12 text-indigo" aria-hidden />
        <h1 className="mt-4 text-4xl font-extrabold">Page not found</h1>
        <p className="mt-2 text-navy-500">The page you are looking for doesn&apos;t exist.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Back to home</Link>
      </div>
    </div>
  );
}
