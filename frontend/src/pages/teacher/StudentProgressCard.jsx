import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

function gradeBadge(pct) {
  if (pct >= 90) return { label: 'A+', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  if (pct >= 75) return { label: 'A',  cls: 'bg-green-100 text-green-700 border-green-200'   };
  if (pct >= 60) return { label: 'B',  cls: 'bg-blue-100 text-blue-700 border-blue-200'     };
  if (pct >= 50) return { label: 'C',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  if (pct >= 35) return { label: 'D',  cls: 'bg-orange-100 text-orange-700 border-orange-200' };
  return                 { label: 'F',  cls: 'bg-red-100 text-red-700 border-red-200'        };
}

function pctBar(pct) {
  const color =
    pct >= 75 ? 'bg-green-500' :
    pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-9 text-right">{pct}%</span>
    </div>
  );
}

export default function StudentProgressCard() {
  const { user } = useAuth();
  const boardCategories = getCategoriesForBoard(user?.board);

  const [students, setStudents]           = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [filters, setFilters]             = useState({ exam_category: '', date_from: '', date_to: '' });
  const [results, setResults]             = useState([]);
  const [studentInfo, setStudentInfo]     = useState(null);
  const [loading, setLoading]             = useState(false);
  const [searched, setSearched]           = useState(false);

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
      if (filters.date_from)     params.date_from     = filters.date_from;
      if (filters.date_to)       params.date_to       = filters.date_to;
      const res = await api.get('/api/progress-card/', { params });
      setResults(res.data.results || []);
      setStudentInfo(res.data.student || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const clearFilters = () => {
    setFilters({ exam_category: '', date_from: '', date_to: '' });
    setSelectedStudentId('');
    setStudentSearch('');
    setResults([]);
    setStudentInfo(null);
    setSearched(false);
  };

  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase());
  });

  /* ── One row per subject+category (best attempt kept per pair) ── */
  const grid = {};
  for (const r of results) {
    const key = `${r.subject_id}_${r.exam_category}`;
    if (!grid[key] || r.percentage > grid[key].percentage) grid[key] = r;
  }

  const rows = Object.values(grid).map((r) => {
    const score = Number(r.score || 0);
    const total = Number(r.total_marks || 0);
    // Show "Subject · Category" only when category label is present
    const catLabel = r.exam_category_display || r.exam_category || '';
    const name = catLabel ? `${r.subject_name}  ·  ${catLabel}` : r.subject_name;
    return {
      key:    `${r.subject_id}_${r.exam_category}`,
      name,
      score,
      total,
      pct:    total > 0 ? Math.round((score / total) * 100) : 0,
      source: r.source,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const grandScore = rows.reduce((sum, r) => sum + r.score, 0);
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);
  const grandPct   = grandTotal > 0 ? Math.round((grandScore / grandTotal) * 100) : 0;
  const grandGrade = gradeBadge(grandPct);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── HEADER ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Student Progress Card</h1>
          <p className="text-gray-500 text-sm mt-1">View performance across subjects for any student.</p>
        </div>

        {/* ── SEARCH PANEL ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search Student</label>
              <input
                type="text"
                placeholder="Type name or username…"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Select Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Select Student --</option>
                {studentsLoading ? (
                  <option disabled>Loading…</option>
                ) : (
                  filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.first_name} {s.last_name}{s.grade ? ` (Class ${s.grade}${s.section || ''})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {boardCategories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Exam Category</label>
                <select
                  value={filters.exam_category}
                  onChange={(e) => setFilters((f) => ({ ...f, exam_category: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Categories</option>
                  {boardCategories.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
              <div className="flex gap-2">
                <input type="date" value={filters.date_from}
                  onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="From date"
                />
                <input type="date" value={filters.date_to}
                  onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-xs bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title="To date"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => fetchProgressCard(selectedStudentId)}
              disabled={!selectedStudentId || loading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold
                         hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading…' : 'View Progress Card'}
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* ── RESULTS ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>

        ) : !searched ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Select a student to view their progress card.</p>
          </div>

        ) : rows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No progress data found for this student.</p>
            <p className="text-gray-400 text-sm mt-1">
              Assign exams with an exam category, and once completed they will appear here.
            </p>
          </div>

        ) : (
          <>
            {/* Student info + overall score */}
            {studentInfo && (
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900
                              rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
                <div className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center
                                  text-2xl font-bold text-white ring-4 ring-white/20 shrink-0">
                    {studentInfo.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-0.5">Progress Card</p>
                    <h2 className="text-xl font-extrabold">{studentInfo.name}</h2>
                    {studentInfo.grade && (
                      <p className="text-indigo-200 text-sm">Class {studentInfo.grade}{studentInfo.section}</p>
                    )}
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-center shrink-0 backdrop-blur-sm">
                    <p className="text-3xl font-extrabold">{grandPct}%</p>
                    <p className="text-indigo-200 text-xs mt-0.5">Overall</p>
                    <span className={`mt-2 inline-block text-xs font-bold px-3 py-0.5 rounded-full border ${grandGrade.cls}`}>
                      Grade {grandGrade.label}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600">#</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600">Subject</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Max Marks</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Marks Obtained</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-gray-600 min-w-[140px]">Percentage</th>
                    <th className="text-center px-5 py-3.5 font-semibold text-gray-600">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.map((row, idx) => {
                    const grade = gradeBadge(row.pct);
                    return (
                      <tr key={row.key} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-4 text-gray-400 font-medium">{idx + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-800">{row.name}</span>
                            {row.source === 'handwritten' && <span className="text-xs text-gray-400">✍️</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-medium text-gray-700">{row.total}</td>
                        <td className="px-5 py-4 text-center font-bold text-indigo-700">{row.score}</td>
                        <td className="px-5 py-4">{pctBar(row.pct)}</td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${grade.cls}`}>
                            {grade.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Total row */}
                <tfoot>
                  <tr className="bg-indigo-50 border-t-2 border-indigo-100">
                    <td className="px-5 py-4" colSpan={2}>
                      <span className="font-bold text-indigo-800">Total</span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-gray-700">{grandTotal}</td>
                    <td className="px-5 py-4 text-center font-bold text-indigo-700">{grandScore}</td>
                    <td className="px-5 py-4">{pctBar(grandPct)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-lg border ${grandGrade.cls}`}>
                        {grandGrade.label}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Legend */}
              <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-400">
                {[
                  { color: 'bg-emerald-400', label: 'A+ ≥90%' },
                  { color: 'bg-green-400',   label: 'A  ≥75%' },
                  { color: 'bg-blue-400',    label: 'B  ≥60%' },
                  { color: 'bg-yellow-400',  label: 'C  ≥50%' },
                  { color: 'bg-orange-400',  label: 'D  ≥35%' },
                  { color: 'bg-red-400',     label: 'F  <35%' },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
