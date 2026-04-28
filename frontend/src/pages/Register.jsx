import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COACHING_EXAMS = [
  { value: 'BANK',   label: 'Bank Exams', icon: '🏦' },
  { value: 'EAMCET', label: 'EAMCET',     icon: '🔬' },
  { value: 'ECET',   label: 'ECET',       icon: '⚙️' },
  { value: 'NEET',   label: 'NEET',       icon: '🩺' },
  { value: 'JEE',    label: 'IIT-JEE',    icon: '🚀' },
  { value: 'DSC',    label: 'DSC',        icon: '📚' },
  { value: 'OTHER',  label: 'Other',      icon: '📋' },
];

const VALID_ORG_TYPES = ['school', 'college', 'coaching'];

const ORG_CFG = {
  school:   { label: 'School',          gradient: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50',   text: 'text-blue-700',   icon: '🏫' },
  college:  { label: 'College',         gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-700', icon: '🎓' },
  coaching: { label: 'Coaching Centre', gradient: 'from-amber-500 to-orange-600',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: '📖' },
};

const FEATURES = [
  { icon: '⚡', text: 'AI-powered instant grading' },
  { icon: '📝', text: 'Handwritten sheet analysis' },
  { icon: '📊', text: 'Deep learning analytics' },
  { icon: '🔒', text: 'Secure role-based access' },
];

function InputField({ label, name, type = 'text', value, onChange, placeholder, required, icon }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300`}
        />
      </div>
    </div>
  );
}

function SelectField({ label, name, value, onChange, required, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition"
      >
        {children}
      </select>
    </div>
  );
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const orgTypeParam = searchParams.get('org_type');
  const preselected  = VALID_ORG_TYPES.includes(orgTypeParam);

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', phone_number: '',
    board: '', school_name: '', org_type: preselected ? orgTypeParam : 'school',
    class_from: 1, class_to: 12,
  });
  const [selectedExams, setSelectedExams] = useState([]);
  const [showPass, setShowPass]           = useState(false);
  const [error, setError]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const { register, login }               = useAuth();
  const navigate                          = useNavigate();

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleExam   = v => setSelectedExams(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const org    = ORG_CFG[formData.org_type] || ORG_CFG.school;
  const orgLabel = org.label;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.password2) { setError('Passwords do not match'); return; }
    if (formData.org_type === 'coaching' && selectedExams.length === 0) { setError('Please select at least one exam type'); return; }
    if (formData.org_type !== 'coaching' && !formData.board) { setError('Please select a board'); return; }
    if (!formData.school_name.trim()) { setError(`${orgLabel} name is required`); return; }
    if (formData.org_type !== 'coaching' && Number(formData.class_from) > Number(formData.class_to)) {
      setError('"Classes From" must be ≤ "Classes To"'); return;
    }
    setLoading(true);
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      const payload = { ...formData, role: 'school' };
      if (formData.org_type === 'coaching') {
        payload.board = selectedExams.join(',');
        delete payload.class_from;
        delete payload.class_to;
      }
      await register(payload);
      await login(formData.username, formData.password);
      setTimeout(() => navigate('/school/dashboard'), 100);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join('. ') : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1200&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/50 via-transparent to-black/70" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Brand */}
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

        {/* Headline */}
        <div className="relative z-10 px-10">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/25 text-indigo-300 text-xs font-bold uppercase tracking-widest border border-indigo-400/30 mb-4">
            Join 500+ Institutions
          </span>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Set Up Your<br />Institution Today.
          </h2>
          <p className="text-slate-300 text-base leading-relaxed max-w-sm">
            Register your school, college, or coaching centre and start AI-powered exam management in minutes.
          </p>
        </div>

        {/* Features */}
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
      <div className="w-full lg:w-7/12 bg-slate-50 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-10">

          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="font-black text-gray-900 text-lg">ExamAI</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-1">Register Institution</h1>
            <p className="text-gray-500 text-sm">Create your organisation account to get started</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7">

            {/* ── Section 1: Organisation ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className={`w-8 h-8 bg-gradient-to-br ${org.gradient} text-white rounded-xl flex items-center justify-center text-base`}>
                  {org.icon}
                </div>
                <h2 className="font-black text-gray-900 text-base">Organisation Details</h2>
              </div>

              {/* Org Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Organisation Type <span className="text-red-400">*</span>
                </label>
                {preselected ? (
                  <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm ${org.bg} ${org.text} border-2 border-transparent`}>
                    <span>{org.icon}</span> {orgLabel}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(ORG_CFG).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, org_type: key })}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          formData.org_type === key ? 'border-transparent shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {formData.org_type === key && (
                          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${cfg.gradient} opacity-100`} />
                        )}
                        <span className={`relative z-10 text-xl`}>{cfg.icon}</span>
                        <span className={`relative z-10 text-xs font-black ${formData.org_type === key ? 'text-white' : 'text-gray-700'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Org Name */}
              <InputField
                label={`${orgLabel} Name`} name="school_name"
                value={formData.school_name} onChange={handleChange}
                placeholder={`Enter ${orgLabel.toLowerCase()} name`} required
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              />

              {/* Coaching: exam checkboxes | School/College: board + class range */}
              {formData.org_type === 'coaching' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Coaching For <span className="text-red-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {COACHING_EXAMS.map(exam => (
                      <button
                        key={exam.value}
                        type="button"
                        onClick={() => toggleExam(exam.value)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          selectedExams.includes(exam.value)
                            ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                            : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-base">{exam.icon}</span>
                        {exam.label}
                        {selectedExams.includes(exam.value) && (
                          <svg className="w-3.5 h-3.5 ml-auto text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedExams.length > 0 && (
                    <p className="text-xs text-amber-600 font-bold mt-2">{selectedExams.length} exam type(s) selected</p>
                  )}
                </div>
              ) : (
                <>
                  <SelectField label="Board" name="board" value={formData.board} onChange={handleChange} required>
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="STATE">State Board</option>
                    <option value="ICSE">ICSE</option>
                    <option value="INTL">International</option>
                  </SelectField>
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Classes From" name="class_from" value={formData.class_from} onChange={handleChange} required>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </SelectField>
                    <SelectField label="Classes To" name="class_to" value={formData.class_to} onChange={handleChange} required>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].filter(g => g >= Number(formData.class_from)).map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </SelectField>
                  </div>
                </>
              )}
            </div>

            {/* ── Section 2: Admin Account ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-gray-800 text-white rounded-xl flex items-center justify-center text-base">
                  👤
                </div>
                <h2 className="font-black text-gray-900 text-base">Admin Account Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} placeholder="John" required />
                <InputField label="Last Name"  name="last_name"  value={formData.last_name}  onChange={handleChange} placeholder="Doe"  required />
              </div>

              <InputField
                label="Username" name="username" value={formData.username}
                onChange={handleChange} placeholder="admin_username" required
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              />

              <InputField
                label="Email" name="email" type="email" value={formData.email}
                onChange={handleChange} placeholder="admin@school.edu" required
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              />

              <InputField
                label="Phone Number" name="phone_number" value={formData.phone_number}
                onChange={handleChange} placeholder="+91 98765 43210"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
              />

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password" value={formData.password} onChange={handleChange}
                      placeholder="Min 8 chars" required
                      className="w-full pl-11 pr-10 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {showPass
                          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                        }
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password2" value={formData.password2} onChange={handleChange}
                      placeholder="Repeat password" required
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Password match indicator */}
              {formData.password2 && (
                <div className={`flex items-center gap-2 text-xs font-bold ${formData.password === formData.password2 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formData.password === formData.password2
                    ? <><span>✓</span> Passwords match</>
                    : <><span>✗</span> Passwords do not match</>
                  }
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-white text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg bg-gradient-to-r ${org.gradient} hover:opacity-90 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                `Register ${orgLabel} ${org.icon}`
              )}
            </button>

            <p className="text-center text-gray-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                Sign In
              </Link>
            </p>
            <div className="text-center">
              <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition">← Back to home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
