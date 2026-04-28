import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const SUBJECT_PALETTES = [
  { grad: 'from-blue-500 to-indigo-600',    light: 'bg-blue-50',    icon: '📐' },
  { grad: 'from-emerald-500 to-teal-600',   light: 'bg-emerald-50', icon: '🔬' },
  { grad: 'from-violet-500 to-purple-600',  light: 'bg-violet-50',  icon: '📖' },
  { grad: 'from-orange-500 to-amber-600',   light: 'bg-orange-50',  icon: '🌍' },
  { grad: 'from-rose-500 to-pink-600',      light: 'bg-rose-50',    icon: '🔤' },
  { grad: 'from-cyan-500 to-blue-600',      light: 'bg-cyan-50',    icon: '⚗️' },
  { grad: 'from-amber-500 to-yellow-600',   light: 'bg-amber-50',   icon: '🧮' },
  { grad: 'from-indigo-500 to-violet-600',  light: 'bg-indigo-50',  icon: '🎨' },
];

const SUBJECT_ICON_MAP = {
  Mathematics:      { icon: '📐', grad: 'from-blue-500 to-indigo-600'   },
  Science:          { icon: '🔬', grad: 'from-emerald-500 to-teal-600'  },
  English:          { icon: '📖', grad: 'from-violet-500 to-purple-600' },
  'Social Science': { icon: '🌍', grad: 'from-orange-500 to-amber-600'  },
  Hindi:            { icon: '🔤', grad: 'from-rose-500 to-pink-600'     },
  Physics:          { icon: '⚡', grad: 'from-cyan-500 to-blue-600'     },
  Chemistry:        { icon: '⚗️', grad: 'from-amber-500 to-yellow-600'  },
  Biology:          { icon: '🧬', grad: 'from-green-500 to-emerald-600' },
  History:          { icon: '🏛️', grad: 'from-amber-600 to-orange-600'  },
  Geography:        { icon: '🗺️', grad: 'from-teal-500 to-cyan-600'     },
};

function getPalette(name, idx) {
  return SUBJECT_ICON_MAP[name] || SUBJECT_PALETTES[idx % SUBJECT_PALETTES.length];
}

export default function SubjectList() {
  const [searchParams] = useSearchParams();
  const examTypeId = searchParams.get('exam_type');
  const [subjects, setSubjects] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(examTypeId || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/exam-types/').then((res) => {
      setExamTypes(res.data.results || res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = selectedType ? { exam_type: selectedType } : {};
    api.get('/api/subjects/', { params }).then((res) => {
      setSubjects(res.data.results || res.data);
      setLoading(false);
    });
  }, [selectedType]);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── BANNER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        <img
          src="https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 py-10">
          <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-1">Start Learning</p>
          <h1 className="text-3xl font-extrabold text-white mb-1">Choose a Subject</h1>
          <p className="text-indigo-200 text-sm mb-6">
            Select a subject to explore chapters and take exams
          </p>

          {/* Stat chip */}
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
              <p className="text-xl font-extrabold text-white">{subjects.length}</p>
              <p className="text-white/50 text-xs">Subjects</p>
            </div>
            {examTypes.length > 0 && (
              <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-center backdrop-blur-sm">
                <p className="text-xl font-extrabold text-indigo-200">{examTypes.length}</p>
                <p className="text-white/50 text-xs">Boards</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── FILTER TABS ── */}
        {examTypes.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-8">
            <button
              onClick={() => setSelectedType('')}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                !selectedType
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow'
                  : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
              }`}
            >
              All Boards
            </button>
            {examTypes.map((et) => (
              <button
                key={et.id}
                onClick={() => setSelectedType(String(et.id))}
                className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                  selectedType === String(et.id)
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent shadow'
                    : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {et.name}
              </button>
            ))}
          </div>
        )}

        {/* ── GRID ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <p className="text-gray-400 text-sm font-medium">Loading subjects…</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl
                            flex items-center justify-center mx-auto mb-5 text-4xl">
              📚
            </div>
            <p className="text-gray-700 font-bold text-lg">No Subjects Found</p>
            <p className="text-gray-400 text-sm mt-2">Try selecting a different board or check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map((subject, idx) => {
              const palette = getPalette(subject.name, idx);
              return (
                <Link
                  key={subject.id}
                  to={`/chapters/${subject.id}`}
                  className="group block bg-white rounded-2xl border border-gray-100 shadow-sm
                             hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                >
                  {/* Card top gradient strip */}
                  <div className={`bg-gradient-to-r ${palette.grad} px-6 pt-6 pb-8 relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
                    <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between">
                      <div>
                        <span className="text-3xl mb-2 block">{palette.icon}</span>
                        <h3 className="text-xl font-extrabold text-white">{subject.name}</h3>
                        {subject.exam_type_name && (
                          <span className="inline-block mt-1.5 text-xs font-bold bg-white/20 text-white
                                           px-2.5 py-0.5 rounded-full">
                            {subject.exam_type_name}
                          </span>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center
                                      group-hover:bg-white/30 transition mt-1">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Card bottom stats */}
                  <div className="px-6 py-4 -mt-4 relative">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm grid grid-cols-2 divide-x divide-gray-100">
                      {[
                        { label: 'Chapters',  value: subject.chapter_count  ?? '—' },
                        { label: 'Questions', value: subject.chapter_count > 0 ? (subject.question_count ?? '—') : '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="px-4 py-3 text-center">
                          <p className="text-sm font-extrabold text-gray-800">{value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
