import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function SchoolExamsList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/api/exams/assigned/')
      .then(res => setExams(res.data.results || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.subject_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.teacher_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/school/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">All Exams</h1>
            <p className="text-sm text-gray-500">{exams.length} exam{exams.length !== 1 ? 's' : ''} assigned by your teachers</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by title, subject or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-80 px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-white text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading exams...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
            <p className="font-bold text-gray-700 mb-1">No exams found</p>
            <p className="text-gray-400 text-sm">Exams assigned by teachers will appear here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(exam => (
              <div key={exam.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${exam.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {exam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="font-black text-gray-900 text-sm mb-1 line-clamp-1">{exam.title}</h3>
                <p className="text-xs text-gray-400 mb-1">{exam.subject_name}</p>
                <p className="text-xs text-indigo-500 font-semibold mb-3">by {exam.teacher_name}</p>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-50 text-xs text-gray-500">
                  <span>🎯 {exam.total_marks} marks</span>
                  <span>⏱️ {exam.duration_minutes} min</span>
                  <span>👥 {exam.student_count} students</span>
                  <span>✅ {exam.completed_count} done</span>
                </div>

                {exam.exam_category_display && (
                  <div className="mt-3">
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {exam.exam_category_display}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
