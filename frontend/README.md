# Student Exam Platform — Frontend

A React + Vite single-page application for a multi-role online exam platform. Supports role-based dashboards and workflows for school admins, coaching centres, teachers, and students.

## Tech Stack

- **Framework**: React 19.2.0
- **Router**: React Router 7.13.0
- **Build Tool**: Vite 7.3.1
- **Styling**: Tailwind CSS 4.1.18
- **Charts**: Recharts 3.7.0
- **HTTP Client**: Axios 1.13.5

## Roles & Dashboards

| Role | Dashboard Route | Description |
|------|----------------|-------------|
| Student | `/dashboard` | Take exams, view results, analytics, assigned exams |
| Teacher | `/teacher/dashboard` | Create exams, grade answers, upload papers, manage materials |
| School Admin | `/school/dashboard` | Manage teachers, students, subjects, assignments |
| Coaching Centre | `/coaching/dashboard` | Same as school with coaching-specific label |

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx                   # Route definitions with role-based guards
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state, token management, role routing
│   ├── api/
│   │   └── axios.js              # Axios instance with JWT auto-attach & refresh
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx        # Dynamic nav based on user role
│   │   │   └── Footer.jsx
│   │   └── Common/
│   │       ├── ProtectedRoute.jsx       # Auth guard (redirects to login)
│   │       └── RoleProtectedRoute.jsx   # Role-based access guard
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx             # Role selector + login form
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx         # Role-aware student dashboard
│   │   ├── Profile.jsx
│   │   ├── SubjectList.jsx
│   │   ├── ChapterList.jsx
│   │   ├── StudyMaterial.jsx
│   │   ├── TakeExam.jsx          # Exam interface (MCQ, short, long answer)
│   │   ├── ExamResult.jsx        # Results with AI analysis & charts
│   │   ├── ExamHistory.jsx
│   │   ├── AssignedExams.jsx
│   │   ├── StudentAnalytics.jsx  # Performance trends & insights
│   │   ├── HandwrittenResults.jsx
│   │   ├── ProgressCard.jsx      # Category-wise progress (pre-mid, mid, annual)
│   │   ├── school/               # School/coaching admin pages
│   │   │   ├── SchoolDashboard.jsx
│   │   │   ├── ManageTeachers.jsx
│   │   │   ├── ManageStudents.jsx
│   │   │   ├── ManageAssignments.jsx
│   │   │   ├── ManageSubjects.jsx
│   │   │   └── ManageImages.jsx
│   │   └── teacher/              # Teacher-specific pages
│   │       ├── TeacherDashboard.jsx
│   │       ├── CreateExam.jsx    # Exam builder (manual/random question selection)
│   │       ├── ExamPaperView.jsx # Manage AI-generated papers
│   │       ├── UploadPaper.jsx
│   │       ├── PapersList.jsx
│   │       ├── CreatedExams.jsx
│   │       ├── ExamSubmissions.jsx
│   │       ├── ReviewAnswers.jsx
│   │       ├── GradingQueue.jsx
│   │       ├── ExamResults.jsx
│   │       ├── GeneratePaper.jsx
│   │       ├── HandwrittenList.jsx
│   │       ├── UploadHandwritten.jsx
│   │       ├── TeacherAnalytics.jsx
│   │       ├── ManageStudyMaterials.jsx
│   │       └── StudentProgressCard.jsx
│   └── utils/
├── public/
├── index.html
├── vite.config.js
├── package.json
└── .env
```

## Authentication Flow

1. User selects role on login page (student / teacher / school / coaching)
2. Credentials sent to `POST /api/auth/login/` → returns JWT access + refresh tokens
3. Tokens stored in `localStorage`
4. Axios interceptor auto-attaches `Authorization: Bearer <token>` to every request
5. On 401, interceptor silently refreshes token via `POST /api/auth/refresh/`
6. `AuthContext.getDashboardPath()` redirects user to their role's dashboard

## Key Pages

- **Login.jsx** — Role selector UI + login form
- **TakeExam.jsx** — Exam interface supporting MCQ, short answer, and long answer questions
- **ExamResult.jsx** — Score breakdown, AI analysis, answer review with Recharts charts
- **StudentAnalytics.jsx** — Performance trends, subject-wise insights
- **ProgressCard.jsx** — Progress across exam categories (pre-mid, mid, final, annual)
- **CreateExam.jsx** — Teacher exam builder with manual or random question selection
- **ExamPaperView.jsx** — Manage questions generated from uploaded PDF papers
- **ManageStudents.jsx** — School bulk create/import/edit students
- **ManageTeachers.jsx** — School create/edit teachers and assign subjects
- **ManageAssignments.jsx** — School assigns teachers to grade/section/subject

## Setup

### Prerequisites

- Node.js 18+
- Backend API running at `http://localhost:8001`

### Installation

1. **Clone the repo**
   ```bash
   git clone git@github.com:geninfo133/student-exam-platform.git
   cd student-exam-platform/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**

   Create a `.env` file in `frontend/`:
   ```env
   VITE_API_URL=http://localhost:8001
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   App runs at: `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output in `dist/`. The Vite dev proxy forwards `/api` and `/media` requests to the backend — configure your web server accordingly in production.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL (e.g. `http://localhost:8001`) |

## Route Summary

**Public**
- `/` — Home
- `/login` — Login with role selection
- `/register` — Student registration

**Student (authenticated)**
- `/dashboard` · `/profile` · `/subjects` · `/chapters/:subjectId`
- `/study-material/:chapterId` · `/exam/:examId` · `/result/:examId`
- `/history` · `/assigned-exams` · `/analytics` · `/progress-card`
- `/handwritten-results`

**Teacher**
- `/teacher/dashboard` · `/teacher/upload-paper` · `/teacher/papers`
- `/teacher/create-exam` · `/teacher/exams` · `/teacher/exam/:examId/submissions`
- `/teacher/review/:examId` · `/teacher/grading`
- `/teacher/handwritten` · `/teacher/upload-handwritten`
- `/teacher/analytics` · `/teacher/study-materials`
- `/teacher/students/:studentId/progress`

**School Admin**
- `/school/dashboard` · `/school/teachers` · `/school/students`
- `/school/assignments` · `/school/subjects` · `/school/images`

**Coaching Centre** (same features as school)
- `/coaching/dashboard` · `/coaching/teachers` · `/coaching/students`
- `/coaching/assignments` · `/coaching/subjects` · `/coaching/progress-card`

## License

Open source — available for educational use.
