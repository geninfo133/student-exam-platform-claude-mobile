import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    key: 'school',
    label: 'School',
    desc: 'Admin login',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'ring-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'teacher',
    label: 'Teacher',
    desc: 'Manage exams',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    key: 'student',
    label: 'Student',
    desc: 'Take exams',
    gradient: 'from-violet-500 to-purple-700',
    ring: 'ring-purple-400',
    badge: 'bg-purple-100 text-purple-700',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const ORG_LABEL = {
  school:   { label: 'School',          desc: 'School admin login' },
  college:  { label: 'College',         desc: 'College admin login' },
  coaching: { label: 'Coaching Centre', desc: 'Coaching admin login' },
};

const FEATURES = [
  { icon: '⚡', text: 'AI-powered instant grading' },
  { icon: '📝', text: 'Handwritten sheet analysis' },
  { icon: '📊', text: 'Deep learning analytics' },
  { icon: '🔒', text: 'Secure role-based access' },
];

export default function Login() {
  const [searchParams] = useSearchParams();
  const orgType    = searchParams.get('org_type');
  const orgOverride = ORG_LABEL[orgType];

  const visibleRoles = ROLES.map(r =>
    r.key === 'school' && orgOverride
      ? { ...r, label: orgOverride.label, desc: orgOverride.desc }
      : r
  );

  const [selectedRole, setSelectedRole] = useState('student');
  const [username, setUsername]         = useState('');
  const [password, setPassword]         = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const activeRole = visibleRoles.find(r => r.key === selectedRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const profile = await login(username, password);
      const path =
        profile.role === 'school'
          ? profile.org_type === 'coaching' ? '/coaching/dashboard' : '/school/dashboard'
          : profile.role === 'teacher' ? '/teacher/dashboard'
          : '/dashboard';
      navigate(path);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel — Photo ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlays */}
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-transparent to-black/70" />
        {/* Dot grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Top — Brand */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">ExamAI</p>
              <p className="text-indigo-300 text-xs font-medium">Powered by Gemini 2.0</p>
            </div>
          </div>
        </div>

        {/* Middle — Headline */}
        <div className="relative z-10 px-10">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-400/30 mb-4">
            AI Exam Management
          </span>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Smarter Exams.<br />Better Outcomes.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm">
            AI-powered grading, handwritten analysis, and deep learning analytics for modern institutions.
          </p>
        </div>

        {/* Bottom — Features */}
        <div className="relative z-10 p-10">
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/80 text-xs font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-black text-gray-900 text-lg">ExamAI</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Role selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {visibleRoles.map(role => {
              const isSelected = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => { setSelectedRole(role.key); setError(''); }}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-transparent shadow-lg scale-[1.03]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                  style={isSelected ? { background: `linear-gradient(135deg, var(--tw-gradient-stops))` } : {}}
                >
                  {isSelected && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.gradient} opacity-100`} />
                  )}
                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {role.icon}
                  </div>
                  <div className="relative z-10 text-center">
                    <p className={`text-sm font-black ${isSelected ? 'text-white' : 'text-gray-700'}`}>{role.label}</p>
                    <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{role.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={`Enter ${activeRole.label.toLowerCase()} username`}
                  required
                  className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-11 pr-12 py-3.5 border-2 border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-white text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2 shadow-lg bg-gradient-to-r ${activeRole.gradient} hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                `Sign In as ${activeRole.label}`
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center mt-6 text-gray-500 text-sm">
            Don't have an account?{' '}
            <Link
              to={orgType ? `/register?org_type=${orgType}` : '/register'}
              className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Register here
            </Link>
          </p>

          {/* Back to home */}
          <div className="text-center mt-3">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
