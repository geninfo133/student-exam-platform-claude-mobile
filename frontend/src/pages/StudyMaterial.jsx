import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

export default function StudyMaterial() {
  const { chapterId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/study-materials/', { params: { chapter: chapterId } }).then((res) => {
      setMaterials(res.data.results || res.data);
      setLoading(false);
    });
  }, [chapterId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Study Material</h1>
        <Link to={-1} className="text-indigo-600 hover:text-indigo-700 text-sm">Back to Chapters</Link>
      </div>

      {materials.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-8 text-center border border-gray-800">
          <p className="text-gray-400">No study material available for this chapter yet.</p>
        </div>
      ) : (
        materials.map((mat) => (
          <div key={mat.id} className="bg-gray-900 rounded-xl p-8 mb-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">{mat.title}</h2>
            {mat.content && (
              <div className="prose max-w-none text-gray-300 whitespace-pre-wrap">{mat.content}</div>
            )}

            {mat.file && (
              <div className="mt-4">
                <a
                  href={mat.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-lg hover:bg-indigo-100 transition text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Attachment
                </a>
              </div>
            )}

            {mat.key_concepts?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <h3 className="font-semibold text-white mb-3">Key Concepts</h3>
                <div className="space-y-3">
                  {mat.key_concepts.map((kc) => (
                    <div key={kc.id} className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-medium text-indigo-800">{kc.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{kc.description}</p>
                      {kc.formula && (
                        <p className="text-sm text-indigo-600 mt-1 font-mono">{kc.formula}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
