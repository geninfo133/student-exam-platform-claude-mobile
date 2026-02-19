import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const GRADING_LABELS = {
  PENDING_REVIEW: 'Pending',
  GRADING_MCQ: 'Grading MCQs...',
  GRADING_DESCRIPTIVE: 'Grading Descriptive...',
  ANALYZING: 'Analyzing...',
};

export default function ExamResults() {
  const [exams, setExams] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [gradingIds, setGradingIds] = useState(new Set());

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

  // Poll while any exam is being graded
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
      setGradingIds((prev) => {
        const next = new Set(prev);
        next.delete(examId);
        return next;
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
        <Link to="/teacher/create-exam" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm">
          Create New Exam
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Pending Review Section */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                Pending Review
                <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {pending.filter((e) => e.grading_status === 'PENDING_REVIEW').length}
                </span>
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-amber-50 border-b border-amber-100">
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Subject</th>
                        <th className="text-center px-5 py-3 font-semibold text-gray-600">Questions</th>
                        <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                        <th className="text-left px-5 py-3 font-semibold text-gray-600">Submitted</th>
                        <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((exam) => {
                        const isProcessing = exam.grading_status !== 'PENDING_REVIEW';
                        return (
                          <tr key={exam.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                            <td className="px-5 py-3 font-medium text-gray-800">{exam.student}</td>
                            <td className="px-5 py-3 text-gray-600">{exam.subject}</td>
                            <td className="text-center px-5 py-3 text-gray-600">{exam.total_questions}</td>
                            <td className="text-center px-5 py-3">
                              {isProcessing ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  {GRADING_LABELS[exam.grading_status] || exam.grading_status}
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-gray-500 text-xs">
                              {exam.completed_at ? new Date(exam.completed_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              }) : '-'}
                            </td>
                            <td className="px-5 py-3 text-center">
                              {exam.grading_status === 'PENDING_REVIEW' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleGrade(exam.id, false)}
                                    disabled={gradingIds.has(exam.id)}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                    title="Grade and assign marks only"
                                  >
                                    Quick Grade
                                  </button>
                                  <button
                                    onClick={() => handleGrade(exam.id, true)}
                                    disabled={gradingIds.has(exam.id)}
                                    className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50"
                                    title="Grade with detailed analysis"
                                  >
                                    Grade + Analyze
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Processing...</span>
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

          {/* Assigned Exams List */}
          <h2 className="text-lg font-bold text-gray-800 mb-3">Assigned Exams</h2>
          {exams.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500 mb-4">No exams assigned yet.</p>
              <Link to="/teacher/create-exam" className="text-indigo-600 font-medium hover:underline">Create your first exam</Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {exams.map((exam) => (
                  <Link
                    key={exam.id}
                    to={`/teacher/review/${exam.id}`}
                    className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{exam.title}</h3>
                        <p className="text-sm text-gray-500">{exam.subject_name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created: {new Date(exam.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-indigo-600">{exam.student_count}</p>
                          <p className="text-xs text-gray-500">Students</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-lg font-bold ${
                            exam.completed_count === exam.student_count && exam.student_count > 0
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}>
                            {exam.completed_count}
                          </p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-3 mt-8">
                <button onClick={() => setPage(page - 1)} disabled={page === 1}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition min-h-[44px]">
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">Page {page}</span>
                <button onClick={() => setPage(page + 1)} disabled={!hasMore}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition min-h-[44px]">
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
