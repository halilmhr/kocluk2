import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Layout from './components/layout/Layout';
import StudentLayout from './components/layout/StudentLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentSignIn from './pages/auth/StudentSignIn';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import StudentList from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import StudentHomeworkReport from './pages/students/StudentHomeworkReport';
import StudentReport from './pages/students/StudentReport';
import StudentExamAnalysis from './pages/students/StudentExamAnalysis';
import StudentQuestionStats from './pages/students/StudentQuestionStats';

import StudentWelcome from './pages/student/StudentWelcome';
import StudentAssignments from './pages/student/StudentAssignments';
import StudentExams from './pages/student/StudentExams';
import QuestionStats from './pages/student/QuestionStats';
import SubjectAnalysis from './pages/student/SubjectAnalysis';
import BookList from './pages/books/BookList';
import ProgramList from './pages/programs/ProgramList';
import CreateProgram from './pages/programs/CreateProgram';
import ProgramDetail from './pages/programs/ProgramDetail';
import StudentView from './pages/student/StudentView';
import ProgramView from './pages/student/ProgramView';

function App() {
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    try {
      const unsubscribe = initialize();
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }, []);
  
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Sistem yükleniyor...</p>
        </div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Home page for unauthenticated users */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
        
        {/* Auth routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/student-signin" element={user ? <Navigate to="/student/welcome" /> : <StudentSignIn />} />
        
        {/* Public routes */}
        <Route path="/student/:studentId" element={<StudentView />} />
        <Route path="/program/:programId" element={<ProgramView />} />
        
        {/* Protected routes under Layout (Coach/Teacher) */}
        <Route element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
          <Route path="/student-report/:studentId" element={<StudentReport />} />
          <Route path="/students/:studentId/assignments" element={<StudentHomeworkReport />} />
          <Route path="/student-exam-analysis/:studentId" element={<StudentExamAnalysis />} />
          <Route path="/students/:studentId/question-stats" element={<StudentQuestionStats />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/programs" element={<ProgramList />} />
          <Route path="/programs/new" element={<CreateProgram />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
        </Route>
        
        {/* Protected routes under StudentLayout (Student) */}
        <Route element={user ? <StudentLayout /> : <Navigate to="/student-signin" />}>
          <Route path="/student/welcome" element={<StudentWelcome />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/subject-analysis" element={<SubjectAnalysis />} />
          <Route path="/student/exams" element={<StudentExams />} />
          <Route path="/student/question-stats" element={<QuestionStats />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;