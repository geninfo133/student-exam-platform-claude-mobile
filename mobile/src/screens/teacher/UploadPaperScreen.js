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

export default function UploadPaperScreen({ navigation }) {
  const { user } = useAuth();
  const [subjects, setSubjects]     = useState([]);
  const [chapters, setChapters]     = useState([]);
  const [stats, setStats]           = useState({ total: 0, generated: 0, subjects: 0 });
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [success, setSuccess]       = useState(false);

  const [title, setTitle]           = useState('');
  const [totalMarks, setTotalMarks] = useState('');
  const [subject, setSubject]       = useState(null);
  const [chapter, setChapter]       = useState(null);
  const [file, setFile]             = useState(null);

  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/subjects/'),
      api.get('/api/exams/papers/'),
    ]).then(([subRes, papersRes]) => {
      setSubjects(subRes.data?.results || subRes.data || []);
      const papers = papersRes.data?.results || papersRes.data || [];
      const generated = papers.filter(p => p.questions_generated > 0).length;
      const uniqueSubjects = new Set(papers.map(p => p.subject)).size;
      setStats({ total: papers.length, generated, subjects: uniqueSubjects });
    }).catch(() => {}).finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (!subject) { setChapters([]); setChapter(null); return; }
    setLoadingChapters(true);
    setChapter(null);
    api.get(`/api/chapters/?subject=${subject.id}`)
      .then(res => setChapters(res.data?.results || res.data || []))
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false));
  }, [subject]);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Error', 'Could not open file picker');
    }
  };

  const handleUpload = async () => {
    if (!title.trim())   return Alert.alert('Missing', 'Enter a paper title');
    if (!subject)        return Alert.alert('Missing', 'Select a subject');
    if (!totalMarks || isNaN(Number(totalMarks))) return Alert.alert('Missing', 'Enter valid total marks');
    if (!file)           return Alert.alert('Missing', 'Select a PDF file');

    setUploading(true);
    try {
      const form = new FormData();
      form.append('title', title.trim());
      form.append('subject', String(subject.id));
      form.append('total_marks', String(totalMarks));
      if (chapter) form.append('chapter', String(chapter.id));
      form.append('file', {
        uri: file.uri,
        name: file.name || 'paper.pdf',
        type: 'application/pdf',
      });

      await api.post('/api/exams/papers/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
    } catch (err) {
      Alert.alert('Upload Failed', err.response?.data?.error || err.response?.data?.detail || 'Failed to upload paper');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setTitle(''); setTotalMarks(''); setSubject(null); setChapter(null); setFile(null); setSuccess(false);
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <ScreenHeader
          navigation={navigation}
          label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
          title="Upload Paper"
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={s.successCard}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>🎉</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#065f46', marginBottom: 8 }}>Paper Uploaded!</Text>
            <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 }}>
              Your question paper has been submitted for processing. Questions will be generated shortly.
            </Text>
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#10b981', marginBottom: 12 }]} onPress={reset}>
              <Text style={s.submitBtnText}>+ Upload Another</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#0891b2', marginBottom: 12 }]} onPress={() => navigation.navigate('PapersList')}>
              <Text style={s.submitBtnText}>📋 View All Papers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#4f46e5' }]} onPress={() => navigation.goBack()}>
              <Text style={s.submitBtnText}>← Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="Upload Question Paper"
        subtitle="Upload PDF papers to auto-generate questions"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Total Papers',  value: stats.total },
            { label: 'Generated',     value: stats.generated },
            { label: 'Subjects',      value: stats.subjects },
          ].map(({ label, value }) => (
            <View key={label} style={s.statPill}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loadingSubjects ? (
          <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 40 }} />
        ) : (
          <View style={s.card}>
            <Text style={s.cardTitle}>Paper Details</Text>

            {/* Title */}
            <Text style={s.label}>Paper Title *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Mathematics Mid-Term 2024"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
            />

            {/* Subject */}
            <Text style={s.label}>Subject *</Text>
            <TouchableOpacity style={s.selector} onPress={() => setShowSubjectPicker(true)}>
              <Text style={subject ? s.selectorValue : s.selectorPlaceholder}>
                {subject ? subject.name : 'Select subject…'}
              </Text>
              <Text style={{ color: '#94a3b8' }}>▾</Text>
            </TouchableOpacity>

            {/* Chapter (optional) */}
            <Text style={s.label}>Chapter <Text style={{ color: '#94a3b8', fontWeight: '400' }}>(optional)</Text></Text>
            <TouchableOpacity
              style={[s.selector, !subject && { opacity: 0.5 }]}
              onPress={() => subject && setShowChapterPicker(true)}
              disabled={!subject}
            >
              {loadingChapters
                ? <ActivityIndicator size="small" color="#4f46e5" />
                : <Text style={chapter ? s.selectorValue : s.selectorPlaceholder}>
                    {chapter ? chapter.name : subject ? 'All chapters' : 'Select subject first'}
                  </Text>
              }
              {!loadingChapters && <Text style={{ color: '#94a3b8' }}>▾</Text>}
            </TouchableOpacity>

            {/* Total Marks */}
            <Text style={s.label}>Total Marks *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 100"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={totalMarks}
              onChangeText={setTotalMarks}
            />

            {/* PDF File */}
            <Text style={s.label}>PDF File *</Text>
            {file ? (
              <View style={s.filePill}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>📄</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                    {file.size ? `${(file.size / 1024).toFixed(0)} KB` : 'PDF'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.filePicker} onPress={pickFile}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>📂</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#4f46e5' }}>Tap to select PDF</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Only PDF files accepted</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[s.submitBtn, uploading && { opacity: 0.6 }]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>🚀 Upload & Generate Questions</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <PickerModal
        visible={showSubjectPicker}
        title="Select Subject"
        items={subjects.map(item => ({ ...item, label: item.name }))}
        onSelect={setSubject}
        onClose={() => setShowSubjectPicker(false)}
      />
      <PickerModal
        visible={showChapterPicker}
        title="Select Chapter"
        items={[{ id: null, label: 'All Chapters (no filter)' }, ...chapters.map(item => ({ ...item, label: item.name }))]}
        onSelect={item => setChapter(item.id ? item : null)}
        onClose={() => setShowChapterPicker(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  statPill:    { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  card:        { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle:   { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 18 },
  label:       { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 14 },
  input:       { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b' },
  selector:    { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectorValue:      { fontSize: 14, color: '#1e293b', fontWeight: '600', flex: 1 },
  selectorPlaceholder:{ fontSize: 14, color: '#94a3b8', flex: 1 },
  filePicker:  { backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e0e7ff', borderStyle: 'dashed', borderRadius: 16, padding: 28, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  filePill:    { backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#bbf7d0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  fileName:    { fontSize: 13, fontWeight: '700', color: '#065f46' },
  submitBtn:   { backgroundColor: '#4f46e5', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitBtnText:{ color: '#fff', fontSize: 15, fontWeight: '800' },
  successCard: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12 },
});
