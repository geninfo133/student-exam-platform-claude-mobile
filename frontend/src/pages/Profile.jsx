import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const PREVIEW_SIZE = 220;

const INFO_FIELDS = [
  { key: 'email',        label: 'Email Address', icon: '📧' },
  { key: 'board',        label: 'Board',          icon: '🏫' },
  { key: 'grade',        label: 'Class / Grade',  icon: '🎓' },
  { key: 'school_name',  label: 'School',         icon: '🏛️' },
  { key: 'phone_number', label: 'Phone',          icon: '📱' },
  { key: 'parent_phone', label: 'Parent Phone',   icon: '☎️' },
];

function Field({ label, name, value, type = 'text', onChange }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-indigo-400 transition placeholder-gray-300"
      />
    </div>
  );
}

export default function Profile() {
  const { user, fetchProfile } = useAuth();
  const [editing, setEditing]   = useState(false);
  const [formData, setFormData] = useState({ ...user });
  const [message, setMessage]   = useState({ text: '', ok: true });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Photo crop modal state
  const [photoModal, setPhotoModal]   = useState(false);
  const [rawPhoto, setRawPhoto]       = useState(null);
  const [photoPos, setPhotoPos]       = useState({ x: 0, y: 0 });
  const [photoScale, setPhotoScale]   = useState(1);
  const [imgNatural, setImgNatural]   = useState({ w: 0, h: 0 });
  const dragging = useRef(false);
  const lastPtr  = useRef({ x: 0, y: 0 });

  const showMsg = (text, ok = true) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage({ text: '', ok: true }), 3500);
  };

  const handleChange = (name, value) => setFormData(p => ({ ...p, [name]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/auth/profile/', formData);
      await fetchProfile();
      setEditing(false);
      showMsg('Profile updated successfully!');
    } catch {
      showMsg('Failed to update profile.', false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRawPhoto(URL.createObjectURL(file));
    setPhotoPos({ x: 0, y: 0 });
    setPhotoScale(1);
    setPhotoModal(true);
    e.target.value = '';
  };

  const handleImgLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.target;
    setImgNatural({ w, h });
    const scale = Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h);
    setPhotoScale(scale);
    setPhotoPos({
      x: (PREVIEW_SIZE - w * scale) / 2,
      y: (PREVIEW_SIZE - h * scale) / 2,
    });
  };

  const clampPos = useCallback((pos, scale) => ({
    x: Math.min(0, Math.max(PREVIEW_SIZE - imgNatural.w * scale, pos.x)),
    y: Math.min(0, Math.max(PREVIEW_SIZE - imgNatural.h * scale, pos.y)),
  }), [imgNatural]);

  const startDrag = (cx, cy) => { dragging.current = true; lastPtr.current = { x: cx, y: cy }; };
  const moveDrag  = (cx, cy) => {
    if (!dragging.current) return;
    const dx = cx - lastPtr.current.x, dy = cy - lastPtr.current.y;
    lastPtr.current = { x: cx, y: cy };
    setPhotoPos(p => clampPos({ x: p.x + dx, y: p.y + dy }, photoScale));
  };
  const endDrag = () => { dragging.current = false; };

  const handleScaleChange = (s) => { setPhotoScale(s); setPhotoPos(p => clampPos(p, s)); };

  const handleApply = () => {
    const img = new Image();
    img.src = rawPhoto;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = PREVIEW_SIZE;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, -photoPos.x / photoScale, -photoPos.y / photoScale,
        PREVIEW_SIZE / photoScale, PREVIEW_SIZE / photoScale, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      canvas.toBlob(async (blob) => {
        setPhotoModal(false);
        setUploading(true);
        try {
          const fd = new FormData();
          fd.append('profile_photo', blob, 'profile.jpg');
          await api.patch('/api/auth/profile/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          await fetchProfile();
          showMsg('Photo updated successfully!');
        } catch {
          showMsg('Failed to upload photo.', false);
        } finally {
          setUploading(false);
          URL.revokeObjectURL(rawPhoto);
        }
      }, 'image/jpeg', 0.92);
    };
  };

  const cancelModal = () => { setPhotoModal(false); URL.revokeObjectURL(rawPhoto); setRawPhoto(null); };

  const minScale = imgNatural.w && imgNatural.h
    ? Math.max(PREVIEW_SIZE / imgNatural.w, PREVIEW_SIZE / imgNatural.h) : 1;

  if (!user) return null;

  const initials = (user.first_name?.[0] || user.username?.[0] || '?').toUpperCase();
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  const roleBadge = user.role === 'teacher' ? '👨‍🏫 Teacher' : user.role === 'school' ? '🏫 Admin' : '🎓 Student';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Profile Header Banner ── */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar with upload overlay */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl">
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-4xl font-black text-white">
                  {initials}
                </div>
              )}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <svg className="w-6 h-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-xs font-bold">{uploading ? 'Uploading…' : 'Change'}</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-white/30 border-t-white rounded-full" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {/* Info */}
          <div className="text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/10 text-indigo-300 text-xs font-bold mb-2">
              {roleBadge}
            </span>
            <h1 className="text-3xl font-black text-white">{fullName}</h1>
            <p className="text-slate-400 text-sm mt-1">@{user.username}</p>
            {(user.board || user.grade) && (
              <p className="text-slate-400 text-sm mt-0.5">
                {[user.board, user.grade && `Class ${user.grade}`].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          {/* Upload button (desktop) */}
          <div className="sm:ml-auto shrink-0">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {uploading ? 'Uploading…' : user.profile_photo ? 'Change Photo' : 'Add Photo'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Toast */}
        {message.text && (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold shadow-sm mb-6 ${
            message.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <span className="text-xl">{message.ok ? '✅' : '❌'}</span>
            {message.text}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* ── Left: Profile card (2/3) ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* View Mode */}
            {!editing && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div>
                    <h2 className="font-black text-gray-900">Profile Information</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Your personal details and settings</p>
                  </div>
                  <button
                    onClick={() => { setEditing(true); setFormData({ ...user }); }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition shadow-md"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Profile
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-50">
                  {INFO_FIELDS.map((f, i) => (
                    <div key={f.key} className={`px-6 py-5 ${i % 2 === 0 && i < INFO_FIELDS.length - 1 ? 'sm:border-b border-gray-50' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{f.icon}</span>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{f.label}</p>
                      </div>
                      <p className="text-gray-900 font-semibold text-sm pl-6">
                        {user[f.key] || <span className="text-gray-300 font-normal italic">Not set</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {editing && (
              <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div>
                    <h2 className="font-black text-gray-900">Edit Profile</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Update your personal details</p>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name"  name="first_name"  value={formData.first_name}  onChange={handleChange} />
                    <Field label="Last Name"   name="last_name"   value={formData.last_name}   onChange={handleChange} />
                  </div>
                  <Field label="Email Address" name="email"        type="email" value={formData.email}        onChange={handleChange} />
                  <Field label="School Name"   name="school_name"  value={formData.school_name}  onChange={handleChange} />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Phone Number"  name="phone_number"  value={formData.phone_number}  onChange={handleChange} />
                    <Field label="Parent Phone"  name="parent_phone"  value={formData.parent_phone}  onChange={handleChange} />
                  </div>
                </div>
                <div className="flex gap-3 px-6 pb-6">
                  <button type="submit"
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-sm hover:opacity-90 transition shadow-lg">
                    Save Changes
                  </button>
                  <button type="button"
                    onClick={() => { setEditing(false); setFormData({ ...user }); }}
                    className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Right: Account info sidebar (1/3) ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h3 className="font-black text-gray-900 text-sm">Account Details</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { icon: '👤', label: 'Username',    value: `@${user.username}`,           bg: 'bg-slate-50'  },
                  { icon: '🔑', label: 'Role',        value: user.role || 'Student',         bg: 'bg-indigo-50' },
                  user.school_account_name && { icon: '🏫', label: 'Institution', value: user.school_account_name, bg: 'bg-emerald-50' },
                  user.board  && { icon: '📋', label: 'Board',  value: user.board,  bg: 'bg-amber-50'   },
                  user.grade  && { icon: '🎓', label: 'Class',  value: `Class ${user.grade}`, bg: 'bg-violet-50'  },
                ].filter(Boolean).map(({ icon, label, value, bg }) => (
                  <div key={label} className="flex items-center gap-3 px-6 py-4">
                    <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center text-base shrink-0`}>{icon}</div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{label}</p>
                      <p className="text-sm font-black text-gray-800 capitalize truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo upload shortcut */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4
                         hover:border-indigo-200 hover:shadow-md transition group disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                              flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition">
                  {uploading ? 'Uploading…' : user.profile_photo ? 'Change Photo' : 'Upload Photo'}
                </p>
                <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* ── Photo Crop Modal ── */}
      {photoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg">📸</div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Adjust Photo</h3>
                <p className="text-xs text-gray-400">Drag to reposition · Scroll to zoom</p>
              </div>
            </div>

            <div className="flex justify-center my-5">
              <div
                className="relative overflow-hidden rounded-full border-4 border-indigo-500 shadow-xl select-none"
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, cursor: dragging.current ? 'grabbing' : 'grab' }}
                onMouseDown={e => { e.preventDefault(); startDrag(e.clientX, e.clientY); }}
                onMouseMove={e => moveDrag(e.clientX, e.clientY)}
                onMouseUp={endDrag} onMouseLeave={endDrag}
                onTouchStart={e => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); }}
                onTouchMove={e => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }}
                onTouchEnd={endDrag}
                onWheel={e => {
                  e.preventDefault();
                  handleScaleChange(Math.max(minScale, Math.min(4, photoScale + (e.deltaY > 0 ? -0.05 : 0.05))));
                }}
              >
                <img
                  src={rawPhoto} alt="Preview" onLoad={handleImgLoad} draggable={false}
                  style={{
                    position: 'absolute', left: photoPos.x, top: photoPos.y,
                    width: imgNatural.w * photoScale, height: imgNatural.h * photoScale,
                    userSelect: 'none', pointerEvents: 'none',
                  }}
                />
              </div>
            </div>

            {/* Zoom slider */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-400 font-medium mb-2">
                <span>Zoom</span>
                <span className="font-black text-indigo-600">{Math.round(photoScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={Math.round(minScale * 100)} max={400}
                value={Math.round(photoScale * 100)}
                onChange={e => handleScaleChange(parseInt(e.target.value) / 100)}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleApply}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl font-black text-sm hover:opacity-90 transition shadow-md"
              >
                Apply Photo
              </button>
              <button
                onClick={cancelModal}
                className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold text-sm hover:bg-slate-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
