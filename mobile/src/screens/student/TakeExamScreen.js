import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, BackHandler, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';

const TYPE_LABEL = { MCQ: 'MCQ', SHORT: 'Short Answer', LONG: 'Long Answer', TRUE_FALSE: 'True / False' };

export default function TakeExamScreen({ route, navigation }) {
  const { examId, examTitle } = route.params;
  const [examData, setExamData]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});   // { [qId]: 'A' | 'text' }
  const [current, setCurrent]     = useState(0);
  const [timeLeft, setTimeLeft]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const userExamId = useRef(null);
  const timerRef   = useRef(null);

  useEffect(() => {
    const startExam = async () => {
      try {
        const res = await api.get(`/api/assigned-exams/${examId}/start/`);
        const data = res.data;
        userExamId.current = data.exam_id;
        setExamData(data);
        setQuestions(data.questions || []);
        setAnswers(data.saved_answers || {});
        setTimeLeft((data.duration_minutes || 30) * 60);
      } catch (e) {
        Alert.alert('Error', e.response?.data?.error || 'Could not load exam.');
        navigation.goBack();
      } finally { setLoading(false); }
    };
    startExam();
  }, [examId]);

  const doSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payload = {
        exam_id: userExamId.current,
        answers: questions.map(q => {
          const ans = answers[q.id];
          const isMCQ = q.question_type === 'MCQ' || q.question_type === 'TRUE_FALSE';
          return {
            question_id: q.id,
            selected_option: isMCQ ? (ans ?? null) : null,
            text_answer: !isMCQ ? (ans ?? '') : null,
          };
        }),
      };
      await api.post('/api/submit-exam/', payload);
      Alert.alert(
        'Submitted!',
        'Your exam has been submitted. Results will be available after grading.',
        [{ text: 'OK', onPress: () => navigation.navigate('StudentTabs') }]
      );
    } catch {
      Alert.alert('Error', 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  }, [submitting, questions, answers]);

  const confirmSubmit = useCallback(() => {
    const unanswered = questions.filter(q => {
      const a = answers[q.id];
      return a === undefined || a === null || a === '';
    }).length;
    if (unanswered > 0) {
      Alert.alert(
        'Submit Exam',
        `You have ${unanswered} unanswered question(s). Submit anyway?`,
        [{ text: 'Cancel', style: 'cancel' }, { text: 'Submit', style: 'destructive', onPress: doSubmit }]
      );
    } else {
      doSubmit();
    }
  }, [questions, answers, doSubmit]);

  useEffect(() => {
    if (timeLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft !== null]);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Exit Exam?', 'Your progress will be saved. You can continue later.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Exit', onPress: () => { clearInterval(timerRef.current); navigation.goBack(); } },
      ]);
      return true;
    });
    return () => back.remove();
  }, []);

  if (loading) return <LoadingScreen />;

  const q = questions[current];
  const mins = String(Math.floor((timeLeft || 0) / 60)).padStart(2, '0');
  const secs = String((timeLeft || 0) % 60).padStart(2, '0');
  const timerRed = timeLeft < 120;
  const answered = questions.filter(q2 => {
    const a = answers[q2.id];
    return a !== undefined && a !== null && a !== '';
  }).length;

  const isMCQ = q?.question_type === 'MCQ' || q?.question_type === 'TRUE_FALSE';
  const isText = q?.question_type === 'SHORT' || q?.question_type === 'LONG';

  const setAnswer = (val) => setAnswers(prev => ({ ...prev, [q.id]: val }));

  const qMarks = q?.marks || q?.total_marks || 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={s.examTitle} numberOfLines={1}>{examData?.title || examTitle}</Text>
            <Text style={s.progress}>{answered}/{questions.length} answered</Text>
          </View>
          <View style={[s.timer, timerRed && s.timerRed]}>
            <Text style={s.timerText}>{mins}:{secs}</Text>
          </View>
        </View>

        <ScrollView style={s.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
          {/* Question card */}
          <View style={s.qCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={s.qNum}>Q{current + 1} of {questions.length}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {q?.question_type && q.question_type !== 'MCQ' && (
                  <View style={s.typeBadge}>
                    <Text style={s.typeBadgeText}>{TYPE_LABEL[q.question_type] || q.question_type}</Text>
                  </View>
                )}
                {qMarks > 0 && (
                  <View style={s.marksBadge}>
                    <Text style={s.marksBadgeText}>{qMarks}m</Text>
                  </View>
                )}
              </View>
            </View>
            <Text style={s.qText}>{q?.question_text}</Text>
          </View>

          {/* MCQ options */}
          {isMCQ && ['a', 'b', 'c', 'd'].map(opt => {
            const text = q?.[`option_${opt}`];
            if (!text) return null;
            const optUpper = opt.toUpperCase();
            const selected = answers[q.id] === optUpper;
            return (
              <TouchableOpacity
                key={opt}
                style={[s.option, selected && s.optionSelected]}
                onPress={() => setAnswer(optUpper)}
              >
                <View style={[s.optBubble, selected && s.optBubbleSelected]}>
                  <Text style={[s.optLetter, selected && s.optLetterSelected]}>{optUpper}</Text>
                </View>
                <Text style={[s.optText, selected && s.optTextSelected]}>{text}</Text>
              </TouchableOpacity>
            );
          })}

          {/* True/False */}
          {q?.question_type === 'TRUE_FALSE' && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['True', 'False'].map(val => {
                const selected = answers[q.id] === val;
                return (
                  <TouchableOpacity
                    key={val}
                    style={[s.tfBtn, selected && s.tfBtnSelected]}
                    onPress={() => setAnswer(val)}
                  >
                    <Text style={[s.tfText, selected && s.tfTextSelected]}>{val}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Short / Long text answer */}
          {isText && (
            <View style={s.textAnswerBox}>
              <Text style={s.textAnswerLabel}>
                {q.question_type === 'SHORT' ? 'Your Answer (2–5 sentences)' : 'Your Answer (detailed)'}
              </Text>
              <TextInput
                style={[s.textInput, q.question_type === 'LONG' && s.textInputLong]}
                multiline
                placeholder="Write your answer here…"
                placeholderTextColor="#94a3b8"
                value={answers[q.id] || ''}
                onChangeText={setAnswer}
                textAlignVertical="top"
              />
              {answers[q.id] ? (
                <Text style={s.wordCount}>{answers[q.id].trim().split(/\s+/).length} words</Text>
              ) : null}
            </View>
          )}
        </ScrollView>

        {/* Bottom nav */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.navBtn, current === 0 && s.navBtnDis]}
            onPress={() => setCurrent(c => c - 1)}
            disabled={current === 0}
          >
            <Text style={[s.navBtnText, current === 0 && s.navBtnTextDis]}>← Prev</Text>
          </TouchableOpacity>

          {current < questions.length - 1 ? (
            <TouchableOpacity style={s.nextBtn} onPress={() => setCurrent(c => c + 1)}>
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.submitBtn} onPress={confirmSubmit} disabled={submitting}>
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.submitBtnText}>Submit Exam</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Question dots */}
        <ScrollView
          horizontal style={s.dotsBar}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          {questions.map((q2, i) => {
            const ans = answers[q2.id];
            const hasAnswer = ans !== undefined && ans !== null && ans !== '';
            return (
              <TouchableOpacity
                key={i}
                style={[s.dot, i === current && s.dotCurrent, hasAnswer && i !== current && s.dotAnswered]}
                onPress={() => setCurrent(i)}
              >
                <Text style={[s.dotText, (i === current || hasAnswer) && s.dotTextActive]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f8fafc' },
  topBar:            { backgroundColor: '#1e1b4b', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, flexDirection: 'row', alignItems: 'center' },
  examTitle:         { color: '#fff', fontSize: 15, fontWeight: '700' },
  progress:          { color: '#a5b4fc', fontSize: 12, marginTop: 2 },
  timer:             { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  timerRed:          { backgroundColor: '#dc2626' },
  timerText:         { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  scroll:            { flex: 1 },
  qCard:             { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  qNum:              { fontSize: 11, color: '#6d28d9', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  qText:             { fontSize: 16, color: '#1e293b', fontWeight: '500', lineHeight: 24 },
  typeBadge:         { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeBadgeText:     { fontSize: 10, fontWeight: '700', color: '#92400e' },
  marksBadge:        { backgroundColor: '#eef2ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  marksBadgeText:    { fontSize: 10, fontWeight: '700', color: '#4f46e5' },
  option:            { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: '#e2e8f0' },
  optionSelected:    { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  optBubble:         { width: 34, height: 34, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  optBubbleSelected: { backgroundColor: '#4f46e5' },
  optLetter:         { fontSize: 14, fontWeight: '800', color: '#64748b' },
  optLetterSelected: { color: '#fff' },
  optText:           { flex: 1, fontSize: 14, color: '#334155', lineHeight: 20 },
  optTextSelected:   { color: '#1e293b', fontWeight: '600' },
  tfBtn:             { flex: 1, borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  tfBtnSelected:     { borderColor: '#4f46e5', backgroundColor: '#eef2ff' },
  tfText:            { fontSize: 16, fontWeight: '800', color: '#64748b' },
  tfTextSelected:    { color: '#4f46e5' },
  textAnswerBox:     { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  textAnswerLabel:   { fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 10 },
  textInput:         { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, color: '#1e293b', minHeight: 100, lineHeight: 22 },
  textInputLong:     { minHeight: 180 },
  wordCount:         { fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'right' },
  bottomBar:         { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  navBtn:            { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#f1f5f9' },
  navBtnDis:         { opacity: 0.4 },
  navBtnText:        { fontSize: 15, fontWeight: '700', color: '#475569' },
  navBtnTextDis:     { color: '#94a3b8' },
  nextBtn:           { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#4f46e5' },
  nextBtnText:       { fontSize: 15, fontWeight: '700', color: '#fff' },
  submitBtn:         { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#059669' },
  submitBtnText:     { fontSize: 15, fontWeight: '700', color: '#fff' },
  dotsBar:           { maxHeight: 52, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  dot:               { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  dotCurrent:        { backgroundColor: '#4f46e5' },
  dotAnswered:       { backgroundColor: '#d1fae5' },
  dotText:           { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  dotTextActive:     { color: '#fff' },
});
