import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function UploadHandwritten() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({
    title: '',
    subject: '',
    student: '',
    student_name: '',
    total_marks: 50,
    question_papers: [],  // multiple pages
    answer_sheets: [],    // multiple pages
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, stuRes] = await Promise.all([
          api.get('/api/subjects/'),
          api.get('/api/auth/my-students/'),
        ]);
        setSubjects(subRes.data.results || subRes.data);
        setStudents(stuRes.data.results || stuRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'answer_sheets') {
      setForm((prev) => ({ ...prev, answer_sheets: [...prev.answer_sheets, ...Array.from(files)] }));
    } else if (name === 'question_papers') {
      setForm((prev) => ({ ...prev, question_papers: [...prev.question_papers, ...Array.from(files)] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const removeFile = (field, index) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const moveFile = (field, index, dir) => {
    setForm((prev) => {
      const files = [...prev[field]];
      const target = index + dir;
      if (target < 0 || target >= files.length) return prev;
      [files[index], files[target]] = [files[target], files[index]];
      return { ...prev, [field]: files };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (form.question_papers.length === 0 || form.answer_sheets.length === 0) {
      setError('Both question paper and at least one answer sheet page are required.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('subject', form.subject);
      if (form.student) formData.append('student', form.student);
      if (form.student_name) formData.append('student_name', form.student_name);
      formData.append('total_marks', form.total_marks);
      form.question_papers.forEach((f) => formData.append('question_paper', f));
      form.answer_sheets.forEach((f) => formData.append('answer_sheet', f));

      await api.post('/api/handwritten/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Uploaded successfully! You can now grade it from the Handwritten list.');
      setTimeout(() => navigate('/teacher/handwritten'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/teacher/handwritten" className="text-gray-400 hover:text-gray-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Upload Handwritten Paper</h1>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-700 font-medium">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text" id="title" name="title" value={form.title} onChange={handleChange} required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="e.g. Math Mid-term - Rahul"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            id="subject" name="subject" value={form.subject} onChange={handleChange} required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Student (optional dropdown) */}
        <div>
          <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">Student (optional)</label>
          <select
            id="student" name="student" value={form.student} onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          >
            <option value="">Select Student (or enter name below)</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.username})</option>
            ))}
          </select>
        </div>

        {/* Student Name fallback */}
        {!form.student && (
          <div>
            <label htmlFor="student_name" className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text" id="student_name" name="student_name" value={form.student_name} onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              placeholder="Enter student name if not in the system"
            />
          </div>
        )}

        {/* Total Marks */}
        <div>
          <label htmlFor="total_marks" className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
          <input
            type="number" id="total_marks" name="total_marks" value={form.total_marks} onChange={handleChange}
            min="1" required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          />
        </div>

        {/* Question Paper — multiple pages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question Paper / Answer Key
            <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              Multiple pages supported
            </span>
          </label>
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-indigo-300 rounded-xl p-5 cursor-pointer hover:bg-indigo-50 transition bg-white">
            <svg className="w-8 h-8 text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">Click to add pages</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — select multiple files at once or add page by page</p>
            <input
              type="file" name="question_papers" onChange={handleChange} multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />
          </label>
          {form.question_papers.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">{form.question_papers.length} page(s)</p>
              {form.question_papers.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-indigo-500 w-5 text-center">P{i + 1}</span>
                  {f.type.startsWith('image/') && (
                    <img src={URL.createObjectURL(f)} alt={`Page ${i + 1}`} className="w-10 h-12 object-cover rounded border border-indigo-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-800 truncate">{f.name}</p>
                    <p className="text-xs text-indigo-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveFile('question_papers', i, -1)} disabled={i === 0}
                      className="p-1 rounded hover:bg-indigo-100 disabled:opacity-30 text-indigo-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button type="button" onClick={() => moveFile('question_papers', i, 1)} disabled={i === form.question_papers.length - 1}
                      className="p-1 rounded hover:bg-indigo-100 disabled:opacity-30 text-indigo-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button type="button" onClick={() => removeFile('question_papers', i)}
                      className="p-1 rounded hover:bg-red-100 text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Sheets — multiple pages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Student's Handwritten Answer Sheet
            <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              Multiple pages supported
            </span>
          </label>
          <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-purple-300 rounded-xl p-5 cursor-pointer hover:bg-purple-50 transition bg-white">
            <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">Click to add pages</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, PDF — select multiple files at once or add page by page</p>
            <input
              type="file" name="answer_sheets" onChange={handleChange} multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
            />
          </label>

          {/* Page list */}
          {form.answer_sheets.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600">{form.answer_sheets.length} page(s) — drag to reorder</p>
              {form.answer_sheets.map((f, i) => (
                <div key={i} className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-purple-500 w-5 text-center">P{i + 1}</span>
                  {f.type.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`Page ${i + 1}`}
                      className="w-10 h-12 object-cover rounded border border-purple-200"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-800 truncate">{f.name}</p>
                    <p className="text-xs text-purple-400">{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveFile('answer_sheets', i, -1)} disabled={i === 0}
                      className="p-1 rounded hover:bg-purple-100 disabled:opacity-30 text-purple-600" title="Move up">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => moveFile('answer_sheets', i, 1)} disabled={i === form.answer_sheets.length - 1}
                      className="p-1 rounded hover:bg-purple-100 disabled:opacity-30 text-purple-600" title="Move down">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => removeFile('answer_sheets', i)}
                      className="p-1 rounded hover:bg-red-100 text-red-400" title="Remove">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        <button
          type="submit" disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Uploading...
            </span>
          ) : (
            'Upload for Grading'
          )}
        </button>
      </form>
    </div>
  );
}
