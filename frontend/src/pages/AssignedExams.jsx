import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ attempt, notStartedYet, expired }) {
  if (!attempt && expired)
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-600 border border-red-200">⛔ Expired</span>;
  if (!attempt && notStartedYet)
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">🕐 Not started yet</span>;
  if (!attempt)
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 border border-indigo-200">📝 Available</span>;
  if (attempt.status === 'IN_PROGRESS')
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />In Progress</span>;
  if (attempt.status === 'COMPLETED' && attempt.grading_status !== 'COMPLETED')
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">⏳ Pending Review</span>;
  if (attempt.status === 'COMPLETED')
    return <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✅ Completed</span>;
  return null;
}

const SUBJECT_GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
];

export default function AssignedExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/exams/assigned/my/').then((res) => {
      setExams(res.data.results || res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const startAssignedExam = async (assignedExam) => {
    if (assignedExam.my_attempt?.status === 'COMPLETED') {
      navigate(`/result/${assignedExam.my_attempt.exam_id}`);
      return;
    }
    if (assignedExam.my_attempt?.status === 'IN_PROGRESS') {
      navigate(`/exam/${assignedExam.my_attempt.exam_id}`);
      return;
    }
    setGenerating(assignedExam.id);
    try {
      const data = { subject_id: assignedExam.subject, assigned_exam_id: assignedExam.id };
      const res = await api.post('/api/exams/generate/', data);
      sessionStorage.setItem(`exam_${res.data.exam_id}`, JSON.stringify(res.data));
      navigate(`/exam/${res.data.exam_id}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start exam');
      setGenerating(null);
    }
  };

  const now = new Date();
  const completedCount   = exams.filter(e => e.my_attempt?.status === 'COMPLETED').length;
  const inProgressCount  = exams.filter(e => e.my_attempt?.status === 'IN_PROGRESS').length;
  const availableCount   = exams.filter(e => {
    const start = e.start_time ? new Date(e.start_time) : null;
    const end   = e.end_time   ? new Date(e.end_time)   : null;
    return !e.my_attempt && !(start && now < start) && !(end && now > end);
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading exams…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">My Exams</p>
          <h1 className="text-3xl font-extrabold text-white mb-1">Assigned Exams</h1>
          <p className="text-indigo-200 text-sm mb-6">Exams assigned to you by your teacher</p>

          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total',       value: exams.length,    color: 'bg-white/10 border-white/20',           text: 'text-white' },
              { label: 'Available',   value: availableCount,  color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
              { label: 'In Progress', value: inProgressCount, color: 'bg-yellow-500/20 border-yellow-400/30', text: 'text-yellow-200' },
              { label: 'Completed',   value: completedCount,  color: 'bg-emerald-500/20 border-emerald-400/30',text: 'text-emerald-200' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`${color} border rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]`}>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl
                            flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-700 font-bold text-lg">No Exams Assigned Yet</p>
            <p className="text-gray-400 text-sm mt-2">Your teacher hasn't assigned any exams to you yet. Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exams.map((exam, idx) => {
              const attempt      = exam.my_attempt;
              const isCompleted  = attempt?.status === 'COMPLETED';
              const isInProgress = attempt?.status === 'IN_PROGRESS';
              const startTime    = exam.start_time ? new Date(exam.start_time) : null;
              const endTime      = exam.end_time   ? new Date(exam.end_time)   : null;
              const notStartedYet = startTime && now < startTime;
              const expired       = endTime && now > endTime && !attempt;
              const gradient      = SUBJECT_GRADIENTS[idx % SUBJECT_GRADIENTS.length];

              const pct = attempt?.percentage != null ? Math.round(attempt.percentage) : null;
              const pctColor = pct == null ? '' : pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-500';

              return (
                <div key={exam.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                             hover:shadow-md transition-shadow">
                  <div className="flex">
                    {/* Left accent strip + subject initial */}
                    <div className={`bg-gradient-to-b ${gradient} w-14 shrink-0 flex flex-col items-center justify-center gap-1 py-5`}>
                      <span className="text-white font-extrabold text-xl">
                        {exam.subject_name?.charAt(0).toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 px-5 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-bold text-gray-800 text-base">{exam.title}</h3>
                            <StatusBadge attempt={attempt} notStartedYet={notStartedYet} expired={expired} />
                          </div>

                          {/* Chips row */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                              📚 {exam.subject_name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                              🏆 {exam.total_marks} marks
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                              ⏱ {exam.duration_minutes} min
                            </span>
                            {exam.teacher_name && (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                👤 {exam.teacher_name}
                              </span>
                            )}
                          </div>

                          {/* Time row */}
                          {(startTime || endTime) && (
                            <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                              {startTime && (
                                <span>🟢 Starts: <strong className="text-gray-600">{fmtDate(startTime)}</strong></span>
                              )}
                              {endTime && (
                                <span>🔴 Ends: <strong className="text-gray-600">{fmtDate(endTime)}</strong></span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action area */}
                        <div className="flex items-center gap-3 shrink-0">
                          {isCompleted && attempt?.grading_status === 'COMPLETED' && pct != null && (
                            <div className="text-center">
                              <p className={`text-2xl font-extrabold ${pctColor}`}>{pct}%</p>
                              <p className="text-xs text-gray-400">Score</p>
                            </div>
                          )}

                          {isCompleted && attempt?.grading_status === 'COMPLETED' && (
                            <button
                              onClick={() => navigate(`/result/${attempt.exam_id}`)}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600
                                         text-white rounded-xl text-sm font-bold hover:from-indigo-600
                                         hover:to-violet-700 transition shadow-sm"
                            >
                              View Result
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => startAssignedExam(exam)}
                              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500
                                         text-white rounded-xl text-sm font-bold hover:from-yellow-600
                                         hover:to-amber-600 transition shadow-sm"
                            >
                              ▶ Continue
                            </button>
                          )}

                          {!attempt && !expired && !notStartedYet && (
                            <button
                              onClick={() => startAssignedExam(exam)}
                              disabled={generating === exam.id}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600
                                         text-white rounded-xl text-sm font-bold hover:from-indigo-700
                                         hover:to-violet-700 transition shadow-sm disabled:opacity-50
                                         disabled:cursor-not-allowed"
                            >
                              {generating === exam.id ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                  Starting…
                                </span>
                              ) : '🚀 Start Exam'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
