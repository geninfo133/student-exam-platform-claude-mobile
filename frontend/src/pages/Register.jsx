import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COACHING_EXAMS = [
  { value: 'BANK', label: 'Bank Exams' },
  { value: 'EAMCET', label: 'EAMCET' },
  { value: 'ECET', label: 'ECET' },
  { value: 'NEET', label: 'NEET' },
  { value: 'JEE', label: 'IIT-JEE' },
  { value: 'DSC', label: 'DSC' },
  { value: 'OTHER', label: 'Other' },
];

const VALID_ORG_TYPES = ['school', 'college', 'coaching'];

export default function Register() {
  const [searchParams] = useSearchParams();
  const orgTypeParam = searchParams.get('org_type');
  const preselected = VALID_ORG_TYPES.includes(orgTypeParam);

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', phone_number: '',
    board: '', school_name: '', org_type: preselected ? orgTypeParam : 'school',
    class_from: 1, class_to: 12,
  });
  const [selectedExams, setSelectedExams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleExam = (value) => {
    setSelectedExams((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const orgLabel = formData.org_type === 'coaching' ? 'Coaching Centre'
    : formData.org_type === 'college' ? 'College' : 'School';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.password2) {
      setError('Passwords do not match');
      return;
    }
    if (formData.org_type === 'coaching' && selectedExams.length === 0) {
      setError('Please select at least one exam type');
      return;
    }
    if (formData.org_type !== 'coaching' && !formData.board) {
      setError('Please select a board');
      return;
    }
    if (!formData.school_name.trim()) {
      setError(`${orgLabel} name is required`);
      return;
    }
    if (formData.org_type !== 'coaching' && Number(formData.class_from) > Number(formData.class_to)) {
      setError('"Classes From" must be less than or equal to "Classes To"');
      return;
    }
    setLoading(true);
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      const payload = { ...formData, role: 'school' };
      if (formData.org_type === 'coaching') {
        payload.board = selectedExams.join(',');
        delete payload.class_from;
        delete payload.class_to;
      }
      await register(payload);
      await login(formData.username, formData.password);
      setTimeout(() => navigate('/school/dashboard'), 100);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const msgs = Object.values(data).flat().join('. ');
        setError(msgs);
      } else {
        setError('Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Register Organization</h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            Create your school, college, or coaching centre account
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type <span className="text-red-500">*</span></label>
              {preselected ? (
                <span className="inline-block bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium text-sm">
                  {orgLabel}
                </span>
              ) : (
                <select name="org_type" value={formData.org_type} onChange={handleChange} required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="coaching">Coaching Centre</option>
                </select>
              )}
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{orgLabel} Name <span className="text-red-500">*</span></label>
              <input name="school_name" value={formData.school_name} onChange={handleChange}
                placeholder={`Enter ${orgLabel.toLowerCase()} name`}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            {/* Board (for school/college) or Coaching For (for coaching) */}
            {formData.org_type === 'coaching' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coaching For <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {COACHING_EXAMS.map((exam) => (
                    <label key={exam.value}
                      className={`flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition ${
                        selectedExams.includes(exam.value)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}>
                      <input
                        type="checkbox"
                        checked={selectedExams.includes(exam.value)}
                        onChange={() => toggleExam(exam.value)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium">{exam.label}</span>
                    </label>
                  ))}
                </div>
                {selectedExams.length > 0 && (
                  <p className="text-xs text-indigo-600 mt-2">{selectedExams.length} exam type(s) selected</p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board <span className="text-red-500">*</span></label>
                  <select name="board" value={formData.board} onChange={handleChange} required
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Select Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="STATE">State Board</option>
                    <option value="ICSE">ICSE</option>
                    <option value="INTL">International</option>
                  </select>
                </div>

                {/* Class Range - only for school/college */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Classes From <span className="text-red-500">*</span></label>
                    <select name="class_from" value={formData.class_from} onChange={handleChange} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Classes To <span className="text-red-500">*</span></label>
                    <select name="class_to" value={formData.class_to} onChange={handleChange} required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      {[1,2,3,4,5,6,7,8,9,10,11,12].filter(g => g >= Number(formData.class_from)).map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Admin Details */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <p className="text-sm font-medium text-gray-600 mb-3">Admin Account Details</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input name="first_name" value={formData.first_name} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input name="last_name" value={formData.last_name} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input name="username" value={formData.username} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input name="phone_number" value={formData.phone_number} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input type="password" name="password2" value={formData.password2} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50">
              {loading ? 'Creating Account...' : `Register ${orgLabel}`}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
