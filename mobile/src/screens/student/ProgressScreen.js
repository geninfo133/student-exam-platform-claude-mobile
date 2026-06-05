import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl,
  TouchableOpacity,
} from 'react-native';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import LoadingScreen from '../../components/LoadingScreen';
import EmptyState from '../../components/EmptyState';
import { getGrade } from '../../utils/helpers';

const CATEGORIES_BY_BOARD = {
  CBSE:  [
    { value: 'pre_mid',  label: 'Pre-Mid Term' },
    { value: 'mid',      label: 'Mid Term' },
    { value: 'post_mid', label: 'Post-Mid Term' },
    { value: 'annual',   label: 'Annual' },
    { value: 'pat1',     label: 'PAT 1' },
    { value: 'pat2',     label: 'PAT 2' },
    { value: 'pat3',     label: 'PAT 3' },
    { value: 'pat4',     label: 'PAT 4' },
  ],
  STATE: [
    { value: 'unit1',       label: 'Unit Test 1' },
    { value: 'unit2',       label: 'Unit Test 2' },
    { value: 'quarterly',   label: 'Quarterly' },
    { value: 'half_yearly', label: 'Half Yearly' },
    { value: 'pre_final',   label: 'Pre-Final' },
    { value: 'final',       label: 'Final' },
  ],
  ICSE:  [
    { value: 'pre_mid',  label: 'Pre-Mid Term' },
    { value: 'mid',      label: 'Mid Term' },
    { value: 'post_mid', label: 'Post-Mid Term' },
    { value: 'annual',   label: 'Annual' },
  ],
  INTL:  [
    { value: 'pre_mid',  label: 'Pre-Mid Term' },
    { value: 'mid',      label: 'Mid Term' },
    { value: 'post_mid', label: 'Post-Mid Term' },
    { value: 'annual',   label: 'Annual' },
  ],
};

const GRADE_LEGEND = [
  { label: 'A+ ≥90%', color: '#10b981' },
  { label: 'A ≥75%',  color: '#22c55e' },
  { label: 'B ≥60%',  color: '#3b82f6' },
  { label: 'C ≥50%',  color: '#eab308' },
  { label: 'D ≥35%',  color: '#f97316' },
  { label: 'F <35%',  color: '#ef4444' },
];

// Column widths
const COL = { num: 28, subject: 130, exam: 100, max: 48, obtained: 64, pct: 90, grade: 76 };
const TOTAL_W = Object.values(COL).reduce((a, b) => a + b, 0);

function PctBar({ pct }) {
  const g = getGrade(pct);
  return (
    <View style={{ width: COL.pct - 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: g.color, borderRadius: 99 }} />
      </View>
      <Text style={{ fontSize: 10, fontWeight: '800', color: '#374151', width: 28, textAlign: 'right' }}>{pct}%</Text>
    </View>
  );
}

