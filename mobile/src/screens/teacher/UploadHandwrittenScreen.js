import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import PickerModal from '../../components/PickerModal';

export default function UploadHandwrittenScreen({ navigation }) {
  const [subjects, setSubjects]   = useState([]);
  const [students, setStudents]   = useState([]);
  const [form, setForm] = useState({
    title: '', subject: '', student: '', student_name: '', total_marks: '50',
  });
  const [questionPapers, setQuestionPapers] = useState([]);
  const [answerSheets, setAnswerSheets]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/subjects/'), api.get('/api/auth/my-students/')])
      .then(([subRes, stuRes]) => {
        setSubjects(subRes.data.results || subRes.data);
        setStudents(stuRes.data.results || stuRes.data);
      })
      .catch(console.error);
  }, []);

  const pickImages = async (field) => {
    Alert.alert(
      'Add Pages',
      'Choose how to add pages',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission needed', 'Camera access required.'); return; }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              const file = { uri: asset.uri, name: `page_${Date.now()}.jpg`, type: 'image/jpeg' };
              if (field === 'question') setQuestionPapers(p => [...p, file]);
              else setAnswerSheets(p => [...p, file]);
            }
          },
        },
        {
          text: 'Photo Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.length > 0) {
              const files = result.assets.map((a, i) => ({
                uri: a.uri, name: `page_${Date.now()}_${i}.jpg`, type: 'image/jpeg',
              }));
              if (field === 'question') setQuestionPapers(p => [...p, ...files]);
              else setAnswerSheets(p => [...p, ...files]);
            }
          },
        },
        {
          text: 'PDF / Files',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              multiple: true,
            });
            if (!result.canceled && result.assets?.length > 0) {
              const files = result.assets.map(a => ({
                uri: a.uri, name: a.name, type: a.mimeType || 'application/octet-stream',
              }));
              if (field === 'question') setQuestionPapers(p => [...p, ...files]);
              else setAnswerSheets(p => [...p, ...files]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const removeFile = (field, idx) => {
    if (field === 'question') setQuestionPapers(p => p.filter((_, i) => i !== idx));
    else setAnswerSheets(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.subject) {
      setError('Title and subject are required.'); return;
    }
    if (questionPapers.length === 0 || answerSheets.length === 0) {
      setError('Both question paper and answer sheet are required.'); return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subject', form.subject);
      if (form.student) fd.append('student', form.student);
      if (!form.student && form.student_name) fd.append('student_name', form.student_name);
      fd.append('total_marks', form.total_marks);
      questionPapers.forEach(f => fd.append('question_paper', { uri: f.uri, name: f.name, type: f.type }));
      answerSheets.forEach(f => fd.append('answer_sheet', { uri: f.uri, name: f.name, type: f.type }));
      await api.post('/api/handwritten/upload/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Uploaded successfully! You can grade it from the handwritten list.');
      setTimeout(() => navigation.goBack(), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const subjectName = subjects.find(x => String(x.id) === String(form.subject))?.name || 'Select Subject';
  const studentName = students.find(x => String(x.id) === String(form.student));
  const studentDisplayName = studentName
    ? `${studentName.first_name} ${studentName.last_name} (@${studentName.username})`
    : 'Select Student (optional)';

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label="TEACHER PORTAL"
        title="Upload Handwritten Paper"
        subtitle="AI-powered grading for handwritten answers"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {!!success && (
          <View style={s.successBox}>
            <Text style={{ color: '#065f46', fontWeight: '600', fontSize: 13 }}>✅ {success}</Text>
          </View>
        )}
        {!!error && (
          <View style={s.errorBox}>
            <Text style={{ color: '#dc2626', fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {/* Exam Details */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Exam Details</Text>
          </View>
          <View style={s.cardBody}>
            <Text style={s.label}>Title *</Text>
            <TextInput style={s.input} placeholder="e.g. Math Mid-term – Rahul"
              value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} />

            <Text style={[s.label, { marginTop: 12 }]}>Subject *</Text>
            <TouchableOpacity style={s.select} onPress={() => setShowSubjectModal(true)}>
              <Text style={{ color: form.subject ? '#1e293b' : '#94a3b8', fontSize: 14 }}>{subjectName}</Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            <Text style={[s.label, { marginTop: 12 }]}>Student (optional)</Text>
            <TouchableOpacity style={s.select} onPress={() => setShowStudentModal(true)}>
              <Text style={{ color: form.student ? '#1e293b' : '#94a3b8', fontSize: 14 }} numberOfLines={1}>
                {studentDisplayName}
              </Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            {!form.student && (
              <>
                <Text style={[s.label, { marginTop: 12 }]}>Student Name (if not in system)</Text>
                <TextInput style={s.input} placeholder="Enter student name"
                  value={form.student_name} onChangeText={v => setForm(p => ({ ...p, student_name: v }))} />
              </>
            )}

            <Text style={[s.label, { marginTop: 12 }]}>Total Marks *</Text>
            <TextInput style={s.input} keyboardType="numeric"
              value={form.total_marks} onChangeText={v => setForm(p => ({ ...p, total_marks: v }))} />
          </View>
        </View>

        {/* Question Paper Upload */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={[s.cardHeader, { backgroundColor: '#eff6ff' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[s.cardTitle, { color: '#1d4ed8' }]}>Question Paper / Answer Key</Text>
              <View style={{ backgroundColor: '#bfdbfe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, color: '#1e40af', fontWeight: '600' }}>Multi-page</Text>
              </View>
            </View>
          </View>
          <View style={s.cardBody}>
            <TouchableOpacity style={[s.uploadZone, { borderColor: '#93c5fd' }]} onPress={() => pickImages('question')}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>📄</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>Tap to add pages</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Photo, library, or PDF</Text>
            </TouchableOpacity>
            {questionPapers.map((f, i) => (
              <FileRow key={i} file={f} index={i} onRemove={() => removeFile('question', i)} color="#3b82f6" />
            ))}
          </View>
        </View>

        {/* Answer Sheet Upload */}
        <View style={[s.card, { marginBottom: 14 }]}>
          <View style={[s.cardHeader, { backgroundColor: '#f5f3ff' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[s.cardTitle, { color: '#5b21b6' }]}>Student's Handwritten Answer Sheet</Text>
              <View style={{ backgroundColor: '#ddd6fe', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, color: '#4c1d95', fontWeight: '600' }}>Multi-page</Text>
              </View>
            </View>
          </View>
          <View style={s.cardBody}>
            <TouchableOpacity style={[s.uploadZone, { borderColor: '#c4b5fd' }]} onPress={() => pickImages('answer')}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>✍️</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b' }}>Tap to add pages</Text>
              <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Photo, library, or PDF</Text>
            </TouchableOpacity>
            {answerSheets.map((f, i) => (
              <FileRow key={i} file={f} index={i} onRemove={() => removeFile('answer', i)} color="#7c3aed" />
            ))}
          </View>
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.submitText}>Upload for Grading</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      <PickerModal
        visible={showSubjectModal}
        title="Select Subject"
        items={subjects.map(sub => ({ ...sub, label: sub.name }))}
        onSelect={item => setForm(p => ({ ...p, subject: String(item.id) }))}
        onClose={() => setShowSubjectModal(false)}
      />

      <PickerModal
        visible={showStudentModal}
        title="Select Student"
        items={[
          { id: '', label: '— None (enter name below) —' },
          ...students.map(stu => ({
            ...stu,
            label: `${stu.first_name} ${stu.last_name}`.trim() || stu.username,
          })),
        ]}
        onSelect={item => setForm(p => ({ ...p, student: item.id ? String(item.id) : '' }))}
        onClose={() => setShowStudentModal(false)}
      />
    </View>
  );
}

function FileRow({ file, index, onRemove, color }) {
  const isImage = file.type?.startsWith('image/');
  return (
    <View style={[fr.row, { borderColor: color + '40' }]}>
      <Text style={[fr.idx, { color }]}>P{index + 1}</Text>
      {isImage && (
        <Image source={{ uri: file.uri }} style={fr.thumb} resizeMode="cover" />
      )}
      <View style={{ flex: 1 }}>
        <Text style={fr.name} numberOfLines={1}>{file.name}</Text>
        <Text style={fr.type}>{isImage ? 'Image' : 'PDF/Document'}</Text>
      </View>
      <TouchableOpacity onPress={onRemove} style={fr.remove}>
        <Text style={{ color: '#ef4444', fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const fr = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, borderWidth: 1, borderRadius: 10, padding: 8, backgroundColor: '#fafafa' },
  idx:   { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'center' },
  thumb: { width: 40, height: 48, borderRadius: 6 },
  name:  { fontSize: 13, fontWeight: '600', color: '#334155' },
  type:  { fontSize: 11, color: '#94a3b8' },
  remove: { padding: 4 },
});

const s = StyleSheet.create({
  successBox: { backgroundColor: '#d1fae5', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#a7f3d0' },
  errorBox:   { backgroundColor: '#fee2e2', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#fecaca' },
  card:     { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#f8fafc' },
  cardTitle:  { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardBody:   { padding: 16 },
  label:    { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input:    { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b', backgroundColor: '#f8fafc' },
  select:   { borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' },
  uploadZone: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 14, padding: 24, alignItems: 'center', backgroundColor: '#f8fafc' },
  submitBtn: { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
