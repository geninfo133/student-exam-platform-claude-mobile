import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getCategoriesForBoard, CATEGORY_LABELS, CATEGORY_ORDER } from '../utils/examCategories';

function pctColor(pct) {
  if (pct >= 75) return 'bg-green-100 text-green-800';
  if (pct >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

export default function ProgressCard() {
  const { user } = useAuth();
  const boardCategories = getCategoriesForBoard(user?.board);
  const [results, setResults] = useState([]);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ exam_category: '', date_from: '', date_to: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.exam_category) params.exam_category = filters.exam_category;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await api.get('/api/progress-card/', { params });
      setResults(res.data.results || []);
      setStudent(res.data.student || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build grid data
  const subjects = [];
  const seenSubjects = new Set();
  const categoriesPresent = new Set();
  const grid = {};

  for (const r of results) {
    if (!seenSubjects.has(r.subject_id)) {
      seenSubjects.add(r.subject_id);
      subjects.push({ id: r.subject_id, name: r.subject_name });
    }
    categoriesPresent.add(r.exam_category);
    const key = `${r.subject_id}_${r.exam_category}`;
    // Keep latest (or best) attempt per subject+category
    if (!grid[key] || r.percentage > grid[key].percentage) {
      grid[key] = r;
    }
  }

  const categories = CATEGORY_ORDER.filter((c) => categoriesPresent.has(c));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Progress Card</h1>
        {student && (
          <p className="text-gray-500 mt-1">
            {student.name}
            {student.grade && ` · Class ${student.grade}${student.section}`}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {boardCategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Exam Category</label>
              <select
                value={filters.exam_category}
                onChange={(e) => setFilters((f) => ({ ...f, exam_category: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {boardCategories.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setFilters({ exam_category: '', date_from: '', date_to: '' })}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Progress Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500 text-lg">No progress data found.</p>
          <p className="text-gray-400 text-sm mt-1">Complete assigned exams or have handwritten papers graded with a category set.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-semibold text-gray-700 min-w-[150px]">Subject</th>
                  {categories.map((cat) => (
                    <th key={cat} className="text-center px-4 py-3 font-semibold text-gray-700 min-w-[90px]">
                      {CATEGORY_LABELS[cat] || cat}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjects.map((subj, idx) => (
                  <tr key={subj.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3 font-medium text-gray-800">{subj.name}</td>
                    {categories.map((cat) => {
                      const cell = grid[`${subj.id}_${cat}`];
                      return (
                        <td key={cat} className="px-4 py-3 text-center">
                          {cell ? (
                            <div className="flex flex-col items-center gap-0.5" title={`${cell.title} (${cell.source === 'handwritten' ? 'Handwritten' : 'Online'})`}>
                              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${pctColor(cell.percentage)}`}>
                                {cell.percentage}%
                              </span>
                              <span className="text-gray-400 text-xs">
                                {cell.score}/{cell.total_marks}
                              </span>
                              {cell.source === 'handwritten' && (
                                <span className="text-gray-400 text-xs">✍️</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-green-200" /> ≥75% Good
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-yellow-200" /> 50–74% Average
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-full bg-red-200" /> &lt;50% Needs Improvement
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
