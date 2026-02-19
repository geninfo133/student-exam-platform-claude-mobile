import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const PERIOD_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
  { label: 'All Time', value: 0 },
];

export default function TeacherAnalytics() {
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
      const res = await api.get('/api/analytics/teacher/', { params });
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

  const { overview, trends, subject_breakdown, student_rankings, exam_type_comparison, recent_performance, subjects } = data;

  const isEmpty = overview.total_exams === 0;

  const pieData = [
    { name: 'Pass', value: overview.pass_count },
    { name: 'Fail', value: overview.fail_count },
  ];
  const pieColors = ['#10b981', '#ef4444'];

  const trendArrow = (trend) => {
    if (trend === 'up') return <span className="text-green-500 font-bold">&#9650;</span>;
    if (trend === 'down') return <span className="text-red-500 font-bold">&#9660;</span>;
    return <span className="text-gray-400 font-bold">&#9654;</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
        <div className="flex flex-wrap items-center gap-4">
          {/* Period selector */}
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

          {/* Subject filter */}
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
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No exam data yet</h2>
          <p className="text-gray-500">
            Analytics will appear here once students complete exams or you grade handwritten sheets.
          </p>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Exams" value={overview.total_exams} color="bg-indigo-50 text-indigo-700" />
            <StatCard label="Students" value={overview.total_students} color="bg-green-50 text-green-700" />
            <StatCard label="Avg Score" value={`${overview.average_percentage}%`} color="bg-amber-50 text-amber-700" />
            <StatCard label="Pass Rate" value={`${overview.pass_rate}%`} color="bg-purple-50 text-purple-700" />
          </div>

          {/* Trends Chart */}
          {trends.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Performance Trends</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trends}>
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
                  <Bar dataKey="online_avg" fill="#4f46e5" name="Online Avg" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="handwritten_avg" fill="#10b981" name="Handwritten Avg" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Exam Type Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <h3 className="font-semibold">Online Exams</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-medium">{exam_type_comparison.online.count}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Average</span><span className="font-medium">{exam_type_comparison.online.average_percentage}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">MCQ Avg</span><span className="font-medium">{exam_type_comparison.online.mcq_avg}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Short Ans Avg</span><span className="font-medium">{exam_type_comparison.online.short_avg}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Long Ans Avg</span><span className="font-medium">{exam_type_comparison.online.long_avg}</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="font-semibold">Handwritten Exams</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-medium">{exam_type_comparison.handwritten.count}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Average</span><span className="font-medium">{exam_type_comparison.handwritten.average_percentage}%</span></div>
              </div>
            </div>
          </div>

          {/* Subject Breakdown + Pass/Fail Pie */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Subject bar chart + table */}
            <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Subject Breakdown</h2>
              {subject_breakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(200, subject_breakdown.length * 45)}>
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
                          <th className="text-center px-3 py-2">Total</th>
                          <th className="text-center px-3 py-2">Online</th>
                          <th className="text-center px-3 py-2">HW</th>
                          <th className="text-center px-3 py-2">Avg %</th>
                          <th className="text-center px-3 py-2">High</th>
                          <th className="text-center px-3 py-2">Low</th>
                          <th className="text-center px-3 py-2">Pass %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subject_breakdown.map((s, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2 font-medium">{s.subject_name}</td>
                            <td className="text-center px-3 py-2">{s.total_exams}</td>
                            <td className="text-center px-3 py-2">{s.online_count}</td>
                            <td className="text-center px-3 py-2">{s.handwritten_count}</td>
                            <td className="text-center px-3 py-2">{s.average_percentage}%</td>
                            <td className="text-center px-3 py-2 text-green-600">{s.highest_score}%</td>
                            <td className="text-center px-3 py-2 text-red-600">{s.lowest_score}%</td>
                            <td className="text-center px-3 py-2">{s.pass_rate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">No subject data available</p>
              )}
            </div>

            {/* Pass/Fail Pie */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Pass / Fail</h2>
              {overview.total_exams > 0 ? (
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
              ) : (
                <p className="text-gray-400 text-center py-8">No data</p>
              )}
            </div>
          </div>

          {/* Student Leaderboard */}
          {student_rankings.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Student Leaderboard</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-center px-3 py-2 w-16">Rank</th>
                      <th className="text-left px-3 py-2">Name</th>
                      <th className="text-center px-3 py-2">Exams</th>
                      <th className="text-center px-3 py-2">Avg %</th>
                      <th className="text-center px-3 py-2">Best %</th>
                      <th className="text-center px-3 py-2">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student_rankings.map((s) => (
                      <tr key={s.rank} className="border-t hover:bg-gray-50">
                        <td className="text-center px-3 py-2">
                          {s.rank <= 3 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold ${
                              s.rank === 1 ? 'bg-yellow-500' : s.rank === 2 ? 'bg-gray-400' : 'bg-amber-600'
                            }`}>{s.rank}</span>
                          ) : s.rank}
                        </td>
                        <td className="px-3 py-2 font-medium">{s.student_name}</td>
                        <td className="text-center px-3 py-2">{s.total_exams}</td>
                        <td className="text-center px-3 py-2">{s.average_percentage}%</td>
                        <td className="text-center px-3 py-2">{s.highest_percentage}%</td>
                        <td className="text-center px-3 py-2">{trendArrow(s.latest_trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Performance */}
          {recent_performance.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Type</th>
                      <th className="text-left px-3 py-2">Student</th>
                      <th className="text-left px-3 py-2">Subject</th>
                      <th className="text-center px-3 py-2">Score</th>
                      <th className="text-center px-3 py-2">%</th>
                      <th className="text-left px-3 py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_performance.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            e.type === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {e.type === 'online' ? 'Online' : 'Handwritten'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{e.student}</td>
                        <td className="px-3 py-2">{e.subject}</td>
                        <td className="text-center px-3 py-2">{e.score}</td>
                        <td className="text-center px-3 py-2">
                          <span className={e.percentage >= 40 ? 'text-green-600' : 'text-red-600'}>
                            {e.percentage != null ? `${e.percentage}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}
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
