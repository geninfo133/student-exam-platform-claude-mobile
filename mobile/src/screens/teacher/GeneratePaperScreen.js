import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import PickerModal from '../../components/PickerModal';

const METHODS = [
  { key: 'papers',       label: 'From Old Papers',    sub: 'Upload PDFs, AI creates questions',    color: '#4f46e5' },
  { key: 'instructions', label: 'From Instructions',  sub: 'Pick chapters, specify topics',         color: '#8b5cf6' },
];

export default function GeneratePaperScreen({ navigation }) {
  const { user } = useAuth();
  const [method, setMethod]   = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');

  const [paperFiles, setPaperFiles] = useState([]);
  const [paperSubject, setPaperSubject] = useState(null);
  const [paperInstructions, setPaperInstructions] = useState('');
  const [paperMarks, setPaperMarks] = useState('50');
  const [paperMcq, setPaperMcq]     = useState('20');
  const [paperShort, setPaperShort] = useState('5');
  const [paperLong, setPaperLong]   = useState('4');

  const [instrSubject, setInstrSubject]     = useState(null);
  const [instrChapterIds, setInstrChapterIds] = useState([]);
  const [instrTopics, setInstrTopics]       = useState('');
  const [instrMarks, setInstrMarks]         = useState('50');
  const [instrMcq, setInstrMcq]             = useState('20');
  const [instrShort, setInstrShort]         = useState('5');
  const [instrLong, setInstrLong]           = useState('4');

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showInstrSubjectPicker, setShowInstrSubjectPicker] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const res = await api.get('/api/assignments/my/');
        const list = res.data.results || res.data || [];
        if (list.length > 0) {
          const map = {};
          list.forEach(a => { if (!map[a.subject]) map[a.subject] = { id: a.subject, name: a.subject_name }; });
          setSubjects(Object.values(map));
          return;
        }
      } catch {}
      try {
        const res = await api.get('/api/subjects/');
        const subs = res.data.results || res.data || [];
        setSubjects(subs.map(s => ({ id: s.id, name: s.name })));
      } catch {}
      finally { setInitLoading(false); }
    };
    loadSubjects().finally(() => setInitLoading(false));
  }, []);

  useEffect(() => {
    if (!instrSubject) { setChapters([]); setInstrChapterIds([]); return; }
    api.get(`/api/chapters/?subject=${instrSubject.id}`)
      .then(res => setChapters(res.data?.results || res.data || []))
      .catch(() => setChapters([]));
    setInstrChapterIds([]);
  }, [instrSubject]);

  const pickFile = async () => {
    if (paperFiles.length >= 5) { Alert.alert('Limit', 'Maximum 5 papers'); return; }
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.length > 0) {
        setPaperFiles(prev => [...prev, res.assets[0]].slice(0, 5));
      }
    } catch { Alert.alert('Error', 'Could not open file picker'); }
  };

  const toggleChapter = (id) => {
    setInstrChapterIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handlePapersSubmit = async () => {
    if (!paperSubject) return Alert.alert('Missing', 'Select a subject');
    if (paperFiles.length === 0) return Alert.alert('Missing', 'Select at least one PDF');
    if (!paperInstructions.trim()) return Alert.alert('Missing', 'Enter instructions for the AI');
    setLoading(true); setUploadProgress('');
    try {
      const paperIds = [];
      for (let i = 0; i < paperFiles.length; i++) {
        setUploadProgress(`Uploading paper ${i + 1} of ${paperFiles.length}…`);
        const form = new FormData();
        form.append('title', paperFiles[i].name?.replace('.pdf', '') || `Paper ${i + 1}`);
        form.append('subject', String(paperSubject.id));
        form.append('total_marks', paperMarks);
        form.append('file', { uri: paperFiles[i].uri, name: paperFiles[i].name || 'paper.pdf', type: 'application/pdf' });
        const res = await api.post('/api/exams/papers/upload/', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        paperIds.push(res.data.id);
      }
      setUploadProgress('Starting AI generation…');
      await api.post('/api/exams/papers/create-from-papers/', {
        paper_ids: paperIds, instructions: paperInstructions,
        subject: paperSubject.id, total_marks: parseInt(paperMarks),
        num_mcq: parseInt(paperMcq), num_short: parseInt(paperShort), num_long: parseInt(paperLong),
      });
      setSuccess('Question generation started! AI is creating questions in the background. This usually takes 1–2 minutes.');
      setPaperFiles([]); setPaperSubject(null); setPaperInstructions('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to generate');
    } finally { setLoading(false); setUploadProgress(''); }
  };

  const handleInstrSubmit = async () => {
    if (!instrSubject) return Alert.alert('Missing', 'Select a subject');
    if (instrChapterIds.length === 0) return Alert.alert('Missing', 'Select at least one chapter');
    setLoading(true);
    try {
      await api.post('/api/exams/generate-from-instructions/', {
        subject: instrSubject.id, chapter_ids: instrChapterIds,
        topics: instrTopics, total_marks: parseInt(instrMarks),
        num_mcq: parseInt(instrMcq), num_short: parseInt(instrShort), num_long: parseInt(instrLong),
      });
      setSuccess('Question generation started! AI is creating questions in the background. This usually takes 1–2 minutes.');
      setInstrSubject(null); setInstrChapterIds([]); setInstrTopics('');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to generate');
    } finally { setLoading(false); }
  };

  if (initLoading) return <LoadingScreen />;

  if (success) return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        title="Generate Questions"
      />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={s.successCard}>
          <Text style={{ fontSize: 56, marginBottom: 16 }}>🎉</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#065f46', marginBottom: 8 }}>Generation Started!</Text>
          <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>{success}</Text>
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#4f46e5', marginBottom: 10 }]} onPress={() => navigation.navigate('CreateExam')}>
            <Text style={s.submitBtnText}>Create Exam Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#0891b2', marginBottom: 10 }]} onPress={() => navigation.navigate('PapersList')}>
            <Text style={s.submitBtnText}>View Papers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#64748b' }]} onPress={() => { setSuccess(''); setMethod(null); }}>
            <Text style={s.submitBtnText}>Generate Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="Generate Questions"
        subtitle="AI-powered question generation from papers or instructions"
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Method selection */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          {METHODS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[s.methodCard, method === m.key && { borderColor: m.color, borderWidth: 2 }]}
              onPress={() => setMethod(m.key)}
            >
              <View style={[s.methodDot, { backgroundColor: m.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.methodLabel}>{m.label}</Text>
                <Text style={s.methodSub}>{m.sub}</Text>
              </View>
              {method === m.key && <Text style={{ color: m.color, fontSize: 18 }}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* From Papers form */}
        {method === 'papers' && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>From Old Papers</Text>

            <Text style={s.label}>Subject *</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowSubjectPicker(true)}>
              <Text style={paperSubject ? s.selectorVal : s.selectorPh}>{paperSubject?.name || 'Select subject…'}</Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            <Text style={s.label}>PDF Papers (up to 5) *</Text>
            {paperFiles.map((f, i) => (
              <View key={i} style={s.filePill}>
                <Text style={{ fontSize: 18, marginRight: 8 }}>📄</Text>
                <Text style={s.fileName} numberOfLines={1}>{f.name}</Text>
                <TouchableOpacity onPress={() => setPaperFiles(prev => prev.filter((_, idx) => idx !== i))}>
                  <Text style={{ color: '#dc2626', fontWeight: '700' }}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {paperFiles.length < 5 && (
              <TouchableOpacity style={s.filePicker} onPress={pickFile}>
                <Text style={{ fontSize: 28, marginBottom: 4 }}>📂</Text>
                <Text style={{ color: '#4f46e5', fontWeight: '700' }}>Tap to add PDF</Text>
              </TouchableOpacity>
            )}

            <Text style={s.label}>Instructions for AI *</Text>
            <TextInput
              style={[s.input, { minHeight: 80 }]}
              multiline
              placeholder="e.g., Focus on chapters 3 and 4. Mix easy and hard questions."
              placeholderTextColor="#94a3b8"
              value={paperInstructions}
              onChangeText={setPaperInstructions}
            />

            <Text style={s.label}>Question Distribution</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[['MCQs', paperMcq, setPaperMcq], ['Short', paperShort, setPaperShort], ['Long', paperLong, setPaperLong]].map(([label, val, setter]) => (
                <View key={label} style={{ flex: 1 }}>
                  <Text style={[s.label, { marginTop: 0 }]}>{label}</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={val} onChangeText={setter} />
                </View>
              ))}
            </View>
            <Text style={s.label}>Total Marks</Text>
            <TextInput style={s.input} keyboardType="numeric" value={paperMarks} onChangeText={setPaperMarks} />

            {uploadProgress !== '' && (
              <View style={s.progressRow}>
                <ActivityIndicator color="#4f46e5" size="small" />
                <Text style={{ color: '#4f46e5', fontSize: 13, fontWeight: '600' }}>{uploadProgress}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.submitBtn, loading && { opacity: 0.6 }]}
              onPress={handlePapersSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>🚀 Upload & Generate</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* From Instructions form */}
        {method === 'instructions' && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>From Instructions</Text>

            <Text style={s.label}>Subject *</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowInstrSubjectPicker(true)}>
              <Text style={instrSubject ? s.selectorVal : s.selectorPh}>{instrSubject?.name || 'Select subject…'}</Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            <Text style={s.label}>Chapters * ({instrChapterIds.length} selected)</Text>
            {!instrSubject ? (
              <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Select a subject first</Text>
            ) : chapters.length === 0 ? (
              <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>No chapters found</Text>
            ) : (
              <View style={{ gap: 6, marginBottom: 8 }}>
                {chapters.map(ch => (
                  <TouchableOpacity
                    key={ch.id}
                    style={[s.chapterChip, instrChapterIds.includes(ch.id) && s.chapterChipActive]}
                    onPress={() => toggleChapter(ch.id)}
                  >
                    <Text style={[s.chapterChipText, instrChapterIds.includes(ch.id) && s.chapterChipTextActive]}>{ch.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={s.label}>Topics / Focus Areas</Text>
            <TextInput
              style={[s.input, { minHeight: 70 }]}
              multiline
              placeholder="e.g., Focus on quadratic equations, application problems"
              placeholderTextColor="#94a3b8"
              value={instrTopics}
              onChangeText={setInstrTopics}
            />

            <Text style={s.label}>Question Distribution</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[['MCQs', instrMcq, setInstrMcq], ['Short', instrShort, setInstrShort], ['Long', instrLong, setInstrLong]].map(([label, val, setter]) => (
                <View key={label} style={{ flex: 1 }}>
                  <Text style={[s.label, { marginTop: 0 }]}>{label}</Text>
                  <TextInput style={s.input} keyboardType="numeric" value={val} onChangeText={setter} />
                </View>
              ))}
            </View>
            <Text style={s.label}>Total Marks</Text>
            <TextInput style={s.input} keyboardType="numeric" value={instrMarks} onChangeText={setInstrMarks} />

            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: '#8b5cf6' }, loading && { opacity: 0.6 }]}
              onPress={handleInstrSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>✨ Generate with AI</Text>}
            </TouchableOpacity>
          </View>
        )}

        {!method && (
          <View style={s.emptyHint}>
            <Text style={{ fontSize: 42, marginBottom: 12 }}>🤖</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e293b' }}>Choose a method above</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Select how you want to generate questions</Text>
          </View>
        )}
      </ScrollView>

      <PickerModal visible={showSubjectPicker} title="Select Subject" items={subjects.map(s => ({ ...s, label: s.name }))} onSelect={setPaperSubject} onClose={() => setShowSubjectPicker(false)} />
      <PickerModal visible={showInstrSubjectPicker} title="Select Subject" items={subjects.map(s => ({ ...s, label: s.name }))} onSelect={setInstrSubject} onClose={() => setShowInstrSubjectPicker(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  methodCard:  { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#e2e8f0', elevation: 1 },
  methodDot:   { width: 12, height: 12, borderRadius: 6 },
  methodLabel: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  methodSub:   { fontSize: 12, color: '#64748b', marginTop: 2 },
  formCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  formTitle:   { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  label:       { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, marginTop: 12 },
  input:       { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  selector:    { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectorVal: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  selectorPh:  { fontSize: 14, color: '#94a3b8' },
  filePicker:  { borderWidth: 2, borderColor: '#e0e7ff', borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginVertical: 6 },
  filePill:    { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  fileName:    { fontSize: 13, fontWeight: '600', color: '#065f46', flex: 1 },
  chapterChip: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f8fafc' },
  chapterChipActive: { backgroundColor: '#eef2ff', borderColor: '#4f46e5' },
  chapterChipText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  chapterChipTextActive: { color: '#4f46e5' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 12, marginTop: 10 },
  submitBtn:   { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  submitBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  emptyHint:   { alignItems: 'center', paddingVertical: 48 },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
});
