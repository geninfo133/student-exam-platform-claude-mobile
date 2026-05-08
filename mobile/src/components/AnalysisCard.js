import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../theme';

export default function AnalysisCard({ analysis, title = 'AI Analysis', style }) {
  if (!analysis) return null;
  const { overall_comment, strengths, weaknesses, recommendations } = analysis;
  if (!strengths?.length && !weaknesses?.length && !recommendations?.length && !overall_comment) return null;

  return (
    <View style={[s.card, style]}>
      <Text style={s.title}>{title}</Text>

      {overall_comment ? (
        <Text style={s.quote}>"{overall_comment}"</Text>
      ) : null}

      {strengths?.length > 0 && (
        <View style={s.block}>
          <Text style={[s.blockTitle, { color: COLORS.successMid }]}>STRENGTHS</Text>
          {strengths.map((pt, i) => <Text key={i} style={[s.point, { color: COLORS.successDark }]}>• {pt}</Text>)}
        </View>
      )}

      {weaknesses?.length > 0 && (
        <View style={s.block}>
          <Text style={[s.blockTitle, { color: COLORS.error }]}>AREAS TO IMPROVE</Text>
          {weaknesses.map((pt, i) => <Text key={i} style={[s.point, { color: COLORS.errorDark }]}>• {pt}</Text>)}
        </View>
      )}

      {recommendations?.length > 0 && (
        <View style={s.block}>
          <Text style={[s.blockTitle, { color: COLORS.blue }]}>RECOMMENDATIONS</Text>
          {recommendations.map((pt, i) => <Text key={i} style={[s.point, { color: COLORS.blueDark }]}>• {pt}</Text>)}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:       { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12, ...SHADOWS.sm },
  title:      { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  quote:      { fontSize: 13, color: COLORS.textSub, fontStyle: 'italic', lineHeight: 18, marginBottom: 10 },
  block:      { marginBottom: 10 },
  blockTitle: { fontSize: 11, fontWeight: '800', marginBottom: 6 },
  point:      { fontSize: 12, lineHeight: 17, marginBottom: 3 },
});
