import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ORG_TYPES = [
  {
    key: 'school',
    title: 'School',
    description: 'Complete K-12 management with class and section controls.',
    color: 'from-cyan-400 to-blue-600',
    shadow: 'shadow-blue-200',
    badge: 'bg-blue-50 text-blue-700',
    border: 'hover:border-blue-400',
    link: 'text-blue-600',
    tag: 'K-12 Education',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
      </svg>
    ),
  },
  {
    key: 'college',
    title: 'College',
    description: 'Scalable assessment solutions for higher education.',
    color: 'from-fuchsia-500 to-purple-700',
    shadow: 'shadow-purple-200',
    badge: 'bg-purple-50 text-purple-700',
    border: 'hover:border-purple-400',
    link: 'text-purple-600',
    tag: 'Higher Education',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    key: 'coaching',
    title: 'Coaching Centre',
    description: 'Optimized for EAMCET, NEET, and JEE preparation.',
    color: 'from-amber-400 to-orange-600',
    shadow: 'shadow-orange-200',
    badge: 'bg-orange-50 text-orange-700',
    border: 'hover:border-orange-400',
    link: 'text-orange-600',
    tag: 'Competitive Exams',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
];

const FEATURES = [
  { title: 'AI Smart Grading', desc: 'Instant, accurate grading for MCQs and descriptive answers using Gemini 2.0.', icon: '⚡' },
  { title: 'Handwritten Analysis', desc: 'Upload handwritten sheets and let AI transcribe and grade them with precision.', icon: '📝' },
  { title: 'Advanced Analytics', desc: 'Detailed student progress cards and learning gap analysis for teachers.', icon: '📊' },
];

