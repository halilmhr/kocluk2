import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart3, BookOpen, User, HelpCircle
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';

const StudentReport: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { students } = useDataStore();

  const selectedStudent = students.find(s => s.id === studentId);

  const handleAssignmentAnalysis = () => {
    navigate(`/students/${studentId}/assignments`);
  };

  const handleExamAnalysis = () => {
    navigate(`/student-exam-analysis/${studentId}`);
  };

  const handleQuestionStats = () => {
    navigate(`/students/${studentId}/question-stats`);
  };

  const handleBack = () => {
    navigate(`/students/${studentId}`);
  };

  if (!selectedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Öğrenci bilgisi yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="container mx-auto px-4 py-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Geri
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {selectedStudent.name}
                  </h1>
                  <p className="text-gray-600">Öğrenci Analiz Merkezi</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Analysis Options */}
          <div className="flex justify-center space-x-4 max-w-3xl mx-auto">
            
            {/* Assignment Analysis Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={handleAssignmentAnalysis}
              className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all duration-200 group"
            >
              <BookOpen className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium group-hover:text-green-600">Ödev Analizi</span>
            </motion.button>

            {/* Exam Analysis Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleExamAnalysis}
              className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 group"
            >
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium group-hover:text-blue-600">Deneme Analizi</span>
            </motion.button>

            {/* Question Stats Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={handleQuestionStats}
              className="flex items-center space-x-2 px-6 py-3 bg-white border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 group"
            >
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <span className="text-gray-700 font-medium group-hover:text-purple-600">Soru İstatistikleri</span>
            </motion.button>

          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center max-w-md mx-auto"
          >
            <p className="text-gray-500 text-sm">
              Analiz türünü seçerek öğrencinin detaylı performans raporlarına erişebilirsiniz.
            </p>
          </motion.div>

        </div>
      </main>
    </div>
  );
};

export default StudentReport;