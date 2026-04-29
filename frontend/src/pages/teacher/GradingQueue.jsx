import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const GRADING_LABELS = {
  PENDING_REVIEW: 'Pending',
  GRADING_MCQ: 'Grading MCQs…',
  GRADING_DESCRIPTIVE: 'Grading Descriptive…',
  ANALYZING: 'Analyzing…',
};

export default function GradingQueue() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingIds, setGradingIds] = useState(new Set());

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/api/exams/pending-review/');
      setPending(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  useEffect(() => {
    const grading = pending.filter((e) => e.grading_status !== 'PENDING_REVIEW');
    if (grading.length === 0) return;
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, [pending, fetchPending]);

  const handleGrade = async (examId, includeAnalysis = false) => {
    setGradingIds((prev) => new Set(prev).add(examId));
    try {
      await api.post(`/api/exams/${examId}/grade/`, { include_analysis: includeAnalysis });
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start grading');
      setGradingIds((prev) => { const n = new Set(prev); n.delete(examId); return n; });
    }
  };

  const pendingCount    = pending.filter((e) => e.grading_status === 'PENDING_REVIEW').length;
  const processingCount = pending.filter((e) => e.grading_status !== 'PENDING_REVIEW').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading grading queue…</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-extrabold text-white">Grading Queue</h1>
            <Link to="/teacher/created-exams"
              className="hidden sm:inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition shrink-0">
              Created Exams
            </Link>
          </div>
          <p className="text-indigo-200 text-sm mb-6">Student submissions awaiting AI grading</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total Queue',     value: pending.length, color: 'bg-white/10 border-white/20',           text: 'text-white'      },
              { label: 'Awaiting Grade',  value: pendingCount,   color: 'bg-amber-500/20 border-amber-400/30',   text: 'text-amber-200'  },
              { label: 'Processing',      value: processingCount, color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
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
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">All caught up!</h2>
            <p className="text-gray-400 text-sm">No submissions are waiting to be graded.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-500 to-orange-600">
                    <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Subject</th>
                    <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Exam</th>
                    <th className="text-center px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Questions</th>
                    <th className="text-center px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Submitted</th>
                    <th className="text-center px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((exam, i) => {
                    const isProcessing = exam.grading_status !== 'PENDING_REVIEW';
                    return (
                      <tr key={exam.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-5 py-4 font-semibold text-gray-800">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {exam.student?.[0]?.toUpperCase()}
                            </div>
                            {exam.student}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-600">{exam.subject}</td>
                        <td className="px-5 py-4 text-gray-600 max-w-[180px] truncate">{exam.exam_title || '—'}</td>
                        <td className="text-center px-5 py-4 text-gray-600">{exam.total_questions}</td>
                        <td className="text-center px-5 py-4">
                          {isProcessing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
                              {GRADING_LABELS[exam.grading_status] || exam.grading_status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                          {exam.completed_at
                            ? new Date(exam.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-5 py-4">
                          {exam.grading_status === 'PENDING_REVIEW' ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleGrade(exam.id, false)}
                                disabled={gradingIds.has(exam.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white transition disabled:opacity-50 shadow-sm"
                              >
                                Quick Grade
                              </button>
                              <button
                                onClick={() => handleGrade(exam.id, true)}
                                disabled={gradingIds.has(exam.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white transition disabled:opacity-50 shadow-sm"
                              >
                                + Analyze
                              </button>
                            </div>
                          ) : (
                            <span className="block text-center text-xs text-gray-400 italic">Processing…</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
