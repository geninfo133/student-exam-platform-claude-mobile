import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';

const PORTALS = [
  {
    key: 'school',
    title: 'School',
    tag: 'K-12 Education',
    desc: 'Complete K-12 management with class and section controls.',
    icon: '🏫',
    bg: '#eff6ff',
    border: '#93c5fd',
    tagColor: '#1d4ed8',
    tagBg: '#dbeafe',
    btnColor: '#2563eb',
    grad: '#3b82f6',
  },
  {
    key: 'college',
    title: 'College',
    tag: 'Higher Education',
    desc: 'Scalable assessment solutions for higher education.',
    icon: '🎓',
    bg: '#faf5ff',
    border: '#c4b5fd',
    tagColor: '#7c3aed',
    tagBg: '#ede9fe',
    btnColor: '#7c3aed',
    grad: '#8b5cf6',
  },
  {
    key: 'coaching',
    title: 'Coaching Centre',
    tag: 'Competitive Exams',
    desc: 'Optimized for EAMCET, NEET, and JEE preparation.',
    icon: '📚',
    bg: '#fff7ed',
    border: '#fdba74',
    tagColor: '#c2410c',
    tagBg: '#ffedd5',
    btnColor: '#ea580c',
    grad: '#f97316',
  },
];

const STATS = [
  { value: '50,000+', label: 'Students Enrolled',   icon: '🎓' },
  { value: '2M+',     label: 'Exams Graded by AI',  icon: '✅' },
  { value: '98%',     label: 'Grading Accuracy',    icon: '🎯' },
  { value: '500+',    label: 'Institutions',         icon: '🏫' },
];

const FEATURES = [
  { icon: '⚡', title: 'AI Smart Grading',          desc: 'Gemini 2.0 grades MCQs and long-form answers instantly.',   bg: '#eef2ff', color: '#4f46e5' },
  { icon: '📝', title: 'Handwritten Analysis',       desc: 'Upload answer sheets and let AI read and grade them.',      bg: '#f5f3ff', color: '#7c3aed' },
  { icon: '📊', title: 'Advanced Analytics',         desc: 'Dashboards revealing learning gaps and performance trends.', bg: '#ecfdf5', color: '#059669' },
  { icon: '📚', title: 'Smart Question Bank',        desc: 'Auto-generate papers from an AI-curated question bank.',    bg: '#fffbeb', color: '#d97706' },
  { icon: '🏆', title: 'Progress Tracking',          desc: 'Chapter-wise progress cards with improvement suggestions.',  bg: '#fef2f2', color: '#dc2626' },
  { icon: '🔒', title: 'Secure & Scalable',          desc: 'Enterprise-grade security. Scales from 10 to 10,000 students.', bg: '#e0f2fe', color: '#0284c7' },
];

const HOW = [
  { step: '01', title: 'Register Institution', desc: 'Sign up as School, College, or Coaching Centre in minutes.', color: '#3b82f6', bg: '#eff6ff' },
  { step: '02', title: 'Create & Assign',      desc: 'Build exams from AI question bank. Assign with one click.',   color: '#8b5cf6', bg: '#f5f3ff' },
  { step: '03', title: 'AI Grades Instantly',  desc: 'Gemini 2.0 evaluates typed or handwritten answers.',          color: '#059669', bg: '#ecfdf5' },
  { step: '04', title: 'Review Analytics',     desc: 'Rich dashboards showing performance and weakest topics.',     color: '#ea580c', bg: '#fff7ed' },
];

