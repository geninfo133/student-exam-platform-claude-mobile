import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/auth/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DashboardScreen from '../screens/student/DashboardScreen';
import AssignedExamsScreen from '../screens/student/AssignedExamsScreen';
import ResultsScreen from '../screens/student/ResultsScreen';
import ProgressScreen from '../screens/student/ProgressScreen';
import TakeExamScreen from '../screens/student/TakeExamScreen';
import ExamResultDetailScreen from '../screens/student/ExamResultDetailScreen';
import StudyMaterialsScreen from '../screens/student/StudyMaterialsScreen';
import StudentAnalyticsScreen from '../screens/student/StudentAnalyticsScreen';
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import CreateExamScreen from '../screens/teacher/CreateExamScreen';
import GradingQueueScreen from '../screens/teacher/GradingQueueScreen';
import CreatedExamsScreen from '../screens/teacher/CreatedExamsScreen';
import ExamSubmissionsScreen from '../screens/teacher/ExamSubmissionsScreen';
import UploadHandwrittenScreen from '../screens/teacher/UploadHandwrittenScreen';
import UploadPaperScreen from '../screens/teacher/UploadPaperScreen';
import PapersListScreen from '../screens/teacher/PapersListScreen';
import ReviewAnswersScreen from '../screens/teacher/ReviewAnswersScreen';
import TeacherAnalyticsScreen from '../screens/teacher/TeacherAnalyticsScreen';
import GeneratePaperScreen from '../screens/teacher/GeneratePaperScreen';
import ManageStudyMaterialsScreen from '../screens/teacher/ManageStudyMaterialsScreen';
import HandwrittenListScreen from '../screens/teacher/HandwrittenListScreen';
import SchoolDashboardScreen from '../screens/school/SchoolDashboardScreen';
import ManageStudentsScreen from '../screens/school/ManageStudentsScreen';
import ManageTeachersScreen from '../screens/school/ManageTeachersScreen';
import ManageSubjectsScreen from '../screens/school/ManageSubjectsScreen';
import ManageAssignmentsScreen from '../screens/school/ManageAssignmentsScreen';
import ManageImagesScreen from '../screens/school/ManageImagesScreen';
import ProgressCardsScreen from '../screens/school/ProgressCardsScreen';
import ExamPaperViewScreen from '../screens/teacher/ExamPaperViewScreen';

// Placeholder screen for screens not yet built
function ComingSoonScreen({ route, navigation }) {
  const title = route.params?.title || 'Coming Soon';
  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: '#1e1b4b', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: '#a5b4fc', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{title}</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 }}>
          <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 28 }}>🚧</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 }}>{title}</Text>
          <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
            This screen is coming soon.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#4f46e5', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Separate navigator instances for each navigator
const AuthStack    = createNativeStackNavigator();
const StudentTab   = createBottomTabNavigator();
const StudentStack = createNativeStackNavigator();
const TeacherStack = createNativeStackNavigator();
const SchoolStack  = createNativeStackNavigator();

function StudentTabs() {
  return (
    <StudentTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e2e8f0', height: 58, paddingBottom: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <StudentTab.Screen name="Home"          component={DashboardScreen}     options={{ tabBarLabel: 'Home' }} />
      <StudentTab.Screen name="AssignedExams" component={AssignedExamsScreen} options={{ tabBarLabel: 'My Exams' }} />
      <StudentTab.Screen name="Results"       component={ResultsScreen}       options={{ tabBarLabel: 'Results' }} />
      <StudentTab.Screen name="Progress"      component={ProgressScreen}      options={{ tabBarLabel: 'Progress' }} />
    </StudentTab.Navigator>
  );
}

