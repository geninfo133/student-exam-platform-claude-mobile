import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';

const TYPE_CFG = {
  MCQ:   { label: 'MCQ',         bg: '#dbeafe', color: '#1e40af' },
  SHORT: { label: 'Short',       bg: '#d1fae5', color: '#065f46' },
  LONG:  { label: 'Long',        bg: '#ede9fe', color: '#5b21b6' },
  TRUE_FALSE: { label: 'T/F',    bg: '#fef3c7', color: '#92400e' },
};

function TypeBadge({ type }) {
  const cfg = TYPE_CFG[type] || { label: type, bg: '#f1f5f9', color: '#64748b' };
  return (
    <View style={[st.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[st.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function OptionRow({ label, text, isCorrect }) {
  return (
    <View style={[st.optionRow, isCorrect && st.optionCorrect]}>
      <View style={[st.optionDot, isCorrect && { backgroundColor: '#059669' }]}>
        <Text style={{ fontSize: 10, fontWeight: '800', color: isCorrect ? '#fff' : '#94a3b8' }}>{label}</Text>
      </View>
      <Text style={[st.optionText, isCorrect && { color: '#065f46', fontWeight: '600' }]}>{text}</Text>
      {isCorrect && <Text style={{ color: '#059669', marginLeft: 'auto' }}>✓</Text>}
    </View>
  );
}

export default function ExamPaperViewScreen({ route, navigation }) {
  const { user } = useAuth();
  const { examId, examTitle } = route.params || {};

  const [exam, setExam]           = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQ, setExpandedQ] = useState(new Set());

  const load = useCallback(async () => {
    try {
      const [examRes, qRes] = await Promise.all([
        api.get(`/api/exams/assigned/${examId}/`).catch(() => null),
        api.get(`/api/exams/${examId}/questions/`).catch(() => null),
      ]);
      if (examRes?.data) setExam(examRes.data);
      const qs = qRes?.data?.results || qRes?.data || [];
      setQuestions(qs);
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (id) => {
    setExpandedQ(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mcqs   = questions.filter(q => q.question_type === 'MCQ');
  const shorts  = questions.filter(q => q.question_type === 'SHORT');
  const longs   = questions.filter(q => q.question_type === 'LONG');
  const others  = questions.filter(q => !['MCQ','SHORT','LONG'].includes(q.question_type));

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);

  if (loading) return <LoadingScreen />;

  const renderQuestion = (q, index) => {
    const isExpanded = expandedQ.has(q.id);
    const options = [
      q.option_a && { label: 'A', text: q.option_a },
      q.option_b && { label: 'B', text: q.option_b },
      q.option_c && { label: 'C', text: q.option_c },
      q.option_d && { label: 'D', text: q.option_d },
    ].filter(Boolean);

    return (
      <View key={q.id} style={st.questionCard}>
        <TouchableOpacity onPress={() => toggleExpand(q.id)} activeOpacity={0.8}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <View style={st.qNum}>
              <Text style={st.qNumText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.questionText} numberOfLines={isExpanded ? undefined : 2}>
                {q.question_text}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <TypeBadge type={q.question_type} />
              <Text style={st.marks}>{q.marks || 0}m</Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={{ marginTop: 12 }}>
            {/* MCQ options */}
            {q.question_type === 'MCQ' && options.length > 0 && (
              <View style={{ gap: 6 }}>
                {options.map(o => (
                  <OptionRow
                    key={o.label}
                    label={o.label}
                    text={o.text}
                    isCorrect={q.correct_answer === o.label}
                  />
                ))}
              </View>
            )}

            {/* Model answer for short/long */}
            {(q.question_type === 'SHORT' || q.question_type === 'LONG') && q.model_answer && (
              <View style={st.modelAnswerBox}>
                <Text style={st.modelAnswerLabel}>Model Answer</Text>
                <Text style={st.modelAnswerText}>{q.model_answer}</Text>
              </View>
            )}

            {/* Keywords */}
            {q.keywords && (
              <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(typeof q.keywords === 'string' ? q.keywords.split(',') : q.keywords).map((kw, i) => (
                  <View key={i} style={st.kwChip}>
                    <Text style={st.kwText}>{kw.trim()}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Difficulty */}
            {q.difficulty && (
              <Text style={st.difficultyText}>Difficulty: {q.difficulty}</Text>
            )}
          </View>
        )}

        <TouchableOpacity onPress={() => toggleExpand(q.id)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
          <Text style={{ color: '#4f46e5', fontSize: 12, fontWeight: '700' }}>{isExpanded ? '▲ Collapse' : '▼ Expand'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSection = (title, qs, color) => {
    if (qs.length === 0) return null;
    const sectionMarks = qs.reduce((s, q) => s + (q.marks || 0), 0);
    return (
      <View style={{ marginBottom: 4 }}>
        <View style={[st.sectionHeader, { borderLeftColor: color }]}>
          <Text style={[st.sectionTitle, { color }]}>{title}</Text>
          <Text style={st.sectionMeta}>{qs.length} Q · {sectionMarks} marks</Text>
        </View>
        {qs.map((q, i) => renderQuestion(q, questions.indexOf(q)))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        label={user?.role === 'school' ? 'SCHOOL ADMIN' : 'TEACHER PORTAL'}
        title={examTitle || exam?.title || 'Exam Paper'}
        subtitle={exam?.subject_name}
        bgColor="#1e1b4b"
      >
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          {[
            { label: 'Questions', value: questions.length },
            { label: 'Marks',     value: totalMarks },
            { label: 'MCQs',      value: mcqs.length },
            { label: 'Subjective',value: shorts.length + longs.length },
          ].map(({ label, value }) => (
            <View key={label} style={st.pill}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
      >
        {questions.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No Questions"
            message="No questions found for this exam paper."
          />
        ) : (
          <>
            <Text style={st.tapHint}>Tap any question to expand/collapse</Text>
            {renderSection('Multiple Choice', mcqs, '#1e40af')}
            {renderSection('Short Answer', shorts, '#065f46')}
            {renderSection('Long Answer', longs, '#5b21b6')}
            {others.length > 0 && renderSection('Other', others, '#64748b')}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  pill:           { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center', flex: 1 },

  tapHint:        { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginBottom: 12 },

  sectionHeader:  { borderLeftWidth: 3, paddingLeft: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle:   { fontSize: 14, fontWeight: '800' },
  sectionMeta:    { fontSize: 11, color: '#94a3b8' },

  questionCard:   { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  qNum:           { width: 26, height: 26, borderRadius: 8, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  qNumText:       { fontSize: 11, fontWeight: '800', color: '#4f46e5' },
  questionText:   { fontSize: 14, color: '#1e293b', lineHeight: 20 },
  marks:          { fontSize: 11, color: '#64748b', fontWeight: '700' },

  badge:          { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText:      { fontSize: 10, fontWeight: '800' },

  optionRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f8fafc' },
  optionCorrect:  { backgroundColor: '#f0fdf4' },
  optionDot:      { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  optionText:     { fontSize: 13, color: '#475569', flex: 1 },

  modelAnswerBox: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginTop: 8 },
  modelAnswerLabel:{ fontSize: 11, fontWeight: '800', color: '#065f46', marginBottom: 4 },
  modelAnswerText: { fontSize: 13, color: '#166534', lineHeight: 18 },

  kwChip:         { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  kwText:         { fontSize: 11, color: '#64748b' },

  difficultyText: { fontSize: 11, color: '#94a3b8', marginTop: 6 },

});
