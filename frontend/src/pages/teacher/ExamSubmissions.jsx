import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

function getState(s) {
  if (s.status === 'NOT_STARTED') return { label: 'Not Started', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' };
  if (s.status === 'IN_PROGRESS')  return { label: 'In Progress',  cls: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500 animate-pulse' };
  if (s.grading_status === 'COMPLETED') return { label: 'Graded', cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' };
  if (s.grading_status === 'FAILED')    return { label: 'Grade Failed', cls: 'bg-red-100 text-red-700', dot: 'bg-red-500' };
  if (s.grading_status && s.grading_status !== 'PENDING_REVIEW') return { label: 'Grading…', cls: 'bg-blue-100 text-blue-600', dot: 'bg-blue-500 animate-pulse' };
  return { label: 'Submitted', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' };
}

const AVATAR_PALETTE = [
  'from-indigo-400 to-violet-500',
  'from-blue-400 to-cyan-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-pink-400 to-rose-500',
  'from-purple-400 to-fuchsia-500',
];

export default function ExamSubmissions() {
  const { examId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/exams/assigned/${examId}/submissions/`)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading submissions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-3">{error}</p>
          <Link to="/teacher/created-exams" className="text-indigo-600 font-medium hover:underline text-sm">
            ← Back to Created Exams
          </Link>
        </div>
      </div>
    );
  }

  const submissions = data?.submissions || [];
  const submitted = submissions.filter((s) => s.status === 'COMPLETED').length;
  const graded    = submissions.filter((s) => s.grading_status === 'COMPLETED').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Teacher Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">{data?.exam_title || 'Exam Submissions'}</h1>
            <Link to={`/teacher/exam/${examId}/paper`}
              className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition shrink-0">
              View Paper
            </Link>
          </div>
          <p className="text-indigo-200 text-sm mb-6">{data?.subject || 'Student submissions for this exam'}</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Assigned',  value: submissions.length, color: 'bg-white/10 border-white/20',             text: 'text-white'       },
              { label: 'Submitted', value: submitted,          color: 'bg-indigo-500/30 border-indigo-400/40',   text: 'text-indigo-200'  },
              { label: 'Graded',    value: graded,             color: 'bg-emerald-500/20 border-emerald-400/30', text: 'text-emerald-200' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`${color} border rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]`}>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Submissions Yet</h3>
            <p className="text-gray-400 text-sm">Students haven't submitted this exam yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map((s, idx) => {
              const state = getState(s);
              const isGraded = s.grading_status === 'COMPLETED';
              const pct = isGraded ? Math.round(s.percentage) : null;
              const avatarGrad = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];

              return (
                <div key={s.student_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGrad} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {s.student_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{s.student_name}</p>
                        {s.completed_at && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(s.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${state.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${state.dot}`} />
                        {state.label}
                      </span>

                      {isGraded && pct != null && (
                        <span className={`text-lg font-bold ${pct >= 60 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {pct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {s.user_exam_id && (
                    <Link
                      to={`/teacher/review/${s.user_exam_id}`}
                      className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-indigo-50 border-t border-gray-100 text-xs font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
                    >
                      {isGraded ? 'View Result' : 'Review Answers'}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