export default function HomeScreen({ navigation }) {
  const [selected, setSelected] = useState(null);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View style={s.hero}>
        <View style={s.heroDots} pointerEvents="none">
          {Array.from({ length: 80 }).map((_, i) => <View key={i} style={s.dot} />)}
        </View>
        <View style={s.heroGlow1} />
        <View style={s.heroGlow2} />

        <View style={s.heroContent}>
          <View style={s.aiBadge}>
            <Text style={s.aiBadgeText}>⚡ Powered by Gemini 2.0 AI</Text>
          </View>
          <Text style={s.heroTitle}>
            Next Gen{'\n'}
            <Text style={s.heroTitleAccent}>Exam Management</Text>
          </Text>
          <Text style={s.heroDesc}>
            Streamline assessments with AI grading, handwritten sheet processing, and deep learning analytics.
          </Text>
          <View style={s.heroPills}>
            {['⚡ AI Smart Grading', '📝 Handwritten Analysis', '📊 Advanced Analytics'].map(f => (
              <View key={f} style={s.heroPill}>
                <Text style={s.heroPillText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={s.heroActions}>
            <TouchableOpacity style={s.heroSignIn} onPress={() => navigation.navigate('Login')}>
              <Text style={s.heroSignInText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.heroRegister} onPress={() => navigation.navigate('Signup')}>
              <Text style={s.heroRegisterText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={s.statsSection}>
        <View style={s.statsGrid}>
          {STATS.map(({ value, label, icon }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statIcon}>{icon}</Text>
              <Text style={s.statValue}>{value}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Portal Selector ── */}
      <View style={s.section}>
        <View style={s.sectionBadge}>
          <Text style={s.sectionBadgeText}>CHOOSE YOUR PORTAL</Text>
        </View>
        <Text style={s.sectionTitle}>Get Started Today</Text>
        <Text style={s.sectionDesc}>
          {selected ? 'Sign in to your portal' : 'Choose your institution type to continue'}
        </Text>

        {!selected ? (
          <View style={s.portalsGrid}>
            {PORTALS.map(p => (
              <TouchableOpacity
                key={p.key}
                style={[s.portalCard, { backgroundColor: p.bg, borderColor: p.border }]}
                onPress={() => setSelected(p.key)}
              >
                <View style={[s.portalTagWrap, { backgroundColor: p.tagBg }]}>
                  <Text style={[s.portalTag, { color: p.tagColor }]}>{p.tag}</Text>
                </View>
                <View style={[s.portalIcon, { backgroundColor: p.grad }]}>
                  <Text style={{ fontSize: 30 }}>{p.icon}</Text>
                </View>
                <Text style={s.portalTitle}>{p.title}</Text>
                <Text style={s.portalDesc}>{p.desc}</Text>
                <Text style={[s.portalLink, { color: p.btnColor }]}>Select Portal →</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={s.loginCard}>
            {(() => {
              const p = PORTALS.find(o => o.key === selected);
              return (
                <>
                  <View style={s.loginCardTop}>
                    <View style={[s.loginCardIcon, { backgroundColor: p.grad }]}>
                      <Text style={{ fontSize: 24 }}>{p.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.loginCardTitle}>{p.title} Portal</Text>
                      <Text style={s.loginCardSub}>SELECTED</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[s.loginBtn, { backgroundColor: '#4f46e5' }]} onPress={() => navigation.navigate('Login')}>
                    <Text style={s.loginBtnText}>Login to Account</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.registerBtn} onPress={() => navigation.navigate('Signup')}>
                    <Text style={s.registerBtnText}>Register New Institution</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.changeBtn} onPress={() => setSelected(null)}>
                    <Text style={s.changeBtnText}>← Change Institution Type</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        )}
      </View>

      {/* ── Features ── */}
      <View style={[s.section, { backgroundColor: '#fff', paddingVertical: 28 }]}>
        <View style={[s.sectionBadge, { backgroundColor: '#d1fae5' }]}>
          <Text style={[s.sectionBadgeText, { color: '#065f46' }]}>PLATFORM FEATURES</Text>
        </View>
        <Text style={s.sectionTitle}>Everything You Need</Text>
        <Text style={s.sectionDesc}>A complete AI-powered toolkit for modern educational institutions.</Text>
        <View style={s.featuresGrid}>
          {FEATURES.map(({ icon, title, desc, bg, color }) => (
            <View key={title} style={[s.featureCard, { backgroundColor: bg }]}>
              <View style={[s.featureIcon, { backgroundColor: color }]}>
                <Text style={{ fontSize: 22 }}>{icon}</Text>
              </View>
              <Text style={s.featureTitle}>{title}</Text>
              <Text style={[s.featureDesc, { color }]}>{desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── How It Works ── */}
      <View style={s.howSection}>
        <View style={[s.sectionBadge, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }]}>
          <Text style={[s.sectionBadgeText, { color: '#a5b4fc' }]}>SIMPLE PROCESS</Text>
        </View>
        <Text style={[s.sectionTitle, { color: '#fff' }]}>How It Works</Text>
        <Text style={[s.sectionDesc, { color: '#94a3b8' }]}>Up and running in under 10 minutes.</Text>
        <View style={s.howGrid}>
          {HOW.map(({ step, title, desc, color, bg }) => (
            <View key={step} style={[s.howCard, { backgroundColor: bg }]}>
              <Text style={[s.howStep, { color }]}>{step}</Text>
              <Text style={s.howTitle}>{title}</Text>
              <Text style={s.howDesc}>{desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CTA ── */}
      <View style={s.cta}>
        <Text style={s.ctaTitle}>Ready to Transform Your Institution?</Text>
        <Text style={s.ctaDesc}>Join 500+ institutions using AI to save time and boost student outcomes.</Text>
        <View style={s.ctaActions}>
          <TouchableOpacity style={s.ctaWhiteBtn} onPress={() => navigation.navigate('Signup')}>
            <Text style={s.ctaWhiteBtnText}>Start Free Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaOutlineBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={s.ctaOutlineBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={s.footer}>
        <Text style={s.footerText}>© 2026 AI Smart Exam Management System. All rights reserved.</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f8fafc' },

  // Hero
  hero:             { backgroundColor: '#0f172a', overflow: 'hidden', paddingBottom: 8 },
  heroDots:         { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap', opacity: 0.1 },
  dot:              { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#818cf8', margin: 6 },
  heroGlow1:        { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(124,58,237,0.25)' },
  heroGlow2:        { position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(79,70,229,0.2)' },
  heroContent:      { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 32 },
  aiBadge:          { alignSelf: 'center', backgroundColor: 'rgba(99,102,241,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  aiBadgeText:      { color: '#a5b4fc', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle:        { color: '#fff', fontSize: 36, fontWeight: '900', textAlign: 'center', lineHeight: 44, marginBottom: 16 },
  heroTitleAccent:  { color: '#818cf8' },
  heroDesc:         { color: '#94a3b8', fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 20 },
  heroPills:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 28 },
  heroPill:         { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroPillText:     { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
  heroActions:      { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  heroSignIn:       { backgroundColor: '#4f46e5', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, flex: 1, alignItems: 'center' },
  heroSignInText:   { color: '#fff', fontWeight: '800', fontSize: 15 },
  heroRegister:     { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroRegisterText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Stats
  statsSection:     { backgroundColor: '#fff', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 0 },
  statCard:         { width: '50%', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8 },
  statIcon:         { fontSize: 24, marginBottom: 6 },
  statValue:        { fontSize: 26, fontWeight: '900', color: '#0f172a', marginBottom: 2 },
  statLabel:        { fontSize: 11, color: '#64748b', fontWeight: '600', textAlign: 'center' },

  // Section
  section:          { paddingHorizontal: 20, paddingVertical: 28 },
  sectionBadge:     { alignSelf: 'center', backgroundColor: '#eef2ff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  sectionBadgeText: { color: '#4f46e5', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionTitle:     { fontSize: 26, fontWeight: '900', color: '#0f172a', textAlign: 'center', marginBottom: 8 },
  sectionDesc:      { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },

  // Portals
  portalsGrid:      { gap: 14 },
  portalCard:       { borderRadius: 20, padding: 20, borderWidth: 2, alignItems: 'center' },
  portalTagWrap:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 14 },
  portalTag:        { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  portalIcon:       { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  portalTitle:      { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
  portalDesc:       { fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 14 },
  portalLink:       { fontSize: 14, fontWeight: '800' },

  // Login card (after portal selected)
  loginCard:        { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  loginCardTop:     { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  loginCardIcon:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  loginCardTitle:   { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  loginCardSub:     { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  loginBtn:         { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  loginBtnText:     { color: '#fff', fontWeight: '800', fontSize: 15 },
  registerBtn:      { borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', marginBottom: 10 },
  registerBtnText:  { color: '#1e293b', fontWeight: '700', fontSize: 15 },
  changeBtn:        { paddingVertical: 8, alignItems: 'center' },
  changeBtnText:    { color: '#94a3b8', fontSize: 13, fontWeight: '600' },

  // Features
  featuresGrid:     { gap: 12 },
  featureCard:      { borderRadius: 20, padding: 20 },
  featureIcon:      { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureTitle:     { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  featureDesc:      { fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // How it works
  howSection:       { backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 32, overflow: 'hidden' },
  howGrid:          { gap: 12 },
  howCard:          { borderRadius: 20, padding: 20 },
  howStep:          { fontSize: 40, fontWeight: '900', marginBottom: 8 },
  howTitle:         { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  howDesc:          { fontSize: 13, color: '#475569', lineHeight: 20 },

  // CTA
  cta:              { backgroundColor: '#4f46e5', paddingHorizontal: 24, paddingVertical: 40, alignItems: 'center' },
  ctaTitle:         { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
  ctaDesc:          { fontSize: 14, color: '#c7d2fe', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  ctaActions:       { flexDirection: 'row', gap: 12 },
  ctaWhiteBtn:      { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14 },
  ctaWhiteBtnText:  { color: '#4f46e5', fontWeight: '800', fontSize: 15 },
  ctaOutlineBtn:    { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  ctaOutlineBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },

  // Footer
  footer:           { backgroundColor: '#fff', paddingVertical: 20, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText:       { color: '#94a3b8', fontSize: 12 },
});
