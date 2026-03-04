import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

const STATUS_STYLES = {
  UPLOADED: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-yellow-100 text-yellow-700',
  GRADED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

export default function HandwrittenList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const boardCategories = getCategoriesForBoard(user?.board);
  const categoryOptions = [{ value: '', label: '-- No Category --' }, ...boardCategories];
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [savingCategoryId, setSavingCategoryId] = useState(null);

  const fetchExams = useCallback(async () => {
    try {
      const res = await api.get('/api/handwritten/');
      setExams(res.data.results || res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // Auto-expand exam from ?expand=id query param
  useEffect(() => {
    const expandId = Number(searchParams.get('expand'));
    if (expandId && !loading) {
      handleViewDetail(expandId);
      setTimeout(() => {
        document.getElementById(`hw-row-${expandId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [loading]);

  // Poll for processing exams
  useEffect(() => {
    const processingExams = exams.filter((e) => e.status === 'PROCESSING');
    if (processingExams.length === 0) return;

    const interval = setInterval(fetchExams, 3000);
    return () => clearInterval(interval);
  }, [exams, fetchExams]);

  const handleGrade = async (id, includeAnalysis = false) => {
    setProcessingIds((prev) => new Set(prev).add(id));
    try {
      await api.post(`/api/handwritten/${id}/process/`, { include_analysis: includeAnalysis });
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to start grading');
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
      await api.delete(`/api/handwritten/${id}/delete/`);
      setExams((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
        setDetail(null);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleCategoryChange = async (id, newCategory) => {
    setExams((prev) => prev.map((e) => e.id === id ? { ...e, exam_category: newCategory } : e));
    setSavingCategoryId(id);
    try {
      await api.patch(`/api/handwritten/${id}/`, { exam_category: newCategory });
    } catch {
      alert('Failed to save category');
      fetchExams();
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleViewDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    try {
      const res = await api.get(`/api/handwritten/${id}/`);
      setDetail(res.data);
      setExpandedId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const getRowColor = (marks, maxMarks) => {
    if (marks === undefined || marks === null) return '';
    const ratio = marks / maxMarks;
    if (ratio >= 1) return 'bg-green-50';
    if (ratio >= 0.5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Handwritten Papers</h1>
        <Link
          to="/teacher/upload-handwritten"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
        >
          Upload New
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-4">No handwritten papers uploaded yet.</p>
          <Link to="/teacher/upload-handwritten" className="text-indigo-600 font-medium hover:underline">
            Upload your first paper
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Subject</th>
                  {boardCategories.length > 0 && (
                    <th className="text-left px-5 py-3 font-semibold text-gray-600">Category</th>
                  )}
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Marks</th>
                  <th className="text-right px-5 py-3 font-semibold text-gray-600">Date</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam) => (
                  <Fragment key={exam.id}>
                    <tr id={`hw-row-${exam.id}`} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-5 py-3 font-medium text-gray-800">{exam.title}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.student_display_name}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.subject_name}</td>
                      {boardCategories.length > 0 && (
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <select
                                value={exam.exam_category || ''}
                                onChange={(e) => handleCategoryChange(exam.id, e.target.value)}
                                disabled={savingCategoryId === exam.id}
                                className={`text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 cursor-pointer ${
                                  exam.status === 'GRADED' && !exam.exam_category
                                    ? 'border border-orange-400 bg-orange-50 text-orange-700'
                                    : 'border border-gray-200 bg-gray-50 text-gray-600'
                                }`}
                              >
                                {categoryOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              {savingCategoryId === exam.id && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 shrink-0" />
                              )}
                            </div>
                            {exam.status === 'GRADED' && !exam.exam_category && (
                              <span className="text-xs text-orange-600 font-medium">Set for Progress Card</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[exam.status] || ''}`}>
                          {exam.status === 'PROCESSING' && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
                          )}
                          {exam.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-800">
                        {exam.status === 'GRADED' ? (
                          <span>
                            <span className="font-bold">{exam.obtained_marks}</span>/{exam.total_marks}
                            <span className={`ml-2 text-xs font-bold ${
                              exam.percentage >= 60 ? 'text-green-600' :
                              exam.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              ({Math.round(exam.percentage)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500 text-xs">
                        {new Date(exam.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {exam.status === 'UPLOADED' && (
                            <>
                              <button
                                onClick={() => handleGrade(exam.id, false)}
                                disabled={processingIds.has(exam.id)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                                title="Grade and assign marks only"
                              >
                                Quick Grade
                              </button>
                              <button
                                onClick={() => handleGrade(exam.id, true)}
                                disabled={processingIds.has(exam.id)}
                                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-purple-700 transition disabled:opacity-50"
                                title="Grade with detailed analysis, strengths and recommendations"
                              >
                                Grade + Analyze
                              </button>
                            </>
                          )}
                          {exam.status === 'FAILED' && (
                            <>
                              <button
                                onClick={() => handleGrade(exam.id, false)}
                                className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-yellow-700 transition"
                              >
                                Retry
                              </button>
                              <button
                                onClick={() => handleGrade(exam.id, true)}
                                className="bg-purple-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-purple-700 transition"
                              >
                                Retry + Analyze
                              </button>
                            </>
                          )}
                          {exam.status === 'GRADED' && (
                            <button
                              onClick={() => handleViewDetail(exam.id)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-700 transition"
                            >
                              {expandedId === exam.id ? 'Hide' : 'View'}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/teacher/exam/${exam.id}/paper?type=handwritten`)}
                            className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                            title="View uploaded files"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="text-red-500 hover:text-red-700 transition p-1"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === exam.id && detail && (
                      <tr>
                        <td colSpan={boardCategories.length > 0 ? 8 : 7} className="px-5 py-4 bg-gray-50">

                          {/* Score Summary Cards */}
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                              <p className="text-2xl font-bold text-indigo-600">{detail.obtained_marks}</p>
                              <p className="text-xs text-gray-500">Obtained Marks</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                              <p className="text-2xl font-bold text-gray-700">{detail.total_marks}</p>
                              <p className="text-xs text-gray-500">Total Marks</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                              <p className={`text-2xl font-bold ${
                                detail.percentage >= 60 ? 'text-green-600' :
                                detail.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>{Math.round(detail.percentage)}%</p>
                              <p className="text-xs text-gray-500">Percentage</p>
                            </div>
                          </div>

                          {/* Charts Row */}
                          <div className="grid md:grid-cols-2 gap-4 mb-6">

                            {/* Donut chart — Score vs Remaining */}
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Overview</h4>
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Scored', value: detail.obtained_marks },
                                      { name: 'Lost', value: Math.max(0, detail.total_marks - detail.obtained_marks) },
                                    ]}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={80}
                                    dataKey="value"
                                    startAngle={90} endAngle={-270}
                                  >
                                    <Cell fill={detail.percentage >= 60 ? '#16a34a' : detail.percentage >= 40 ? '#ca8a04' : '#dc2626'} />
                                    <Cell fill="#e5e7eb" />
                                  </Pie>
                                  <Tooltip formatter={(v, n) => [`${v} marks`, n]} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Bar chart — Per-question marks */}
                            {detail.grading_data?.questions?.length > 0 && (
                              <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Question-wise Marks</h4>
                                <ResponsiveContainer width="100%" height={200}>
                                  <BarChart
                                    data={detail.grading_data.questions.map(q => ({
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
                                    <Bar dataKey="Max" fill="#e0e7ff" radius={[3,3,0,0]} />
                                    <Bar dataKey="Scored" fill="#4f46e5" radius={[3,3,0,0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>

                          {/* Overall feedback */}
                          {detail.grading_data?.overall_feedback && (
                            <div className="bg-indigo-50 rounded-lg p-3 mb-4 border border-indigo-100">
                              <p className="text-sm font-semibold text-indigo-800 mb-1">Overall Feedback</p>
                              <p className="text-sm text-indigo-700">{detail.grading_data.overall_feedback}</p>
                            </div>
                          )}

                          {/* Analysis — Strengths / Weaknesses / Recommendations */}
                          {(detail.grading_data?.strengths?.length > 0 || detail.grading_data?.weaknesses?.length > 0 || detail.grading_data?.recommendations?.length > 0) && (
                            <div className="grid md:grid-cols-3 gap-3 mb-4">
                              {detail.grading_data.strengths?.length > 0 && (
                                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                                  <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths</h4>
                                  <ul className="text-xs text-green-800 space-y-1">
                                    {detail.grading_data.strengths.map((s, i) => <li key={i}>- {s}</li>)}
                                  </ul>
                                </div>
                              )}
                              {detail.grading_data.weaknesses?.length > 0 && (
                                <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                  <h4 className="text-xs font-semibold text-red-700 mb-1">Weaknesses</h4>
                                  <ul className="text-xs text-red-800 space-y-1">
                                    {detail.grading_data.weaknesses.map((w, i) => <li key={i}>- {w}</li>)}
                                  </ul>
                                </div>
                              )}
                              {detail.grading_data.recommendations?.length > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                  <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommendations</h4>
                                  <ul className="text-xs text-blue-800 space-y-1">
                                    {detail.grading_data.recommendations.map((r, i) => <li key={i}>- {r}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Per-question table */}
                          {detail.grading_data?.questions?.length > 0 && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Q#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Question</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Student Answer</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Correct Answer</th>
                                    <th className="px-3 py-2 text-center font-semibold text-gray-600">Marks</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Feedback</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {detail.grading_data.questions.map((q, idx) => (
                                    <tr key={idx} className={`border-t border-gray-100 ${getRowColor(q.marks_awarded, q.max_marks)}`}>
                                      <td className="px-3 py-2 font-medium text-gray-700">{q.question_number}</td>
                                      <td className="px-3 py-2 text-gray-700 max-w-xs">{q.question_text}</td>
                                      <td className="px-3 py-2 text-gray-700 max-w-xs italic">{q.student_answer}</td>
                                      <td className="px-3 py-2 text-gray-600 max-w-xs">{q.correct_answer}</td>
                                      <td className="px-3 py-2 text-center">
                                        <span className={`font-bold ${
                                          q.marks_awarded >= q.max_marks ? 'text-green-600' :
                                          q.marks_awarded > 0 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                          {q.marks_awarded}/{q.max_marks}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">{q.feedback}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Error message */}
                          {detail.error_message && (
                            <div className="bg-red-50 rounded-lg p-3 mt-4 border border-red-100">
                              <p className="text-sm text-red-700">{detail.error_message}</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
