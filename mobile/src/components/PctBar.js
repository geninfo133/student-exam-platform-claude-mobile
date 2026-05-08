import React from 'react';
import { View } from 'react-native';
import { COLORS } from '../theme';

export default function PctBar({ pct, color, height = 6 }) {
  return (
    <View style={{ height, backgroundColor: COLORS.border, borderRadius: height / 2, overflow: 'hidden' }}>
      <View style={{ height, width: `${Math.min(pct || 0, 100)}%`, backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}
