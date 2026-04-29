import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

const GRADING_LABELS = {
  PENDING_REVIEW: 'Pending',
  GRADING_MCQ: 'Grading MCQs…',
  GRADING_DESCRIPTIVE: 'Grading Descriptive…',
  ANALYZING: 'Analyzing…',
};

const ACCENT = [
  'from-indigo-500 to-violet-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-purple-500 to-fuchsia-600',
];

export default function ExamResults() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [gradingIds, setGradingIds] = useState(new Set());
  const [deletingExamId, setDeletingExamId] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);

  const boardCategories = getCategoriesForBoard(user?.board);
  const categoryOptions = [{ value: '', label: '-- No Category --' }, ...boardCategories];

  const fetchExams = async (pageNum) => {
    try {
      const res = await api.get('/api/exams/assigned/', { params: { page: pageNum } });
      const data = res.data;
      if (data.results) {
        setExams(data.results);
        setHasMore(!!data.next);
      } else {
        setExams(data);
        setHasMore(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/api/exams/pending-review/');
      setPending(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchExams(page), fetchPending()]).finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    const grading = pending.filter((e) => e.grading_status !== 'PENDING_REVIEW');
    if (grading.length === 0) return;
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, [pending, fetchPending]);

  const handleDeleteExam = async (e, examId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this exam? All student submissions will also be removed.')) return;
    setDeletingExamId(examId);
    try {
      await api.delete(`/api/exams/assigned/${examId}/`);
      fetchExams(page);
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete exam');
    } finally {
      setDeletingExamId(null);
    }
  };

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

  const handleCategoryChange = async (examId, newCategory) => {
    setExams((prev) => prev.map((e) => e.id === examId ? { ...e, exam_category: newCategory } : e));
    setSavingCategoryId(examId);
    try {
      await api.patch(`/api/exams/assigned/${examId}/`, { exam_category: newCategory });
    } catch {
      alert('Failed to save category');
      fetchExams(page);
    } finally {
      setSavingCategoryId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading results…</p>
        </div>
      </div>
    );
  }

  const pendingCount = pending.filter((e) => e.grading_status === 'PENDING_REVIEW').length;

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
            <h1 className="text-3xl font-extrabold text-white">Exam Results</h1>
            <Link to="/teacher/create-exam"
              className="hidden sm:inline-flex items-center gap-2 bg-white text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-lg shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Exam
            </Link>
          </div>
          <p className="text-indigo-200 text-sm mb-6">View and manage all submitted exam results</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total Exams',    value: exams.length,   color: 'bg-white/10 border-white/20',             text: 'text-white'       },
              { label: 'Pending Review', value: pendingCount,   color: 'bg-amber-500/20 border-amber-400/30',     text: 'text-amber-200'   },
              { label: 'Being Graded',   value: pending.filter(e => e.grading_status !== 'PENDING_REVIEW').length, color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
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
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Pending Review */}
        {pending.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Pending Review</h2>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {pendingCount} waiting
                </span>
              )}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-amber-500 to-orange-600">
                      <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Student</th>
                      <th className="text-left px-5 py-3.5 text-white text-xs font-semibold uppercase tracking-wider">Subject</th>
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
                          <td className="px-5 py-3.5 font-semibold text-gray-800">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {exam.student?.[0]?.toUpperCase()}
                              </div>
                              {exam.student}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-600">{exam.subject}</td>
                          <td className="text-center px-5 py-3.5 text-gray-600">{exam.total_questions}</td>
                          <td className="text-center px-5 py-3.5">
                            {isProcessing ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
                                {GRADING_LABELS[exam.grading_status] || exam.grading_status}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">
                            {exam.completed_at
                              ? new Date(exam.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {exam.grading_status === 'PENDING_REVIEW' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleGrade(exam.id, false)}
                                  disabled={gradingIds.has(exam.id)}
                                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                                >
                                  Quick Grade
                                </button>
                                <button
                                  onClick={() => handleGrade(exam.id, true)}
                                  disabled={gradingIds.has(exam.id)}
                                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                                >
                                  Grade + Analyze
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Processing…</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assigned Exams */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Assigned Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No exams assigned yet</h3>
              <Link to="/teacher/create-exam" className="text-indigo-600 font-medium text-sm hover:underline">
                Create your first exam →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {exams.map((exam, idx) => {
                  const pct = exam.student_count > 0 ? Math.round((exam.completed_count / exam.student_count) * 100) : 0;
                  const done = exam.completed_count === exam.student_count && exam.student_count > 0;
                  return (
                    <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex">
                      {/* Colored left strip */}
                      <div className={`w-1.5 flex-shrink-0 bg-gradient-to-b ${ACCENT[idx % ACCENT.length]}`} />

                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <Link to={`/teacher/review/${exam.id}`} className="font-semibold text-gray-800 hover:text-indigo-700 transition text-sm leading-snug block">
                              {exam.title}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5">{exam.subject_name}</p>
                          </div>
                          {/* Action icons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Link to={`/teacher/exam/${exam.id}/paper`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition" title="View paper">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link to={`/teacher/create-exam/${exam.id}`} className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="Edit exam">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={(e) => handleDeleteExam(e, exam.id)}
                              disabled={deletingExamId === exam.id}
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                              title="Delete exam"
                            >
                              {deletingExamId === exam.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent" />
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Chips row */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium">
                            {exam.student_count} student{exam.student_count !== 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {exam.completed_count}/{exam.student_count} done
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(exam.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${done ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        {/* Category selector */}
                        {boardCategories.length > 0 && (
                          <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                            <label className="text-xs text-gray-400">Category:</label>
                            <select
                              value={exam.exam_category || ''}
                              onChange={(e) => handleCategoryChange(exam.id, e.target.value)}
                              disabled={savingCategoryId === exam.id}
                              className="text-xs border-2 border-gray-100 rounded-lg px-2 py-1 text-gray-600 focus:outline-none focus:border-indigo-300 bg-gray-50 disabled:opacity-50"
                            >
                              {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                            {savingCategoryId === exam.id && (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-indigo-500 border-t-transparent" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                  Page {page}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="px-5 py-2.5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium text-sm transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
