import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { User, LogOut, Calculator, X, BookOpen, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../../components/ui/Button';
import { saveTYTExam, saveSingleSubjectExam, getStudentIdFromAuthUser } from '../../lib/examService';
import toast from 'react-hot-toast';

const StudentWelcome: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showExamsModal, setShowExamsModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [examName, setExamName] = useState('');

  
  const [tytData, setTytData] = useState({
    turkce: { correct: '', wrong: '', blank: '' },
    sosyal: {
      tarih: { correct: '', wrong: '', blank: '' },
      cografya: { correct: '', wrong: '', blank: '' },
      felsefe: { correct: '', wrong: '', blank: '' },
      dinKultur: { correct: '', wrong: '', blank: '' }
    },
    matematik: { correct: '', wrong: '', blank: '' },
    fen: {
      fizik: { correct: '', wrong: '', blank: '' },
      kimya: { correct: '', wrong: '', blank: '' },
      biyoloji: { correct: '', wrong: '', blank: '' }
    }
  });

  const [aytData, setAytData] = useState({
    matematik: { correct: '', wrong: '', blank: '' },
    edebiyatSosyal: {
      edebiyat: { correct: '', wrong: '', blank: '' },
      tarih: { correct: '', wrong: '', blank: '' },
      cografya: { correct: '', wrong: '', blank: '' }
    },
    sosyalBilimler2: {
      tarih: { correct: '', wrong: '', blank: '' },
      cografya: { correct: '', wrong: '', blank: '' },
      felsefe: { correct: '', wrong: '', blank: '' },
      din: { correct: '', wrong: '', blank: '' }
    },
    fenBilimleri: {
      fizik: { correct: '', wrong: '', blank: '' },
      kimya: { correct: '', wrong: '', blank: '' },
      biyoloji: { correct: '', wrong: '', blank: '' }
    }
  });

  // Net hesaplama fonksiyonu
  const calculateNet = (correct: string, wrong: string) => {
    const correctNum = parseInt(correct) || 0;
    const wrongNum = parseInt(wrong) || 0;
    return correctNum - (wrongNum / 4);
  };

  // Toplam net hesaplama fonksiyonları
  const calculateSubjectTotalNet = (subjectData: any) => {
    if (typeof subjectData.correct === 'string') {
      // Basit ders (Türkçe, Matematik)
      return calculateNet(subjectData.correct, subjectData.wrong);
    } else {
      // Alt kategorili ders (Fen, Sosyal)
      return Object.values(subjectData).reduce((total: number, subData: any) => {
        return total + calculateNet(subData.correct, subData.wrong);
      }, 0);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openExamsModal = () => {
    setShowExamsModal(true);
  };

  const goToAssignments = () => {
    navigate('/student/assignments');
  };

  const goToExamsList = () => {
    navigate('/student/exams');
  };

  const resetExamData = () => {
    setTytData({
      turkce: { correct: '', wrong: '', blank: '' },
      sosyal: {
        tarih: { correct: '', wrong: '', blank: '' },
        cografya: { correct: '', wrong: '', blank: '' },
        felsefe: { correct: '', wrong: '', blank: '' },
        dinKultur: { correct: '', wrong: '', blank: '' }
      },
      matematik: { correct: '', wrong: '', blank: '' },
      fen: {
        fizik: { correct: '', wrong: '', blank: '' },
        kimya: { correct: '', wrong: '', blank: '' },
        biyoloji: { correct: '', wrong: '', blank: '' }
      }
    });
    setAytData({
      matematik: { correct: '', wrong: '', blank: '' },
      edebiyatSosyal: {
        edebiyat: { correct: '', wrong: '', blank: '' },
        tarih: { correct: '', wrong: '', blank: '' },
        cografya: { correct: '', wrong: '', blank: '' }
      },
      sosyalBilimler2: {
        tarih: { correct: '', wrong: '', blank: '' },
        cografya: { correct: '', wrong: '', blank: '' },
        felsefe: { correct: '', wrong: '', blank: '' },
        din: { correct: '', wrong: '', blank: '' }
      },
      fenBilimleri: {
        fizik: { correct: '', wrong: '', blank: '' },
        kimya: { correct: '', wrong: '', blank: '' },
        biyoloji: { correct: '', wrong: '', blank: '' }
      }
    });
  };

  const closeExamsModal = () => {
    setShowExamsModal(false);
  };

  const openAddExamModal = () => {
    setShowAddExamModal(true);
  };

  const handleExamTypeSelect = (type: string) => {
    setSelectedExamType(type);
    setExamName('');
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      const { studentId } = await getStudentIdFromAuthUser(user.id);
      
      if (selectedExamType === 'TYT') {
        // Fen bilimlerini birleştir
        const fenTotal = {
          correct: (parseInt(tytData.fen.fizik.correct) || 0) + 
                   (parseInt(tytData.fen.kimya.correct) || 0) + 
                   (parseInt(tytData.fen.biyoloji.correct) || 0),
          wrong: (parseInt(tytData.fen.fizik.wrong) || 0) + 
                 (parseInt(tytData.fen.kimya.wrong) || 0) + 
                 (parseInt(tytData.fen.biyoloji.wrong) || 0),
          blank: (parseInt(tytData.fen.fizik.blank) || 0) + 
                 (parseInt(tytData.fen.kimya.blank) || 0) + 
                 (parseInt(tytData.fen.biyoloji.blank) || 0)
        };
        
        // Sosyal bilimleri birleştir
        const sosyalTotal = {
          correct: (parseInt(tytData.sosyal.tarih.correct) || 0) + 
                   (parseInt(tytData.sosyal.cografya.correct) || 0) + 
                   (parseInt(tytData.sosyal.felsefe.correct) || 0) + 
                   (parseInt(tytData.sosyal.dinKultur.correct) || 0),
          wrong: (parseInt(tytData.sosyal.tarih.wrong) || 0) + 
                 (parseInt(tytData.sosyal.cografya.wrong) || 0) + 
                 (parseInt(tytData.sosyal.felsefe.wrong) || 0) + 
                 (parseInt(tytData.sosyal.dinKultur.wrong) || 0),
          blank: (parseInt(tytData.sosyal.tarih.blank) || 0) + 
                 (parseInt(tytData.sosyal.cografya.blank) || 0) + 
                 (parseInt(tytData.sosyal.felsefe.blank) || 0) + 
                 (parseInt(tytData.sosyal.dinKultur.blank) || 0)
        };
        
        await saveTYTExam(studentId, {
          examName,
          turkce: tytData.turkce,
          matematik: tytData.matematik,
          fen: tytData.fen,
          sosyal: tytData.sosyal
        });
      } else if (selectedExamType === 'AYT') {
        // Matematik kaydet
        await saveSingleSubjectExam(studentId, 'AYT', {
          examName: examName + ' - Matematik',
          subject: 'Matematik',
          correct: parseInt(aytData.matematik.correct) || 0,
          wrong: parseInt(aytData.matematik.wrong) || 0,
          blank: parseInt(aytData.matematik.blank) || 0
        });
        
        // Edebiyat-Sosyal Bilimler 1 kaydet
        await saveSingleSubjectExam(studentId, 'AYT', {
          examName: examName + ' - Edebiyat-Sosyal Bilimler 1',
          subject: 'Edebiyat-Sosyal Bilimler 1',
          correct: (parseInt(aytData.edebiyatSosyal.edebiyat.correct) || 0) + 
                   (parseInt(aytData.edebiyatSosyal.tarih.correct) || 0) + 
                   (parseInt(aytData.edebiyatSosyal.cografya.correct) || 0),
          wrong: (parseInt(aytData.edebiyatSosyal.edebiyat.wrong) || 0) + 
                 (parseInt(aytData.edebiyatSosyal.tarih.wrong) || 0) + 
                 (parseInt(aytData.edebiyatSosyal.cografya.wrong) || 0),
          blank: (parseInt(aytData.edebiyatSosyal.edebiyat.blank) || 0) + 
                 (parseInt(aytData.edebiyatSosyal.tarih.blank) || 0) + 
                 (parseInt(aytData.edebiyatSosyal.cografya.blank) || 0)
        });
        
        // Sosyal Bilimler-2 kaydet
        await saveSingleSubjectExam(studentId, 'AYT', {
          examName: examName + ' - Sosyal Bilimler-2',
          subject: 'Sosyal Bilimler-2',
          correct: (parseInt(aytData.sosyalBilimler2.tarih.correct) || 0) + 
                   (parseInt(aytData.sosyalBilimler2.cografya.correct) || 0) + 
                   (parseInt(aytData.sosyalBilimler2.felsefe.correct) || 0) + 
                   (parseInt(aytData.sosyalBilimler2.din.correct) || 0),
          wrong: (parseInt(aytData.sosyalBilimler2.tarih.wrong) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.cografya.wrong) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.felsefe.wrong) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.din.wrong) || 0),
          blank: (parseInt(aytData.sosyalBilimler2.tarih.blank) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.cografya.blank) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.felsefe.blank) || 0) + 
                 (parseInt(aytData.sosyalBilimler2.din.blank) || 0)
        });
        
        // Fen Bilimleri kaydet
        await saveSingleSubjectExam(studentId, 'AYT', {
          examName: examName + ' - Fen Bilimleri',
          subject: 'Fen Bilimleri',
          correct: (parseInt(aytData.fenBilimleri.fizik.correct) || 0) + 
                   (parseInt(aytData.fenBilimleri.kimya.correct) || 0) + 
                   (parseInt(aytData.fenBilimleri.biyoloji.correct) || 0),
          wrong: (parseInt(aytData.fenBilimleri.fizik.wrong) || 0) + 
                 (parseInt(aytData.fenBilimleri.kimya.wrong) || 0) + 
                 (parseInt(aytData.fenBilimleri.biyoloji.wrong) || 0),
          blank: (parseInt(aytData.fenBilimleri.fizik.blank) || 0) + 
                 (parseInt(aytData.fenBilimleri.kimya.blank) || 0) + 
                 (parseInt(aytData.fenBilimleri.biyoloji.blank) || 0)
        });
      }

      toast.success('Deneme başarıyla kaydedildi!');
      setShowAddExamModal(false);
      setShowExamsModal(false);
      resetExamData();
      setSelectedExamType('');
      setExamName('');
    } catch (error: any) {
      console.error('Deneme kaydedilirken hata:', error);
      toast.error(error.message || 'Deneme kaydedilirken bir hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Hoş Geldin! 👋
          </motion.h1>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Calculator size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Denemelerim</h3>
            <p className="text-gray-600 mb-8">
              Deneme sınavlarını görüntüle, yeni deneme ekle ve performansını takip et.
            </p>
            <div className="flex flex-row gap-3">
              <button
                onClick={openExamsModal}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-3 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
              >
                Deneme Ekle
              </button>
              <button
                onClick={goToExamsList}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-3 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 text-xs sm:text-sm"
              >
                Denemelerimi Görüntüle
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <BookOpen size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ödevlerim</h3>
            <p className="text-gray-600 mb-8">
              Ödevlerini görüntüle, tamamlama durumunu takip et ve notlarını incele.
            </p>
            <button
              onClick={goToAssignments}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
            >
              <BookOpen size={20} className="mr-2" />
              Ödevlerim
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <Target size={40} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Konu Analizi</h3>
            <p className="text-gray-600 mb-8">
              Konuları takip et, tamamladığın konuları işaretle ve ilerleme durumunu gör.
            </p>
            <button
              onClick={() => navigate('/student/subject-analysis')}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
            >
              <Target size={20} className="mr-2" />
              Konu Analizim
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/>
                <line x1="9" x2="15" y1="15" y2="15"/>
                <line x1="12" x2="12" y1="12" y2="18"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Soru İstatistiklerim</h3>
            <p className="text-gray-600 mb-8">
              Çözdüğün soru sayılarını gir ve performansını takip et.
            </p>
            <button
              onClick={() => navigate('/student/question-stats')}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center text-sm sm:text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-4"/>
                <path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/>
                <line x1="9" x2="15" y1="15" y2="15"/>
                <line x1="12" x2="12" y1="12" y2="18"/>
              </svg>
              Soru Sayılarım
            </button>
          </motion.div>
        </div>
      </main>

      {/* Denemeler Ana Modal */}
      {showExamsModal && !showAddExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deneme Türü Seç</h2>
              <p className="text-gray-600">Hangi tür deneme eklemek istiyorsun?</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  handleExamTypeSelect('TYT');
                  setShowAddExamModal(true);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                TYT Denemesi
              </button>
              
              <button
                onClick={() => {
                  handleExamTypeSelect('AYT');
                  setShowAddExamModal(true);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                AYT Denemesi
              </button>
              

            </div>
            
            <button
              onClick={closeExamsModal}
              className="w-full mt-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              İptal
            </button>
          </motion.div>
        </div>
      )}

      {/* Deneme Ekleme Modal */}
      {showAddExamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedExamType} Denemesi Ekle
              </h2>
              <button
                onClick={() => {
                  setShowAddExamModal(false);
                  setShowExamsModal(false);
                  resetExamData();
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            
            {selectedExamType && (
              <form onSubmit={handleExamSubmit} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deneme Adı
                  </label>
                  <input
                    type="text"
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Örn: Matematik Deneme 1"
                    required
                  />
                </div>

                {selectedExamType === 'TYT' && (
                  <div className="space-y-6">
                    {Object.entries(tytData).map(([subject, data]) => (
                      <div key={subject} className="bg-gray-50 p-4 rounded-lg">
                        {subject === 'fen' ? (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 capitalize flex justify-between items-center">
                              <span>Fen Bilimleri</span>
                              <span className="text-sm font-normal text-blue-600">
                                Toplam Net: {calculateSubjectTotalNet(data).toFixed(2)}
                              </span>
                            </h3>
                            <div className="space-y-4">
                              {Object.entries(data as any).map(([subSubject, subData]: [string, any]) => (
                                <div key={subSubject} className="ml-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize flex justify-between items-center">
                                    <span>
                                      {subSubject === 'fizik' ? 'Fizik' : 
                                       subSubject === 'kimya' ? 'Kimya' : 'Biyoloji'}
                                    </span>
                                    <span className="text-xs font-normal text-green-600">
                                      Net: {calculateNet(subData.correct, subData.wrong).toFixed(2)}
                                    </span>
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Doğru
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.correct}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          fen: {
                                            ...prev.fen,
                                            [subSubject]: { ...prev.fen[subSubject as keyof typeof prev.fen], correct: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Yanlış
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.wrong}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          fen: {
                                            ...prev.fen,
                                            [subSubject]: { ...prev.fen[subSubject as keyof typeof prev.fen], wrong: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Boş
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.blank}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          fen: {
                                            ...prev.fen,
                                            [subSubject]: { ...prev.fen[subSubject as keyof typeof prev.fen], blank: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : subject === 'sosyal' ? (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 capitalize flex justify-between items-center">
                              <span>Sosyal Bilimler</span>
                              <span className="text-sm font-normal text-blue-600">
                                Toplam Net: {calculateSubjectTotalNet(data).toFixed(2)}
                              </span>
                            </h3>
                            <div className="space-y-4">
                              {Object.entries(data as any).map(([subSubject, subData]: [string, any]) => (
                                <div key={subSubject} className="ml-4">
                                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize flex justify-between items-center">
                                    <span>
                                      {subSubject === 'tarih' ? 'Tarih' : 
                                       subSubject === 'cografya' ? 'Coğrafya' : 
                                       subSubject === 'felsefe' ? 'Felsefe' : 'Din Kültürü'}
                                    </span>
                                    <span className="text-xs font-normal text-green-600">
                                      Net: {calculateNet(subData.correct, subData.wrong).toFixed(2)}
                                    </span>
                                  </h4>
                                  <div className="grid grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Doğru
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.correct}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          sosyal: {
                                            ...prev.sosyal,
                                            [subSubject]: { ...prev.sosyal[subSubject as keyof typeof prev.sosyal], correct: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Yanlış
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.wrong}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          sosyal: {
                                            ...prev.sosyal,
                                            [subSubject]: { ...prev.sosyal[subSubject as keyof typeof prev.sosyal], wrong: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Boş
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={subData.blank}
                                        onChange={(e) => setTytData(prev => ({
                                          ...prev,
                                          sosyal: {
                                            ...prev.sosyal,
                                            [subSubject]: { ...prev.sosyal[subSubject as keyof typeof prev.sosyal], blank: e.target.value }
                                          }
                                        }))}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-3 capitalize flex justify-between items-center">
                              <span>{subject === 'turkce' ? 'Türkçe' : 'Matematik'}</span>
                              <span className="text-sm font-normal text-blue-600">
                                Toplam Net: {calculateSubjectTotalNet(data).toFixed(2)}
                              </span>
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Doğru
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={data.correct}
                                  onChange={(e) => setTytData(prev => ({
                                    ...prev,
                                    [subject]: { ...prev[subject as keyof typeof prev], correct: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Yanlış
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={data.wrong}
                                  onChange={(e) => setTytData(prev => ({
                                    ...prev,
                                    [subject]: { ...prev[subject as keyof typeof prev], wrong: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Boş
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={data.blank}
                                  onChange={(e) => setTytData(prev => ({
                                    ...prev,
                                    [subject]: { ...prev[subject as keyof typeof prev], blank: e.target.value }
                                  }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}



                {selectedExamType === 'TYT' && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Toplam Net Sayıları</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Türkçe</div>
                        <div className="text-xl font-bold text-blue-600">
                          {calculateSubjectTotalNet(tytData.turkce).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Matematik</div>
                        <div className="text-xl font-bold text-blue-600">
                          {calculateSubjectTotalNet(tytData.matematik).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Fen Bilimleri</div>
                        <div className="text-xl font-bold text-blue-600">
                          {calculateSubjectTotalNet(tytData.fen).toFixed(2)}
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                        <div className="text-sm font-medium text-gray-600">Sosyal Bilimler</div>
                        <div className="text-xl font-bold text-blue-600">
                          {calculateSubjectTotalNet(tytData.sosyal).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center p-4 bg-white rounded-lg shadow-sm border-2 border-green-200">
                      <div className="text-lg font-medium text-gray-700">Toplam Net</div>
                      <div className="text-3xl font-bold text-green-600">
                        {(
                          calculateSubjectTotalNet(tytData.turkce) +
                          calculateSubjectTotalNet(tytData.matematik) +
                          calculateSubjectTotalNet(tytData.fen) +
                          calculateSubjectTotalNet(tytData.sosyal)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {selectedExamType === 'AYT' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3 flex justify-between items-center">
                        <span>Edebiyat-Sosyal Bilimler 1</span>
                        <span className="text-sm font-normal text-blue-600">
                          Toplam Net: {calculateSubjectTotalNet(aytData.edebiyatSosyal).toFixed(2)}
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(aytData.edebiyatSosyal).map(([subSubject, subData]: [string, any]) => (
                          <div key={subSubject} className="ml-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize flex justify-between items-center">
                              <span>
                                {subSubject === 'edebiyat' ? 'Edebiyat' : 
                                 subSubject === 'tarih' ? 'Tarih' : 'Coğrafya'}
                              </span>
                              <span className="text-xs font-normal text-green-600">
                                Net: {calculateNet(subData.correct, subData.wrong).toFixed(2)}
                              </span>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Doğru
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.correct}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    edebiyatSosyal: {
                                      ...prev.edebiyatSosyal,
                                      [subSubject]: { ...prev.edebiyatSosyal[subSubject as keyof typeof prev.edebiyatSosyal], correct: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Yanlış
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.wrong}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    edebiyatSosyal: {
                                      ...prev.edebiyatSosyal,
                                      [subSubject]: { ...prev.edebiyatSosyal[subSubject as keyof typeof prev.edebiyatSosyal], wrong: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Boş
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.blank}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    edebiyatSosyal: {
                                      ...prev.edebiyatSosyal,
                                      [subSubject]: { ...prev.edebiyatSosyal[subSubject as keyof typeof prev.edebiyatSosyal], blank: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3 flex justify-between items-center">
                        <span>Sosyal Bilimler-2</span>
                        <span className="text-sm font-normal text-blue-600">
                          Toplam Net: {calculateSubjectTotalNet(aytData.sosyalBilimler2).toFixed(2)}
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(aytData.sosyalBilimler2).map(([subSubject, subData]: [string, any]) => (
                          <div key={subSubject} className="ml-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize flex justify-between items-center">
                              <span>
                                {subSubject === 'tarih' ? 'Tarih' : 
                                 subSubject === 'cografya' ? 'Coğrafya' : 
                                 subSubject === 'felsefe' ? 'Felsefe' : 'Din'}
                              </span>
                              <span className="text-xs font-normal text-green-600">
                                Net: {calculateNet(subData.correct, subData.wrong).toFixed(2)}
                              </span>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Doğru
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.correct}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    sosyalBilimler2: {
                                      ...prev.sosyalBilimler2,
                                      [subSubject]: { ...prev.sosyalBilimler2[subSubject as keyof typeof prev.sosyalBilimler2], correct: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Yanlış
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.wrong}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    sosyalBilimler2: {
                                      ...prev.sosyalBilimler2,
                                      [subSubject]: { ...prev.sosyalBilimler2[subSubject as keyof typeof prev.sosyalBilimler2], wrong: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Boş
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.blank}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    sosyalBilimler2: {
                                      ...prev.sosyalBilimler2,
                                      [subSubject]: { ...prev.sosyalBilimler2[subSubject as keyof typeof prev.sosyalBilimler2], blank: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3 flex justify-between items-center">
                        <span>Matematik</span>
                        <span className="text-sm font-normal text-blue-600">
                          Net: {calculateNet(aytData.matematik.correct, aytData.matematik.wrong).toFixed(2)}
                        </span>
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Doğru
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={aytData.matematik.correct}
                            onChange={(e) => setAytData(prev => ({
                              ...prev,
                              matematik: { ...prev.matematik, correct: e.target.value }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Yanlış
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={aytData.matematik.wrong}
                            onChange={(e) => setAytData(prev => ({
                              ...prev,
                              matematik: { ...prev.matematik, wrong: e.target.value }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Boş
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={aytData.matematik.blank}
                            onChange={(e) => setAytData(prev => ({
                              ...prev,
                              matematik: { ...prev.matematik, blank: e.target.value }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">Fen Bilimleri</h3>
                      <div className="space-y-3">
                        {Object.entries(aytData.fenBilimleri).map(([subSubject, subData]) => (
                          <div key={subSubject}>
                            <h4 className="font-medium text-gray-800 mb-2 capitalize flex justify-between items-center">
                              <span>
                                {subSubject === 'fizik' ? 'Fizik' : 
                                 subSubject === 'kimya' ? 'Kimya' : 'Biyoloji'}
                              </span>
                              <span className="text-sm font-normal text-green-600">
                                Net: {calculateNet(subData.correct, subData.wrong).toFixed(2)}
                              </span>
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Doğru
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.correct}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    fenBilimleri: {
                                      ...prev.fenBilimleri,
                                      [subSubject]: { ...prev.fenBilimleri[subSubject as keyof typeof prev.fenBilimleri], correct: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Yanlış
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.wrong}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    fenBilimleri: {
                                      ...prev.fenBilimleri,
                                      [subSubject]: { ...prev.fenBilimleri[subSubject as keyof typeof prev.fenBilimleri], wrong: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Boş
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={subData.blank}
                                  onChange={(e) => setAytData(prev => ({
                                    ...prev,
                                    fenBilimleri: {
                                      ...prev.fenBilimleri,
                                      [subSubject]: { ...prev.fenBilimleri[subSubject as keyof typeof prev.fenBilimleri], blank: e.target.value }
                                    }
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">AYT Net Sayıları</h3>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm border-2 border-green-200">
                        <div className="text-lg font-medium text-gray-700">Toplam Net</div>
                        <div className="text-3xl font-bold text-green-600">
                          {(
                            calculateNet(aytData.matematik.correct, aytData.matematik.wrong) +
                            calculateSubjectTotalNet(aytData.edebiyatSosyal) +
                            calculateSubjectTotalNet(aytData.sosyalBilimler2) +
                            calculateSubjectTotalNet(aytData.fenBilimleri)
                          ).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                  >
                    Denemeyi Kaydet
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddExamModal(false);
                      setShowExamsModal(false);
                      resetExamData();
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    İptal
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentWelcome;