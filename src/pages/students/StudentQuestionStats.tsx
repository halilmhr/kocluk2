import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, BarChart3, TrendingUp, BookOpen, 
  Calendar, Target, Award, RefreshCw
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import toast from 'react-hot-toast';
import { getStudentQuestionStats, getAvailableSubjects } from '../../lib/examService';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface QuestionEntry {
  id: string;
  date: string;
  subject: string;
  questionCount: number;
  timeSpent: number;
}

interface StudentQuestionStats {
  totalEntries: number;
  totalQuestions: number;
  totalTime: number;
  averagePerDay: number;
  subjectStats: Array<{
    subject: string;
    questions: number;
    time: number;
  }>;
  recentEntries: QuestionEntry[];
}

const StudentQuestionStats: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { students } = useDataStore();
  
  const [stats, setStats] = useState<StudentQuestionStats | null>(null);
  const [entries, setEntries] = useState<QuestionEntry[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedStudent = students?.find(s => s.id === studentId);

  useEffect(() => {
    if (studentId) {
      fetchQuestionStats();
    }
  }, [studentId]);

  const fetchQuestionStats = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      setError(null);
      
      // 1. Mevcut dersleri çek
      const subjectsResult = await getAvailableSubjects();
      const availableSubjectsList: string[] = subjectsResult.subjects || [];
      setAvailableSubjects(availableSubjectsList);
      
      // 2. Veritabanından ödev verilerini çek
      const dbResult = await getStudentQuestionStats(studentId);
      
      // 3. localStorage'dan soru istatistiklerini çek
      const storageKey = `questionStats_${studentId}`;
      const savedEntries = localStorage.getItem(storageKey);
      let localEntries: QuestionEntry[] = [];
      
      if (savedEntries) {
        try {
          localEntries = JSON.parse(savedEntries);
          // Sadece mevcut derslerdeki verileri filtrele
          localEntries = localEntries.filter(entry => 
            availableSubjectsList.length === 0 || availableSubjectsList.includes(entry.subject)
          );
        } catch (e) {
          console.error('localStorage parse error:', e);
        }
      }
      
      // 4. Veritabanı verilerini QuestionEntry formatına çevir
      let dbEntries: QuestionEntry[] = [];
      if (dbResult.data && dbResult.data.length > 0) {
        dbEntries = dbResult.data
          .filter((assignment: any) => {
            const subject = assignment.books?.[0]?.subject || 'Genel';
            return availableSubjectsList.length === 0 || availableSubjectsList.includes(subject);
          })
          .map((assignment: any) => {
            const questionCount = (assignment.correct_answers || 0) + (assignment.wrong_answers || 0) + (assignment.blank_answers || 0);
            // Soru sayısına göre tahmin edilen süre (soru başına 1-2 dakika)
            const estimatedTime = Math.round(questionCount * 1.5);
            
            return {
              id: `db_${assignment.id}`,
              date: assignment.day || new Date().toISOString().split('T')[0],
              subject: assignment.books?.[0]?.subject || 'Genel',
              questionCount,
              timeSpent: estimatedTime
            };
          });
      }
      
      // 5. Tüm verileri birleştir
      const allEntries = [...dbEntries, ...localEntries];
      
      if (allEntries.length > 0) {
        // İstatistikleri hesapla
        const totalQuestions = allEntries.reduce((total, entry) => total + entry.questionCount, 0);
        const totalTime = allEntries.reduce((total, entry) => total + entry.timeSpent, 0);
        
        // Ders bazında istatistikler - sadece mevcut dersleri dahil et
        const subjectMap: { [key: string]: { questions: number; time: number } } = {};
        allEntries.forEach(entry => {
          if (!subjectMap[entry.subject]) {
            subjectMap[entry.subject] = { questions: 0, time: 0 };
          }
          subjectMap[entry.subject].questions += entry.questionCount;
          subjectMap[entry.subject].time += entry.timeSpent;
        });
        
        const subjectStats = Object.entries(subjectMap).map(([subject, data]) => ({
          subject,
          questions: data.questions,
          time: data.time
        })).sort((a, b) => b.questions - a.questions);
        
        // Son kayıtlar
        const recentEntries = [...allEntries]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        const questionStats: StudentQuestionStats = {
          totalEntries: allEntries.length,
          totalQuestions,
          totalTime,
          averagePerDay: allEntries.length > 0 ? Math.round(totalQuestions / allEntries.length) : 0,
          subjectStats,
          recentEntries
        };
        
        setStats(questionStats);
        setEntries(allEntries);
      } else {
        // Veri yoksa boş stats oluştur
        setStats({
          totalEntries: 0,
          totalQuestions: 0,
          totalTime: 0,
          averagePerDay: 0,
          subjectStats: [],
          recentEntries: []
        });
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching question stats:', error);
      setError('Soru istatistikleri yüklenemedi');
      toast.error('Soru istatistikleri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/student-report/${studentId}`);
  };

  // Ders bazlı grafik verisi
  const getSubjectChartData = () => {
    if (!stats?.subjectStats || stats.subjectStats.length === 0) return null;

    const topSubjects = stats.subjectStats.slice(0, 8); // En çok soru çözülen 8 ders

    return {
      labels: topSubjects.map(s => s.subject),
      datasets: [
        {
          label: 'Soru Sayısı',
          data: topSubjects.map(s => s.questions),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Süre (dk)',
          data: topSubjects.map(s => s.time),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Genel dağılım pasta grafiği - ders bazında
  const getDistributionChartData = () => {
    if (!stats?.subjectStats || stats.subjectStats.length === 0) return null;

    const topSubjects = stats.subjectStats.slice(0, 6); // İlk 6 ders
    const colors = [
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(236, 72, 153, 0.8)',
    ];

    return {
      labels: topSubjects.map(s => s.subject),
      datasets: [
        {
          data: topSubjects.map(s => s.questions),
          backgroundColor: colors.slice(0, topSubjects.length),
          borderColor: colors.slice(0, topSubjects.length).map(color => color.replace('0.8', '1')),
          borderWidth: 2,
        },
      ],
    };
  };

  // Günlük performans grafiği
  const getDailyChartData = () => {
    if (!entries || entries.length === 0) return null;

    // Son 30 günü göster
    const last30Days = entries
      .slice(-30)
      .sort((a: QuestionEntry, b: QuestionEntry) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      labels: last30Days.map((entry: QuestionEntry) => new Date(entry.date).toLocaleDateString('tr-TR')),
      datasets: [
        {
          label: 'Soru Sayısı',
          data: last30Days.map((entry: QuestionEntry) => entry.questionCount),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
        {
          label: 'Süre (dk)',
          data: last30Days.map((entry: QuestionEntry) => entry.timeSpent),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Soru istatistikleri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Hata Oluştu</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchQuestionStats}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  {selectedStudent?.name || 'Öğrenci'} - Soru İstatistikleri
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchQuestionStats}
                disabled={loading}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Mevcut Dersler Bilgisi */}
        {availableSubjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200"
          >
            <h3 className="text-sm font-medium text-blue-800 mb-2">Sistemdeki Dersler:</h3>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map((subject, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium"
                >
                  {subject}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* İstatistik Kartları */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Soru</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Süre</p>
                  <p className="text-2xl font-bold text-green-600">{Math.floor(stats.totalTime / 60)}s {stats.totalTime % 60}dk</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama/Gün</p>
                  <p className="text-2xl font-bold text-green-600">{stats.averagePerDay}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Kayıt</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalEntries}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grafikler */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ders Bazlı Analiz */}
            {getSubjectChartData() && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
                  Ders Bazında Analiz
                </h3>
                <div className="h-64">
                  <Bar data={getSubjectChartData()!} options={chartOptions} />
                </div>
              </motion.div>
            )}

            {/* Genel Dağılım */}
            {getDistributionChartData() && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  Genel Dağılım
                </h3>
                <div className="h-64">
                  <Doughnut 
                    data={getDistributionChartData()!} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                      },
                    }} 
                  />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Günlük Performans Grafiği */}
        {stats && getDailyChartData() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-purple-600 mr-2" />
              Günlük Performans Trendi
            </h3>
            <div className="h-64">
              <Bar data={getDailyChartData()!} options={chartOptions} />
            </div>
          </motion.div>
        )}

        {/* Ders Detayları Tablosu */}
        {stats && stats.subjectStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ders Detayları
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Soru Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Süre (dk)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ortalama/Gün
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kayıt Sayısı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Son Çalışma
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.subjectStats.map((subject, index) => {
                    // Bu ders için kayıtları filtrele
                    const subjectEntries = entries.filter(entry => entry.subject === subject.subject);
                    const lastEntry = subjectEntries.length > 0 ? 
                      subjectEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subject.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subject.questions}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                          {subject.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {subjectEntries.length > 0 ? Math.round(subject.questions / subjectEntries.length) : 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subjectEntries.length}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600">
                          {lastEntry ? new Date(lastEntry.date).toLocaleDateString('tr-TR') : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Veri Yok Mesajı */}
        {stats && stats.totalQuestions === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-8 border border-gray-100 text-center"
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Henüz soru istatistiği bulunmuyor
            </h3>
            <p className="text-gray-500">
              Öğrenci henüz hiç ödev yapmamış veya soru istatistikleri girilmemiş.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentQuestionStats;