import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const STATUS = {
  generated: { label: 'Generated', bg: '#d1fae5', color: '#065f46' },
  error:     { label: 'Error',     bg: '#fee2e2', color: '#dc2626' },
  processing:{ label: 'Processing',bg: '#dbeafe', color: '#1d4ed8' },
  pending:   { label: 'Pending',   bg: '#f1f5f9', color: '#64748b' },
};

function getStatus(paper) {
  if (paper.questions_generated) return STATUS.generated;
  if (paper.generation_error && !paper.generation_error.startsWith('[')) return STATUS.error;
  if (paper.generation_error) return STATUS.processing;
  return STATUS.pending;
}

export default function PapersListScreen({ navigation }) {
  const { user } = useAuth();
  const [papers, setPapers]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [generating, setGenerating] = useState({});
  const [deleting, setDeleting]   = useState({});

  const fetchPapers = useCallback(async (pageNum = 1) => {
    try {
      const res = await api.get('/api/exams/papers/', { params: { page: pageNum } });
      const data = res.data;
      if (data.results) { setPapers(data.results); setHasMore(!!data.next); }
      else { setPapers(data); setHasMore(false); }
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPapers(page); }, [page]);

  const handleGenerate = async (paperId) => {
    setGenerating(prev => ({ ...prev, [paperId]: true }));
    try {
      await api.post(`/api/exams/papers/${paperId}/generate/`);
      const poll = setInterval(async () => {
        try {
          const res = await api.get('/api/exams/papers/', { params: { page } });
          const data = res.data.results || res.data;
          const paper = data.find(p => p.id === paperId);
          if (paper && (paper.questions_generated || (paper.generation_error && !paper.generation_error.startsWith('[')))) {
            clearInterval(poll);
            setPapers(data);
            setGenerating(prev => ({ ...prev, [paperId]: false }));
          }
        } catch { }
      }, 5000);
      setTimeout(() => { clearInterval(poll); setGenerating(prev => ({ ...prev, [paperId]: false })); fetchPapers(page); }, 180000);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.detail || err.response?.data?.error || 'Failed to generate questions');
      setGenerating(prev => ({ ...prev, [paperId]: false }));
    }
  };

  const handleDelete = (paperId) => {
    Alert.alert('Delete Paper', 'Delete this paper? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setDeleting(prev => ({ ...prev, [paperId]: true }));
          try {
            await api.delete(`/api/exams/papers/${paperId}/`);
            fetchPapers(page);
          } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete paper');
          } finally { setDeleting(prev => ({ ...prev, [paperId]: false })); }
        },
      },
    ]);
  };

  const generated = papers.filter(p => p.questions_generated).length;

  if (loading) return <LoadingScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title="Uploaded Papers"
        subtitle="Select papers to generate questions"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Total',     value: papers.length },
            { label: 'Generated', value: generated },
            { label: 'Pending',   value: papers.length - generated },
          ].map(({ label, value }) => (
            <View key={label} style={s.statPill}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPapers(page); }} tintColor="#4f46e5" />}
      >
        <TouchableOpacity
          style={s.uploadBtn}
          onPress={() => navigation.navigate('UploadPaper')}
        >
          <Text style={s.uploadBtnText}>+ Upload New Paper</Text>
        </TouchableOpacity>

        {papers.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No Papers Yet"
            message="Upload a PDF paper to get started."
            style={{ marginTop: 8 }}
          />
        ) : (
          <>
            {papers.map(paper => {
              const st = getStatus(paper);
              const isGenerating = !!generating[paper.id];
              return (
                <View key={paper.id} style={s.card}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.paperTitle} numberOfLines={2}>{paper.title}</Text>
                      <Text style={s.paperMeta}>{paper.subject_name} · {paper.total_marks} marks</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {paper.generation_error && !paper.generation_error.startsWith('[') && (
                    <Text style={s.errorText}>{paper.generation_error}</Text>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        s.generateBtn,
                        paper.questions_generated && { backgroundColor: '#f1f5f9' },
                        isGenerating && { opacity: 0.6 },
                        { flex: 1 },
                      ]}
                      onPress={() => !paper.questions_generated && handleGenerate(paper.id)}
                      disabled={paper.questions_generated || isGenerating}
                    >
                      {isGenerating
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <Text style={[s.generateBtnText, paper.questions_generated && { color: '#94a3b8' }]}>
                            {paper.questions_generated ? '✓ Generated' : '⚡ Generate Questions'}
                          </Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.deleteBtn, deleting[paper.id] && { opacity: 0.6 }]}
                      onPress={() => handleDelete(paper.id)}
                      disabled={!!deleting[paper.id]}
                    >
                      {deleting[paper.id]
                        ? <ActivityIndicator color="#dc2626" size="small" />
                        : <Text style={s.deleteBtnText}>🗑</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Pagination */}
            <View style={s.pagination}>
              <TouchableOpacity
                style={[s.pageBtn, page === 1 && { opacity: 0.4 }]}
                onPress={() => setPage(p => p - 1)}
                disabled={page === 1}
              >
                <Text style={s.pageBtnText}>← Prev</Text>
              </TouchableOpacity>
              <Text style={s.pageNum}>Page {page}</Text>
              <TouchableOpacity
                style={[s.pageBtn, !hasMore && { opacity: 0.4 }]}
                onPress={() => setPage(p => p + 1)}
                disabled={!hasMore}
              >
                <Text style={s.pageBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  uploadBtn:   { backgroundColor: '#4f46e5', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12 },
  uploadBtnText:{ color: '#fff', fontWeight: '800', fontSize: 14 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  paperTitle:  { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 3 },
  paperMeta:   { fontSize: 12, color: '#64748b' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  statusText:  { fontSize: 11, fontWeight: '700' },
  errorText:   { fontSize: 12, color: '#dc2626', marginBottom: 8 },
  generateBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  generateBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  deleteBtn:   { borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, alignItems: 'center' },
  deleteBtnText:{ fontSize: 16 },
  pagination:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 16 },
  pageBtn:     { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: '#4f46e5' },
  pageNum:     { backgroundColor: '#eef2ff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
});
