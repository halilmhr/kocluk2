import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface QuestionEntry {
  id: string;
  date: string;
  subject: string;
  questionCount: number;
  timeSpent: number; // dakika cinsinden
}

const QuestionStats: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    questionCount: '',
    timeSpent: ''
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
    // LocalStorage'dan verileri yükle
    const savedEntries = localStorage.getItem('questionStats');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const saveToLocalStorage = (newEntries: QuestionEntry[]) => {
    localStorage.setItem('questionStats', JSON.stringify(newEntries));
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEntry.subject || !newEntry.questionCount || !newEntry.timeSpent) {
      toast.error('Lütfen tüm alanları doldurun!');
      return;
    }

    const entry: QuestionEntry = {
      id: Date.now().toString(),
      date: newEntry.date,
      subject: newEntry.subject,
      questionCount: parseInt(newEntry.questionCount),
      timeSpent: parseInt(newEntry.timeSpent)
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    saveToLocalStorage(updatedEntries);
    
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      subject: '',
      questionCount: '',
      timeSpent: ''
    });
    setShowAddModal(false);
    toast.success('Soru kaydı başarıyla eklendi!');
  };

  const getTotalQuestions = () => {
    return entries.reduce((total, entry) => total + entry.questionCount, 0);
  };

  const getTotalTime = () => {
    return entries.reduce((total, entry) => total + entry.timeSpent, 0);
  };

  const getSubjectStats = () => {
    const stats: { [key: string]: { questions: number; time: number } } = {};
    
    entries.forEach(entry => {
      if (!stats[entry.subject]) {
        stats[entry.subject] = { questions: 0, time: 0 };
      }
      stats[entry.subject].questions += entry.questionCount;
      stats[entry.subject].time += entry.timeSpent;
    });
    
    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      questions: data.questions,
      time: data.time
    })).sort((a, b) => b.questions - a.questions);
  };

  const getRecentEntries = () => {
    return [...entries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">

            <div>
              <h1 className="text-3xl font-bold text-gray-900">Soru İstatistiklerim</h1>
              <p className="text-gray-600 mt-1">Çözdüğün soruları takip et ve performansını analiz et</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
          >
            <Plus size={20} />
            Soru Kaydı Ekle
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Toplam Soru</p>
                <p className="text-3xl font-bold text-green-600">{getTotalQuestions()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="text-green-600" size={24} />
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
                <p className="text-gray-600 text-sm font-medium">Toplam Süre</p>
                <p className="text-3xl font-bold text-blue-600">{Math.floor(getTotalTime() / 60)}s {getTotalTime() % 60}dk</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="text-blue-600" size={24} />
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
                <p className="text-gray-600 text-sm font-medium">Ortalama/Gün</p>
                <p className="text-3xl font-bold text-purple-600">
                  {entries.length > 0 ? Math.round(getTotalQuestions() / entries.length) : 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="text-purple-600" size={24} />
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
              {getSubjectStats().map((stat, index) => (
                <div key={stat.subject} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{stat.subject}</p>
                    <p className="text-sm text-gray-600">{stat.time} dakika</p>
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
                    <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">{entry.questionCount} soru</p>
                    <p className="text-xs text-gray-500">{entry.timeSpent} dakika</p>
                  </div>
                </div>
              ))}
              {getRecentEntries().length === 0 && (
                <p className="text-gray-500 text-center py-8">Henüz soru kaydı bulunmuyor.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Soru Kaydı Ekleme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Yeni Soru Kaydı</h2>
            
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tarih
                </label>
                <input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ders
                </label>
                <select
                  value={newEntry.subject}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                >
                  <option value="">Ders seçin</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soru Sayısı
                </label>
                <input
                  type="number"
                  min="1"
                  value={newEntry.questionCount}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, questionCount: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Çözdüğünüz soru sayısı"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Süre (Dakika)
                </label>
                <input
                  type="number"
                  min="1"
                  value={newEntry.timeSpent}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, timeSpent: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Harcanan süre (dakika)"
                  required
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  İptal
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