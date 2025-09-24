import React, { useState, useEffect } from 'react';
import { Plus, Save, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { 
  saveStudentQuestionStat, 
  getStudentQuestionStatsFromDB 
} from '../../lib/examService';

interface QuestionEntry {
  id: string;
  date: string;
  subject: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
}

const QuestionStats: React.FC = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    correctAnswers: '',
    wrongAnswers: ''
  });

  const subjects = [
    'Matematik',
    'Türkçe',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Tarih',
    'Coğrafya',
    'Felsefe',
    'Edebiyat',
    'İngilizce'
  ];

  useEffect(() => {
    loadQuestionStats();
  }, [user?.id]);

  const loadQuestionStats = async () => {
    if (!user?.id) return;
    
    console.log('Loading question stats for user:', user.id);
    setLoading(true);
    try {
      // Önce veritabanından çekmeyi dene
      const { data: dbData, error } = await getStudentQuestionStatsFromDB(user.id, 365); // Son 1 yıl
      
      console.log('Database response:', { dbData, error });
      
      if (!error && dbData && dbData.length > 0) {
        // Veritabanından veri geldi
        console.log('Using database data:', dbData);
        setEntries(dbData);
        // LocalStorage'ı da güncelle
        localStorage.setItem(`questionStats_${user.id}`, JSON.stringify(dbData));
      } else {
        // Veritabanından veri gelmedi, localStorage'dan yükle
        console.log('No database data, trying localStorage');
        const savedEntries = localStorage.getItem(`questionStats_${user.id}`);
        if (savedEntries) {
          const localData = JSON.parse(savedEntries);
          console.log('Using localStorage data:', localData);
          setEntries(localData);
          
          // LocalStorage'daki verileri veritabanına senkronize et
          await syncLocalDataToDatabase(localData);
        } else {
          console.log('No data found in localStorage either');
        }
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      // Hata durumunda localStorage'dan yükle
      const savedEntries = localStorage.getItem(`questionStats_${user.id}`);
      if (savedEntries) {
        console.log('Fallback to localStorage due to error');
        setEntries(JSON.parse(savedEntries));
      }
    } finally {
      setLoading(false);
    }
  };

  const syncLocalDataToDatabase = async (localEntries: QuestionEntry[]) => {
    if (!user?.id || !localEntries.length) return;
    
    try {
      for (const entry of localEntries) {
        await saveStudentQuestionStat(user.id, {
          date: entry.date,
          subject: entry.subject,
          correctAnswers: entry.correctAnswers,
          wrongAnswers: entry.wrongAnswers
        });
      }
    } catch (error) {
      console.error('LocalStorage senkronizasyon hatası:', error);
    }
  };

  const saveToLocalStorage = (newEntries: QuestionEntry[]) => {
    if (user?.id) {
      localStorage.setItem(`questionStats_${user.id}`, JSON.stringify(newEntries));
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.subject || !newEntry.correctAnswers || !newEntry.wrongAnswers) {
      toast.error('Lütfen tüm alanları doldurun!');
      return;
    }

    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı!');
      return;
    }

    const correctAnswers = parseInt(newEntry.correctAnswers);
    const wrongAnswers = parseInt(newEntry.wrongAnswers);
    const totalQuestions = correctAnswers + wrongAnswers;

    console.log('Adding new entry:', { 
      userId: user.id, 
      entry: { ...newEntry, correctAnswers, wrongAnswers } 
    });

    setLoading(true);
    
    try {
      // Önce veritabanına kaydet
      const { data: dbResult, error } = await saveStudentQuestionStat(user.id, {
        date: newEntry.date,
        subject: newEntry.subject,
        correctAnswers,
        wrongAnswers
      });

      console.log('Database save result:', { dbResult, error });

      if (error) {
        throw new Error('Veritabanı kayıt hatası: ' + (error.message || JSON.stringify(error)));
      }

      const entry: QuestionEntry = {
        id: dbResult?.id || Date.now().toString(),
        date: newEntry.date,
        subject: newEntry.subject,
        correctAnswers,
        wrongAnswers,
        totalQuestions
      };

      // Local state'i güncelle
      const updatedEntries = [...entries, entry];
      setEntries(updatedEntries);
      
      // LocalStorage'ı da güncelle
      saveToLocalStorage(updatedEntries);
      
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        correctAnswers: '',
        wrongAnswers: ''
      });
      setShowAddModal(false);
      toast.success('Soru kaydı başarıyla veritabanına eklendi!');
      
    } catch (error) {
      console.error('Kayıt hatası:', error);
      
      // Veritabanı hatası durumunda sadece localStorage'a kaydet
      const entry: QuestionEntry = {
        id: Date.now().toString(),
        date: newEntry.date,
        subject: newEntry.subject,
        correctAnswers,
        wrongAnswers,
        totalQuestions
      };

      const updatedEntries = [...entries, entry];
      setEntries(updatedEntries);
      saveToLocalStorage(updatedEntries);
      
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        correctAnswers: '',
        wrongAnswers: ''
      });
      setShowAddModal(false);
      toast.error('Veritabanı hatası! Sadece localStorage\'a kaydedildi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const getTotalQuestions = () => {
    return entries.reduce((total, entry) => total + entry.totalQuestions, 0);
  };

  const getTotalCorrect = () => {
    return entries.reduce((total, entry) => total + entry.correctAnswers, 0);
  };

  const getSuccessRate = () => {
    const total = getTotalQuestions();
    const correct = getTotalCorrect();
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const getSubjectStats = () => {
    const stats: { [key: string]: { questions: number; correct: number; wrong: number } } = {};
    
    entries.forEach(entry => {
      if (!stats[entry.subject]) {
        stats[entry.subject] = { questions: 0, correct: 0, wrong: 0 };
      }
      stats[entry.subject].questions += entry.totalQuestions;
      stats[entry.subject].correct += entry.correctAnswers;
      stats[entry.subject].wrong += entry.wrongAnswers;
    });
    
    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      questions: data.questions,
      correct: data.correct,
      wrong: data.wrong,
      successRate: data.questions > 0 ? Math.round((data.correct / data.questions) * 100) : 0
    })).sort((a, b) => b.questions - a.questions);
  };

  const getRecentEntries = () => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Soru İstatistiklerim</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Kayıt Ekle
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam Soru</p>
                <p className="text-3xl font-bold text-purple-600">{getTotalQuestions()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Doğru Cevaplar</p>
                <p className="text-3xl font-bold text-green-600">{getTotalCorrect()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="text-green-600" size={24} />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Başarı Oranı</p>
                <p className="text-3xl font-bold text-blue-600">%{getSuccessRate()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ders Bazında İstatistikler */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Ders Bazında İstatistikler</h2>
            <div className="space-y-4">
              {getSubjectStats().map((stat) => (
                <div key={stat.subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{stat.subject}</p>
                    <p className="text-sm text-gray-600">%{stat.successRate} başarı</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{stat.questions}</p>
                    <p className="text-xs text-gray-500">soru</p>
                  </div>
                </div>
              ))}
              {getSubjectStats().length === 0 && (
                <p className="text-gray-500 text-center py-8">Henüz soru kaydı bulunmuyor.</p>
              )}
            </div>
          </motion.div>

          {/* Son Kayıtlar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-6">Son Kayıtlar</h2>
            <div className="space-y-4">
              {getRecentEntries().map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.subject}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{entry.totalQuestions} soru</p>
                    <p className="text-xs text-gray-500">{entry.correctAnswers}D / {entry.wrongAnswers}Y</p>
                  </div>
                </div>
              ))}
              {getRecentEntries().length === 0 && (
                <p className="text-gray-500 text-center py-8">Henüz kayıt bulunmuyor.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Yeni Soru Kaydı</h3>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
                <select
                  value={newEntry.subject}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Ders seçin</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doğru Cevap Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={newEntry.correctAnswers}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, correctAnswers: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doğru cevap sayısı"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yanlış Cevap Sayısı</label>
                <input
                  type="number"
                  min="0"
                  value={newEntry.wrongAnswers}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, wrongAnswers: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Yanlış cevap sayısı"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={16} />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default QuestionStats;