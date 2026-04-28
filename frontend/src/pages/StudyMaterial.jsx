import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CONCEPT_COLORS = [
  { bg: 'bg-indigo-50', border: 'border-indigo-100', title: 'text-indigo-800', desc: 'text-indigo-600', formula: 'text-indigo-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', title: 'text-emerald-800', desc: 'text-emerald-600', formula: 'text-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-100', title: 'text-violet-800', desc: 'text-violet-600', formula: 'text-violet-500' },
  { bg: 'bg-amber-50', border: 'border-amber-100', title: 'text-amber-800', desc: 'text-amber-600', formula: 'text-amber-500' },
  { bg: 'bg-blue-50', border: 'border-blue-100', title: 'text-blue-800', desc: 'text-blue-600', formula: 'text-blue-500' },
];

function KeyConceptCard({ kc, idx }) {
  const c = CONCEPT_COLORS[idx % CONCEPT_COLORS.length];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-6 h-6 rounded-full ${c.bg} border-2 ${c.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <span className={`text-xs font-bold ${c.title}`}>{idx + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${c.title} text-sm`}>{kc.title}</h4>
          {kc.description && (
            <p className={`text-xs mt-1 leading-relaxed ${c.desc}`}>{kc.description}</p>
          )}
          {kc.formula && (
            <div className={`mt-2 px-3 py-1.5 bg-white/60 rounded-lg font-mono text-xs ${c.formula} border ${c.border}`}>
              {kc.formula}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MaterialCard({ mat, idx }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <p className="text-indigo-300 text-xs font-medium uppercase tracking-wider">Material {idx + 1}</p>
            <h2 className="text-lg font-bold text-white leading-snug">{mat.title}</h2>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main content */}
        {mat.content && (
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {mat.content}
          </div>
        )}

        {/* Download */}
        {mat.file && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs text-indigo-600 font-medium">Attached File</p>
              <p className="text-sm text-indigo-800 font-semibold truncate">{mat.file.split('/').pop()}</p>
            </div>
            <a
              href={mat.file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        )}

        {/* Key concepts */}
        {mat.key_concepts?.length > 0 && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800">Key Concepts</h3>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {mat.key_concepts.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mat.key_concepts.map((kc, i) => (
                <KeyConceptCard key={kc.id} kc={kc} idx={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudyMaterial() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [chapterName, setChapterName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/study-materials/', { params: { chapter: chapterId } }),
      api.get(`/api/chapters/${chapterId}/`).catch(() => ({ data: null })),
    ]).then(([matRes, chapRes]) => {
      setMaterials(matRes.data.results || matRes.data);
      if (chapRes.data) setChapterName(chapRes.data.name || '');
      setLoading(false);
    });
  }, [chapterId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="text-slate-400 text-sm">Loading study material…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chapters
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-300 text-sm font-medium uppercase tracking-wider">Study Material</p>
              <h1 className="text-3xl font-bold text-white">{chapterName || 'Chapter'}</h1>
            </div>
          </div>

          {/* Stat tiles */}
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{materials.length}</p>
              <p className="text-emerald-200 text-xs mt-0.5">
                Material{materials.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">
                {materials.reduce((acc, m) => acc + (m.key_concepts?.length || 0), 0)}
              </p>
              <p className="text-emerald-200 text-xs mt-0.5">Key Concepts</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">
                {materials.filter(m => m.file).length}
              </p>
              <p className="text-emerald-200 text-xs mt-0.5">Attachments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {materials.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No Study Material Yet</h3>
            <p className="text-gray-400 text-sm">Study material for this chapter hasn't been added yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {materials.map((mat, idx) => (
              <MaterialCard key={mat.id} mat={mat} idx={idx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
