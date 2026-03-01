import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';

export default function HandwrittenResults() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    api.get('/api/handwritten/my/')
      .then((res) => setExams(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getScoreColor = (pct) => {
    if (pct >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (pct >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (pct >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getMarkColor = (awarded, max) => {
    const ratio = max > 0 ? awarded / max : 0;
    if (ratio >= 0.8) return 'bg-green-100 text-green-700';
    if (ratio >= 0.5) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Handwritten Exam Results</h1>
        <p className="text-gray-500 text-sm mt-1">View your graded handwritten answer sheets</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No graded handwritten exams yet.</p>
          <p className="text-gray-400 text-sm mt-1">Your teacher will upload and grade your answer sheets here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => {
            const pct = exam.percentage || 0;
            const isExpanded = expanded === exam.id;
            const grading = exam.grading_data || {};

            return (
              <div key={exam.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpanded(isExpanded ? null : exam.id)}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{exam.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{exam.subject_name}</span>
                      <span className="text-xs text-gray-400">{new Date(exam.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-lg border font-bold text-lg ${getScoreColor(pct)}`}>
                      {exam.obtained_marks}/{exam.total_marks}
                      <span className="text-xs font-normal ml-1">({pct.toFixed(1)}%)</span>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-5">
                    {/* Score Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 text-center border">
                        <p className="text-2xl font-bold text-indigo-600">{exam.obtained_marks}</p>
                        <p className="text-xs text-gray-500 mt-1">Obtained</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center border">
                        <p className="text-2xl font-bold text-gray-700">{exam.total_marks}</p>
                        <p className="text-xs text-gray-500 mt-1">Total</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-center border">
                        <p className={`text-2xl font-bold ${pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {pct.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Percentage</p>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Score donut */}
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Score Overview</h4>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Scored', value: exam.obtained_marks },
                                { name: 'Lost', value: Math.max(0, exam.total_marks - exam.obtained_marks) },
                              ]}
                              cx="50%" cy="50%"
                              innerRadius={50} outerRadius={72}
                              dataKey="value"
                              startAngle={90} endAngle={-270}
                            >
                              <Cell fill={pct >= 60 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626'} />
                              <Cell fill="#e5e7eb" />
                            </Pie>
                            <Tooltip formatter={(v, n) => [`${v} marks`, n]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Per-question bar */}
                      {grading.questions?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Question-wise Marks</h4>
                          <ResponsiveContainer width="100%" height={180}>
                            <BarChart
                              data={grading.questions.map(q => ({
                                name: `Q${q.question_number}`,
                                Scored: q.marks_awarded,
                                Max: q.max_marks,
                              }))}
                              margin={{ top: 0, right: 5, left: -20, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Legend wrapperStyle={{ fontSize: 10 }} />
                              <Bar dataKey="Max" fill="#e0e7ff" radius={[3,3,0,0]} />
                              <Bar dataKey="Scored" fill="#4f46e5" radius={[3,3,0,0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Overall Feedback */}
                    {grading.overall_feedback && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-indigo-800 mb-1">Overall Feedback</p>
                        <p className="text-sm text-indigo-700">{grading.overall_feedback}</p>
                      </div>
                    )}

                    {/* Strengths / Weaknesses / Recommendations */}
                    {grading.strengths?.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-green-800 mb-2">Strengths</p>
                        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                          {grading.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {grading.weaknesses?.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-red-800 mb-2">Areas to Improve</p>
                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                          {grading.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                    {grading.recommendations?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-medium text-blue-800 mb-2">Recommendations</p>
                        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
                          {grading.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Per-Question Breakdown */}
                    {grading.questions?.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-3">Question-wise Breakdown</p>
                        <div className="space-y-3">
                          {grading.questions.map((q, i) => (
                            <div key={i} className="bg-white rounded-lg border p-4">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-800">Q{q.question_number}. {q.question_text}</p>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${getMarkColor(q.marks_awarded, q.max_marks)}`}>
                                  {q.marks_awarded}/{q.max_marks}
                                </span>
                              </div>
                              {q.student_answer && (
                                <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Your Answer:</span> {q.student_answer}</p>
                              )}
                              {q.correct_answer && (
                                <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Expected:</span> {q.correct_answer}</p>
                              )}
                              {q.feedback && (
                                <p className="text-xs text-indigo-600 mt-1">{q.feedback}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
