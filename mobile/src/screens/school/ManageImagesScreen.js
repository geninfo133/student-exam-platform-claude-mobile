import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/axios';
import ScreenHeader from '../../components/ScreenHeader';
import LoadingScreen from '../../components/LoadingScreen';

const IMAGE_SLOTS = [
  { key: 'school_dashboard', label: 'School Dashboard',  desc: 'Header background for the main dashboard',  color: '#4f46e5' },
  { key: 'manage_teachers',  label: 'Manage Teachers',   desc: 'Header background for the teachers page',    color: '#3b82f6' },
  { key: 'manage_students',  label: 'Manage Students',   desc: 'Header background for the students page',    color: '#8b5cf6' },
  { key: 'manage_subjects',  label: 'Manage Subjects',   desc: 'Header background for the subjects page',    color: '#10b981' },
];

export default function ManageImagesScreen({ navigation }) {
  const [images, setImages]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [uploading, setUploading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const fetchImages = async () => {
    try {
      const res = await api.get('/api/site-images/');
      setImages(res.data || {});
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (key) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];

    setUploading(key);
    try {
      const form = new FormData();
      form.append('key', key);
      form.append('title', key);
      form.append('image', {
        uri: asset.uri,
        name: asset.fileName || 'image.jpg',
        type: asset.mimeType || 'image/jpeg',
      });

      await api.post('/api/site-images/upload/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Image uploaded!');
      fetchImages();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Upload failed');
    } finally { setUploading(null); }
  };

  const handleDelete = (key) => {
    const img = images[key];
    if (!img?.id) return;
    Alert.alert('Remove Image', 'Remove this background image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          setDeleting(key);
          try {
            await api.delete(`/api/site-images/${img.id}/`);
            showToast('Image removed.');
            fetchImages();
          } catch { Alert.alert('Error', 'Failed to remove image'); }
          finally { setDeleting(null); }
        },
      },
    ]);
  };

  const uploadedCount = IMAGE_SLOTS.filter(slot => !!images[slot.key]?.url).length;

  if (loading) return <LoadingScreen color="#4f46e5" />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScreenHeader
        navigation={navigation}
        label="School Administration"
        title="Background Images"
        subtitle="Upload custom backgrounds for your school pages"
      >
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { label: 'Uploaded',      value: uploadedCount },
            { label: 'Using Default', value: IMAGE_SLOTS.length - uploadedCount },
            { label: 'Total Slots',   value: IMAGE_SLOTS.length },
          ].map(({ label, value }) => (
            <View key={label} style={s.statPill}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>{value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>{label}</Text>
            </View>
          ))}
        </View>
      </ScreenHeader>

      {toast !== '' && (
        <View style={s.toast}><Text style={s.toastText}>{toast}</Text></View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {IMAGE_SLOTS.map(slot => {
          const img = images[slot.key];
          const hasImage = !!img?.url;

          return (
            <View key={slot.key} style={s.card}>
              {/* Preview */}
              <View style={[s.preview, { backgroundColor: slot.color + '33' }]}>
                {hasImage ? (
                  <Image source={{ uri: img.url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : null}
                <View style={[StyleSheet.absoluteFill, { backgroundColor: hasImage ? 'rgba(0,0,0,0.4)' : 'transparent' }]} />
                <View style={s.previewContent}>
                  {hasImage && (
                    <View style={s.customBadge}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Custom</Text></View>
                  )}
                  <Text style={s.slotLabel}>{slot.label}</Text>
                  <Text style={s.slotDesc}>{slot.desc}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.uploadBtn, { backgroundColor: slot.color }, uploading === slot.key && { opacity: 0.6 }]}
                  onPress={() => handleUpload(slot.key)}
                  disabled={uploading === slot.key}
                >
                  {uploading === slot.key
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.uploadBtnText}>{hasImage ? '🔄 Change' : '📷 Upload'}</Text>
                  }
                </TouchableOpacity>

                {hasImage && (
                  <TouchableOpacity
                    style={[s.removeBtn, deleting === slot.key && { opacity: 0.6 }]}
                    onPress={() => handleDelete(slot.key)}
                    disabled={deleting === slot.key}
                  >
                    <Text style={s.removeBtnText}>{deleting === slot.key ? '…' : 'Remove'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  statPill:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', minWidth: 70 },
  toast:        { backgroundColor: '#10b981', padding: 12, alignItems: 'center' },
  toastText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  card:         { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  preview:      { height: 140, justifyContent: 'flex-end' },
  previewContent:{ padding: 14 },
  customBadge:  { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  slotLabel:    { color: '#fff', fontSize: 16, fontWeight: '800' },
  slotDesc:     { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  actions:      { flexDirection: 'row', gap: 10, padding: 14 },
  uploadBtn:    { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  uploadBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  removeBtn:    { borderWidth: 1.5, borderColor: '#fecaca', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center' },
  removeBtnText:{ color: '#dc2626', fontWeight: '700', fontSize: 13 },
});
