import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

export default function ScreenHeader({
  navigation,
  label,
  title,
  subtitle,
  bgColor = COLORS.headerDark,
  children,
}) {
  return (
    <View style={[s.header, { backgroundColor: bgColor }]}>
      {navigation && (
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={s.backBtn}>← Back</Text>
        </TouchableOpacity>
      )}
      {label ? <Text style={s.label}>{label}</Text> : null}
      {title ? <Text style={s.title}>{title}</Text> : null}
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  header:   { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:  { color: COLORS.primaryAccent, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  label:    { color: COLORS.primaryMid, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  title:    { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  subtitle: { color: COLORS.textLight, fontSize: 12, marginTop: 4 },
});
