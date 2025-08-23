import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Book, GraduationCap, Layout, LogOut, Globe, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const t = (key: string) => {
    const tr = {
      dashboard: 'Genel Bakış',
      students: 'Öğrenciler',
      books: 'Kitaplar',
      programs: 'Programlar',
      logout: 'Çıkış Yap',
    };
    return tr[key] || key;
  };
  
  if (!user) return null;
  
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="flex items-center">
              <GraduationCap className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ÖdevTakip</span>
            </Link>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <motion.nav 
              className="hidden md:flex space-x-4 items-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors"
              >
                <Layout className="h-4 w-4 mr-1" />
                <span>{t('dashboard')}</span>
              </Link>

              <Link
                to="/programs"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors"
              >
                <Book className="h-4 w-4 mr-1" />
                <span>{t('programs')}</span>
              </Link>
              
              <Link
                to="/students"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors"
              >
                <GraduationCap className="h-4 w-4 mr-1" />
                <span>{t('students')}</span>
              </Link>
              
              <Link
                to="/books"
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium rounded-md flex items-center transition-colors"
              >
                <Book className="h-4 w-4 mr-1" />
                <span>{t('books')}</span>
              </Link>
            </motion.nav>
            
            {/* Desktop Logout Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center space-x-2"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>{t('logout')}</span>
              </Button>
            </motion.div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="Menüyü aç/kapat"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md flex items-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Layout className="h-5 w-5 mr-2" />
                <span>{t('dashboard')}</span>
              </Link>

              <Link
                to="/programs"
                className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md flex items-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Book className="h-5 w-5 mr-2" />
                <span>{t('programs')}</span>
              </Link>
              
              <Link
                to="/students"
                className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md flex items-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                <span>{t('students')}</span>
              </Link>
              
              <Link
                to="/books"
                className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 block px-3 py-2 text-base font-medium rounded-md flex items-center transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Book className="h-5 w-5 mr-2" />
                <span>{t('books')}</span>
              </Link>
              
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-gray-700 hover:text-red-600 hover:bg-red-50 block w-full text-left px-3 py-2 text-base font-medium rounded-md flex items-center transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;