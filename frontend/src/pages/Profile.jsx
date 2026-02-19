import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const { user, fetchProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/auth/profile/', formData);
      await fetchProfile();
      setEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update profile');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profile_photo', file);
      await api.patch('/api/auth/profile/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchProfile();
      setFormData(prev => ({ ...prev, profile_photo: user?.profile_photo }));
      setMessage('Photo updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Profile</h1>

      {message && (
        <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${message.includes('success') || message.includes('updated') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
        {/* Profile Photo */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-200">
          <div>
            {user.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{user.first_name} {user.last_name}</h2>
            <p className="text-gray-500">@{user.username}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="mt-2 inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uploading ? 'Uploading...' : user.profile_photo ? 'Change Photo' : 'Add Photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
              <input value={formData.school_name || ''} onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={formData.phone_number || ''} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
              <input value={formData.parent_phone || ''} onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition">Save</button>
              <button type="button" onClick={() => { setEditing(false); setFormData({ ...user }); }}
                className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2.5 rounded-lg font-medium transition">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setEditing(true)}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition">
                Edit Profile
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div><span className="text-sm text-gray-500">Email</span><p className="font-medium text-gray-800">{user.email}</p></div>
              <div><span className="text-sm text-gray-500">Board</span><p className="font-medium text-gray-800">{user.board}</p></div>
              <div><span className="text-sm text-gray-500">Class</span><p className="font-medium text-gray-800">{user.grade}</p></div>
              <div><span className="text-sm text-gray-500">School</span><p className="font-medium text-gray-800">{user.school_name || '-'}</p></div>
              <div><span className="text-sm text-gray-500">Phone</span><p className="font-medium text-gray-800">{user.phone_number || '-'}</p></div>
              <div><span className="text-sm text-gray-500">Parent Phone</span><p className="font-medium text-gray-800">{user.parent_phone || '-'}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
