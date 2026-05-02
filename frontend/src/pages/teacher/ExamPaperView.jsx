import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

/* ── File Viewer ── */
function FileViewer({ url, label, gradient, emptyMsg, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!url) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-5">
        <div className="text-2xl mb-2">📎</div>
        <p className="text-amber-700 text-sm font-medium">{emptyMsg}</p>
      </div>
    );
  }

  const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 bg-gradient-to-br ${gradient} text-white rounded-xl flex items-center justify-center shrink-0`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className={`text-xs text-white px-3 py-1.5 rounded-lg bg-gradient-to-r ${gradient} hover:opacity-90 transition font-medium print:hidden`}
          >
            Open / Download
          </a>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4">
          {isImage ? (
            <img src={url} alt={label} className="w-full rounded-xl border border-gray-100 shadow-sm" />
          ) : (
            <object
              data={url}
              type="application/pdf"
              className="w-full rounded-xl"
              style={{ height: '75vh', minHeight: '500px' }}
            >
              <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl">
                <div className={`w-16 h-16 bg-gradient-to-br ${gradient} text-white rounded-2xl flex items-center justify-center mb-4`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium mb-4">PDF preview not available</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-white px-6 py-2.5 rounded-xl font-medium bg-gradient-to-r ${gradient} hover:opacity-90 transition`}
                >
                  Open PDF
                </a>
              </div>
            </object>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Difficulty Badge ── */
