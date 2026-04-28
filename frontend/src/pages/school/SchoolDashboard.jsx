import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const QUICK_ACTIONS = [
  {
    label: 'Manage Teachers',
    desc: 'Add, edit or remove teachers',
    to: '/school/teachers',
    color: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    label: 'Manage Students',
    desc: 'View and manage student records',
    to: '/school/students',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: 'Assignments',
    desc: 'Create and track exam assignments',
    to: '/school/assignments',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: 'Manage Subjects',
    desc: 'Configure subjects and curriculum',
    to: '/school/subjects',
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: 'Progress Cards',
    desc: 'View student performance reports',
    to: '/school/progress-card',
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Manage Images',
    desc: 'Upload branding & background images',
    to: '/school/images',
    color: 'from-sky-500 to-cyan-600',
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

export default function SchoolDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bgImages, setBgImages] = useState({});

  useEffect(() => {
    api.get('/api/site-images/').then(res => setBgImages(res.data)).catch(() => {});
    const fetchData = async () => {
      try {
        const res = await api.get('/api/dashboard/school/');
        setStats(res.data);
        setRecentActivity(res.data.recent_activity || []);
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
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600" />
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Teachers',
      value: stats?.teachers_count ?? 0,
      change: '+2 this month',
      color: 'from-indigo-500 to-blue-600',
      shadow: 'shadow-indigo-100',
      link: '/school/teachers',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Students',
      value: stats?.students_count ?? 0,
      change: '+15 this month',
      color: 'from-violet-500 to-purple-600',
      shadow: 'shadow-purple-100',
      link: '/school/students',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: 'Total Exams',
      value: stats?.exams_count ?? 0,
      change: 'Active this term',
      color: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-100',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: 'Question Papers',
      value: stats?.papers_count ?? 0,
      change: 'In question bank',
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-100',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h10" />
        </svg>
      ),
    },
  ];

  const heroBg = bgImages.school_dashboard?.url;
  const userName = user?.first_name || user?.username || 'Admin';
  const initials = (user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* ── Welcome Banner ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl min-h-[220px]">
          {/* Background */}
          {heroBg ? (
            <>
              <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : (
            <>
              <img
                src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=1600&q=80&auto=format&fit=crop"
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/65" />
              <div className="absolute inset-0 bg-indigo-950/40" />
            </>
          )}

          {/* Dot grid texture */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

          {/* Content */}
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow-xl shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-xl">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-1">School Administration</p>
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                  Welcome back, {userName}!
                </h1>
                <p className="text-white/60 mt-1 text-sm">
                  Here's what's happening at your institution today.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/school/teachers"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Teacher
              </Link>
              <Link
                to="/school/students"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/20 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const inner = (
              <div className={`bg-white rounded-2xl p-6 shadow-lg ${card.shadow} border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${card.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                  {card.icon}
                </div>
                <p className="text-4xl font-black text-gray-900 mb-1">{card.value}</p>
                <p className="text-sm font-semibold text-gray-600 mb-2">{card.label}</p>
                <p className="text-xs text-gray-400">{card.change}</p>
              </div>
            );
            return card.link ? (
              <Link key={card.label} to={card.link}>{inner}</Link>
            ) : (
              <div key={card.label}>{inner}</div>
            );
          })}
        </div>

        {/* ── Quick Actions + Recent Activity ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Quick Actions</h2>
              <span className="text-xs text-gray-400 font-medium">All management tools</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  to={action.to}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} text-white rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <p className="font-black text-gray-900 text-sm mb-1">{action.label}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{action.desc}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs font-bold ${action.text} group-hover:translate-x-1 transition-transform`}>
                    Go <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900">Recent Activity</h2>
              <span className="text-xs text-gray-400 font-medium">Latest events</span>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="font-bold text-gray-700 mb-1">No activity yet</p>
                  <p className="text-sm text-gray-400">Activity will appear here as your team gets started.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentActivity.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 hover:bg-slate-50 transition">
                      <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {item.description || item.message || item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.timestamp
                            ? new Date(item.timestamp).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
