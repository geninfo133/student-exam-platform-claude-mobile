import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ChapterList() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/chapters/', { params: { subject: subjectId } }).then((res) => {
      setChapters(res.data.results || res.data);
      setLoading(false);
    });
  }, [subjectId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-white">Chapters</h1>
      <p className="text-gray-400 mb-6">Select a chapter to study</p>

      {/* Chapter list */}
      <div className="space-y-3">
        {chapters.map((chapter) => (
          <div key={chapter.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:bg-gray-800 transition">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white">{chapter.name}</h3>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => navigate(`/study/${chapter.id}`)}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition min-h-[44px]">
                  Study
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
