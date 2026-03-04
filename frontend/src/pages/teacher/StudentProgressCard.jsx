import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard, CATEGORY_LABELS, CATEGORY_ORDER } from '../../utils/examCategories';

function pctColor(pct) {
  if (pct >= 75) return 'bg-green-100 text-green-800';
  if (pct >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-700';
}

export default function StudentProgressCard() {
  const { user } = useAuth();
  const boardCategories = getCategoriesForBoard(user?.board);

  // Students list (for dropdown)
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  // Filters
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filters, setFilters] = useState({ exam_category: '', date_from: '', date_to: '' });

  // Results
  const [results, setResults] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      setStudentsLoading(true);
      try {
        const endpoint = user?.role === 'school' ? '/api/auth/members/?role=student' : '/api/auth/my-students/';
        const res = await api.get(endpoint);
        setStudents(res.data.results || res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    };
    loadStudents();
  }, [user]);

  const fetchProgressCard = useCallback(async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setSearched(true);
    try {
      const params = { student_id: studentId };
      if (filters.exam_category) params.exam_category = filters.exam_category;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res = await api.get('/api/progress-card/', { params });
      setResults(res.data.results || []);
      setStudentInfo(res.data.student || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleSearch = () => {
    fetchProgressCard(selectedStudentId);
  };

  const clearFilters = () => {
    setFilters({ exam_category: '', date_from: '', date_to: '' });
    setSelectedStudentId('');
    setStudentSearch('');
    setResults([]);
    setStudentInfo(null);
    setSearched(false);
  };

  // Filtered student dropdown
  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase());
  });

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
    if (!grid[key] || r.percentage > grid[key].percentage) {
      grid[key] = r;
    }
  }

  const categories = CATEGORY_ORDER.filter((c) => categoriesPresent.has(c));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Progress Card</h1>
        <p className="text-gray-500 mt-1">View performance across exam categories for any student.</p>
      </div>

      {/* Search Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Student Search */}
          <div className="lg:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search Student</label>
            <input
              type="text"
              placeholder="Type name or username..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Student Dropdown */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Student --</option>
              {studentsLoading ? (
                <option disabled>Loading...</option>
              ) : (
                filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} {s.grade ? `(Class ${s.grade}${s.section || ''})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Exam Category — only shown when board has categories */}
          {boardCategories.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Exam Category</label>
              <select
                value={filters.exam_category}
                onChange={(e) => setFilters((f) => ({ ...f, exam_category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {boardCategories.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="From date"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="To date"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSearch}
            disabled={!selectedStudentId || loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'View Progress Card'}
          </button>
          <button
            onClick={clearFilters}
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
      ) : !searched ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">Select a student to view their progress card.</p>
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500 text-lg">No progress data found for this student.</p>
          <p className="text-gray-400 text-sm mt-1">
            Assign exams with an exam category, and once completed they will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Student Info */}
          {studentInfo && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                {studentInfo.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{studentInfo.name}</p>
                {studentInfo.grade && (
                  <p className="text-sm text-gray-500">Class {studentInfo.grade}{studentInfo.section}</p>
                )}
              </div>
            </div>
          )}

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
        </>
      )}
    </div>
  );
}
