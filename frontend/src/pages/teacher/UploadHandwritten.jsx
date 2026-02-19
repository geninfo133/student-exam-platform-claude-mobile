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
    question_paper: null,
    answer_sheet: null,
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
    if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!form.question_paper || !form.answer_sheet) {
      setError('Both question paper and answer sheet files are required.');
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
      formData.append('question_paper', form.question_paper);
      formData.append('answer_sheet', form.answer_sheet);

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

        {/* Question Paper */}
        <div>
          <label htmlFor="question_paper" className="block text-sm font-medium text-gray-700 mb-1">Question Paper / Answer Key</label>
          <input
            type="file" id="question_paper" name="question_paper" onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="text-xs text-gray-400 mt-1">PDF or image (JPG, PNG)</p>
        </div>

        {/* Answer Sheet */}
        <div>
          <label htmlFor="answer_sheet" className="block text-sm font-medium text-gray-700 mb-1">Student's Handwritten Answer Sheet</label>
          <input
            type="file" id="answer_sheet" name="answer_sheet" onChange={handleChange}
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          <p className="text-xs text-gray-400 mt-1">Photo or scan of the student's handwritten answers</p>
        </div>

        {/* File previews */}
        <div className="grid grid-cols-2 gap-4">
          {form.question_paper && (
            <div className="border border-gray-200 rounded-lg p-3 text-center bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Question Paper</p>
              <p className="text-sm font-medium text-gray-700 truncate">{form.question_paper.name}</p>
              <p className="text-xs text-gray-400">{(form.question_paper.size / 1024).toFixed(0)} KB</p>
            </div>
          )}
          {form.answer_sheet && (
            <div className="border border-purple-200 rounded-lg p-3 text-center bg-purple-50">
              <p className="text-xs text-purple-500 mb-1">Answer Sheet</p>
              <p className="text-sm font-medium text-purple-700 truncate">{form.answer_sheet.name}</p>
              <p className="text-xs text-purple-400">{(form.answer_sheet.size / 1024).toFixed(0)} KB</p>
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
