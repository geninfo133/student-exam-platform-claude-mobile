import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: 'All Time', value: 0 },
];

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [period, subjectFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = { period };
      if (subjectFilter) params.subject_id = subjectFilter;
      const res = await api.get('/api/analytics/student/', { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
        Failed to load analytics data.
      </div>
    );
  }

  const { overview, trends, subject_breakdown, question_type_analysis, recent_exams, subjects } = data;
  const isEmpty = overview.total_exams === 0;

  const pieData = [
    { name: 'Pass', value: overview.pass_count },
    { name: 'Fail', value: overview.fail_count },
  ];
  const pieColors = ['#10b981', '#ef4444'];

  const typeChartData = [
    { name: 'MCQ', avg: question_type_analysis.mcq_avg, max: 20 },
    { name: 'Short', avg: question_type_analysis.short_avg, max: 10 },
    { name: 'Long', avg: question_type_analysis.long_avg, max: 20 },
  ];

  const answerDistribution = [
    { name: 'Correct', value: question_type_analysis.avg_correct },
    { name: 'Wrong', value: question_type_analysis.avg_wrong },
    { name: 'Unanswered', value: question_type_analysis.avg_unanswered },
  ].filter((d) => d.value > 0);
  const answerColors = ['#10b981', '#ef4444', '#9ca3af'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">My Performance</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-white/20 rounded-lg overflow-hidden">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  period === opt.value ? 'bg-white text-indigo-700' : 'hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {subjects && subjects.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="" className="text-gray-800">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-800">{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No exam data yet</h2>
          <p className="text-gray-500">
            Take some exams and your performance analytics will appear here.
          </p>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Exams" value={overview.total_exams} color="bg-indigo-50 text-indigo-700" />
            <StatCard label="Avg Score" value={`${overview.average_percentage}%`} color="bg-blue-50 text-blue-700" />
            <StatCard label="Best Score" value={`${overview.best_score}%`} color="bg-green-50 text-green-700" />
            <StatCard label="Pass Rate" value={`${overview.pass_rate}%`} color="bg-purple-50 text-purple-700" />
          </div>

          {/* Trends Line Chart */}
          {trends.length > 1 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Score Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return isNaN(d) ? val : `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(val) => {
                      const d = new Date(val);
                      return isNaN(d) ? val : d.toLocaleDateString();
                    }}
                    formatter={(v) => `${v}%`}
                  />
                  <Line type="monotone" dataKey="combined_avg" stroke="#4f46e5" strokeWidth={2} name="Average %" dot={{ r: 4 }} />
                  {overview.online_exams > 0 && (
                    <Line type="monotone" dataKey="online_avg" stroke="#6366f1" strokeDasharray="5 5" name="Online" dot={false} />
                  )}
                  {overview.handwritten_exams > 0 && (
                    <Line type="monotone" dataKey="handwritten_avg" stroke="#10b981" strokeDasharray="5 5" name="Handwritten" dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Question Type Analysis + Pass/Fail */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Question type bar chart */}
            <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Avg Marks by Question Type</h2>
              {overview.online_exams > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={typeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avg" fill="#4f46e5" name="Your Avg" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="max" fill="#e5e7eb" name="Max Possible" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-400 text-center py-8">Only available for online exams</p>
              )}
            </div>

            {/* Pass/Fail Pie */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Pass / Fail</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Answer Accuracy + Exam Type Split */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Average answer distribution */}
            {overview.online_exams > 0 && answerDistribution.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Avg Answer Accuracy</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={answerDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {answerDistribution.map((_, index) => (
                        <Cell key={index} fill={answerColors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Exam type split */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Exam Breakdown</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Online Exams</p>
                    <p className="text-2xl font-bold text-indigo-700">{overview.online_exams}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Avg</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      {overview.online_exams > 0 ? `${(overview.online_exams > 0 ? Math.round((overview.average_percentage * overview.total_exams - (overview.handwritten_exams > 0 ? 0 : 0)) / overview.online_exams) : 0)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-500">Handwritten Exams</p>
                    <p className="text-2xl font-bold text-green-700">{overview.handwritten_exams}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Count</p>
                    <p className="text-lg font-semibold text-green-600">{overview.handwritten_exams}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Breakdown */}
          {subject_breakdown.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Subject Performance</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, subject_breakdown.length * 50)}>
                <BarChart data={subject_breakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis type="category" dataKey="subject_name" width={120} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="average_percentage" fill="#8b5cf6" name="Avg %" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Subject</th>
                      <th className="text-center px-3 py-2">Exams</th>
                      <th className="text-center px-3 py-2">Avg %</th>
                      <th className="text-center px-3 py-2">Best</th>
                      <th className="text-center px-3 py-2">Lowest</th>
                      <th className="text-center px-3 py-2">Pass %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subject_breakdown.map((s, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-medium">{s.subject_name}</td>
                        <td className="text-center px-3 py-2">{s.total_exams}</td>
                        <td className="text-center px-3 py-2">{s.average_percentage}%</td>
                        <td className="text-center px-3 py-2 text-green-600">{s.highest_score}%</td>
                        <td className="text-center px-3 py-2 text-red-600">{s.lowest_score}%</td>
                        <td className="text-center px-3 py-2">{s.pass_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Exams */}
          {recent_exams.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Exams</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Subject</th>
                      <th className="text-center px-3 py-2">Score</th>
                      <th className="text-center px-3 py-2">%</th>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-center px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_exams.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            e.type === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {e.type === 'online' ? 'Online' : 'Handwritten'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{e.subject}</td>
                        <td className="text-center px-3 py-2">{e.score}</td>
                        <td className="text-center px-3 py-2">
                          <span className={
                            e.percentage >= 60 ? 'text-green-600' :
                            e.percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }>
                            {e.percentage != null ? `${e.percentage}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="text-center px-3 py-2">
                          {e.type === 'online' && (
                            <Link
                              to={`/result/${e.id}`}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                            >
                              View
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-xl p-5 ${color}`}>
      <p className="text-sm opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