export default function ProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [results,    setResults]    = useState([]);
  const [student,    setStudent]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catFilter,  setCatFilter]  = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);

  const boardCategories = CATEGORIES_BY_BOARD[user?.board] || [];

  const load = useCallback(async () => {
    try {
      const params = {};
      if (catFilter) params.exam_category = catFilter;
      const res = await api.get('/api/progress-card/', { params });
      setResults(res.data.results || []);
      setStudent(res.data.student || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  // Deduplicate — best score per subject+category+source
  const grid = {};
  for (const r of results) {
    const key = `${r.subject_id}_${r.exam_category}_${r.source}`;
    if (!grid[key] || r.percentage > grid[key].percentage) grid[key] = r;
  }

  const rows = Object.values(grid).map(r => {
    const score = Number(r.score || 0);
    const total = Number(r.total_marks || 0);
    return {
      key:       `${r.subject_id}_${r.exam_category}_${r.source}`,
      subject:   r.subject_name,
      category:  r.exam_category_display || r.exam_category || '—',
      score, total,
      pct:       total > 0 ? Math.round((score / total) * 100) : 0,
      source:    r.source,
      result_id: r.result_id,
    };
  }).sort((a, b) => a.subject.localeCompare(b.subject) || a.category.localeCompare(b.category));

  const grandScore = rows.reduce((s, r) => s + r.score, 0);
  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const grandPct   = grandTotal > 0 ? Math.round((grandScore / grandTotal) * 100) : 0;
  const grandGrade = getGrade(grandPct);
  const passCount  = rows.filter(r => r.pct >= 35).length;
  const failCount  = rows.length - passCount;

  if (loading) return <LoadingScreen />;

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#4f46e5" />}
    >
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')} style={{ alignSelf: 'flex-start', marginBottom: 10 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ color: '#818cf8', fontSize: 13, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.portalLabel}>Student Report</Text>
        <Text style={s.name}>{student?.name || user?.username || 'Progress Card'}</Text>
        {student?.grade && (
          <Text style={s.className}>
            Class {student.grade}{student.section || ''}{student.school ? ` · ${student.school}` : ''}
          </Text>
        )}
        <View style={s.pillsRow}>
          {[
            { label: 'Exams',   value: rows.length,          bg: 'rgba(255,255,255,0.1)'  },
            { label: 'Passed',  value: passCount,            bg: 'rgba(16,185,129,0.3)'   },
            ...(failCount > 0 ? [{ label: 'Failed', value: failCount, bg: 'rgba(239,68,68,0.3)' }] : []),
            ...(rows.length > 0 ? [{ label: 'Overall', value: `${grandPct}%`, bg: 'rgba(79,70,229,0.4)' }] : []),
          ].map(({ label, value, bg }) => (
            <View key={label} style={[s.pill, { backgroundColor: bg }]}>
              <Text style={s.pillVal}>{value}</Text>
              <Text style={s.pillLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Category Filter ── */}
      {boardCategories.length > 0 && (
        <View style={s.filterBox}>
          <Text style={s.filterLabel}>Filter by Exam Category</Text>
          <TouchableOpacity style={s.filterPicker} onPress={() => setShowCatPicker(v => !v)}>
            <Text style={s.filterPickerText}>
              {boardCategories.find(c => c.value === catFilter)?.label || 'All Categories'}
            </Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>▾</Text>
          </TouchableOpacity>
          {showCatPicker && (
            <View style={s.dropdown}>
              {[{ value: '', label: 'All Categories' }, ...boardCategories].map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.dropdownItem, catFilter === opt.value && s.dropdownItemActive]}
                  onPress={() => { setCatFilter(opt.value); setShowCatPicker(false); }}
                >
                  <Text style={[s.dropdownText, catFilter === opt.value && { color: '#4f46e5', fontWeight: '800' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── Table ── */}
      {rows.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Progress Data Yet"
          message="Complete assigned exams or have handwritten papers graded with a category set."
          style={{ margin: 16 }}
        />
      ) : (
        <View style={s.tableWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ width: TOTAL_W }}>

              {/* Table header */}
              <View style={s.thead}>
                {[
                  { label: '#',          w: COL.num,      align: 'center' },
                  { label: 'Subject',    w: COL.subject,  align: 'left'   },
                  { label: 'Exam',       w: COL.exam,     align: 'left'   },
                  { label: 'Max',        w: COL.max,      align: 'center' },
                  { label: 'Obtained',   w: COL.obtained, align: 'center' },
                  { label: 'Percentage', w: COL.pct,      align: 'left'   },
                  { label: 'Grade',      w: COL.grade,    align: 'center' },
                ].map(col => (
                  <Text key={col.label} style={[s.theadCell, { width: col.w, textAlign: col.align }]}>
                    {col.label}
                  </Text>
                ))}
              </View>

              {/* Data rows */}
              {rows.map((row, idx) => {
                const g = getGrade(row.pct);
                const onPress = () => {
                  if (!row.result_id) return;
                  navigation.navigate('ExamResultDetail', {
                    resultId: row.result_id,
                    type: row.source === 'handwritten' ? 'handwritten' : 'online',
                  });
                };
                return (
                  <TouchableOpacity
                    key={row.key}
                    style={[s.trow, idx % 2 === 1 && s.trowAlt]}
                    onPress={onPress}
                    activeOpacity={row.result_id ? 0.6 : 1}
                  >
                    <Text style={[s.tcell, { width: COL.num, textAlign: 'center', color: '#94a3b8' }]}>{idx + 1}</Text>

                    <View style={[s.tcellInner, { width: COL.subject }]}>
                      <View style={[s.subjectIcon, { backgroundColor: g.bg }]}>
                        <Text style={[s.subjectIconText, { color: g.color }]}>{row.subject.charAt(0)}</Text>
                      </View>
                      <Text style={s.subjectName} numberOfLines={1}>{row.subject}</Text>
                      {row.source === 'handwritten' && <Text style={{ fontSize: 10 }}>✍️</Text>}
                    </View>

                    <View style={{ width: COL.exam, justifyContent: 'center', paddingHorizontal: 4 }}>
                      <View style={s.categoryBadge}>
                        <Text style={s.categoryText} numberOfLines={1}>{row.category}</Text>
                      </View>
                    </View>

                    <Text style={[s.tcell, { width: COL.max, textAlign: 'center', color: '#475569' }]}>{row.total}</Text>
                    <Text style={[s.tcell, { width: COL.obtained, textAlign: 'center', color: '#4f46e5', fontWeight: '800' }]}>{row.score}</Text>

                    <View style={{ width: COL.pct, justifyContent: 'center', paddingHorizontal: 6 }}>
                      <PctBar pct={row.pct} />
                    </View>

                    <View style={{ width: COL.grade, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={[s.gradeBadge, { backgroundColor: g.bg }]}>
                        <Text style={[s.gradeText, { color: g.color }]}>Grade {g.label}</Text>
                      </View>
                      {row.result_id ? (
                        <Text style={{ fontSize: 9, color: '#6366f1', marginTop: 2 }}>View →</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Total row */}
              <View style={s.tfoot}>
                <Text style={[s.tfootCell, { width: COL.num + COL.subject + COL.exam }]}>Total</Text>
                <Text style={[s.tfootCell, { width: COL.max, textAlign: 'center', color: '#374151' }]}>{grandTotal}</Text>
                <Text style={[s.tfootCell, { width: COL.obtained, textAlign: 'center', color: '#4f46e5', fontWeight: '800' }]}>{grandScore}</Text>
                <View style={{ width: COL.pct, justifyContent: 'center', paddingHorizontal: 6 }}>
                  <PctBar pct={grandPct} />
                </View>
                <View style={{ width: COL.grade, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={[s.gradeBadge, { backgroundColor: grandGrade.bg }]}>
                    <Text style={[s.gradeText, { color: grandGrade.color }]}>Grade {grandGrade.label}</Text>
                  </View>
                </View>
              </View>

            </View>
          </ScrollView>

          {/* ── Grade Legend ── */}
          <View style={s.legend}>
            {GRADE_LEGEND.map(({ label, color }) => (
              <View key={label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: color }]} />
                <Text style={s.legendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f8fafc' },

  header:           { backgroundColor: '#0f172a', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  portalLabel:      { color: '#818cf8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  name:             { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  className:        { color: '#64748b', fontSize: 12, marginBottom: 14 },
  pillsRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill:             { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  pillVal:          { color: '#fff', fontSize: 16, fontWeight: '800' },
  pillLabel:        { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },

  filterBox:        { backgroundColor: '#fff', margin: 16, marginBottom: 8, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  filterLabel:      { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  filterPicker:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f8fafc' },
  filterPickerText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  dropdown:         { marginTop: 6, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  dropdownItem:     { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dropdownItemActive:{ backgroundColor: '#eef2ff' },
  dropdownText:     { fontSize: 14, color: '#334155', fontWeight: '600' },

  tableWrap:        { margin: 16, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },

  thead:            { flexDirection: 'row', backgroundColor: '#1e1b4b', paddingVertical: 12, paddingHorizontal: 8 },
  theadCell:        { color: '#a5b4fc', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  trow:             { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trowAlt:          { backgroundColor: '#fafbff' },
  tcell:            { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  tcellInner:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 6 },

  subjectIcon:      { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  subjectIconText:  { fontWeight: '800', fontSize: 12 },
  subjectName:      { fontSize: 12, fontWeight: '700', color: '#1e293b', flex: 1 },
  categoryBadge:    { backgroundColor: '#eef2ff', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, alignSelf: 'flex-start' },
  categoryText:     { fontSize: 10, fontWeight: '700', color: '#4f46e5' },
  gradeBadge:       { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  gradeText:        { fontSize: 10, fontWeight: '800' },

  tfoot:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: '#eef2ff', borderTopWidth: 2, borderTopColor: '#c7d2fe' },
  tfootCell:        { fontSize: 13, fontWeight: '800', color: '#1e1b4b' },

  legend:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:        { width: 8, height: 8, borderRadius: 99 },
  legendText:       { fontSize: 10, color: '#94a3b8' },
});
