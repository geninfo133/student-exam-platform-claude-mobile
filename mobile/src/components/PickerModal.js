import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADII } from '../theme';

export default function PickerModal({
  visible,
  title,
  items,
  onSelect,
  onClose,
  labelKey = 'label',
  valueKey = 'id',
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <Text style={s.title}>{title}</Text>
        <ScrollView style={{ maxHeight: 340 }}>
          {items.map((item, i) => (
            <TouchableOpacity
              key={item[valueKey] ?? i}
              style={s.row}
              onPress={() => { onSelect(item); onClose(); }}
            >
              <Text style={s.rowText}>{item[labelKey]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopLeftRadius: RADII.xxl, borderTopRightRadius: RADII.xxl, padding: 20, maxHeight: '60%' },
  handle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title:   { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  row:     { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
  rowText: { fontSize: 15, color: COLORS.textSub },
});
