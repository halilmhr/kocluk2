import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, BookOpen, Home, FileText, BarChart3, HelpCircle, Target } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

const StudentLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Öğrenci Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <motion.div 
              className="flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Öğrenci Paneli</span>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center space-x-3"
              >
                <div className="flex items-center text-gray-700">
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span>Çıkış Yap</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigasyon Menüsü */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-4">
            <Link
              to="/student/welcome"
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === '/student/welcome'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4 mr-2" />
              Ana Sayfa
            </Link>
            
            <Link
              to="/student/assignments"
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === '/student/assignments'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Ödevlerim
            </Link>
            
            <Link
              to="/student/subject-analysis"
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === '/student/subject-analysis'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Target className="h-4 w-4 mr-2" />
              Konu Analizi
            </Link>
            
            <Link
              to="/student/exams"
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === '/student/exams'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Sınav Sonuçları
            </Link>
            
            <Link
              to="/student/question-stats"
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                location.pathname === '/student/question-stats'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Soru İstatistikleri
            </Link>
          </div>
        </div>
      </nav>
      
      {/* Ana İçerik */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;