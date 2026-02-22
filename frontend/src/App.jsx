import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';
import RoleProtectedRoute from './components/Common/RoleProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import SubjectList from './pages/SubjectList';
import ChapterList from './pages/ChapterList';
import StudyMaterial from './pages/StudyMaterial';
import TakeExam from './pages/TakeExam';
import ExamResult from './pages/ExamResult';
import ExamHistory from './pages/ExamHistory';
import AssignedExams from './pages/AssignedExams';
import StudentAnalytics from './pages/StudentAnalytics';
import HandwrittenResults from './pages/HandwrittenResults';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import UploadPaper from './pages/teacher/UploadPaper';
import PapersList from './pages/teacher/PapersList';
import CreateExam from './pages/teacher/CreateExam';
import ExamResults from './pages/teacher/ExamResults';
import ReviewAnswers from './pages/teacher/ReviewAnswers';
import GeneratePaper from './pages/teacher/GeneratePaper';
import HandwrittenList from './pages/teacher/HandwrittenList';
import UploadHandwritten from './pages/teacher/UploadHandwritten';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import ManageStudyMaterials from './pages/teacher/ManageStudyMaterials';
import SchoolDashboard from './pages/school/SchoolDashboard';
import ManageTeachers from './pages/school/ManageTeachers';
import ManageStudents from './pages/school/ManageStudents';
import ManageAssignments from './pages/school/ManageAssignments';
import ManageSubjects from './pages/school/ManageSubjects';
import ManageImages from './pages/school/ManageImages';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/subjects" element={<ProtectedRoute><SubjectList /></ProtectedRoute>} />
            <Route path="/chapters/:subjectId" element={<ProtectedRoute><ChapterList /></ProtectedRoute>} />
            <Route path="/study/:chapterId" element={<ProtectedRoute><StudyMaterial /></ProtectedRoute>} />
            <Route path="/exam/:examId" element={<ProtectedRoute><TakeExam /></ProtectedRoute>} />
            <Route path="/result/:examId" element={<ProtectedRoute><ExamResult /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><ExamHistory /></ProtectedRoute>} />
            <Route path="/assigned-exams" element={<ProtectedRoute><AssignedExams /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><StudentAnalytics /></ProtectedRoute>} />
            <Route path="/handwritten-results" element={<ProtectedRoute><HandwrittenResults /></ProtectedRoute>} />

            {/* School Routes */}
            <Route path="/school/dashboard" element={<RoleProtectedRoute allowedRoles={['school']}><SchoolDashboard /></RoleProtectedRoute>} />
            <Route path="/school/teachers" element={<RoleProtectedRoute allowedRoles={['school']}><ManageTeachers /></RoleProtectedRoute>} />
            <Route path="/school/students" element={<RoleProtectedRoute allowedRoles={['school']}><ManageStudents /></RoleProtectedRoute>} />
            <Route path="/school/assignments" element={<RoleProtectedRoute allowedRoles={['school']}><ManageAssignments /></RoleProtectedRoute>} />
            <Route path="/school/subjects" element={<RoleProtectedRoute allowedRoles={['school']}><ManageSubjects /></RoleProtectedRoute>} />
            <Route path="/school/images" element={<RoleProtectedRoute allowedRoles={['school']}><ManageImages /></RoleProtectedRoute>} />

            {/* Teacher Routes (also accessible by school/org admins) */}
            <Route path="/teacher/dashboard" element={<RoleProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></RoleProtectedRoute>} />
            <Route path="/teacher/upload-paper" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><UploadPaper /></RoleProtectedRoute>} />
            <Route path="/teacher/papers" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><PapersList /></RoleProtectedRoute>} />
            <Route path="/teacher/create-exam" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><CreateExam /></RoleProtectedRoute>} />
            <Route path="/teacher/create-from-papers" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><GeneratePaper /></RoleProtectedRoute>} />
            <Route path="/teacher/generate-paper" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><GeneratePaper /></RoleProtectedRoute>} />
            <Route path="/teacher/exams" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><ExamResults /></RoleProtectedRoute>} />
            <Route path="/teacher/results" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><ExamResults /></RoleProtectedRoute>} />
            <Route path="/teacher/review/:examId" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><ReviewAnswers /></RoleProtectedRoute>} />
            <Route path="/teacher/handwritten" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><HandwrittenList /></RoleProtectedRoute>} />
            <Route path="/teacher/upload-handwritten" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><UploadHandwritten /></RoleProtectedRoute>} />
            <Route path="/teacher/analytics" element={<RoleProtectedRoute allowedRoles={['teacher', 'school']}><TeacherAnalytics /></RoleProtectedRoute>} />
            <Route path="/teacher/study-materials" element={<RoleProtectedRoute allowedRoles={['teacher']}><ManageStudyMaterials /></RoleProtectedRoute>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
