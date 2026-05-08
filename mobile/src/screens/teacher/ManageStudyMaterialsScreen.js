import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import PickerModal from '../../components/PickerModal';

export default function ManageStudyMaterialsScreen({ navigation }) {
  const [subjects, setSubjects]   = useState([]);
  const [chapters, setChapters]   = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle]         = useState('');
  const [content, setContent]     = useState('');
  const [order, setOrder]         = useState('0');
  const [file, setFile]           = useState(null);

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [toast, setToast]         = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    api.get('/api/assignments/my/')
      .then(res => {
        const assignments = res.data?.results || res.data || [];
        const map = {};
        assignments.forEach(a => { if (!map[a.subject]) map[a.subject] = { id: a.subject, name: a.subject_name }; });
        setSubjects(Object.values(map));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSubject) { setChapters([]); setSelectedChapter(null); setMaterials([]); return; }
    api.get(`/api/chapters/?subject=${selectedSubject.id}`)
      .then(res => setChapters(res.data?.results || res.data || []))
      .catch(() => setChapters([]));
    setSelectedChapter(null); setMaterials([]);
  }, [selectedSubject]);

  useEffect(() => {
    if (!selectedChapter) { setMaterials([]); return; }
    fetchMaterials();
  }, [selectedChapter]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/study-materials/manage/', { params: { chapter: selectedChapter.id } });
      setMaterials(res.data?.results || res.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setOrder('0'); setFile(null); setEditingId(null); setShowForm(false);
  };

  const startEdit = (mat) => {
    setEditingId(mat.id);
    setTitle(mat.title || '');
    setContent(mat.content || '');
    setOrder(String(mat.order || 0));
    setFile(null);
    setShowForm(true);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets?.length > 0) setFile(res.assets[0]);
    } catch { Alert.alert('Error', 'Could not open file picker'); }
  };

  const handleSubmit = async () => {
    if (!title.trim()) return Alert.alert('Missing', 'Enter a title');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', title.trim());
      fd.append('content', content);
      fd.append('chapter', String(selectedChapter.id));
      fd.append('order', order || '0');
      if (file) fd.append('file', { uri: file.uri, name: file.name || 'file', type: file.mimeType || 'application/octet-stream' });

      if (editingId) {
        await api.patch(`/api/study-materials/${editingId}/update/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Material updated!');
      } else {
        await api.post('/api/study-materials/create/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        showToast('Material created!');
      }
      resetForm(); fetchMaterials();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to save material');
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Material', 'Delete this study material?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/study-materials/${id}/delete/`);
            showToast('Material deleted.');
            fetchMaterials();
          } catch { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="TEACHER PORTAL"
        title="Study Materials"
        subtitle={selectedChapter ? `${selectedSubject?.name} · ${selectedChapter.name}` : 'Upload and manage chapter materials'}
      />

      {toast !== '' && <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Subject + Chapter selectors */}
        <View style={{ gap: 8, marginBottom: 14 }}>
          <TouchableOpacity style={s.selector} onPress={() => setShowSubjectPicker(true)}>
            <Text style={selectedSubject ? s.selectorVal : s.selectorPh}>{selectedSubject?.name || 'Select Subject…'}</Text>
            <Text style={{ color: '#94a3b8' }}>▾</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.selector, !selectedSubject && { opacity: 0.5 }]}
            onPress={() => selectedSubject && setShowChapterPicker(true)}
            disabled={!selectedSubject}
          >
            <Text style={selectedChapter ? s.selectorVal : s.selectorPh}>{selectedChapter?.name || 'Select Chapter…'}</Text>
            <Text style={{ color: '#94a3b8' }}>▾</Text>
          </TouchableOpacity>
        </View>

        {!selectedChapter ? (
          <EmptyState
            icon="📚"
            title="Select a subject and chapter"
            message="Choose a chapter above to manage its study materials"
          />
        ) : loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : (
          <>
            {!showForm && (
              <TouchableOpacity style={s.addBtn} onPress={() => { resetForm(); setShowForm(true); }}>
                <Text style={s.addBtnText}>+ Add Material</Text>
              </TouchableOpacity>
            )}

            {/* Form */}
            {showForm && (
              <View style={s.formCard}>
                <Text style={s.formTitle}>{editingId ? 'Edit Material' : 'New Material'}</Text>
                <Text style={s.label}>Title *</Text>
                <TextInput style={s.input} placeholder="Material title" placeholderTextColor="#94a3b8" value={title} onChangeText={setTitle} />

                <Text style={s.label}>Content</Text>
                <TextInput style={[s.input, { minHeight: 80 }]} multiline placeholder="Study material content…" placeholderTextColor="#94a3b8" value={content} onChangeText={setContent} />

                <Text style={s.label}>Attach File</Text>
                {file ? (
                  <View style={s.filePill}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>📎</Text>
                    <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                    <TouchableOpacity onPress={() => setFile(null)}><Text style={{ color: '#dc2626', fontWeight: '700' }}>✕</Text></TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={s.filePicker} onPress={pickFile}>
                    <Text style={{ fontSize: 26, marginBottom: 4 }}>📂</Text>
                    <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Tap to attach file</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 11 }}>PDF, images, documents</Text>
                  </TouchableOpacity>
                )}

                <Text style={s.label}>Display Order</Text>
                <TextInput style={s.input} keyboardType="numeric" value={order} onChangeText={setOrder} />

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <TouchableOpacity
                    style={[s.submitBtn, { flex: 1 }, saving && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={saving}
                  >
                    {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>{editingId ? 'Update' : 'Create'}</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.cancelBtn, { flex: 1 }]} onPress={resetForm}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Materials list */}
            {materials.length === 0 && !showForm ? (
              <EmptyState
                icon="📄"
                title="No materials yet"
                message="Add your first study material for this chapter."
              />
            ) : (
              materials.map((mat, idx) => (
                <View key={mat.id} style={s.matCard}>
                  <View style={[s.orderStrip, { backgroundColor: '#10b981' }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>{mat.order ?? idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1, padding: 12 }}>
                    <Text style={s.matTitle}>{mat.title}</Text>
                    {mat.content ? <Text style={s.matContent} numberOfLines={2}>{mat.content}</Text> : null}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {mat.file && <Text style={s.chip}>📎 File attached</Text>}
                      {mat.key_concepts?.length > 0 && <Text style={s.chip}>💡 {mat.key_concepts.length} concepts</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity style={s.editBtn} onPress={() => startEdit(mat)}>
                        <Text style={s.editBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(mat.id)}>
                        <Text style={s.deleteBtnText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <PickerModal visible={showSubjectPicker} title="Select Subject" items={subjects.map(s => ({ ...s, label: s.name }))} onSelect={setSelectedSubject} onClose={() => setShowSubjectPicker(false)} />
      <PickerModal visible={showChapterPicker} title="Select Chapter" items={chapters.map(c => ({ ...c, label: c.name }))} onSelect={setSelectedChapter} onClose={() => setShowChapterPicker(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  toast:       { backgroundColor: '#10b981', padding: 12, alignItems: 'center' },
  toastText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  selector:    { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorVal: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  selectorPh:  { fontSize: 14, color: '#94a3b8' },
  addBtn:      { backgroundColor: '#10b981', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 12 },
  addBtnText:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  formCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  formTitle:   { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  label:       { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, marginTop: 10 },
  input:       { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  filePicker:  { borderWidth: 2, borderColor: '#a7f3d0', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginVertical: 4 },
  filePill:    { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  fileName:    { fontSize: 13, fontWeight: '600', color: '#065f46', flex: 1 },
  submitBtn:   { backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn:   { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:{ color: '#64748b', fontWeight: '700', fontSize: 13 },
  matCard:     { backgroundColor: '#fff', borderRadius: 14, marginBottom: 8, flexDirection: 'row', overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4 },
  orderStrip:  { width: 36, alignItems: 'center', justifyContent: 'center' },
  matTitle:    { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  matContent:  { fontSize: 12, color: '#64748b', marginTop: 2 },
  chip:        { fontSize: 11, backgroundColor: '#f1f5f9', color: '#64748b', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600' },
  editBtn:     { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  editBtnText: { color: '#4f46e5', fontSize: 12, fontWeight: '700' },
  deleteBtn:   { backgroundColor: '#fff1f2', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  deleteBtnText:{ color: '#dc2626', fontSize: 12, fontWeight: '700' },
});
