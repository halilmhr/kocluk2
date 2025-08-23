import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, BarChart3, Calendar, Target, TrendingUp,
  GraduationCap, Filter, RefreshCw, AlertCircle, Award, ChevronDown, ChevronUp
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { getExamStatistics } from '../../lib/examService';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StudentExam {
  id: string;
  student_id: string;
  exam_type: 'TYT' | 'AYT' | 'LGS';
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  empty_answers: number;
  score: number;
  net_score: number;
  subject_scores: any;
}

interface ExamStats {
  totalExams: number;
  averageNet: string;
  bestNet: string;
  latestNet: string;
  improvement: string;
}

interface ExamGroup {
  examName: string;
  exams: StudentExam[];
  latestDate: string;
  totalNet: number;
  examCount: number;
}

const StudentExamAnalysis: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useDataStore();
  
  const [allExams, setAllExams] = useState<StudentExam[]>([]);
  const [filteredExams, setFilteredExams] = useState<StudentExam[]>([]);
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<'ALL' | 'TYT' | 'AYT' | 'LGS'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && studentId) {
      fetchStudents(user.id);
      fetchExamData();
    }
  }, [user, studentId]);

  useEffect(() => {
    filterExams();
  }, [allExams, selectedExamType]);

  const fetchExamData = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Tüm sınavları getir
      const { data: allExamData, error: allExamError } = await getExamStatistics(studentId);
      
      if (allExamError) {
        setError('Sınav verileri yüklenirken hata oluştu');
        return;
      }
      
      setAllExams(allExamData || []);
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu');
      console.error('Exam data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterExams = async () => {
    let filtered = allExams;
    
    if (selectedExamType !== 'ALL') {
      filtered = allExams.filter(exam => exam.exam_type === selectedExamType);
    }
    
    setFilteredExams(filtered);
    
    // Filtrelenmiş veriler için istatistikleri hesapla
    if (filtered.length > 0) {
      const stats = {
        totalExams: filtered.length,
        averageNet: (filtered.reduce((sum, exam) => sum + exam.net_score, 0) / filtered.length).toFixed(2),
        bestNet: Math.max(...filtered.map(exam => exam.net_score)).toFixed(2),
        latestNet: filtered.length > 0 ? filtered[0].net_score.toFixed(2) : '0',
        improvement: filtered.length >= 2 ? (filtered[0].net_score - filtered[filtered.length - 1].net_score).toFixed(2) : '0'
      };
      setExamStats(stats);
    } else {
      setExamStats(null);
    }
  };

  const student = students.find(s => s.id === studentId);

  // Deneme gruplarını oluşturma
  const getGroupedExams = (): ExamGroup[] => {
    const examsByName: { [key: string]: StudentExam[] } = {};
    
    filteredExams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'AYT') {
        // AYT için examName'den ders kısmını çıkar
        examName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
      } else {
        // TYT ve LGS için examName'i direkt kullan
        examName = exam.subject_scores?.examName || `${exam.exam_type} - ${exam.exam_date}`;
      }
      
      if (!examsByName[examName]) {
        examsByName[examName] = [];
      }
      examsByName[examName].push(exam);
    });

    // Her deneme grubunu tarihe göre sırala ve deneme gruplarını da tarihe göre sırala
    const sortedGroups = Object.entries(examsByName).map(([examName, examList]) => {
      const sortedExams = examList.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime());
      const latestDate = sortedExams[0].exam_date;
      const totalNet = sortedExams.reduce((sum, exam) => sum + exam.net_score, 0);
      
      return {
        examName,
        exams: sortedExams,
        latestDate,
        totalNet,
        examCount: sortedExams.length
      };
    }).sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
    
    return sortedGroups;
  };

  const toggleGroupExpansion = (examName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(examName)) {
      newExpanded.delete(examName);
    } else {
      newExpanded.add(examName);
    }
    setExpandedGroups(newExpanded);
  };

  // Net skor trend grafiği
  const getNetScoreTrend = () => {
    // Sınavları deneme başlığına göre grupla
    const examsByName: { [key: string]: StudentExam[] } = {};
    
    filteredExams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'AYT') {
        // AYT için examName'den ders kısmını çıkar
        examName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
      } else {
        // TYT ve LGS için examName'i direkt kullan
        examName = exam.subject_scores?.examName || `${exam.exam_type} - ${exam.exam_date}`;
      }
      
      if (!examsByName[examName]) {
        examsByName[examName] = [];
      }
      examsByName[examName].push(exam);
    });

    // Her deneme için toplam net hesapla ve tarihe göre sırala
    const examData = Object.entries(examsByName).map(([examName, examList]) => {
      const totalNet = examList.reduce((sum, exam) => sum + exam.net_score, 0);
      
      // En son tarihli sınavı al (sıralama için)
      const latestExam = examList.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
      
      return {
        examName,
        totalNet,
        date: latestExam.exam_date,
        examCount: examList.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      labels: examData.map(item => item.examName),
      datasets: [
        {
          label: 'Net Skor',
          data: examData.map(item => item.totalNet),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        }
      ]
    };
  };

  // Doğru/Yanlış dağılımı
  const getAnswerDistribution = () => {
    const totalCorrect = filteredExams.reduce((sum, exam) => sum + exam.correct_answers, 0);
    const totalWrong = filteredExams.reduce((sum, exam) => sum + exam.wrong_answers, 0);
    const totalEmpty = filteredExams.reduce((sum, exam) => sum + exam.empty_answers, 0);
    
    return {
      labels: ['Doğru', 'Yanlış', 'Boş'],
      datasets: [
        {
          data: [totalCorrect, totalWrong, totalEmpty],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(239, 68, 68)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 2,
        }
      ]
    };
  };

  // Deneme bazlı performans
  const getExamBasedPerformance = () => {
    // Sınavları deneme başlığına göre grupla
    const examsByName: { [key: string]: StudentExam[] } = {};
    
    filteredExams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'AYT') {
        // AYT için examName'den ders kısmını çıkar
        examName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
      } else {
        // TYT ve LGS için examName'i direkt kullan
        examName = exam.subject_scores?.examName || `${exam.exam_type} - ${exam.exam_date}`;
      }
      
      if (!examsByName[examName]) {
        examsByName[examName] = [];
      }
      examsByName[examName].push(exam);
    });

    // Her deneme için ortalama net hesapla
    const examData = Object.entries(examsByName).map(([examName, examList]) => {
      const averageNet = examList.reduce((sum, exam) => sum + exam.net_score, 0) / examList.length;
      
      // En son tarihli sınavı al (sıralama için)
      const latestExam = examList.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
      
      return {
        examName,
        averageNet,
        date: latestExam.exam_date,
        examCount: examList.length
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      labels: examData.map(item => item.examName),
      datasets: [
        {
          label: 'Ortalama Net',
          data: examData.map(item => parseFloat(item.averageNet.toFixed(2))),
          backgroundColor: 'rgba(139, 92, 246, 0.8)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Sınav verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600 mb-4">{error || 'Öğrenci bulunamadı'}</p>
          <button
            onClick={() => navigate(`/students/${studentId}`)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Öğrenci Detayına Dön
          </button>
        </div>
      </div>
    );
  }

  if (allExams.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <button
              onClick={() => navigate(`/students/${studentId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft size={20} className="mr-2" />
              Öğrenci Detayına Dön
            </button>
          </div>
          
          <div className="text-center py-12">
            <BarChart3 className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Henüz Sınav Verisi Yok</h2>
            <p className="text-gray-600 mb-6">
              {student.name} için henüz hiç sınav verisi bulunmuyor.
            </p>
            <button
              onClick={() => navigate(`/students/${studentId}`)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Öğrenci Detayına Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/students/${studentId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Öğrenci Detayına Dön
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                  <p className="text-gray-600">Deneme Analizi & Performans Takibi</p>
                </div>
              </div>
              
              <button
                onClick={fetchExamData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Filtre */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Sınav Türü Filtresi</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['ALL', 'TYT', 'AYT', 'LGS'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedExamType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedExamType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'ALL' ? 'Tümü' : type} 
                ({type === 'ALL' ? allExams.length : allExams.filter(e => e.exam_type === type).length})
              </button>
            ))}
          </div>
        </div>

        {/* İstatistik Kartları */}
        {examStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Toplam Sınav</p>
                  <p className="text-2xl font-bold text-gray-900">{examStats.totalExams}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ortalama Net</p>
                  <p className="text-2xl font-bold text-gray-900">{examStats.averageNet}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En İyi Net</p>
                  <p className="text-2xl font-bold text-gray-900">{examStats.bestNet}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gelişim</p>
                  <p className={`text-2xl font-bold ${parseFloat(examStats.improvement) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(examStats.improvement) > 0 ? '+' : ''}{examStats.improvement}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Net Skor Trendi */}
          {filteredExams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Skor Trendi</h3>
              <div className="h-80">
                <Line
                  data={getNetScoreTrend()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        display: true,
                        ticks: {
                          maxRotation: 45,
                          minRotation: 45,
                        },
                      },
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Doğru/Yanlış Dağılımı */}
          {filteredExams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cevap Dağılımı</h3>
              <div className="h-80">
                <Doughnut
                  data={getAnswerDistribution()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Deneme Bazlı Performans */}
          {filteredExams.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deneme Bazlı Performans</h3>
              <div className="h-80">
                <Bar
                  data={getExamBasedPerformance()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Deneme Bazlı Detaylı Sınav Listesi */}
        {filteredExams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deneme Bazlı Sınav Detayları ({getGroupedExams().length} deneme)
            </h3>
            
            <div className="space-y-4">
              {getGroupedExams().map((group) => (
                <div key={group.examName} className="border border-gray-200 rounded-lg">
                  {/* Deneme Başlığı */}
                  <div
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroupExpansion(group.examName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium text-gray-900">{group.examName}</h4>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {group.examCount} sınav
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 text-right">
                          <p className="text-sm text-gray-600">Toplam Net</p>
                          <p className="text-lg font-bold text-blue-600">{group.totalNet.toFixed(2)}</p>
                        </div>
                        <div className="mr-4 text-right">
                          <p className="text-sm text-gray-600">Son Tarih</p>
                          <p className="text-sm text-gray-900">
                            {new Date(group.latestDate).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        {expandedGroups.has(group.examName) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sınav Detayları */}
                  {expandedGroups.has(group.examName) && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sınav Adı
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Türü
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tarih
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Doğru
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Yanlış
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Boş
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Net
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {group.exams.map((exam, examIndex) => (
                              <tr key={exam.id} className={examIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {exam.subject_scores?.examName || `${exam.exam_type} Denemesi`}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    exam.exam_type === 'TYT' ? 'bg-blue-100 text-blue-800' :
                                    exam.exam_type === 'AYT' ? 'bg-green-100 text-green-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {exam.exam_type}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {new Date(exam.exam_date).toLocaleDateString('tr-TR')}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                  {exam.correct_answers}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                                  {exam.wrong_answers}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {exam.empty_answers}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">
                                  {exam.net_score.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StudentExamAnalysis;