function DiffBadge({ difficulty }) {
  const map = {
    EASY:   'bg-emerald-100 text-emerald-700',
    MEDIUM: 'bg-amber-100   text-amber-700',
    HARD:   'bg-red-100     text-red-700',
  };
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${map[difficulty] || 'bg-gray-100 text-gray-600'}`}>
      {difficulty}
    </span>
  );
}

/* ── Main Component ── */
export default function ExamPaperView() {
  const { examId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paperType = searchParams.get('type') || 'created';

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createdExams, setCreatedExams] = useState([]);
  const [handwrittenExams, setHandwrittenExams] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPaper, setSelectedPaper] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/exams/assigned/').catch(() => ({ data: [] })),
      api.get('/api/handwritten/').catch(() => ({ data: [] })),
    ]).then(([createdRes, hwRes]) => {
      setCreatedExams(createdRes.data.results || createdRes.data || []);
      setHandwrittenExams(hwRes.data.results || hwRes.data || []);
    });
  }, []);

  useEffect(() => {
    if (!examId) { setLoading(false); setError(''); setExam(null); return; }
    setLoading(true); setError(''); setExam(null);
    const endpoint = paperType === 'handwritten'
      ? `/api/handwritten/${examId}/`
      : `/api/exams/assigned/${examId}/`;
    api.get(endpoint)
      .then(res => setExam(res.data))
      .catch(() => setError('Failed to load paper.'))
      .finally(() => setLoading(false));
  }, [examId, paperType]);

  useEffect(() => {
    if (!exam) return;
    setSelectedStudent(paperType === 'handwritten'
      ? (exam.student_display_name || exam.student_name || '')
      : '__created__');
    setSelectedPaper(`${paperType}:${examId}`);
  }, [exam, paperType, examId]);

  const uniqueStudents = [...new Map(
    handwrittenExams.map(e => {
      const name = e.student_display_name || e.student_name || 'Unknown';
      return [name, name];
    })
  ).keys()];

  const papersForStudent = selectedStudent === '__created__'
    ? createdExams.map(e => ({ value: `created:${e.id}`, label: `${e.title} — ${e.subject_name}` }))
    : handwrittenExams
        .filter(e => (e.student_display_name || e.student_name) === selectedStudent)
        .map(e => ({ value: `handwritten:${e.id}`, label: `${e.title} — ${e.subject_name}` }));

  const handleStudentChange = e => { setSelectedStudent(e.target.value); setSelectedPaper(''); };
  const handlePaperChange = e => {
    const val = e.target.value;
    if (!val) return;
    setSelectedPaper(val);
    const [type, id] = val.split(':');
    navigate(`/teacher/exam/${id}/paper?type=${type}`);
  };

  const mcqs   = exam?.questions?.filter(q => q.question_type === 'MCQ')   || [];
  const shorts = exam?.questions?.filter(q => q.question_type === 'SHORT') || [];
  const longs  = exam?.questions?.filter(q => q.question_type === 'LONG')  || [];
  const optionLabel = { A: 'a', B: 'b', C: 'c', D: 'd' };

  const pct = exam?.percentage ?? 0;
  const scoreColor = pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500';
  const scoreBg    = pct >= 60 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 print:hidden">
        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Teacher Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-3">
              <Link
                to="/teacher/results"
                className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-xl flex items-center justify-center transition border border-white/10 shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-3xl font-extrabold text-white">
                {exam ? exam.title : 'Question Paper Viewer'}
              </h1>
            </div>
            {exam && !loading && (
              <button
                onClick={() => window.print()}
                className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            )}
          </div>
          <p className="text-indigo-200 text-sm mb-6">
            {paperType === 'handwritten' ? 'Handwritten exam paper' : 'Created exam paper'}
            {exam?.subject_name ? ` · ${exam.subject_name}` : ''}
          </p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'MCQ',   value: mcqs.length   || '—', color: 'bg-white/10 border-white/20',           text: 'text-white'      },
              { label: 'Short', value: shorts.length  || '—', color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
              { label: 'Long',  value: longs.length   || '—', color: 'bg-violet-500/20 border-violet-400/30', text: 'text-violet-200' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`${color} border rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]`}>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Paper Selector ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:hidden">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Paper</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Student</label>
              <select
                value={selectedStudent}
                onChange={handleStudentChange}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium focus:ring-0 focus:border-indigo-400 bg-slate-50 transition"
              >
                <option value="">— Select Student —</option>
                {uniqueStudents.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                {createdExams.length > 0 && (
                  <option value="__created__">📝 Created Exam Papers</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {selectedStudent === '__created__' ? 'Exam Paper' : 'Exam / Paper'}
              </label>
              <select
                value={selectedPaper}
                onChange={handlePaperChange}
                disabled={!selectedStudent}
                className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium focus:ring-0 focus:border-indigo-400 bg-slate-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">— Select Paper —</option>
                {papersForStudent.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600" />
            <p className="text-gray-400 font-medium">Loading paper...</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && !exam && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-lg mb-1">No paper selected</p>
            <p className="text-gray-400 text-sm">Choose a student and paper from the selector above.</p>
          </div>
        )}

        {/* ══════════════════════════════════════
            CREATED EXAM PAPER
        ══════════════════════════════════════ */}
        {!loading && !error && exam && paperType === 'created' && (
          <>
            {/* Exam Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
                <h2 className="text-2xl font-black text-white mb-0.5">{exam.title}</h2>
                <p className="text-indigo-200 text-sm">{exam.subject_name}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                {[
                  { label: 'Total Marks', value: exam.total_marks, icon: '🎯', color: 'text-indigo-600' },
                  { label: 'Duration',    value: `${exam.duration_minutes} min`, icon: '⏱️', color: 'text-purple-600' },
                  { label: 'Questions',  value: exam.questions?.length ?? (exam.num_mcq + exam.num_short + exam.num_long), icon: '📋', color: 'text-emerald-600' },
                  { label: 'Selection',  value: exam.selection_mode === 'manual' ? 'Fixed' : 'Random', icon: '🔀', color: 'text-amber-600' },
                ].map(s => (
                  <div key={s.label} className="p-5 text-center">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              {exam.selection_mode === 'random' && (
                <div className="px-6 pb-5 flex gap-2 flex-wrap border-t border-gray-100 pt-4">
                  <span className="text-sm bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full">{exam.num_mcq} MCQ</span>
                  <span className="text-sm bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full">{exam.num_short} Short</span>
                  <span className="text-sm bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-full">{exam.num_long} Long</span>
                </div>
              )}
            </div>

            {exam.selection_mode === 'random' && exam.questions_source === 'attempt' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-blue-500 text-xl">ℹ️</span>
                <p className="text-blue-700 text-sm font-medium">Showing questions from the first completed student attempt (random selection exam).</p>
              </div>
            )}

            {exam.questions?.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-amber-800 font-bold mb-1">No question paper available yet</p>
                <p className="text-amber-600 text-sm">This is a random-selection exam. The paper will appear once a student completes it.</p>
              </div>
            )}

            {exam.questions?.length > 0 && (
              <div className="space-y-5">

                {/* MCQ Section */}
                {mcqs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
                        <h3 className="font-black text-white">Section A — Multiple Choice</h3>
                      </div>
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">{mcqs.length} Qs · 1 mark each</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {mcqs.map((q, idx) => (
                        <div key={q.id} className="px-6 py-5 hover:bg-slate-50 transition">
                          <div className="flex gap-4">
                            <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 font-semibold mb-3 leading-relaxed">{q.question_text}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                {['A', 'B', 'C', 'D'].map(opt => q[`option_${optionLabel[opt]}`] && (
                                  <div key={opt} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 text-sm transition ${
                                    q.correct_answer === opt
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                      : 'border-gray-100 text-gray-700 bg-gray-50'
                                  }`}>
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                      q.correct_answer === opt ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>{opt}</span>
                                    <span className="flex-1">{q[`option_${optionLabel[opt]}`]}</span>
                                    {q.correct_answer === opt && (
                                      <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <DiffBadge difficulty={q.difficulty} />
                                {q.chapter_name && <span className="text-xs text-gray-400 font-medium">{q.chapter_name}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer Section */}
                {shorts.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">B</div>
                        <h3 className="font-black text-white">Section B — Short Answer</h3>
                      </div>
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">{shorts.length} Qs · 2 marks each</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {shorts.map((q, idx) => (
                        <div key={q.id} className="px-6 py-5 hover:bg-slate-50 transition">
                          <div className="flex gap-4">
                            <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 font-semibold mb-3 leading-relaxed">{q.question_text}</p>
                              {q.model_answer && (
                                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                                  <p className="text-xs font-black text-emerald-700 uppercase tracking-wide mb-1">Model Answer</p>
                                  <p className="text-sm text-emerald-800 leading-relaxed">{q.model_answer}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <DiffBadge difficulty={q.difficulty} />
                                {q.chapter_name && <span className="text-xs text-gray-400 font-medium">{q.chapter_name}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Long Answer Section */}
                {longs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-500 to-purple-700 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">C</div>
                        <h3 className="font-black text-white">Section C — Long Answer</h3>
                      </div>
                      <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full font-bold">{longs.length} Qs · 5 marks each</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {longs.map((q, idx) => (
                        <div key={q.id} className="px-6 py-5 hover:bg-slate-50 transition">
                          <div className="flex gap-4">
                            <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-800 font-semibold mb-3 leading-relaxed">{q.question_text}</p>
                              {q.model_answer && (
                                <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl mb-3">
                                  <p className="text-xs font-black text-violet-700 uppercase tracking-wide mb-1">Model Answer</p>
                                  <p className="text-sm text-violet-800 leading-relaxed">{q.model_answer}</p>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <DiffBadge difficulty={q.difficulty} />
                                {q.chapter_name && <span className="text-xs text-gray-400 font-medium">{q.chapter_name}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════
            HANDWRITTEN PAPER
        ══════════════════════════════════════ */}
        {!loading && !error && exam && paperType === 'handwritten' && (
          <>
            {/* Info Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
                <h2 className="text-2xl font-black text-white mb-0.5">{exam.title}</h2>
                <p className="text-violet-200 text-sm">{exam.subject_name}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
                <div className="p-5 text-center">
                  <div className="text-2xl mb-1">🎓</div>
                  <p className="text-base font-black text-violet-600 truncate px-1">{exam.student_display_name || exam.student_name || '—'}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Student</p>
                </div>
                <div className="p-5 text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <p className="text-2xl font-black text-indigo-600">{exam.total_marks}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Total Marks</p>
                </div>
                {exam.status === 'GRADED' ? (
                  <>
                    <div className="p-5 text-center">
                      <div className="text-2xl mb-1">✅</div>
                      <p className="text-2xl font-black text-emerald-600">{exam.obtained_marks}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Obtained</p>
                    </div>
                    <div className="p-5 text-center">
                      <div className="text-2xl mb-1">📊</div>
                      <p className={`text-2xl font-black ${scoreColor}`}>{Math.round(pct)}%</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Percentage</p>
                    </div>
                  </>
                ) : (
                  <div className="p-5 text-center col-span-2">
                    <div className="text-2xl mb-1">⏳</div>
                    <p className={`text-xl font-black ${
                      exam.status === 'PROCESSING' ? 'text-amber-600' :
                      exam.status === 'FAILED' ? 'text-red-600' : 'text-gray-600'
                    }`}>{exam.status}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Status</p>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Analysis */}
            {exam.status === 'GRADED' && exam.grading_data && (
              <div className="space-y-5">

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <p className="text-sm font-black text-gray-700 mb-4">Score Overview</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Scored', value: exam.obtained_marks },
                            { name: 'Lost', value: Math.max(0, exam.total_marks - exam.obtained_marks) },
                          ]}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={80}
                          dataKey="value" startAngle={90} endAngle={-270}
                        >
                          <Cell fill={scoreBg} />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v} marks`, n]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {exam.grading_data.questions?.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <p className="text-sm font-black text-gray-700 mb-4">Question-wise Marks</p>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart
                          data={exam.grading_data.questions.map(q => ({
                            name: `Q${q.question_number}`,
                            Scored: q.marks_awarded,
                            Max: q.max_marks,
                          }))}
                          margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Max"    fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Scored" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Overall Feedback */}
                {exam.grading_data.overall_feedback && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
                    <p className="text-sm font-black text-indigo-700 uppercase tracking-wide mb-2">Overall Feedback</p>
                    <p className="text-gray-700 leading-relaxed">{exam.grading_data.overall_feedback}</p>
                  </div>
                )}

                {/* Strengths / Weaknesses / Recommendations */}
                {(exam.grading_data.strengths?.length > 0 || exam.grading_data.weaknesses?.length > 0 || exam.grading_data.recommendations?.length > 0) && (
                  <div className="grid md:grid-cols-3 gap-4">
                    {exam.grading_data.strengths?.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">💪</span>
                          <h4 className="text-sm font-black text-emerald-700 uppercase tracking-wide">Strengths</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {exam.grading_data.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                              <span className="text-emerald-500 mt-0.5">✓</span> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exam.grading_data.weaknesses?.length > 0 && (
                      <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">⚠️</span>
                          <h4 className="text-sm font-black text-red-700 uppercase tracking-wide">Weaknesses</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {exam.grading_data.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-red-800 flex items-start gap-1.5">
                              <span className="text-red-400 mt-0.5">✗</span> {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {exam.grading_data.recommendations?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">💡</span>
                          <h4 className="text-sm font-black text-blue-700 uppercase tracking-wide">Recommendations</h4>
                        </div>
                        <ul className="space-y-1.5">
                          {exam.grading_data.recommendations.map((r, i) => (
                            <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                              <span className="text-blue-400 mt-0.5">→</span> {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Per-question breakdown table */}
                {exam.grading_data.questions?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-4">
                      <h4 className="font-black text-white">Question-wise Breakdown</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-100">
                            {['Q#', 'Question', 'Student Answer', 'Correct Answer', 'Marks', 'Feedback'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {exam.grading_data.questions.map((q, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-slate-50 transition">
                              <td className="px-4 py-3">
                                <div className="w-7 h-7 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-black text-xs">
                                  {q.question_number}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-700 max-w-[180px] text-xs">{q.question_text}</td>
                              <td className="px-4 py-3 text-gray-500 italic max-w-[180px] text-xs">{q.student_answer}</td>
                              <td className="px-4 py-3 text-gray-600 max-w-[180px] text-xs">{q.correct_answer}</td>
                              <td className="px-4 py-3">
                                <span className={`font-black text-sm px-2.5 py-1 rounded-lg ${
                                  q.marks_awarded >= q.max_marks ? 'bg-emerald-100 text-emerald-700' :
                                  q.marks_awarded > 0           ? 'bg-amber-100   text-amber-700'   :
                                                                   'bg-red-100     text-red-700'
                                }`}>
                                  {q.marks_awarded}/{q.max_marks}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px]">{q.feedback}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Viewers */}
            <FileViewer
              url={exam.question_paper}
              label="Question Paper / Answer Key"
              gradient="from-indigo-500 to-blue-600"
              emptyMsg="No question paper file attached."
            />
            <FileViewer
              url={exam.answer_sheet}
              label="Student's Answer Sheet"
              gradient="from-violet-500 to-purple-700"
              emptyMsg="No answer sheet file attached."
              defaultExpanded
            />
          </>
        )}
      </div>
    </div>
  );
}
