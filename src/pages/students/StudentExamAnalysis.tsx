import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import { motion } from 'framer-motion';
import { getStudentExams, StudentExam } from '../../lib/examService';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import {
  Calendar,
  GraduationCap,
  Target,
  Trophy,
  Star,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  User,
  ArrowLeft,
  BarChart3
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExamStats {
  totalExams: number;
  averageNet: string;
  bestNet: string;
  accuracy: string;
  improvement: string;
}

interface ExamGroup {
  examName: string;
  exams: StudentExam[];
  totalNet: number;
  examCount: number;
  latestDate: string;
}

const StudentExamAnalysis: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useDataStore();
  
  const [allExams, setAllExams] = useState<StudentExam[]>([]);
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<'ALL' | 'TYT' | 'AYT' | 'LGS'>('ALL');
  const [selectedChartView, setSelectedChartView] = useState<'progress' | 'comparison' | 'subjects'>('progress');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedTYTSubject, setSelectedTYTSubject] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user && studentId) {
      fetchStudents(user.id);
      fetchExamData();
    }
  }, [user, studentId]);

  const selectedStudent = students?.find(s => s.id === studentId);

  const fetchExamData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      
      const { data, error } = await getStudentExams(studentId);
      
      if (error) {
        throw error;
      }

      setAllExams(data || []);
      
    } catch (error) {
      console.error('Error fetching exam data:', error);
      setError('Deneme verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExams = (): StudentExam[] => {
    if (!selectedStudent?.id || !allExams) return [];

    return allExams.filter(exam => {
      // Öğrenci ID kontrolü
      const studentMatch = exam.student_id === selectedStudent.id;
      
      // Deneme türü kontrolü
      const examTypeMatch = selectedExamType === 'ALL' || exam.exam_type === selectedExamType;
      
      // AYT seçiliyse Türkçe'yi filtrele
      if (selectedExamType === 'AYT' && exam.subject_scores?.subject === 'Türkçe') {
        return false;
      }
      
      // Ders kontrolü - TYT için özel mantık
      let subjectMatch = true;
      if (selectedSubject !== 'ALL') {
        if (exam.exam_type === 'TYT') {
          // TYT'de tüm dersler tek kayıtta olduğu için "ALL" dışında filtreleme yapma
          subjectMatch = true;
        } else {
          // AYT ve diğerleri için mevcut mantığı koru
          subjectMatch = exam.subject_scores?.subject === selectedSubject;
        }
      }
      
      return studentMatch && examTypeMatch && subjectMatch;
    });
  };

  const getAvailableSubjects = (): string[] => {
    const subjects = new Set<string>();
    
    allExams.forEach(exam => {
      // Seçili exam type'a göre filtrele
      if (selectedExamType !== 'ALL' && exam.exam_type !== selectedExamType) {
        return; // Bu exam type seçilmemişse atla
      }
      
      if (exam.exam_type === 'TYT') {
        // TYT için ana ders kategorilerini ekle
        subjects.add('Türkçe');
        subjects.add('Matematik');
        subjects.add('Fen Bilimleri');
        subjects.add('Sosyal Bilimler');
      } else if (exam.subject_scores?.subject) {
        // AYT ve diğerleri için Türkçe'yi kaldır
        if (exam.subject_scores.subject !== 'Türkçe') {
          subjects.add(exam.subject_scores.subject);
        }
      }
    });
    
    return Array.from(subjects).sort();
  };

  const getGroupedExamsForStats = (): ExamGroup[] => {
    const filteredExams = getFilteredExams();
    
    const groupedData: { [key: string]: StudentExam[] } = {};
    
    filteredExams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'TYT') {
        // TYT için examName'i subject_scores'dan al
        examName = exam.subject_scores?.examName || `TYT Denemesi - ${new Date(exam.exam_date).toLocaleDateString('tr-TR')}`;
      } else {
        // AYT ve diğerleri için mevcut mantığı koru
        examName = exam.subject_scores?.examName || `${exam.exam_type} Denemesi - ${new Date(exam.exam_date).toLocaleDateString('tr-TR')}`;
        
        // Eğer examName'de " - " varsa, sadece ilk kısmını al (deneme adı)
        if (examName.includes(' - ')) {
          examName = examName.split(' - ')[0];
        }
      }
      
      if (!groupedData[examName]) {
        groupedData[examName] = [];
      }
      groupedData[examName].push(exam);
    });

    return Object.keys(groupedData).map(examName => {
      const exams = groupedData[examName];
      let totalNet = 0;
      
      if (selectedExamType === 'TYT' || (selectedExamType === 'ALL' && exams[0]?.exam_type === 'TYT')) {
        // TYT için toplam net puanını al
        totalNet = exams.reduce((sum, exam) => sum + exam.net_score, 0);
      } else {
        // AYT için mevcut mantığı koru
        totalNet = exams.reduce((sum, exam) => sum + exam.net_score, 0);
      }
      
      const latestDate = exams.reduce((latest, exam) => 
        new Date(exam.exam_date) > new Date(latest) ? exam.exam_date : latest, 
        exams[0]?.exam_date || ''
      );

      return {
        examName,
        exams,
        totalNet,
        examCount: 1, // Her grup 1 deneme sayılır (alt dersler değil)
        latestDate
      };
    }).sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
  };

  const toggleGroupExpansion = (examName: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(examName)) {
      newExpandedGroups.delete(examName);
    } else {
      newExpandedGroups.add(examName);
    }
    setExpandedGroups(newExpandedGroups);
  };

  // Grafik verileri hazırlama fonksiyonları
  const getProgressChartData = () => {
    const groupedExams = getGroupedExamsForStats();
    const sortedGroups = groupedExams.sort((a, b) => new Date(a.latestDate).getTime() - new Date(b.latestDate).getTime());
    
    let chartData = [];
    let labelText = 'Net Puan';
    
    if (selectedExamType === 'TYT' && selectedSubject !== 'ALL') {
      // TYT'de spesifik ders seçildiyse, o dersin verilerini al
      chartData = sortedGroups.map(group => {
        const exam = group.exams[0]; // TYT'de grup başına bir exam olur
        if (exam?.subject_scores) {
          switch (selectedSubject) {
            case 'Türkçe':
              return (exam.subject_scores.turkce?.correct || 0) - ((exam.subject_scores.turkce?.wrong || 0) * 0.25);
            case 'Matematik':
              return (exam.subject_scores.matematik?.correct || 0) - ((exam.subject_scores.matematik?.wrong || 0) * 0.25);
            case 'Fen Bilimleri':
              return (exam.subject_scores.fen?.correct || 0) - ((exam.subject_scores.fen?.wrong || 0) * 0.25);
            case 'Sosyal Bilimler':
              return (exam.subject_scores.sosyal?.correct || 0) - ((exam.subject_scores.sosyal?.wrong || 0) * 0.25);
            default:
              return group.totalNet;
          }
        }
        return 0;
      });
      labelText = `${selectedSubject} Net`;
    } else {
      // Genel durumda toplam net puanı kullan
      chartData = sortedGroups.map(group => group.totalNet);
      labelText = selectedSubject === 'ALL' ? 'Net Puan' : `${selectedSubject} Net`;
    }
    
    return {
      labels: sortedGroups.map(group => group.examName),
      datasets: [
        {
          label: labelText,
          data: chartData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const getSubjectPerformanceData = () => {
    const groupedExams = getGroupedExamsForStats();
    
    let chartData = [];
    let labelText = 'Net Puan';
    let backgroundColor = 'rgba(34, 197, 94, 0.8)';
    let borderColor = 'rgb(34, 197, 94)';
    
    if (selectedExamType === 'TYT' && selectedSubject !== 'ALL') {
      // TYT'de spesifik ders seçildiyse
      chartData = groupedExams.map(group => {
        const exam = group.exams[0];
        if (exam?.subject_scores) {
          switch (selectedSubject) {
            case 'Türkçe':
              return (exam.subject_scores.turkce?.correct || 0) - ((exam.subject_scores.turkce?.wrong || 0) * 0.25);
            case 'Matematik':
              return (exam.subject_scores.matematik?.correct || 0) - ((exam.subject_scores.matematik?.wrong || 0) * 0.25);
            case 'Fen Bilimleri':
              return (exam.subject_scores.fen?.correct || 0) - ((exam.subject_scores.fen?.wrong || 0) * 0.25);
            case 'Sosyal Bilimler':
              return (exam.subject_scores.sosyal?.correct || 0) - ((exam.subject_scores.sosyal?.wrong || 0) * 0.25);
            default:
              return group.totalNet;
          }
        }
        return 0;
      });
      labelText = `${selectedSubject} Net`;
      backgroundColor = 'rgba(59, 130, 246, 0.8)';
      borderColor = 'rgb(59, 130, 246)';
    } else {
      chartData = groupedExams.map(group => group.totalNet);
      labelText = selectedSubject === 'ALL' ? 'Net Puan' : `${selectedSubject} Net`;
    }
    
    return {
      labels: groupedExams.map(group => group.examName),
      datasets: [
        {
          label: labelText,
          data: chartData,
          backgroundColor,
          borderColor,
          borderWidth: 2,
        }
      ]
    };
  };

  const getTYTSubjectDetailData = (mainSubject: string) => {
    // TYT alt dersleri için detaylı grafik
    let groupedExams = getGroupedExamsForStats().filter(group => 
      group.exams[0]?.exam_type === 'TYT'
    );
    
    if (selectedExam) {
      groupedExams = groupedExams.filter(group => group.examName === selectedExam);
    }
    
    const examNames: string[] = [];
    let subjectData: { [key: string]: number[] } = {};
    
    if (mainSubject === 'Fen Bilimleri') {
      subjectData = {
        'Fizik': [],
        'Kimya': [],
        'Biyoloji': []
      };
    } else if (mainSubject === 'Sosyal Bilimler') {
      subjectData = {
        'Tarih': [],
        'Coğrafya': [],
        'Felsefe': [],
        'DKAB': []
      };
    }

    groupedExams.forEach(group => {
      examNames.push(group.examName);
      const exam = group.exams[0];
      
      if (exam?.subject_scores) {
        if (mainSubject === 'Fen Bilimleri') {
          subjectData['Fizik'].push(
            (exam.subject_scores.fen?.fizik?.correct || 0) - ((exam.subject_scores.fen?.fizik?.wrong || 0) * 0.25)
          );
          subjectData['Kimya'].push(
            (exam.subject_scores.fen?.kimya?.correct || 0) - ((exam.subject_scores.fen?.kimya?.wrong || 0) * 0.25)
          );
          subjectData['Biyoloji'].push(
            (exam.subject_scores.fen?.biyoloji?.correct || 0) - ((exam.subject_scores.fen?.biyoloji?.wrong || 0) * 0.25)
          );
        } else if (mainSubject === 'Sosyal Bilimler') {
          subjectData['Tarih'].push(
            (exam.subject_scores.sosyal?.tarih?.correct || 0) - ((exam.subject_scores.sosyal?.tarih?.wrong || 0) * 0.25)
          );
          subjectData['Coğrafya'].push(
            (exam.subject_scores.sosyal?.cografya?.correct || 0) - ((exam.subject_scores.sosyal?.cografya?.wrong || 0) * 0.25)
          );
          subjectData['Felsefe'].push(
            (exam.subject_scores.sosyal?.felsefe?.correct || 0) - ((exam.subject_scores.sosyal?.felsefe?.wrong || 0) * 0.25)
          );
          subjectData['DKAB'].push(
            (exam.subject_scores.sosyal?.dinKultur?.correct || 0) - ((exam.subject_scores.sosyal?.dinKultur?.wrong || 0) * 0.25)
          );
        }
      } else {
        // Veri yoksa sıfır ekle
        Object.keys(subjectData).forEach(key => {
          subjectData[key].push(0);
        });
      }
    });

    const colors = [
      'rgba(239, 68, 68, 0.8)',   // Kırmızı
      'rgba(59, 130, 246, 0.8)',  // Mavi  
      'rgba(34, 197, 94, 0.8)',   // Yeşil
      'rgba(245, 158, 11, 0.8)',  // Sarı
    ];

    return {
      labels: examNames,
      datasets: Object.keys(subjectData).map((subject, index) => ({
        label: subject,
        data: subjectData[subject],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.8', '1'),
        borderWidth: 2,
      }))
    };
  };

  const getTYTSubjectComparisonData = () => {
    // TYT için ders bazlı karşılaştırma
    let groupedExams = getGroupedExamsForStats().filter(group => 
      group.exams[0]?.exam_type === 'TYT'
    );
    
    // Eğer belirli bir deneme seçildiyse, sadece o denemeyi göster
    if (selectedExam) {
      groupedExams = groupedExams.filter(group => group.examName === selectedExam);
    }
    
    const examNames: string[] = [];
    const subjectData = {
      'Türkçe': [] as number[],
      'Matematik': [] as number[],
      'Fen Bilimleri': [] as number[],
      'Sosyal Bilimler': [] as number[]
    };

    groupedExams.forEach(group => {
      examNames.push(group.examName);
      const exam = group.exams[0];
      
      if (exam?.subject_scores) {
        subjectData['Türkçe'].push(
          (exam.subject_scores.turkce?.correct || 0) - ((exam.subject_scores.turkce?.wrong || 0) * 0.25)
        );
        subjectData['Matematik'].push(
          (exam.subject_scores.matematik?.correct || 0) - ((exam.subject_scores.matematik?.wrong || 0) * 0.25)
        );
        subjectData['Fen Bilimleri'].push(
          (exam.subject_scores.fen?.correct || 0) - ((exam.subject_scores.fen?.wrong || 0) * 0.25)
        );
        subjectData['Sosyal Bilimler'].push(
          (exam.subject_scores.sosyal?.correct || 0) - ((exam.subject_scores.sosyal?.wrong || 0) * 0.25)
        );
      } else {
        // Veri yoksa sıfır ekle
        Object.keys(subjectData).forEach(key => {
          subjectData[key as keyof typeof subjectData].push(0);
        });
      }
    });

    const colors = [
      'rgba(34, 197, 94, 0.8)',  // Türkçe - Yeşil
      'rgba(59, 130, 246, 0.8)', // Matematik - Mavi
      'rgba(239, 68, 68, 0.8)',  // Fen - Kırmızı
      'rgba(245, 158, 11, 0.8)', // Sosyal - Sarı
    ];

    return {
      labels: examNames,
      datasets: Object.keys(subjectData).map((subject, index) => ({
        label: subject,
        data: subjectData[subject as keyof typeof subjectData],
        backgroundColor: colors[index],
        borderColor: colors[index].replace('0.8', '1'),
        borderWidth: 2,
      }))
    };
  };

  const getAYTSubjectComparisonData = () => {
    // AYT için ders bazlı karşılaştırma
    const aytExams = getFilteredExams().filter(exam => exam.exam_type === 'AYT');
    const subjects = [...new Set(aytExams
      .map(exam => exam.subject_scores?.subject)
      .filter(subject => subject && subject !== 'Türkçe')
    )];
    const subjectData: { [key: string]: number[] } = {};
    const examNames: string[] = [];

    // Her ders için veri hazırla
    subjects.forEach(subject => {
      subjectData[subject] = [];
    });

    let groupedExams = getGroupedExamsForStats().filter(group => 
      group.exams[0]?.exam_type === 'AYT'
    );
    
    // Eğer belirli bir deneme seçildiyse, sadece o denemeyi göster
    if (selectedExam) {
      groupedExams = groupedExams.filter(group => group.examName === selectedExam);
    }
    
    groupedExams.forEach(group => {
      examNames.push(group.examName);
      subjects.forEach(subject => {
        const subjectExam = group.exams.find(exam => exam.subject_scores?.subject === subject);
        subjectData[subject].push(subjectExam ? subjectExam.net_score : 0);
      });
    });

    const colors = [
      'rgba(59, 130, 246, 0.8)', // Mavi
      'rgba(34, 197, 94, 0.8)',  // Yeşil
      'rgba(239, 68, 68, 0.8)',  // Kırmızı
      'rgba(245, 158, 11, 0.8)', // Sarı
      'rgba(168, 85, 247, 0.8)', // Mor
      'rgba(236, 72, 153, 0.8)', // Pembe
    ];

    return {
      labels: examNames,
      datasets: subjects.map((subject, index) => ({
        label: subject,
        data: subjectData[subject],
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.8', '1'),
        borderWidth: 2,
      }))
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10
          },
          maxRotation: 45,
        }
      }
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5
      },
      bar: {
        borderRadius: 2
      }
    }
  };

  const calculateExamStats = (): ExamStats | null => {
    const groupedExams = getGroupedExamsForStats();
    
    if (groupedExams.length === 0) return null;

    const totalExams = groupedExams.reduce((sum, group) => sum + group.examCount, 0);
    const totalNet = groupedExams.reduce((sum, group) => sum + group.totalNet, 0);
    const averageNet = totalNet / totalExams;
    const bestNet = Math.max(...groupedExams.map(group => group.totalNet));

    const allExamsList = groupedExams.flatMap(group => group.exams);
    const totalCorrect = allExamsList.reduce((sum, exam) => sum + exam.correct_answers, 0);
    const totalQuestions = allExamsList.reduce((sum, exam) => 
      sum + exam.correct_answers + exam.wrong_answers + exam.empty_answers, 0);
    
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    const improvement = groupedExams.length >= 2 
      ? groupedExams[0].totalNet - groupedExams[groupedExams.length - 1].totalNet
      : 0;

    return {
      totalExams,
      averageNet: averageNet.toFixed(1),
      bestNet: bestNet.toFixed(1),
      accuracy: accuracy.toFixed(1),
      improvement: improvement.toFixed(1)
    };
  };

  useEffect(() => {
    setExamStats(calculateExamStats());
  }, [allExams, selectedExamType]);

  const examTypeOptions = [
    { value: 'ALL', label: 'Tümü', color: 'from-indigo-500 to-purple-600' },
    { value: 'TYT', label: 'TYT', color: 'from-blue-500 to-cyan-600' },
    { value: 'AYT', label: 'AYT', color: 'from-green-500 to-emerald-600' },
    { value: 'LGS', label: 'LGS', color: 'from-orange-500 to-red-600' }
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading exam data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchExamData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header - Minimal */}
        <div className="mb-4">
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-3 border border-gray-100">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  console.log('Back button clicked, studentId:', studentId);
                  console.log('Navigating to:', `/student-report/${studentId}`);
                  navigate(`/student-report/${studentId}`);
                }}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-900 text-sm">
                  {selectedStudent?.name || 'Student'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchExamData}
                disabled={loading}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Exam Type Filter - Small and Colorful */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 sm:space-x-2 sm:gap-0">
            {examTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedExamType(option.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedExamType === option.value
                    ? `bg-gradient-to-r ${option.color} text-white shadow-md transform scale-105`
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statistics Cards - Small */}
        {examStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md flex items-center justify-center mb-1">
                  <GraduationCap className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Toplam</p>
                <p className="text-sm font-bold text-gray-900">{examStats.totalExams}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center mb-1">
                  <Target className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Ortalama</p>
                <p className="text-sm font-bold text-gray-900">{examStats.averageNet}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-md flex items-center justify-center mb-1">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">En İyi</p>
                <p className="text-sm font-bold text-gray-900">{examStats.bestNet}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-md flex items-center justify-center mb-1">
                  <Star className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Doğruluk</p>
                <p className="text-sm font-bold text-gray-900">%{examStats.accuracy}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-lg shadow-sm p-2 border border-gray-100 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center mb-1 ${
                  parseFloat(examStats.improvement) >= 0 
                    ? 'bg-gradient-to-br from-green-500 to-green-600' 
                    : 'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase">Gelişim</p>
                <p className={`text-sm font-bold ${parseFloat(examStats.improvement) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(examStats.improvement) > 0 ? '+' : ''}{examStats.improvement}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grafik ve Ders Filtreleme Butonları */}
        {getFilteredExams().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 mb-4"
          >
            <div className="space-y-4">
              {/* Grafik Türü Seçimi */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Grafik Görünümü:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedChartView('progress')}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedChartView === 'progress'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📈 <span className="hidden sm:inline">Gelişim Grafiği</span><span className="sm:hidden">Gelişim</span>
                  </button>
                  <button
                    onClick={() => setSelectedChartView('comparison')}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedChartView === 'comparison'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📊 <span className="hidden sm:inline">Karşılaştırma</span><span className="sm:hidden">Karş.</span>
                  </button>
                  <button
                    onClick={() => setSelectedChartView('subjects')}
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedChartView === 'subjects'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📚 <span className="hidden sm:inline">Ders Bazlı</span><span className="sm:hidden">Ders</span>
                  </button>
                </div>
              </div>

              {/* Ders Filtresi */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ders Filtresi:</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedSubject('ALL')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedSubject === 'ALL'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tüm Dersler
                  </button>
                  {getAvailableSubjects().map((subject) => (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        selectedSubject === subject
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grafik Analizi */}
        {getFilteredExams().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-6 mt-8"
          >
            {/* Gelişim Grafiği */}
            {selectedChartView === 'progress' && (
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 mr-2" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Net Puan Gelişimi</h3>
                  </div>
                  {selectedSubject !== 'ALL' && (
                    <span className="ml-0 sm:ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium self-start sm:self-auto">
                      {selectedSubject}
                    </span>
                  )}
                </div>
                <div className="h-40 sm:h-48 w-full overflow-hidden">
                  <Line data={getProgressChartData()} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Karşılaştırma Grafiği */}
            {selectedChartView === 'comparison' && (
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <Target className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 mr-2" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Deneme Bazlı Karşılaştırma</h3>
                  </div>
                  {selectedSubject !== 'ALL' && (
                    <span className="ml-0 sm:ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium self-start sm:self-auto">
                      {selectedSubject}
                    </span>
                  )}
                </div>
                <div className="h-40 sm:h-48 w-full overflow-hidden">
                  <Bar data={getSubjectPerformanceData()} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Ders Bazlı Analiz */}
            {selectedChartView === 'subjects' && (
              <div className="space-y-4">
                {/* TYT Dersleri */}
                {getFilteredExams().some(exam => exam.exam_type === 'TYT') && (
                  <div className="space-y-4">
                    {/* Ana TYT Dersleri Grafiği */}
                    {!selectedTYTSubject && (
                      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 mr-2" />
                            <div className="flex flex-col sm:flex-row sm:items-center">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                TYT Ders Bazlı Performans
                              </h3>
                              {selectedExam && (
                                <span className="text-sm font-normal text-blue-600 sm:ml-2">
                                  - {selectedExam}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedExam && (
                            <button
                              onClick={() => {
                                setSelectedExam(null);
                                setSelectedChartView('progress');
                              }}
                              className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors self-start sm:self-auto"
                            >
                              Tümünü Göster
                            </button>
                          )}
                        </div>
                        <div className="h-40 sm:h-48 w-full overflow-hidden">
                          <Bar data={getTYTSubjectComparisonData()} options={chartOptions} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          💡 Fen Bilimleri veya Sosyal Bilimler'e tıklayarak alt dersleri görüntüleyebilirsiniz
                        </p>
                      </div>
                    )}

                    {/* TYT Alt Ders Detayları */}
                    {selectedTYTSubject && (
                      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                          <div className="flex items-center mb-2 sm:mb-0">
                            <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 mr-2" />
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {selectedTYTSubject} Alt Dersleri
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedTYTSubject(null)}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                            >
                              Ana Derslere Dön
                            </button>
                            {selectedExam && (
                              <button
                                onClick={() => {
                                  setSelectedExam(null);
                                  setSelectedTYTSubject(null);
                                  setSelectedChartView('progress');
                                }}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                              >
                                Tümünü Göster
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="h-40 sm:h-48 w-full overflow-hidden">
                          <Bar data={getTYTSubjectDetailData(selectedTYTSubject)} options={chartOptions} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* AYT Dersleri */}
                {getFilteredExams().some(exam => exam.exam_type === 'AYT') && (
                  <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                      <div className="flex items-center mb-2 sm:mb-0">
                        <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5 text-green-600 mr-2" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          AYT Ders Bazlı Performans
                          {selectedExam && (
                            <span className="ml-2 text-sm font-normal text-green-600">
                              - {selectedExam}
                            </span>
                          )}
                        </h3>
                      </div>
                      {selectedExam && (
                        <button
                          onClick={() => {
                            setSelectedExam(null);
                            setSelectedChartView('progress');
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                        >
                          Tümünü Göster
                        </button>
                      )}
                    </div>
                    <div className="h-40 sm:h-48 w-full overflow-hidden">
                      <Bar data={getAYTSubjectComparisonData()} options={chartOptions} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Detailed Exam Analysis - Small */}
        {getFilteredExams().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-gray-100 mt-8"
          >
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
              Deneme Detayları ({getGroupedExamsForStats().length})
            </h3>
            
            <div className="space-y-3">
              {getGroupedExamsForStats().map((group) => (
                <div key={group.examName} className={`border rounded-lg overflow-hidden ${
                  selectedExam === group.examName 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200'
                }`}>
                  <div
                    className="p-3 sm:p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-all duration-200"
                    onClick={() => {
                      // Deneme seçme/seçimi kaldırma
                      if (selectedExam === group.examName) {
                        setSelectedExam(null);
                        setSelectedChartView('progress'); // Varsayılan görünüme dön
                      } else {
                        setSelectedExam(group.examName);
                        setSelectedChartView('subjects'); // Ders analizine geç
                      }
                      toggleGroupExpansion(group.examName);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
                        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 sm:mb-0">{group.examName}</h4>
                        <div className="flex items-center text-xs sm:text-sm text-gray-600">
                          <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                          {new Date(group.latestDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 sm:space-x-4">
                        <div className="text-right">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Net</p>
                          <p className="text-sm sm:text-lg font-bold text-blue-600">{group.totalNet.toFixed(1)}</p>
                        </div>
                        <div className="w-5 sm:w-6 h-5 sm:h-6 rounded-lg bg-gray-200 flex items-center justify-center">
                          {expandedGroups.has(group.examName) ? (
                            <ChevronUp className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 text-gray-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedGroups.has(group.examName) && (
                    <div className="border-t border-gray-200">
                      {/* Dersler detayı - Excel tablosu benzeri */}
                      <div className="p-3 sm:p-4 bg-gray-50">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-4">Ders Detayları:</h4>
                        <div className="overflow-x-auto">
                          {/* Tablo başlığı */}
                          <div className="grid grid-cols-6 gap-1 sm:gap-2 p-2 sm:p-3 bg-gray-100 border border-gray-300 rounded-t-lg text-xs font-semibold text-gray-700 min-w-max">
                            <div className="text-center min-w-16">Ders</div>
                            <div className="text-center min-w-12">Tür</div>
                            <div className="text-center text-green-700 min-w-12">Doğru</div>
                            <div className="text-center text-red-700 min-w-12">Yanlış</div>
                            <div className="text-center text-gray-700 min-w-12">Boş</div>
                            <div className="text-center text-blue-700 min-w-12">Net</div>
                          </div>
                          
                          {/* Tablo satırları */}
                          {(() => {
                            // TYT için alt dersleri açık şekilde göster
                            if (group.exams[0]?.exam_type === 'TYT' && group.exams[0]?.subject_scores) {
                              const exam = group.exams[0];
                              const subjectScores = exam.subject_scores;
                              
                              const subjects = [
                                { 
                                  name: 'Türkçe', 
                                  data: subjectScores.turkce,
                                  isMain: true
                                },
                                { 
                                  name: 'Matematik', 
                                  data: subjectScores.matematik,
                                  isMain: true
                                },
                                // Fen Bilimleri ana kategori
                                { 
                                  name: 'Fen Bilimleri', 
                                  data: subjectScores.fen,
                                  isMain: true
                                },
                              ];

                              // Fen alt dersleri
                              if (subjectScores.fen?.fizik) {
                                subjects.push({ 
                                  name: '├ Fizik', 
                                  data: subjectScores.fen.fizik,
                                  isMain: false
                                });
                              }
                              if (subjectScores.fen?.kimya) {
                                subjects.push({ 
                                  name: '├ Kimya', 
                                  data: subjectScores.fen.kimya,
                                  isMain: false
                                });
                              }
                              if (subjectScores.fen?.biyoloji) {
                                subjects.push({ 
                                  name: '└ Biyoloji', 
                                  data: subjectScores.fen.biyoloji,
                                  isMain: false
                                });
                              }

                              // Sosyal Bilimler ana kategori
                              subjects.push({ 
                                name: 'Sosyal Bilimler', 
                                data: subjectScores.sosyal,
                                isMain: true
                              });

                              // Sosyal alt dersleri
                              if (subjectScores.sosyal?.tarih) {
                                subjects.push({ 
                                  name: '├ Tarih', 
                                  data: subjectScores.sosyal.tarih,
                                  isMain: false
                                });
                              }
                              if (subjectScores.sosyal?.cografya) {
                                subjects.push({ 
                                  name: '├ Coğrafya', 
                                  data: subjectScores.sosyal.cografya,
                                  isMain: false
                                });
                              }
                              if (subjectScores.sosyal?.felsefe) {
                                subjects.push({ 
                                  name: '├ Felsefe', 
                                  data: subjectScores.sosyal.felsefe,
                                  isMain: false
                                });
                              }
                              if (subjectScores.sosyal?.dinKultur) {
                                subjects.push({ 
                                  name: '└ DKAB', 
                                  data: subjectScores.sosyal.dinKultur,
                                  isMain: false
                                });
                              }

                              return subjects.map((subject, index) => {
                                if (!subject.data) return null;
                                
                                const correct = subject.data.correct || 0;
                                const wrong = subject.data.wrong || 0;
                                const blank = subject.data.blank || 0;
                                const net = correct - (wrong * 0.25);

                                return (
                                  <div 
                                    key={`${exam.id}-${index}`} 
                                    className={`grid grid-cols-6 gap-2 p-3 border-l border-r border-b border-gray-300 ${
                                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    } hover:bg-blue-50 transition-colors ${
                                      subject.isMain ? 'cursor-pointer' : 'bg-blue-25'
                                    }`}
                                    onClick={() => {
                                      if (subject.isMain && (subject.name === 'Fen Bilimleri' || subject.name === 'Sosyal Bilimler')) {
                                        setSelectedTYTSubject(subject.name);
                                        setSelectedChartView('subjects');
                                      }
                                    }}
                                  >
                                    <div className={`text-sm font-medium ${
                                      subject.isMain ? 'font-semibold text-gray-900 text-center' : 'text-gray-600 text-left pl-2'
                                    } ${
                                      subject.isMain && (subject.name === 'Fen Bilimleri' || subject.name === 'Sosyal Bilimler') 
                                        ? 'text-blue-600 hover:text-blue-800' 
                                        : ''
                                    }`}>
                                      {subject.name}
                                      {subject.isMain && (subject.name === 'Fen Bilimleri' || subject.name === 'Sosyal Bilimler') && (
                                        <span className="ml-1 text-xs text-blue-500">📊</span>
                                      )}
                                    </div>
                                    <div className="text-center">
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                        TYT
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="inline-flex items-center justify-center w-10 h-8 bg-green-100 text-green-800 rounded-md font-bold text-sm border border-green-200">
                                        {correct}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="inline-flex items-center justify-center w-10 h-8 bg-red-100 text-red-800 rounded-md font-bold text-sm border border-red-200">
                                        {wrong}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 text-gray-800 rounded-md font-bold text-sm border border-gray-200">
                                        {blank}
                                      </span>
                                    </div>
                                    <div className="text-center">
                                      <span className="inline-flex items-center justify-center w-12 h-8 bg-blue-100 text-blue-800 rounded-md font-bold text-sm border border-blue-200">
                                        {net.toFixed(1)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }).filter(Boolean);
                            } else {
                              // AYT için hierarşik görünüm
                              const categories = {
                                'Matematik': ['Matematik'],
                                'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji', 'Fen Bilimleri'],
                                'Sosyal Bilimler': ['Edebiyat-Sosyal Bilimler 1', 'Sosyal Bilimler-2']
                              };

                              const groupedExams: { [key: string]: typeof group.exams } = {};
                              
                              // AYT için Türkçe'yi filtrele
                              group.exams.filter(exam => 
                                exam.subject_scores?.subject !== 'Türkçe'
                              ).forEach(exam => {
                                const subject = exam.subject_scores?.subject || 'Bilinmeyen';
                                let category = 'Diğer';
                                
                                Object.entries(categories).forEach(([cat, subjects]) => {
                                  if (subjects.includes(subject)) {
                                    category = cat;
                                  }
                                });
                                
                                if (!groupedExams[category]) {
                                  groupedExams[category] = [];
                                }
                                groupedExams[category].push(exam);
                              });

                              let rowIndex = 0;
                              return Object.entries(groupedExams).map(([category, exams]) => {
                                const rows = [];
                                
                                // Kategori başlığı (her zaman göster)
                                rows.push(
                                  <div key={`cat-${category}`} className={`grid grid-cols-6 gap-2 p-3 border-l border-r border-b border-gray-300 ${
                                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                  } hover:bg-blue-50 transition-colors`}>
                                    <div className="text-sm font-semibold text-gray-900 text-center">
                                      {category}
                                    </div>
                                    <div className="text-center">
                                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                        AYT
                                      </span>
                                    </div>
                                    <div className="text-center text-gray-500">—</div>
                                    <div className="text-center text-gray-500">—</div>
                                    <div className="text-center text-gray-500">—</div>
                                    <div className="text-center text-gray-500">—</div>
                                  </div>
                                );
                                rowIndex++;
                                
                                // Alt dersler
                                exams.forEach((exam, i) => {
                                  const isLast = i === exams.length - 1;
                                  const prefix = exams.length > 1 ? (isLast ? '└ ' : '├ ') : '└ ';
                                  
                                  rows.push(
                                    <div key={exam.id} className={`grid grid-cols-6 gap-2 p-3 border-l border-r border-b border-gray-300 ${
                                      rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                    } hover:bg-blue-50 transition-colors`}>
                                      <div className="text-sm font-medium text-gray-600 text-left pl-4">
                                        {prefix}{exam.subject_scores?.subject || exam.exam_type}
                                      </div>
                                      <div className="text-center">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                          AYT
                                        </span>
                                      </div>
                                      <div className="text-center">
                                        <span className="inline-flex items-center justify-center w-10 h-8 bg-green-100 text-green-800 rounded-md font-bold text-sm border border-green-200">
                                          {exam.correct_answers}
                                        </span>
                                      </div>
                                      <div className="text-center">
                                        <span className="inline-flex items-center justify-center w-10 h-8 bg-red-100 text-red-800 rounded-md font-bold text-sm border border-red-200">
                                          {exam.wrong_answers}
                                        </span>
                                      </div>
                                      <div className="text-center">
                                        <span className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 text-gray-800 rounded-md font-bold text-sm border border-gray-200">
                                          {exam.empty_answers}
                                        </span>
                                      </div>
                                      <div className="text-center">
                                        <span className="inline-flex items-center justify-center w-12 h-8 bg-blue-100 text-blue-800 rounded-md font-bold text-sm border border-blue-200">
                                          {exam.net_score.toFixed(1)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                  rowIndex++;
                                });
                                
                                return rows;
                              }).flat();
                            }
                          })()}
                        </div>
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