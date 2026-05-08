import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import api from '../../api/axios';
import PickerModal from '../../components/PickerModal';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const TYPE_CFG = {
  note:    { label: 'Note',    icon: '📝', bg: '#eef2ff', color: '#4f46e5' },
  video:   { label: 'Video',   icon: '🎬', bg: '#fef3c7', color: '#d97706' },
  pdf:     { label: 'PDF',     icon: '📄', bg: '#fee2e2', color: '#dc2626' },
  link:    { label: 'Link',    icon: '🔗', bg: '#d1fae5', color: '#059669' },
  image:   { label: 'Image',   icon: '🖼',  bg: '#fce7f3', color: '#db2777' },
};

function getType(m) {
  return TYPE_CFG[m.material_type] || TYPE_CFG.note;
}

export default function StudyMaterialsScreen({ navigation }) {
  const [subjects, setSubjects]       = useState([]);
  const [chapters, setChapters]       = useState([]);
  const [materials, setMaterials]     = useState([]);
  const [selSubject, setSelSubject]   = useState(null);
  const [selChapter, setSelChapter]   = useState(null);
  const [subjectModal, setSubjectModal] = useState(false);
  const [chapterModal, setChapterModal] = useState(false);
  const [loadingS, setLoadingS]       = useState(true);
  const [loadingM, setLoadingM]       = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [expanded, setExpanded]       = useState(new Set());

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/api/subjects/');
        const list = res.data?.results || res.data || [];
        setSubjects(list);
        if (list.length > 0) setSelSubject(list[0]);
      } catch { }
      finally { setLoadingS(false); }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!selSubject) return;
    setSelChapter(null);
    setChapters([]);
    const fetch = async () => {
      try {
        const res = await api.get(`/api/chapters/?subject=${selSubject.id}`);
        const list = res.data?.results || res.data || [];
        setChapters(list);
        if (list.length > 0) setSelChapter(list[0]);
      } catch { }
    };
    fetch();
  }, [selSubject]);

  const loadMaterials = useCallback(async () => {
    if (!selChapter) return;
    setLoadingM(true);
    try {
      const res = await api.get(`/api/study-materials/?chapter=${selChapter.id}`);
      setMaterials(res.data?.results || res.data || []);
    } catch { setMaterials([]); }
    finally { setLoadingM(false); setRefreshing(false); }
  }, [selChapter]);

  useEffect(() => { loadMaterials(); }, [loadMaterials]);

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const openLink = async (url) => {
    if (!url) return;
    try { await Linking.openURL(url); } catch { }
  };

  if (loadingS) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerLabel}>STUDENT PORTAL</Text>
        <Text style={s.headerTitle}>Study Materials</Text>
        <Text style={s.headerSub}>Notes, PDFs, and links from your teachers</Text>
      </View>

      {/* Subject + Chapter pickers */}
      <View style={s.filterRow}>
        <TouchableOpacity style={[s.picker, { flex: 1 }]} onPress={() => setSubjectModal(true)}>
          <Text style={s.pickerText} numberOfLines={1}>{selSubject?.name || 'Subject'}</Text>
          <Text style={{ color: '#94a3b8' }}>▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.picker, { flex: 1 }]} onPress={() => chapters.length > 0 && setChapterModal(true)}>
          <Text style={s.pickerText} numberOfLines={1}>{selChapter?.name || 'Chapter'}</Text>
          <Text style={{ color: '#94a3b8' }}>▾</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadMaterials(); }} tintColor="#4f46e5" />}
      >
        {loadingM ? (
          <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color="#4f46e5" />
          </View>
        ) : materials.length === 0 ? (
          <EmptyState
            icon="📚"
            title="No materials yet"
            message={selChapter ? `No study materials for ${selChapter.name}.` : 'Select a chapter to view materials.'}
            style={{ marginTop: 10 }}
          />
        ) : (
          materials.map(m => {
            const tc = getType(m);
            const isExp = expanded.has(m.id);
            return (
              <View key={m.id} style={s.card}>
                {/* Header row */}
                <TouchableOpacity onPress={() => toggleExpand(m.id)} activeOpacity={0.8}>
                  <View style={s.cardHeader}>
                    <View style={[s.typeIcon, { backgroundColor: tc.bg }]}>
                      <Text style={{ fontSize: 20 }}>{tc.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.cardTitle}>{m.title}</Text>
                      {m.order != null && <Text style={s.cardMeta}>#{m.order}</Text>}
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[s.typeBadgeText, { color: tc.color }]}>{tc.label}</Text>
                    </View>
                    <Text style={{ color: '#94a3b8', marginLeft: 8 }}>{isExp ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {isExp && (
                  <View style={{ marginTop: 12 }}>
                    {m.content ? (
                      <Text style={s.content}>{m.content}</Text>
                    ) : null}

                    {(m.file_url || m.file) && (
                      <TouchableOpacity
                        style={s.fileBtn}
                        onPress={() => openLink(m.file_url || m.file)}
                      >
                        <Text style={s.fileBtnText}>📎 Open {tc.label}</Text>
                      </TouchableOpacity>
                    )}

                    {m.link && (
                      <TouchableOpacity
                        style={[s.fileBtn, { backgroundColor: '#d1fae5' }]}
                        onPress={() => openLink(m.link)}
                      >
                        <Text style={[s.fileBtnText, { color: '#065f46' }]}>🔗 Open Link</Text>
                      </TouchableOpacity>
                    )}

                    {!m.content && !m.file_url && !m.file && !m.link && (
                      <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>No content available.</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <PickerModal
        visible={subjectModal}
        title="Select Subject"
        items={subjects}
        onSelect={setSelSubject}
        onClose={() => setSubjectModal(false)}
        labelKey="name"
      />
      <PickerModal
        visible={chapterModal}
        title="Select Chapter"
        items={chapters}
        onSelect={setSelChapter}
        onClose={() => setChapterModal(false)}
        labelKey="name"
      />
    </View>
  );
}

const s = StyleSheet.create({
  header:       { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:      { color: '#a5b4fc', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  headerLabel:  { color: '#818cf8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '800' },
  headerSub:    { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  filterRow:    { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  picker:       { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText:   { fontSize: 13, color: '#334155', flex: 1 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardMeta:     { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  typeBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:{ fontSize: 10, fontWeight: '800' },
  content:      { fontSize: 14, color: '#334155', lineHeight: 22, marginBottom: 10 },
  fileBtn:      { backgroundColor: '#eef2ff', borderRadius: 10, paddingVertical: 11, alignItems: 'center', marginBottom: 8 },
  fileBtnText:  { color: '#4f46e5', fontWeight: '700', fontSize: 13 },
});
