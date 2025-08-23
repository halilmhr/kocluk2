import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { getStudentExams, getExamStatistics, deleteStudentExam, StudentExam, getStudentIdFromAuthUser } from '../../lib/examService';
import { ArrowLeft, Calendar, TrendingUp, Target, Award, Trash2, BarChart3, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const StudentExams: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'ALL' | 'TYT' | 'AYT' | 'LGS'>('ALL');
  const [expandedExams, setExpandedExams] = useState<Set<string>>(new Set());

  const toggleExpanded = (examKey: string) => {
    setExpandedExams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(examKey)) {
        newSet.delete(examKey);
      } else {
        newSet.add(examKey);
      }
      return newSet;
    });
  };

  // Deneme başlığına göre özel istatistik hesaplama
  const calculateCustomStatistics = (exams: StudentExam[], examType: string) => {
    if (!exams || exams.length === 0) {
      return {
        totalExams: 0,
        averageNet: '0',
        bestNet: '0',
        latestNet: '0',
        improvement: '0'
      };
    }

    // Benzersiz deneme başlıklarını bul
    const uniqueExamNames = new Set<string>();
    const examsByName: { [key: string]: StudentExam[] } = {};

    exams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'AYT') {
        // AYT için examName'den ders kısmını çıkar
        examName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
      } else {
        // TYT ve LGS için examName'i direkt kullan
        examName = exam.subject_scores?.examName || exam.exam_date;
      }
      
      uniqueExamNames.add(examName);
      
      if (!examsByName[examName]) {
        examsByName[examName] = [];
      }
      examsByName[examName].push(exam);
    });

    // Her deneme için toplam net hesapla
    const examTotals: number[] = [];
    const examDates: { date: string; totalNet: number }[] = [];

    Object.entries(examsByName).forEach(([examName, examList]) => {
      const totalNet = examList.reduce((sum, exam) => sum + exam.net_score, 0);
      examTotals.push(totalNet);
      
      // En son tarihli sınavı al
      const latestExam = examList.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
      examDates.push({ date: latestExam.exam_date, totalNet });
    });

    // Tarihe göre sırala
    examDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalExams = uniqueExamNames.size;
    const averageNet = examTotals.length ? (examTotals.reduce((sum, net) => sum + net, 0) / examTotals.length).toFixed(2) : '0';
    const bestNet = examTotals.length ? Math.max(...examTotals).toFixed(2) : '0';
    const latestNet = examDates.length ? examDates[0].totalNet.toFixed(2) : '0';
    const improvement = examDates.length >= 2 ? (examDates[0].totalNet - examDates[examDates.length - 1].totalNet).toFixed(2) : '0';
    
    // Bir önceki denemeye göre değişim hesapla
    const previousChange = examDates.length >= 2 ? (examDates[0].totalNet - examDates[1].totalNet).toFixed(2) : '0';

    return {
      totalExams,
      averageNet,
      bestNet,
      latestNet,
      improvement,
      previousChange
    };
  };

  useEffect(() => {
    if (user?.id) {
      fetchExams();
    }
  }, [user?.id, selectedType]);

  const fetchExams = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { studentId } = await getStudentIdFromAuthUser(user.id);
      const examType = selectedType === 'ALL' ? undefined : selectedType;
      const { data, stats, error } = await getExamStatistics(studentId, examType as any);
      
      if (error) {
        console.error('Deneme istatistikleri getirme hatası:', error);
        toast.error('Denemeler yüklenirken hata oluştu');
      } else {
        setExams(data || []);
        
        // Deneme sayısını deneme başlığına göre hesapla
        const customStats = calculateCustomStatistics(data || [], selectedType);
        setStatistics(customStats);
      }
    } catch (error) {
      console.error('Deneme istatistikleri getirme hatası:', error);
      toast.error('Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('Bu denemeyi silmek istediğinizden emin misiniz?')) return;
    
    const { error } = await deleteStudentExam(examId);
    if (error) {
      toast.error('Deneme silinirken hata oluştu');
    } else {
      toast.success('Deneme başarıyla silindi');
      fetchExams();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case 'TYT': return 'bg-green-100 text-green-800';
      case 'AYT': return 'bg-green-100 text-green-800';
      case 'LGS': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTYTDetails = (exam: StudentExam) => {
    const subjects = [
      { name: 'Türkçe', data: exam.subject_scores.turkce },
      { name: 'Matematik', data: exam.subject_scores.matematik },
      { name: 'Fen Bilimleri', data: exam.subject_scores.fen },
      { name: 'Sosyal Bilimler', data: exam.subject_scores.sosyal }
    ];
    
    const totalCorrect = subjects.reduce((sum, subject) => sum + (subject.data?.correct || 0), 0);
    const totalWrong = subjects.reduce((sum, subject) => sum + (subject.data?.wrong || 0), 0);
    const totalBlank = subjects.reduce((sum, subject) => sum + (subject.data?.blank || 0), 0);
    const totalNet = subjects.reduce((sum, subject) => {
      const correct = subject.data?.correct || 0;
      const wrong = subject.data?.wrong || 0;
      return sum + (correct - wrong / 4);
    }, 0);
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-2 font-semibold text-gray-700">Ders</th>
                <th className="text-center p-2 font-semibold text-gray-700">Doğru</th>
                <th className="text-center p-2 font-semibold text-gray-700">Yanlış</th>
                <th className="text-center p-2 font-semibold text-gray-700">Boş</th>
                <th className="text-center p-2 font-semibold text-gray-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => {
                const correct = subject.data?.correct || 0;
                const wrong = subject.data?.wrong || 0;
                const blank = subject.data?.blank || 0;
                const net = correct - wrong / 4;
                
                return (
                  <tr key={subject.name} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="p-2 font-medium">{subject.name}</td>
                    <td className="p-2 text-center">{correct}</td>
                    <td className="p-2 text-center">{wrong}</td>
                    <td className="p-2 text-center">{blank}</td>
                    <td className="p-2 text-center font-bold text-blue-600">
                      {net.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-400 bg-blue-50">
                <td className="p-2 font-bold">TOPLAM</td>
                <td className="p-2 text-center font-bold">{totalCorrect}</td>
                <td className="p-2 text-center font-bold">{totalWrong}</td>
                <td className="p-2 text-center font-bold">{totalBlank}</td>
                <td className="p-2 text-center font-bold text-green-600">{totalNet.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAYTDetails = (aytExams: StudentExam[]) => {
    const subjects = ['Matematik', 'Edebiyat-Sosyal Bilimler 1', 'Sosyal Bilimler-2', 'Fen Bilimleri'];
    const examData: { [key: string]: StudentExam } = {};
    
    // AYT denemelerini subject'e göre grupla
    aytExams.forEach(exam => {
      if (exam.subject_scores?.subject) {
        examData[exam.subject_scores.subject] = exam;
      }
    });
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left p-2 font-semibold text-gray-700">Ders</th>
                <th className="text-center p-2 font-semibold text-gray-700">Doğru</th>
                <th className="text-center p-2 font-semibold text-gray-700">Yanlış</th>
                <th className="text-center p-2 font-semibold text-gray-700">Boş</th>
                <th className="text-center p-2 font-semibold text-gray-700">Net</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(subject => {
                const exam = examData[subject];
                return (
                  <tr key={subject} className="border-b border-gray-200 hover:bg-gray-100">
                    <td className="p-2 font-medium">{subject}</td>
                    <td className="p-2 text-center">{exam?.subject_scores?.correct || 0}</td>
                    <td className="p-2 text-center">{exam?.subject_scores?.wrong || 0}</td>
                    <td className="p-2 text-center">{exam?.subject_scores?.blank || 0}</td>
                    <td className="p-2 text-center font-bold text-blue-600">
                      {exam ? exam.net_score.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-gray-400 bg-blue-50">
                <td className="p-2 font-bold">TOPLAM</td>
                <td className="p-2 text-center font-bold">
                  {subjects.reduce((sum, subject) => sum + (examData[subject]?.subject_scores?.correct || 0), 0)}
                </td>
                <td className="p-2 text-center font-bold">
                  {subjects.reduce((sum, subject) => sum + (examData[subject]?.subject_scores?.wrong || 0), 0)}
                </td>
                <td className="p-2 text-center font-bold">
                  {subjects.reduce((sum, subject) => sum + (examData[subject]?.subject_scores?.blank || 0), 0)}
                </td>
                <td className="p-2 text-center font-bold text-green-600">
                  {subjects.reduce((sum, subject) => sum + (examData[subject]?.net_score || 0), 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSingleSubjectDetails = (exam: StudentExam) => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-600">Ders</div>
          <div className="font-semibold">{exam.subject_scores.subject}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Doğru - Yanlış - Boş</div>
          <div className="font-semibold">{exam.correct_answers}D - {exam.wrong_answers}Y - {exam.empty_answers}B</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Net</div>
          <div className="text-blue-600 font-bold text-lg">{exam.net_score.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Denemeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/student/welcome')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Ana Sayfaya Dön
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Denemelerim</h1>
          <div></div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedType === 'ALL' ? 'Toplam Deneme' : `${selectedType} Deneme`}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.totalExams}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedType === 'ALL' ? 'Ortalama Net' : `${selectedType} Ortalama`}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.averageNet}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <Award className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedType === 'ALL' ? 'En İyi Net' : `${selectedType} En İyi`}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">{statistics.bestNet}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedType === 'ALL' ? 'Son Gelişim' : `${selectedType} Son Net`}
                  </p>
                  <p className={`text-2xl font-bold ${
                    selectedType === 'ALL' 
                      ? (parseFloat(statistics.improvement) >= 0 ? 'text-green-600' : 'text-red-600')
                      : 'text-gray-800'
                  }`}>
                    {selectedType === 'ALL' 
                      ? `${parseFloat(statistics.improvement) >= 0 ? '+' : ''}${statistics.improvement}`
                      : statistics.latestNet
                    }
                  </p>
                  {selectedType !== 'ALL' && statistics.previousChange && (
                    <p className={`text-sm font-medium ${
                      parseFloat(statistics.previousChange) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(statistics.previousChange) >= 0 ? '+' : ''}{statistics.previousChange} (önceki denemeye göre)
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}



        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['ALL', 'TYT', 'AYT', 'LGS'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as any)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {type === 'ALL' ? 'Tümü' : type}
            </button>
          ))}
        </div>

        {/* Exams List */}
        <div className="space-y-4">
          {exams.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Henüz deneme bulunmuyor</h3>
              <p className="text-gray-500">İlk denemenizi eklemek için ana sayfaya dönün.</p>
            </div>
          ) : (
            (() => {
              // AYT denemelerini grupla
              const groupedExams: { [key: string]: StudentExam[] } = {};
              const otherExams: StudentExam[] = [];
              
              exams.forEach(exam => {
                if (exam.exam_type === 'AYT') {
                  const examBaseName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
                  if (!groupedExams[examBaseName]) {
                    groupedExams[examBaseName] = [];
                  }
                  groupedExams[examBaseName].push(exam);
                } else {
                  otherExams.push(exam);
                }
              });
              
              const allDisplayExams = [
                ...Object.entries(groupedExams).map(([examName, aytExams]) => ({
                  type: 'AYT_GROUP',
                  examName,
                  exams: aytExams,
                  exam_date: aytExams[0].exam_date,
                  totalNet: aytExams.reduce((sum, exam) => sum + exam.net_score, 0)
                })),
                ...otherExams.map(exam => ({ type: 'SINGLE', exam }))
              ];
              
              return allDisplayExams.map((item, index) => {
                if (item.type === 'AYT_GROUP') {
                  return (
                    <motion.div
                      key={`ayt-${item.examName}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          onClick={() => toggleExpanded(item.examName)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              AYT
                            </span>
                            <h3 className="text-xl font-bold text-gray-800">{item.examName}</h3>
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-500 transition-transform ${
                                expandedExams.has(item.examName) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(item.exam_date)}
                            </div>
                            <div className="font-semibold text-blue-600">
                              Toplam Net: {item.totalNet.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Tüm AYT denemelerini sil
                            item.exams.forEach(exam => handleDeleteExam(exam.id));
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      {expandedExams.has(item.examName) && renderAYTDetails(item.exams)}
                    </motion.div>
                  );
                } else {
                  const exam = item.exam;
                  return (
                    <motion.div
                      key={exam.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div 
                          className="flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          onClick={() => toggleExpanded(exam.subject_scores.examName)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getExamTypeColor(exam.exam_type)}`}>
                              {exam.exam_type}
                            </span>
                            <h3 className="text-xl font-bold text-gray-800">{exam.subject_scores.examName}</h3>
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-500 transition-transform ${
                                expandedExams.has(exam.subject_scores.examName) ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(exam.exam_date)}
                            </div>
                            <div className="font-semibold text-blue-600">
                              Toplam Net: {exam.net_score.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      {expandedExams.has(exam.subject_scores.examName) && (exam.exam_type === 'TYT' ? renderTYTDetails(exam) : renderSingleSubjectDetails(exam))}
                    </motion.div>
                  );
                }
              });
            })()
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentExams;