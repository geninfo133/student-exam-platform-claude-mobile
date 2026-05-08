import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const ACCENT_COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function ManageSubjectsScreen({ navigation }) {
  const [subjects, setSubjects]         = useState([]);
  const [chapters, setChapters]         = useState({});
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectForm, setSubjectForm]   = useState({ name: '', code: '', grade: '' });
  const [submittingSubject, setSubmittingSubject] = useState(false);

  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [editSubjectForm, setEditSubjectForm] = useState({ name: '', code: '' });
  const [savingSubject, setSavingSubject] = useState(false);

  const [expandedSubject, setExpandedSubject] = useState(null);
  const [chapterForSubject, setChapterForSubject] = useState(null);
  const [chapterForm, setChapterForm]   = useState({ name: '', code: '' });
  const [submittingChapter, setSubmittingChapter] = useState(false);

  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editChapterForm, setEditChapterForm] = useState({ name: '', code: '' });
  const [savingChapter, setSavingChapter] = useState(false);

  const [deleting, setDeleting]         = useState(null);
  const [toast, setToast]               = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/api/subjects/');
      setSubjects(res.data?.results || res.data || []);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchChapters = async (subjectId) => {
    try {
      const res = await api.get(`/api/chapters/?subject=${subjectId}`);
      setChapters(prev => ({ ...prev, [subjectId]: res.data?.results || res.data || [] }));
    } catch { }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const toggleExpand = (subjectId) => {
    if (expandedSubject === subjectId) { setExpandedSubject(null); return; }
    setExpandedSubject(subjectId);
    if (!chapters[subjectId]) fetchChapters(subjectId);
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name.trim()) return Alert.alert('Missing', 'Enter subject name');
    if (!subjectForm.code.trim()) return Alert.alert('Missing', 'Enter subject code');
    setSubmittingSubject(true);
    try {
      await api.post('/api/subjects/create/', subjectForm);
      showToast('Subject created!');
      setSubjectForm({ name: '', code: '', grade: '' });
      setShowAddSubject(false);
      fetchSubjects();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create subject');
    } finally { setSubmittingSubject(false); }
  };

  const handleDeleteSubject = (id) => {
    Alert.alert(
      'Delete Subject',
      'This will delete the subject and all its chapters and questions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            setDeleting(`subject-${id}`);
            try {
              await api.delete(`/api/subjects/${id}/`);
              showToast('Subject deleted.');
              fetchSubjects();
            } catch { Alert.alert('Error', 'Failed to delete subject'); }
            finally { setDeleting(null); }
          },
        },
      ]
    );
  };

  const handleSaveSubject = async (id) => {
    setSavingSubject(true);
    try {
      await api.patch(`/api/subjects/${id}/update/`, editSubjectForm);
      showToast('Subject updated!');
      setEditingSubjectId(null);
      fetchSubjects();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update subject');
    } finally { setSavingSubject(false); }
  };

  const handleCreateChapter = async (subjectId) => {
    if (!chapterForm.name.trim()) return Alert.alert('Missing', 'Enter chapter name');
    if (!chapterForm.code.trim()) return Alert.alert('Missing', 'Enter chapter code');
    setSubmittingChapter(true);
    try {
      await api.post('/api/chapters/create/', { ...chapterForm, subject: subjectId });
      showToast('Chapter created!');
      setChapterForm({ name: '', code: '' });
      setChapterForSubject(null);
      fetchChapters(subjectId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create chapter');
    } finally { setSubmittingChapter(false); }
  };

  const handleDeleteChapter = (subjectId, chapterId) => {
    Alert.alert('Delete Chapter', 'Delete this chapter?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(`chapter-${chapterId}`);
          try {
            await api.delete(`/api/chapters/${chapterId}/`);
            showToast('Chapter deleted.');
            fetchChapters(subjectId);
          } catch { Alert.alert('Error', 'Failed to delete chapter'); }
          finally { setDeleting(null); }
        },
      },
    ]);
  };

  const handleSaveChapter = async (subjectId, chapterId) => {
    setSavingChapter(true);
    try {
      await api.patch(`/api/chapters/${chapterId}/update/`, editChapterForm);
      showToast('Chapter updated!');
      setEditingChapterId(null);
      fetchChapters(subjectId);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update chapter');
    } finally { setSavingChapter(false); }
  };

  if (loading) return <LoadingScreen color="#4f46e5" />;

  const totalChapters = subjects.reduce((acc, sub) => acc + (sub.chapter_count || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title="Subjects & Chapters"
        subtitle="Manage subjects and chapters for your curriculum"
      >
        <View style={s.pillsRow}>
          {[
            { label: 'Subjects', value: subjects.length },
            { label: 'Chapters', value: totalChapters },
          ].map(({ label, value }) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillValue}>{value}</Text>
              <Text style={s.pillLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      {toast !== '' && (
        <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubjects(); }} tintColor="#4f46e5" />}
      >
        {/* Add Subject Button */}
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddSubject(!showAddSubject)}>
          <Text style={s.addBtnText}>{showAddSubject ? '✕ Cancel' : '+ Add Subject'}</Text>
        </TouchableOpacity>

        {/* Add Subject Form */}
        {showAddSubject && (
          <View style={s.formCard}>
            <Text style={s.formTitle}>New Subject</Text>
            <Text style={s.label}>Subject Name *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#94a3b8"
              value={subjectForm.name}
              onChangeText={v => setSubjectForm({ ...subjectForm, name: v })}
            />
            <Text style={s.label}>Code *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. MATH10"
              placeholderTextColor="#94a3b8"
              value={subjectForm.code}
              onChangeText={v => setSubjectForm({ ...subjectForm, code: v.toUpperCase() })}
              autoCapitalize="characters"
            />
            <Text style={s.label}>Grade / Class</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. 10 (optional)"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={subjectForm.grade}
              onChangeText={v => setSubjectForm({ ...subjectForm, grade: v })}
            />
            <TouchableOpacity
              style={[s.submitBtn, submittingSubject && { opacity: 0.6 }]}
              onPress={handleCreateSubject}
              disabled={submittingSubject}
            >
              {submittingSubject
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Create Subject</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Subjects List */}
        {subjects.length === 0 ? (
          <EmptyState icon="📚" title="No Subjects Yet" message="Add your first subject above." />
        ) : (
          subjects.map((subject, idx) => {
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const isExpanded = expandedSubject === subject.id;
            const isEditingSubject = editingSubjectId === subject.id;

            return (
              <View key={subject.id} style={s.subjectCard}>
                {/* Subject row */}
                <TouchableOpacity style={s.subjectRow} onPress={() => toggleExpand(subject.id)}>
                  <View style={[s.subjectIcon, { backgroundColor: accent }]}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                      {subject.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={s.subjectName}>{subject.name}</Text>
                      <View style={s.codeBadge}><Text style={s.codeText}>{subject.code}</Text></View>
                      {subject.grade ? <View style={s.gradeBadge}><Text style={s.gradeText}>Class {subject.grade}</Text></View> : null}
                    </View>
                    <Text style={s.subjectMeta}>{subject.chapter_count || 0} chapters · {subject.question_count || 0} questions</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    <TouchableOpacity
                      style={s.editBtn}
                      onPress={e => {
                        setEditingSubjectId(isEditingSubject ? null : subject.id);
                        setEditSubjectForm({ name: subject.name, code: subject.code });
                      }}
                    >
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => handleDeleteSubject(subject.id)}
                      disabled={deleting === `subject-${subject.id}`}
                    >
                      <Text style={s.deleteBtnText}>{deleting === `subject-${subject.id}` ? '…' : 'Del'}</Text>
                    </TouchableOpacity>
                    <Text style={{ color: '#94a3b8', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Inline Edit Subject */}
                {isEditingSubject && (
                  <View style={s.inlineEdit}>
                    <Text style={s.label}>Name</Text>
                    <TextInput
                      style={s.input}
                      value={editSubjectForm.name}
                      onChangeText={v => setEditSubjectForm({ ...editSubjectForm, name: v })}
                    />
                    <Text style={s.label}>Code</Text>
                    <TextInput
                      style={s.input}
                      value={editSubjectForm.code}
                      onChangeText={v => setEditSubjectForm({ ...editSubjectForm, code: v.toUpperCase() })}
                      autoCapitalize="characters"
                    />
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={[s.submitBtn, { flex: 1 }, savingSubject && { opacity: 0.6 }]}
                        onPress={() => handleSaveSubject(subject.id)}
                        disabled={savingSubject}
                      >
                        {savingSubject ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Save</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.cancelBtn, { flex: 1 }]} onPress={() => setEditingSubjectId(null)}>
                        <Text style={s.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Chapters Section */}
                {isExpanded && (
                  <View style={s.chaptersSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={s.chaptersTitle}>Chapters</Text>
                      <TouchableOpacity
                        style={[s.addChapterBtn, { backgroundColor: accent }]}
                        onPress={() => {
                          setChapterForSubject(chapterForSubject === subject.id ? null : subject.id);
                          setChapterForm({ name: '', code: '' });
                        }}
                      >
                        <Text style={s.addChapterBtnText}>
                          {chapterForSubject === subject.id ? '✕ Cancel' : '+ Add'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Add Chapter Form */}
                    {chapterForSubject === subject.id && (
                      <View style={s.chapterForm}>
                        <TextInput
                          style={s.input}
                          placeholder="Chapter name"
                          placeholderTextColor="#94a3b8"
                          value={chapterForm.name}
                          onChangeText={v => setChapterForm({ ...chapterForm, name: v })}
                        />
                        <TextInput
                          style={[s.input, { marginTop: 8 }]}
                          placeholder="Code (e.g. CH01)"
                          placeholderTextColor="#94a3b8"
                          value={chapterForm.code}
                          onChangeText={v => setChapterForm({ ...chapterForm, code: v.toUpperCase() })}
                          autoCapitalize="characters"
                        />
                        <TouchableOpacity
                          style={[s.submitBtn, submittingChapter && { opacity: 0.6 }, { marginTop: 8 }]}
                          onPress={() => handleCreateChapter(subject.id)}
                          disabled={submittingChapter}
                        >
                          {submittingChapter ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Create Chapter</Text>}
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Chapter List */}
                    {!chapters[subject.id] ? (
                      <ActivityIndicator color="#4f46e5" style={{ marginVertical: 12 }} />
                    ) : chapters[subject.id].length === 0 ? (
                      <Text style={{ fontSize: 13, color: '#94a3b8', padding: 8 }}>No chapters yet.</Text>
                    ) : (
                      chapters[subject.id].map((ch, chIdx) => (
                        <View key={ch.id} style={s.chapterRow}>
                          <View style={[s.chapterNum, { backgroundColor: accent }]}>
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{chIdx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            {editingChapterId === ch.id ? (
                              <View>
                                <TextInput
                                  style={s.input}
                                  value={editChapterForm.name}
                                  onChangeText={v => setEditChapterForm({ ...editChapterForm, name: v })}
                                />
                                <TextInput
                                  style={[s.input, { marginTop: 6 }]}
                                  value={editChapterForm.code}
                                  onChangeText={v => setEditChapterForm({ ...editChapterForm, code: v.toUpperCase() })}
                                  autoCapitalize="characters"
                                />
                                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                                  <TouchableOpacity
                                    style={[s.submitBtn, { flex: 1, paddingVertical: 8 }, savingChapter && { opacity: 0.6 }]}
                                    onPress={() => handleSaveChapter(subject.id, ch.id)}
                                    disabled={savingChapter}
                                  >
                                    {savingChapter ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.submitBtnText}>Save</Text>}
                                  </TouchableOpacity>
                                  <TouchableOpacity style={[s.cancelBtn, { flex: 1, paddingVertical: 8 }]} onPress={() => setEditingChapterId(null)}>
                                    <Text style={s.cancelBtnText}>Cancel</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ) : (
                              <>
                                <Text style={s.chapterName}>{ch.name} <Text style={s.chapterCode}>({ch.code})</Text></Text>
                                <Text style={{ fontSize: 10, color: '#94a3b8' }}>{ch.question_count || 0} questions</Text>
                              </>
                            )}
                          </View>
                          {editingChapterId !== ch.id && (
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity
                                style={s.editBtn}
                                onPress={() => { setEditingChapterId(ch.id); setEditChapterForm({ name: ch.name, code: ch.code }); }}
                              >
                                <Text style={s.editBtnText}>Edit</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={s.deleteBtn}
                                onPress={() => handleDeleteChapter(subject.id, ch.id)}
                                disabled={deleting === `chapter-${ch.id}`}
                              >
                                <Text style={s.deleteBtnText}>{deleting === `chapter-${ch.id}` ? '…' : 'Del'}</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pillsRow:        { flexDirection: 'row', gap: 10 },
  pill:            { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center', minWidth: 72 },
  pillValue:       { color: '#fff', fontSize: 18, fontWeight: '800' },
  pillLabel:       { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  toast:           { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99, backgroundColor: '#10b981', padding: 12, alignItems: 'center' },
  toastText:       { color: '#fff', fontWeight: '700', fontSize: 13 },
  addBtn:          { backgroundColor: '#4f46e5', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12 },
  addBtnText:      { color: '#fff', fontWeight: '800', fontSize: 14 },
  formCard:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  formTitle:       { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 14 },
  label:           { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 5, marginTop: 10 },
  input:           { backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1e293b' },
  submitBtn:       { backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  submitBtnText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  cancelBtn:       { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelBtnText:   { color: '#64748b', fontWeight: '700', fontSize: 13 },
  subjectCard:     { backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  subjectRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  subjectIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  subjectName:     { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  subjectMeta:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  codeBadge:       { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  codeText:        { fontSize: 10, color: '#64748b', fontWeight: '600' },
  gradeBadge:      { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gradeText:       { fontSize: 10, color: '#4f46e5', fontWeight: '600' },
  editBtn:         { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  editBtnText:     { fontSize: 11, fontWeight: '700', color: '#4f46e5' },
  deleteBtn:       { backgroundColor: '#fff1f2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText:   { fontSize: 11, fontWeight: '700', color: '#dc2626' },
  inlineEdit:      { backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 14 },
  chaptersSection: { backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0', padding: 14 },
  chaptersTitle:   { fontSize: 13, fontWeight: '700', color: '#475569' },
  addChapterBtn:   { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addChapterBtnText:{ color: '#fff', fontSize: 11, fontWeight: '700' },
  chapterForm:     { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chapterRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#f1f5f9' },
  chapterNum:      { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  chapterName:     { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  chapterCode:     { fontSize: 11, color: '#94a3b8', fontWeight: '400' },
});
