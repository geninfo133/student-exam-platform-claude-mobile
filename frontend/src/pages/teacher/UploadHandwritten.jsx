import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { getCategoriesForBoard } from '../../utils/examCategories';

const INPUT_CLS = 'w-full px-4 py-2.5 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-indigo-400 transition bg-gray-50 text-sm';

export default function UploadHandwritten() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const boardCategories = getCategoriesForBoard(user?.board);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    title: '', subject: '', student: '', student_name: '', exam_category: '',
    total_marks: 50, question_papers: [], answer_sheets: [],
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/subjects/'), api.get('/api/auth/my-students/')]).then(([subRes, stuRes]) => {
      setSubjects(subRes.data.results || subRes.data);
      setStudents(stuRes.data.results || stuRes.data);
    }).catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'answer_sheets') setForm(p => ({ ...p, answer_sheets: [...p.answer_sheets, ...Array.from(files)] }));
    else if (name === 'question_papers') setForm(p => ({ ...p, question_papers: [...p.question_papers, ...Array.from(files)] }));
    else setForm(p => ({ ...p, [name]: value }));
  };

  const removeFile = (field, idx) => setForm(p => ({ ...p, [field]: p[field].filter((_, i) => i !== idx) }));
  const moveFile = (field, idx, dir) => {
    setForm(p => {
      const files = [...p[field]];
      const t = idx + dir;
      if (t < 0 || t >= files.length) return p;
      [files[idx], files[t]] = [files[t], files[idx]];
      return { ...p, [field]: files };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.question_papers.length === 0 || form.answer_sheets.length === 0) {
      setError('Both question paper and answer sheet are required.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subject', form.subject);
      if (form.student) fd.append('student', form.student);
      if (form.student_name) fd.append('student_name', form.student_name);
      fd.append('total_marks', form.total_marks);
      if (form.exam_category) fd.append('exam_category', form.exam_category);
      form.question_papers.forEach(f => fd.append('question_paper', f));
      form.answer_sheets.forEach(f => fd.append('answer_sheet', f));
      await api.post('/api/handwritten/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Uploaded successfully! You can now grade it from the Handwritten list.');
      setTimeout(() => navigate('/teacher/handwritten'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Upload failed. Please try again.');
    } finally { setLoading(false); }
  };

  function FileList({ files, field, color = 'indigo' }) {
    if (files.length === 0) return null;
    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500">{files.length} page{files.length !== 1 ? 's' : ''}</p>
        {files.map((f, i) => (
          <div key={i} className={`flex items-center gap-3 bg-${color}-50 border border-${color}-100 rounded-xl px-3 py-2`}>
            <span className={`text-xs font-bold text-${color}-600 w-6 text-center flex-shrink-0`}>P{i+1}</span>
            {f.type.startsWith('image/') && (
              <img src={URL.createObjectURL(f)} alt={`Page ${i+1}`} className={`w-10 h-12 object-cover rounded border border-${color}-200 flex-shrink-0`} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
              <p className="text-xs text-gray-400">{(f.size/1024).toFixed(0)} KB</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button type="button" onClick={() => moveFile(field, i, -1)} disabled={i === 0}
                className={`p-1 rounded hover:bg-${color}-100 disabled:opacity-30 text-${color}-600`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <button type="button" onClick={() => moveFile(field, i, 1)} disabled={i === files.length - 1}
                className={`p-1 rounded hover:bg-${color}-100 disabled:opacity-30 text-${color}-600`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button type="button" onClick={() => removeFile(field, i)} className="p-1 rounded hover:bg-red-100 text-red-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1400&q=80')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute top-10 right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <Link to="/teacher/handwritten" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Handwritten List
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <p className="text-purple-300 text-sm font-medium uppercase tracking-wider">Teacher</p>
              <h1 className="text-3xl font-bold text-white">Upload Handwritten Paper</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-emerald-800 font-semibold text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4">
              <p className="font-semibold text-white text-sm">Exam Details</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Title</label>
                <input type="text" name="title" value={form.title} onChange={handleChange} required className={INPUT_CLS} placeholder="e.g. Math Mid-term – Rahul" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                <select name="subject" value={form.subject} onChange={handleChange} required className={INPUT_CLS}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student (optional)</label>
                <select name="student" value={form.student} onChange={handleChange} className={INPUT_CLS}>
                  <option value="">Select Student (or enter name below)</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.username})</option>)}
                </select>
              </div>
              {!form.student && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Student Name</label>
                  <input type="text" name="student_name" value={form.student_name} onChange={handleChange} className={INPUT_CLS} placeholder="Enter student name if not in the system" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Marks</label>
                <input type="number" name="total_marks" value={form.total_marks} onChange={handleChange} min="1" required className={INPUT_CLS} />
              </div>
              {boardCategories.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Exam Category <span className="text-gray-400 font-normal normal-case">(for Progress Card)</span>
                  </label>
                  <select name="exam_category" value={form.exam_category} onChange={handleChange} className={INPUT_CLS}>
                    <option value="">-- None --</option>
                    {boardCategories.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Question Paper upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-5 py-4 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">Question Paper / Answer Key</p>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Multi-page</span>
            </div>
            <div className="p-5">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-200 rounded-xl p-6 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition bg-gray-50">
                <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Click to add pages</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — multiple files supported</p>
                <input type="file" name="question_papers" onChange={handleChange} multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
              </label>
              <FileList files={form.question_papers} field="question_papers" color="blue" />
            </div>
          </div>

          {/* Answer Sheets upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-fuchsia-600 px-5 py-4 flex items-center justify-between">
              <p className="font-semibold text-white text-sm">Student's Handwritten Answer Sheet</p>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Multi-page</span>
            </div>
            <div className="p-5">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-xl p-6 cursor-pointer hover:bg-purple-50 hover:border-purple-400 transition bg-gray-50">
                <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Click to add pages</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — add page by page or all at once</p>
                <input type="file" name="answer_sheets" onChange={handleChange} multiple accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" />
              </label>
              <FileList files={form.answer_sheets} field="answer_sheets" color="purple" />
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Uploading…
              </span>
            ) : 'Upload for Grading'}
          </button>
        </form>
      </div>
    </div>
  );
}