const FEATURE_CARDS = [
  {
    icon: '⚡',
    title: 'AI Smart Grading',
    desc: 'Gemini 2.0 powered engine grades MCQs and long-form answers instantly with human-level accuracy.',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
  },
  {
    icon: '📝',
    title: 'Handwritten Sheet Analysis',
    desc: 'Upload scanned answer sheets and let AI read, transcribe, and evaluate handwriting automatically.',
    color: 'from-violet-500 to-purple-700',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
  },
  {
    icon: '📊',
    title: 'Advanced Analytics',
    desc: 'Deep learning-powered dashboards reveal student learning gaps and predict performance trends.',
    color: 'from-emerald-400 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
  {
    icon: '📚',
    title: 'Smart Question Bank',
    desc: 'Auto-generate exam papers from a rich question bank aligned with your syllabus and difficulty levels.',
    color: 'from-amber-400 to-orange-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  {
    icon: '🏆',
    title: 'Progress Tracking',
    desc: 'Real-time student progress cards with chapter-wise performance and improvement suggestions.',
    color: 'from-rose-400 to-pink-600',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
  },
  {
    icon: '🔒',
    title: 'Secure & Scalable',
    desc: 'Enterprise-grade security with role-based access control. Scales from 10 to 10,000 students seamlessly.',
    color: 'from-sky-400 to-cyan-600',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
  },
];

const STATS = [
  { value: '50,000+', label: 'Students Enrolled', icon: '🎓' },
  { value: '2M+', label: 'Exams Graded by AI', icon: '✅' },
  { value: '98%', label: 'Grading Accuracy', icon: '🎯' },
  { value: '500+', label: 'Institutions', icon: '🏫' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Register Your Institution',
    desc: 'Sign up as a School, College, or Coaching Centre. Set up your classes, subjects, and student roster in minutes.',
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
  },
  {
    step: '02',
    title: 'Create & Assign Exams',
    desc: 'Build exam papers from our AI question bank or upload your own. Assign to students with a single click.',
    color: 'from-purple-500 to-fuchsia-600',
    bg: 'bg-purple-50',
  },
  {
    step: '03',
    title: 'AI Grades Instantly',
    desc: 'Gemini 2.0 evaluates answers — typed or handwritten — with detailed score breakdowns per question.',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
  },
  {
    step: '04',
    title: 'Review Analytics',
    desc: 'Teachers and admins get rich dashboards showing class performance, weakest topics, and improvement plans.',
    color: 'from-orange-500 to-red-600',
    bg: 'bg-orange-50',
  },
];

function HeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Student exam photo */}
      <img
        src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1920&q=80&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/70" />
      {/* Indigo tint to match brand */}
      <div className="absolute inset-0 bg-indigo-950/40" />
      {/* Dot grid for texture */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);

  if (user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-50 -z-10" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-50" />
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Welcome back!</h1>
          <p className="text-gray-600 text-lg mb-8">Continue managing your exams and monitoring student progress.</p>
          <Link to="/dashboard" className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:-translate-y-1 active:scale-95">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-28 px-4 overflow-hidden">
        <HeroBg />
        <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-slate-50 to-transparent z-10" />
        <div className="relative z-20 max-w-7xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-bold tracking-wide uppercase mb-6 border border-indigo-500/30 backdrop-blur-sm">
            Powered by Gemini 2.0 AI
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            Next Gen{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Exam Management
            </span>
          </h1>
          <p className="text-slate-300 text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed mb-10">
            Streamline assessments with AI grading, handwritten sheet processing, and deep learning analytics.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10 text-sm font-medium text-slate-200">
                <span>{f.icon}</span> {f.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-4xl font-black text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Get Started / Institution Selector ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-4">
              Choose Your Portal
            </span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Get Started Today</h2>
            <p className="text-gray-500 text-lg">{selected ? 'Sign in to your portal' : 'Choose your institution type to continue'}</p>
          </div>

          {!selected ? (
            <div className="grid md:grid-cols-3 gap-8">
              {ORG_TYPES.map((org) => (
                <button
                  key={org.key}
                  onClick={() => setSelected(org.key)}
                  className={`group relative bg-white rounded-3xl shadow-xl ${org.shadow} p-8 flex flex-col items-center text-center cursor-pointer border-2 border-transparent ${org.border} transition-all duration-300 hover:-translate-y-2`}
                >
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${org.badge} mb-5`}>
                    {org.tag}
                  </span>
                  <div className={`w-20 h-20 bg-gradient-to-br ${org.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    {org.icon}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">{org.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-6">{org.description}</p>
                  <div className={`mt-auto flex items-center ${org.link} font-bold group-hover:translate-x-1 transition-transform`}>
                    Select Portal
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 bg-gradient-to-br ${ORG_TYPES.find(o => o.key === selected).color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                    {ORG_TYPES.find(o => o.key === selected).icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{ORG_TYPES.find(o => o.key === selected).title} Portal</h3>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Selected</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Link to={`/login?org_type=${selected}`} className="flex items-center justify-center w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    Login to Account
                  </Link>
                  <Link to={`/register?org_type=${selected}`} className="flex items-center justify-center w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                    Register New Institution
                  </Link>
                  <button onClick={() => setSelected(null)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-medium underline">
                    Change Institution Type
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold tracking-widest uppercase mb-4">
              Platform Features
            </span>
            <h2 className="text-4xl font-black text-gray-900 mb-3">Everything You Need</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">A complete AI-powered toolkit for modern educational institutions.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURE_CARDS.map((f, i) => (
              <div key={i} className={`rounded-3xl p-8 ${f.bg} border border-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${f.color} text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{f.title}</h3>
                <p className={`text-sm leading-relaxed ${f.text} font-medium`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold tracking-widest uppercase mb-4 border border-white/10">
              Simple Process
            </span>
            <h2 className="text-4xl font-black text-white mb-3">How It Works</h2>
            <p className="text-slate-400 text-lg">Up and running in under 10 minutes.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={i} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-0.5 bg-white/10 z-0" style={{ width: 'calc(100% - 2.5rem)', left: '80%' }} />
                )}
                <div className={`${s.bg} rounded-3xl p-8 relative z-10`}>
                  <div className={`text-5xl font-black bg-gradient-to-br ${s.color} bg-clip-text text-transparent mb-4`}>
                    {s.step}
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Ready to Transform Your Institution?
          </h2>
          <p className="text-indigo-100 text-xl mb-10">
            Join 500+ institutions already using AI to save time, improve accuracy, and boost student outcomes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register?org_type=school" className="px-8 py-4 bg-white text-indigo-700 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all shadow-2xl hover:-translate-y-1">
              Start Free Today
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white/10 text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-10">
          {FEATURES.map((f, i) => (
            <div key={i} className="text-center md:text-left">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h4 className="text-lg font-black text-gray-900 mb-2">{f.title}</h4>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10 text-sm text-gray-400">
          © 2026 AI Smart Exam Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
