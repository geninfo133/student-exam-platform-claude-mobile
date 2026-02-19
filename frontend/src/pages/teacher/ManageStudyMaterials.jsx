import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function ManageStudyMaterials() {
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', file: null, order: 0 });
  const [keyConcepts, setKeyConcepts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    api.get('/api/assignments/my/').then(res => {
      const assignments = res.data.results || res.data;
      // Deduplicate subjects from teacher's assignments
      const subjectMap = {};
      assignments.forEach(a => {
        if (!subjectMap[a.subject]) {
          subjectMap[a.subject] = { id: a.subject, name: a.subject_name };
        }
      });
      setSubjects(Object.values(subjectMap));
    });
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setChapters([]); setSelectedChapter(''); return; }
    api.get('/api/chapters/', { params: { subject: selectedSubject } }).then(res => {
      setChapters(res.data.results || res.data);
    });
    setSelectedChapter('');
    setMaterials([]);
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) { setMaterials([]); return; }
    fetchMaterials();
  }, [selectedChapter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/study-materials/manage/', { params: { chapter: selectedChapter } });
      setMaterials(res.data.results || res.data);
    } catch { setError('Failed to load materials.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ title: '', content: '', file: null, order: 0 });
    setKeyConcepts([]);
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSuccess('');
    const fi = document.getElementById('material-file-input');
    if (fi) fi.value = '';
  };

  const startEdit = (mat) => {
    setEditingId(mat.id);
    setForm({ title: mat.title, content: mat.content || '', file: null, order: mat.order });
    setKeyConcepts(
      (mat.key_concepts || []).map(kc => ({
        title: kc.title, description: kc.description, formula: kc.formula || '', order: kc.order,
      }))
    );
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const addKeyConcept = () => {
    setKeyConcepts([...keyConcepts, { title: '', description: '', formula: '', order: keyConcepts.length }]);
  };

  const removeKeyConcept = (idx) => {
    setKeyConcepts(keyConcepts.filter((_, i) => i !== idx));
  };

  const updateKeyConcept = (idx, field, value) => {
    setKeyConcepts(keyConcepts.map((kc, i) => i === idx ? { ...kc, [field]: value } : kc));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('chapter', selectedChapter);
      formData.append('order', form.order);
      if (form.file) formData.append('file', form.file);
      if (keyConcepts.length > 0) {
        formData.append('key_concepts', JSON.stringify(keyConcepts));
      }

      if (editingId) {
        await api.patch(`/api/study-materials/${editingId}/update/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Material updated successfully!');
      } else {
        await api.post('/api/study-materials/create/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Material created successfully!');
      }
      resetForm();
      fetchMaterials();
    } catch (err) {
      const detail = err.response?.data;
      if (typeof detail === 'string') setError(detail);
      else if (detail?.non_field_errors) setError(detail.non_field_errors.join(', '));
      else if (detail?.detail) setError(detail.detail);
      else setError('Failed to save material.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/study-materials/${id}/delete/`);
      setSuccess('Material deleted.');
      setDeleteConfirm(null);
      fetchMaterials();
    } catch {
      setError('Failed to delete material.');
    }
  };

  const getFileName = (url) => {
    if (!url) return '';
    return url.split('/').pop();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Study Materials</h1>

      {/* Subject / Chapter selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
          <select
            value={selectedChapter}
            onChange={e => setSelectedChapter(e.target.value)}
            disabled={!selectedSubject}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
          >
            <option value="">Select Chapter</option>
            {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4">{success}</div>}

      {/* Material list */}
      {selectedChapter && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Materials {materials.length > 0 && `(${materials.length})`}
            </h2>
            {!showForm && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
              >
                + Add Material
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              {/* Create / Edit Form */}
              {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4">
                    {editingId ? 'Edit Material' : 'New Material'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                      <input
                        type="text"
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                      <textarea
                        rows={6}
                        value={form.content}
                        onChange={e => setForm({ ...form, content: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter study material content..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, images, docs)</label>
                        <input
                          type="file"
                          id="material-file-input"
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onChange={e => setForm({ ...form, file: e.target.files[0] || null })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                        <input
                          type="number"
                          value={form.order}
                          onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Key Concepts */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Key Concepts</label>
                        <button
                          type="button"
                          onClick={addKeyConcept}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          + Add Concept
                        </button>
                      </div>
                      {keyConcepts.map((kc, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4 mb-3 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-semibold text-gray-500">Concept {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeKeyConcept(idx)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Title"
                              required
                              value={kc.title}
                              onChange={e => updateKeyConcept(idx, 'title', e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <input
                              type="text"
                              placeholder="Formula (optional)"
                              value={kc.formula}
                              onChange={e => updateKeyConcept(idx, 'formula', e.target.value)}
                              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <textarea
                            placeholder="Description"
                            required
                            rows={2}
                            value={kc.description}
                            onChange={e => updateKeyConcept(idx, 'description', e.target.value)}
                            className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium text-sm disabled:opacity-50"
                    >
                      {saving ? (editingId ? 'Updating...' : 'Creating...') : (editingId ? 'Update Material' : 'Create Material')}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Materials cards */}
              {materials.length === 0 && !showForm ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                  <p className="text-gray-500">No materials for this chapter yet.</p>
                </div>
              ) : (
                materials.map(mat => (
                  <div key={mat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-lg">{mat.title}</h3>
                        {mat.content && (
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{mat.content}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                          {mat.file && (
                            <a
                              href={mat.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {getFileName(mat.file)}
                            </a>
                          )}
                          <span>Order: {mat.order}</span>
                          {mat.key_concepts?.length > 0 && (
                            <span>{mat.key_concepts.length} key concept{mat.key_concepts.length !== 1 ? 's' : ''}</span>
                          )}
                          {mat.uploaded_by_name && <span>By: {mat.uploaded_by_name}</span>}
                          {!mat.is_active && <span className="text-red-500 font-medium">Inactive</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => startEdit(mat)}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                        >
                          Edit
                        </button>
                        {deleteConfirm === mat.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(mat.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-gray-500 hover:text-gray-700 text-sm px-2 py-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(mat.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
