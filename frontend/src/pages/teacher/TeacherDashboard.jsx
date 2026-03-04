import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examFilter, setExamFilter] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, pendingRes] = await Promise.all([
          api.get('/api/dashboard/teacher/'),
          api.get('/api/exams/pending-review/'),
        ]);
        setStats(dashRes.data);
        setRecentExams(dashRes.data.recent_exams || []);
        setPendingQueue(pendingRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Papers Uploaded', value: stats?.papers_count ?? 0,        color: 'text-indigo-600' },
    { label: 'Assigned Exams',  value: stats?.assigned_exams_count ?? 0, color: 'text-purple-600' },
    { label: 'Students',        value: stats?.students_count ?? 0,       color: 'text-green-600'  },
    { label: 'Pending Reviews', value: stats?.pending_reviews ?? 0,      color: 'text-yellow-600', to: '/teacher/grading' },
  ];

  const quickLinks = [
    { to: '/teacher/papers/view',    label: 'View Papers',       sub: 'Created & handwritten papers' },
    { to: '/teacher/created-exams',  label: 'Created Exams',     sub: 'Manage assigned exams'        },
    { to: '/teacher/grading',        label: 'Grading Queue',     sub: 'Grade student submissions', badge: stats?.pending_reviews || 0 },
    { to: '/teacher/handwritten',    label: 'Handwritten Papers', sub: 'Grade handwritten sheets'    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-4 mb-5">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white/50 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-1 text-indigo-100">Teacher Dashboard</p>
            {stats?.assigned_subjects?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {stats.assigned_subjects.map((s) => (
                  <span key={s.id} className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) =>
          card.to ? (
            <Link key={card.label} to={card.to} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition block">
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </Link>
          ) : (
            <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          )
        )}
      </div>

      {/* Pending Grading Alert */}
      {pendingQueue.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {pendingQueue.length} submission{pendingQueue.length > 1 ? 's' : ''} waiting to be graded
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                {pendingQueue.slice(0, 3).map((e) => e.student).join(', ')}
                {pendingQueue.length > 3 && ` and ${pendingQueue.length - 3} more`}
              </p>
            </div>
          </div>
          <Link to="/teacher/grading" className="shrink-0 bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition">
            Grade Now
          </Link>
        </div>
      )}

      {/* Quick Links + Recent Exams */}
      <div className="grid md:grid-cols-3 gap-8">

        {/* Quick Links */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Links</h2>
          <div className="space-y-3">
            {quickLinks.map(({ to, label, sub, badge }) => (
              <Link key={to} to={to} className="block bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{label}</h3>
                      {badge > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{sub}</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Exams</h2>
            <Link to="/teacher/created-exams" className="text-indigo-600 text-sm font-medium hover:underline">View All</Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
            {[
              { value: 'all',         label: 'All' },
              { value: 'online',      label: 'Online' },
              { value: 'handwritten', label: 'Handwritten' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setExamFilter(value)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  examFilter === value
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {recentExams.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500">No exams assigned yet.</p>
              <Link to="/teacher/create-exam" className="text-indigo-600 font-medium hover:underline text-sm mt-2 inline-block">
                Create your first exam
              </Link>
            </div>
          ) : (() => {
            // Filter then group by student
            const filtered = examFilter === 'all' ? recentExams : recentExams.filter((e) => e.type === examFilter);
            const grouped = {};
            filtered.forEach((exam) => {
              const key = exam.student_id ?? exam.student;
              if (!grouped[key]) grouped[key] = { student: exam.student, student_id: exam.student_id, exams: [] };
              grouped[key].exams.push(exam);
            });
            const rows = Object.values(grouped);
            if (rows.length === 0) {
              return (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-sm">No {examFilter} exams found.</p>
                </div>
              );
            }
            return (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {rows.map(({ student, student_id, exams }) => (
                  <div key={student_id ?? student} className="flex items-center gap-3 px-5 py-3.5">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                      {student[0]?.toUpperCase()}
                    </div>

                    {/* Name + ID */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{student}</p>
                      {student_id && <p className="text-xs text-gray-400">#{student_id}</p>}
                    </div>

                    {/* One button per exam type (most recent of each) */}
                    <div className="flex items-center gap-2 shrink-0">
                      {['online', 'handwritten'].map((type) => {
                        const match = exams.find((e) => e.type === type);
                        if (!match) return null;
                        const isHW = type === 'handwritten';
                        const href = isHW
                          ? `/teacher/exam/${match.id}/paper?type=handwritten`
                          : `/teacher/review/${match.id}`;
                        const statusLabel = isHW && match.hw_status !== 'GRADED'
                          ? (match.hw_status === 'PROCESSING' ? ' · Grading…' :
                             match.hw_status === 'FAILED'     ? ' · Failed'   : ' · Not graded')
                          : '';
                        return (
                          <button
                            key={type}
                            onClick={() => navigate(href)}
                            className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                              isHW
                                ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                            }`}
                          >
                            {isHW ? 'Handwritten' : 'Online'}{statusLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}
