import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

export default function ExamHistory() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [histRes, hwRes] = await Promise.all([
          api.get('/api/exams/history/', { params: { page_size: 100 } }),
          api.get('/api/handwritten/my/').catch(() => ({ data: [] })),
        ]);
        const online = (histRes.data.results || histRes.data).map(e => ({
          ...e, _type: 'online', _date: e.completed_at,
        }));
        const hw = (hwRes.data.results || hwRes.data).map(e => ({
          ...e, _type: 'handwritten', _date: e.created_at,
        }));
        const combined = [...online, ...hw].sort((a, b) => new Date(b._date) - new Date(a._date));
        setExams(combined);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Exam History</h1>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500 mb-4">No exams taken yet.</p>
          <Link to="/subjects" className="text-indigo-600 font-medium hover:underline">Take your first exam</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const isHw = exam._type === 'handwritten';
            const pct = Math.round(exam.percentage || 0);
            const pctColor = pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-600';
            const linkTo = isHw ? '/handwritten-results' : `/result/${exam.id}`;

            return (
              <Link key={`${exam._type}-${exam.id}`} to={linkTo}
                className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {isHw ? exam.title : exam.subject_name}
                      {isHw && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Handwritten</span>}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {exam.subject_name}{!isHw && exam.chapter_name ? ` | ${exam.chapter_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(exam._date).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${pctColor}`}>{pct}%</p>
                      <p className="text-xs text-gray-500">
                        {isHw ? `${exam.obtained_marks}/${exam.total_marks}` : `${exam.score}/50`}
                      </p>
                    </div>
                    {!isHw && (
                      <div className="text-xs space-y-1 text-gray-500">
                        <p>MCQ: {exam.mcq_score}</p>
                        <p>Short: {exam.short_answer_score}</p>
                        <p>Long: {exam.long_answer_score}</p>
                      </div>
                    )}
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
