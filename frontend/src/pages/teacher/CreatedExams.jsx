import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

export default function CreatedExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(page); }, [page]);

  const handleDelete = async (e, examId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this exam? All student submissions will also be removed.')) return;
    setDeletingId(examId);
    try {
      await api.delete(`/api/exams/assigned/${examId}/`);
      fetchExams(page);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete exam');
    } finally {
      setDeletingId(null);
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Created Exams</h1>
          <p className="text-sm text-gray-500 mt-0.5">All exams you have created and assigned to students</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/teacher/grading"
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-amber-600 transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Grading Queue
          </Link>
          <Link
            to="/teacher/create-exam"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Exam
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl p-16 text-center shadow-sm border border-gray-100">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 mb-4 font-medium">No exams created yet</p>
          <Link to="/teacher/create-exam" className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition text-sm inline-block">
            Create your first exam
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {exams.map((exam) => {
              const allDone = exam.completed_count === exam.student_count && exam.student_count > 0;
              return (
                <div key={exam.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">

                      {/* Exam info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            allDone ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {allDone ? 'All Completed' : `${exam.completed_count}/${exam.student_count} done`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{exam.subject_name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {new Date(exam.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {exam.start_time && (
                            <span className="ml-2">
                              · Starts {new Date(exam.start_time).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-5 shrink-0">
                        <div className="text-center">
                          <p className="text-xl font-bold text-indigo-600">{exam.student_count}</p>
                          <p className="text-xs text-gray-400">Students</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xl font-bold ${allDone ? 'text-green-600' : 'text-amber-500'}`}>
                            {exam.completed_count}
                          </p>
                          <p className="text-xs text-gray-400">Completed</p>
                        </div>
                      </div>

                      {/* Category selector */}
                      {boardCategories.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.preventDefault()}>
                          <select
                            value={exam.exam_category || ''}
                            onChange={(e) => handleCategoryChange(exam.id, e.target.value)}
                            disabled={savingCategoryId === exam.id}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 disabled:opacity-50 cursor-pointer"
                          >
                            {categoryOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          {savingCategoryId === exam.id && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 shrink-0" />
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* View paper */}
                        <Link
                          to={`/teacher/exam/${exam.id}/paper`}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          title="View question paper"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        {/* Edit */}
                        <Link
                          to={`/teacher/create-exam/${exam.id}`}
                          className="p-2 rounded-lg text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition"
                          title="Edit exam"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(e, exam.id)}
                          disabled={deletingId === exam.id}
                          className="p-2 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                          title="Delete exam"
                        >
                          {deletingId === exam.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                        {/* View student submissions */}
                        <Link
                          to={`/teacher/exam/${exam.id}/submissions`}
                          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          title="View student submissions"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-3 mt-8">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
              ← Previous
            </button>
            <span className="px-4 py-2 text-gray-500 text-sm">Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={!hasMore}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition">
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
