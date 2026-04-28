import { useState, useEffect } from 'react';
import api from '../../api/axios';

const IMAGE_SLOTS = [
  { key: 'school_dashboard', label: 'School Dashboard', desc: 'Header background for the main dashboard', gradient: 'from-indigo-500 to-violet-600' },
  { key: 'manage_teachers', label: 'Manage Teachers', desc: 'Header background for the teachers page', gradient: 'from-blue-500 to-cyan-600' },
  { key: 'manage_students', label: 'Manage Students', desc: 'Header background for the students page', gradient: 'from-violet-500 to-fuchsia-600' },
  { key: 'manage_subjects', label: 'Manage Subjects', desc: 'Header background for the subjects page', gradient: 'from-emerald-500 to-teal-600' },
];

export default function ManageImages() {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchImages = async () => {
    try { const res = await api.get('/api/site-images/'); setImages(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, []);

  const showMsg = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage({ text: '', type: '' }), 4000); };

  const handleUpload = async (key, file) => {
    if (!file) return;
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('key', key); fd.append('image', file); fd.append('title', key);
      await api.post('/api/site-images/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showMsg('Image uploaded successfully!'); fetchImages();
    } catch (err) { showMsg(err.response?.data?.error || 'Upload failed.', 'error'); }
    finally { setUploading(null); }
  };

  const handleDelete = async (key) => {
    const img = images[key];
    if (!img?.id) return;
    if (!window.confirm('Remove this background image?')) return;
    setDeleting(key);
    try { await api.delete(`/api/site-images/${img.id}/`); showMsg('Image removed.'); fetchImages(); }
    catch { showMsg('Failed to remove image.', 'error'); }
    finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );

  const uploadedCount = IMAGE_SLOTS.filter(s => !!images[s.key]?.url).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-10 right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-pink-300 text-sm font-medium uppercase tracking-wider">School Admin</p>
              <h1 className="text-3xl font-bold text-white">Background Images</h1>
              <p className="text-indigo-200 text-sm mt-0.5">Upload custom backgrounds for your school pages.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{uploadedCount}</p>
              <p className="text-pink-200 text-xs mt-0.5">Uploaded</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">{IMAGE_SLOTS.length - uploadedCount}</p>
              <p className="text-pink-200 text-xs mt-0.5">Using Default</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {message.text && (
          <div className={`rounded-2xl p-4 border mb-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-emerald-800' : 'text-red-700'}`}>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {IMAGE_SLOTS.map(slot => {
            const img = images[slot.key];
            const hasImage = !!img?.url;

            return (
              <div key={slot.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Preview */}
                <div className="h-40 bg-cover bg-center relative" style={hasImage ? { backgroundImage: `url(${img.url})` } : {}}>
                  <div className={`absolute inset-0 ${hasImage ? 'bg-black/40' : `bg-gradient-to-br ${slot.gradient}`}`} />
                  <div className="relative z-10 p-5 flex flex-col justify-end h-full">
                    <div className="flex items-center gap-2 mb-1">
                      {hasImage && (
                        <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">Custom</span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-lg">{slot.label}</h3>
                    <p className="text-white/70 text-xs">{slot.desc}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex items-center gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition shadow-sm ${
                    uploading === slot.key
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : `bg-gradient-to-r ${slot.gradient} text-white hover:opacity-90`
                  }`}>
                    {uploading === slot.key ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />Uploading…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{hasImage ? 'Change Image' : 'Upload Image'}</>
                    )}
                    <input type="file" accept="image/*" className="hidden" disabled={uploading === slot.key} onChange={e => handleUpload(slot.key, e.target.files[0])} />
                  </label>
                  {hasImage && (
                    <button onClick={() => handleDelete(slot.key)} disabled={deleting === slot.key}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 border-2 border-gray-100 hover:border-red-200 transition disabled:opacity-50">
                      {deleting === slot.key ? '…' : 'Remove'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
