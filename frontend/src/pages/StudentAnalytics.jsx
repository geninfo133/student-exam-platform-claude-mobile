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

function ChartCard({ title, icon, gradient = 'from-slate-800 to-indigo-900', children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h3 className="font-semibold text-white text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => { fetchAnalytics(); }, [period, subjectFilter]);

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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Failed to load analytics data.</p>
      </div>
    );
  }

  const { overview, trends, subject_breakdown, question_type_analysis, recent_exams, subjects } = data;
  const isEmpty = overview.total_exams === 0;

  const pieData = [
    { name: 'Pass', value: overview.pass_count },
    { name: 'Fail', value: overview.fail_count },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt="" className="absolute inset-0 w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <h1 className="text-3xl font-extrabold text-white">My Performance</h1>
          </div>
          <p className="text-indigo-200 text-sm mb-6">Track your exam scores and progress over time</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Total Exams', value: overview?.total_exams ?? 0,             color: 'bg-white/10 border-white/20',             text: 'text-white'       },
              { label: 'Avg Score',   value: overview?.average_percentage != null ? `${overview.average_percentage}%` : '—', color: 'bg-emerald-500/20 border-emerald-400/30', text: 'text-emerald-200' },
              { label: 'Pass Rate',   value: overview?.pass_rate != null ? `${overview.pass_rate}%` : '—', color: 'bg-indigo-500/30 border-indigo-400/40', text: 'text-indigo-200' },
            ].map(({ label, value, color, text }) => (
              <div key={label} className={`${color} border rounded-xl px-4 py-2.5 text-center backdrop-blur-sm min-w-[80px]`}>
                <p className={`text-xl font-extrabold ${text}`}>{value}</p>
                <p className="text-white/50 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 text-sm font-medium transition ${
                  period === opt.value
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {subjects?.length > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-indigo-400 shadow-sm"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isEmpty ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No exam data yet</h2>
            <p className="text-gray-500 text-sm mb-6">Take some exams and your performance analytics will appear here.</p>
            <Link
              to="/assigned-exams"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              View Assigned Exams
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Trend */}
            {trends.length > 1 && (
              <ChartCard
                title="Score Trend"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              >
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="period"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return isNaN(d) ? val : `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={(val) => { const d = new Date(val); return isNaN(d) ? val : d.toLocaleDateString(); }}
                      formatter={(v) => `${v}%`}
                    />
                    <Line type="monotone" dataKey="combined_avg" stroke="#6366f1" strokeWidth={2.5} name="Average %" dot={{ r: 4, fill: '#6366f1' }} />
                    {overview.online_exams > 0 && (
                      <Line type="monotone" dataKey="online_avg" stroke="#8b5cf6" strokeDasharray="5 5" name="Online" dot={false} />
                    )}
                    {overview.handwritten_exams > 0 && (
                      <Line type="monotone" dataKey="handwritten_avg" stroke="#10b981" strokeDasharray="5 5" name="Handwritten" dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Question Type + Pass/Fail */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <ChartCard
                  title="Avg Marks by Question Type"
                  gradient="from-slate-800 to-blue-900"
                  icon={
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                >
                  {overview.online_exams > 0 ? (
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={typeChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="avg" fill="#6366f1" name="Your Avg" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="max" fill="#e2e8f0" name="Max Possible" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                      Only available for online exams
                    </div>
                  )}
                </ChartCard>
              </div>

              <ChartCard
                title="Pass / Fail"
                gradient="from-slate-800 to-emerald-900"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  </svg>
                }
              >
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={['#10b981', '#ef4444'][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Answer Accuracy + Exam Type */}
            <div className="grid md:grid-cols-2 gap-6">
              {overview.online_exams > 0 && answerDistribution.length > 0 && (
                <ChartCard
                  title="Avg Answer Accuracy"
                  gradient="from-slate-800 to-violet-900"
                  icon={
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={answerDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                        dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {answerDistribution.map((_, i) => (
                          <Cell key={i} fill={['#10b981', '#ef4444', '#94a3b8'][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              <ChartCard
                title="Exam Breakdown"
                gradient="from-slate-800 to-indigo-900"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Online Exams</p>
                      <p className="text-2xl font-bold text-indigo-700">{overview.online_exams}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Handwritten Exams</p>
                      <p className="text-2xl font-bold text-emerald-700">{overview.handwritten_exams}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Subject Performance */}
            {subject_breakdown.length > 0 && (
              <ChartCard
                title="Subject Performance"
                gradient="from-slate-800 to-purple-900"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                }
              >
                <ResponsiveContainer width="100%" height={Math.max(180, subject_breakdown.length * 50)}>
                  <BarChart data={subject_breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject_name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="average_percentage" fill="#8b5cf6" name="Avg %" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-5 overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-indigo-900">
                        <th className="text-left px-4 py-3 text-white text-xs font-semibold">Subject</th>
                        <th className="text-center px-4 py-3 text-white text-xs font-semibold">Exams</th>
                        <th className="text-center px-4 py-3 text-white text-xs font-semibold">Avg %</th>
                        <th className="text-center px-4 py-3 text-white text-xs font-semibold">Best</th>
                        <th className="text-center px-4 py-3 text-white text-xs font-semibold">Lowest</th>
                        <th className="text-center px-4 py-3 text-white text-xs font-semibold">Pass %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subject_breakdown.map((s, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 font-medium text-gray-800">{s.subject_name}</td>
                          <td className="text-center px-4 py-3 text-gray-600">{s.total_exams}</td>
                          <td className="text-center px-4 py-3">
                            <span className={`font-semibold ${
                              s.average_percentage >= 60 ? 'text-emerald-600' :
                              s.average_percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>{s.average_percentage}%</span>
                          </td>
                          <td className="text-center px-4 py-3 text-emerald-600 font-medium">{s.highest_score}%</td>
                          <td className="text-center px-4 py-3 text-red-500 font-medium">{s.lowest_score}%</td>
                          <td className="text-center px-4 py-3">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              s.pass_rate >= 60 ? 'bg-emerald-100 text-emerald-700' :
                              s.pass_rate >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>{s.pass_rate}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            )}

            {/* Recent Exams */}
            {recent_exams.length > 0 && (
              <ChartCard
                title="Recent Exams"
                gradient="from-slate-800 to-indigo-900"
                icon={
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Subject</th>
                        <th className="text-center px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Score</th>
                        <th className="text-center px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">%</th>
                        <th className="text-left px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">Date</th>
                        <th className="text-center px-4 py-3 text-gray-500 text-xs font-semibold uppercase tracking-wider">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent_exams.map((e, i) => (
                        <tr key={i} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-25'}`}>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              e.type === 'online' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {e.type === 'online' ? 'Online' : 'Handwritten'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{e.subject}</td>
                          <td className="text-center px-4 py-3 text-gray-600">{e.score ?? '—'}</td>
                          <td className="text-center px-4 py-3">
                            <span className={`font-semibold text-sm ${
                              e.percentage >= 60 ? 'text-emerald-600' :
                              e.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {e.percentage != null ? `${e.percentage}%` : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {e.date ? new Date(e.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="text-center px-4 py-3">
                            {e.type === 'online' && (
                              <Link
                                to={`/result/${e.id}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                              >
                                View
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