function StudentNavigator() {
  return (
    <StudentStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentStack.Screen name="StudentTabs"       component={StudentTabs} />
      <StudentStack.Screen name="TakeExam"          component={TakeExamScreen} options={{ gestureEnabled: false }} />
      <StudentStack.Screen name="ExamResultDetail"  component={ExamResultDetailScreen} />
      <StudentStack.Screen name="StudyMaterials"    component={StudyMaterialsScreen} />
      <StudentStack.Screen name="StudentAnalytics"  component={StudentAnalyticsScreen} />
    </StudentStack.Navigator>
  );
}

function TeacherNavigator() {
  return (
    <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
      <TeacherStack.Screen name="TeacherDashboard"   component={TeacherDashboardScreen} />
      <TeacherStack.Screen name="ManageStudents"      component={ManageStudentsScreen} />
      <TeacherStack.Screen name="CreateExam"        component={CreateExamScreen} />
      <TeacherStack.Screen name="GradingQueue"      component={GradingQueueScreen} />
      <TeacherStack.Screen name="CreatedExams"      component={CreatedExamsScreen} />
      <TeacherStack.Screen name="ExamSubmissions"   component={ExamSubmissionsScreen} />
      <TeacherStack.Screen name="UploadHandwritten" component={UploadHandwrittenScreen} />
      <TeacherStack.Screen name="UploadPaper"      component={UploadPaperScreen} />
      <TeacherStack.Screen name="PapersList"       component={PapersListScreen} />
      <TeacherStack.Screen name="ReviewAnswers"    component={ReviewAnswersScreen} />
      <TeacherStack.Screen name="TeacherAnalytics"      component={TeacherAnalyticsScreen} />
      <TeacherStack.Screen name="GeneratePaper"         component={GeneratePaperScreen} />
      <TeacherStack.Screen name="ManageStudyMaterials"  component={ManageStudyMaterialsScreen} />
      <TeacherStack.Screen name="HandwrittenList"       component={HandwrittenListScreen} />
      <TeacherStack.Screen name="ExamPaperView"         component={ExamPaperViewScreen} />
      <TeacherStack.Screen name="ProgressCards"         component={ProgressCardsScreen} />
    </TeacherStack.Navigator>
  );
}

function SchoolNavigator() {
  return (
    <SchoolStack.Navigator screenOptions={{ headerShown: false }}>
      <SchoolStack.Screen name="SchoolDashboard" component={SchoolDashboardScreen} />
      <SchoolStack.Screen name="ManageStudents"  component={ManageStudentsScreen} />
      <SchoolStack.Screen name="ManageTeachers"  component={ManageTeachersScreen} />
      <SchoolStack.Screen name="ManageSubjects"  component={ManageSubjectsScreen} />
      <SchoolStack.Screen name="Assignments"     component={ManageAssignmentsScreen} />
      <SchoolStack.Screen name="ManageImages"    component={ManageImagesScreen} />
      <SchoolStack.Screen name="ProgressCards"   component={ProgressCardsScreen} />
      <SchoolStack.Screen name="Analytics"       component={TeacherAnalyticsScreen} />
      <SchoolStack.Screen name="UploadPaper"     component={UploadPaperScreen} />
      <SchoolStack.Screen name="PapersList"      component={PapersListScreen} />
      <SchoolStack.Screen name="GeneratePaper"   component={GeneratePaperScreen} />
      <SchoolStack.Screen name="CreateExam"      component={CreateExamScreen} />
      <SchoolStack.Screen name="CreatedExams"    component={CreatedExamsScreen} />
      <SchoolStack.Screen name="ExamSubmissions" component={ExamSubmissionsScreen} />
      <SchoolStack.Screen name="ExamPaperView"   component={ExamPaperViewScreen} />
    </SchoolStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Home"   component={HomeScreen} />
          <AuthStack.Screen name="Login"  component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      ) : user.role === 'school' ? (
        <SchoolNavigator />
      ) : user.role === 'teacher' ? (
        <TeacherNavigator />
      ) : (
        <StudentNavigator />
      )}
    </NavigationContainer>
  );
}
