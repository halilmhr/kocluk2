import React from 'react';
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
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { StudentExam } from '../../lib/examService';
import { TrendingUp, BarChart3, Target } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

interface ExamAnalysisChartProps {
  exams: StudentExam[];
  examType: string;
}

const ExamAnalysisChart: React.FC<ExamAnalysisChartProps> = ({ exams, examType }) => {
  // Deneme türüne göre veri hazırlama
  const prepareChartData = () => {
    if (!exams || exams.length === 0) return null;

    // Deneme başlıklarına göre gruplama
    const examsByName: { [key: string]: StudentExam[] } = {};
    
    exams.forEach(exam => {
      let examName: string;
      
      if (exam.exam_type === 'AYT') {
        examName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
      } else {
        examName = exam.subject_scores?.examName || exam.exam_date;
      }
      
      if (!examsByName[examName]) {
        examsByName[examName] = [];
      }
      examsByName[examName].push(exam);
    });

    // Her deneme için toplam net hesapla ve tarihe göre sırala
    const examData = Object.entries(examsByName).map(([examName, examList]) => {
      const totalNet = examList.reduce((sum, exam) => sum + exam.net_score, 0);
      const latestExam = examList.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
      
      return {
        examName,
        totalNet,
        date: latestExam.exam_date,
        exams: examList
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return examData;
  };

  // Gelişim grafiği için veri hazırlama
  const prepareProgressData = () => {
    const examData = prepareChartData();
    if (!examData) return null;

    return {
      labels: examData.map(item => {
        // Deneme ismini kısalt
        const examName = item.examName;
        if (examName.length > 15) {
          return examName.substring(0, 15) + '...';
        }
        return examName;
      }),
      datasets: [
        {
          label: 'Net Puan',
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

  // Ders dağılımı grafiği için veri hazırlama (TYT ve AYT için)
  const prepareSubjectDistribution = () => {
    if (!exams || exams.length === 0) return null;

    if (examType === 'TYT') {
      const latestExam = exams.sort((a, b) => new Date(b.exam_date).getTime() - new Date(a.exam_date).getTime())[0];
      
      if (!latestExam.subject_scores) return null;

      const subjects = [
        { name: 'Türkçe', data: latestExam.subject_scores.turkce, color: '#ef4444' },
        { name: 'Matematik', data: latestExam.subject_scores.matematik, color: '#3b82f6' },
        { name: 'Fen Bilimleri', data: latestExam.subject_scores.fen, color: '#10b981' },
        { name: 'Sosyal Bilimler', data: latestExam.subject_scores.sosyal, color: '#f59e0b' }
      ];

      const netScores = subjects.map(subject => {
        const correct = subject.data?.correct || 0;
        const wrong = subject.data?.wrong || 0;
        return correct - wrong / 4;
      });

      return {
        labels: subjects.map(s => s.name),
        datasets: [
          {
            data: netScores,
            backgroundColor: subjects.map(s => s.color),
            borderColor: subjects.map(s => s.color),
            borderWidth: 2,
          }
        ]
      };
    } else if (examType === 'AYT') {
      // AYT için en son deneme grubunu al
      const examsByName: { [key: string]: StudentExam[] } = {};
      
      exams.forEach(exam => {
        const examBaseName = exam.subject_scores?.examName?.split(' - ')[0] || exam.exam_date;
        if (!examsByName[examBaseName]) {
          examsByName[examBaseName] = [];
        }
        examsByName[examBaseName].push(exam);
      });

      // En son tarihe sahip deneme grubunu bul
      const latestExamGroup = Object.values(examsByName)
        .sort((a, b) => new Date(b[0].exam_date).getTime() - new Date(a[0].exam_date).getTime())[0];

      if (!latestExamGroup) return null;

      // AYT dersleri ve renkleri
      const subjectMap = {
        'Matematik': { color: '#3b82f6', net: 0 },
        'Edebiyat-Sosyal Bilimler 1': { color: '#ef4444', net: 0 },
        'Sosyal Bilimler-2': { color: '#f59e0b', net: 0 },
        'Fen Bilimleri': { color: '#10b981', net: 0 }
      };

      // Her ders için net puanı hesapla
      latestExamGroup.forEach(exam => {
        const subject = exam.subject_scores?.subject;
        if (subject && subjectMap[subject as keyof typeof subjectMap]) {
          subjectMap[subject as keyof typeof subjectMap].net = exam.net_score;
        }
      });

      const subjects = Object.keys(subjectMap);
      const netScores = subjects.map(subject => subjectMap[subject as keyof typeof subjectMap].net);
      const colors = subjects.map(subject => subjectMap[subject as keyof typeof subjectMap].color);

      // Sıfır olmayan değerleri filtrele
      const filteredData = subjects
        .map((subject, index) => ({ subject, net: netScores[index], color: colors[index] }))
        .filter(item => item.net > 0);

      if (filteredData.length === 0) return null;

      return {
        labels: filteredData.map(item => item.subject),
        datasets: [
          {
            data: filteredData.map(item => item.net),
            backgroundColor: filteredData.map(item => item.color),
            borderColor: filteredData.map(item => item.color),
            borderWidth: 2,
          }
        ]
      };
    }

    return null;
  };

  const progressData = prepareProgressData();
  const subjectData = prepareSubjectDistribution();

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: function(context: any) {
            const examData = prepareChartData();
            if (examData && context[0]) {
              return examData[context[0].dataIndex].examName;
            }
            return context[0].label;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          }
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  if (!exams || exams.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Grafik oluşturmak için en az bir deneme gerekli</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">
            {examType} Grafik Analiz Raporu
          </h3>
        </div>
        <p className="text-gray-600">
          Bu raporda {examType} deneme sonuçlarınızın detaylı grafik analizi yer almaktadır.
        </p>
      </div>

      {/* Gelişim Grafiği */}
      {progressData && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-800">Gelişim Grafiği</h4>
          </div>
          <div className="h-64">
            <Line data={progressData} options={chartOptions} />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Analiz:</strong> Bu grafik deneme sonuçlarınızdaki gelişimi göstermektedir. 
              Yukarı doğru olan eğilim performansınızın arttığını gösterir.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Ders Dağılımı (TYT ve AYT için) */}
        {subjectData && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-orange-600" />
              <h4 className="text-lg font-semibold text-gray-800">
                {examType === 'TYT' ? 'Ders Bazlı Net Dağılımı' : 'AYT Ders Bazlı Net Dağılımı'}
              </h4>
            </div>
            <div className="h-64">
              <Doughnut data={subjectData} options={doughnutOptions} />
            </div>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Analiz:</strong> En son {examType} denemenizde hangi derslerde daha başarılı olduğunuzu gösterir.
                {examType === 'TYT' ? ' Küçük olan dilimler üzerinde daha fazla çalışmanız gerekebilir.' : ' AYT\'de her ders ayrı bir alan olduğu için dengeli çalışma önemlidir.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* İstatistiksel Özet */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">İstatistiksel Özet</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-green-800 font-semibold mb-1">En İyi Performans</div>
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const examData = prepareChartData();
                if (!examData || examData.length === 0) return '0.00';
                return Math.max(...examData.map(e => e.totalNet)).toFixed(2);
              })()} Net
            </div>
            <div className="text-xs text-green-700 mt-1">
              {(() => {
                const examData = prepareChartData();
                if (!examData || examData.length === 0) return '';
                const bestExam = examData.reduce((prev, current) => 
                  prev.totalNet > current.totalNet ? prev : current
                );
                return bestExam.examName;
              })()}
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-800 font-semibold mb-1">Ortalama Performans</div>
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                const examData = prepareChartData();
                if (!examData || examData.length === 0) return '0.00';
                const average = examData.reduce((sum, e) => sum + e.totalNet, 0) / examData.length;
                return average.toFixed(2);
              })()} Net
            </div>
            <div className="text-xs text-blue-700 mt-1">
              {(() => {
                const examData = prepareChartData();
                return examData ? `${examData.length} deneme ortalaması` : '';
              })()}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-purple-800 font-semibold mb-1">Son Performans</div>
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const examData = prepareChartData();
                if (!examData || examData.length === 0) return '0.00';
                // En son tarihe göre sırala ve son denemeyi al
                const latestExam = examData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                return latestExam.totalNet.toFixed(2);
              })()} Net
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {(() => {
                const examData = prepareChartData();
                if (!examData || examData.length === 0) return '';
                const latestExam = examData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                return latestExam.examName;
              })()}
            </div>
          </div>
        </div>
        
        {/* Gelişim Trendi */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-gray-800 font-semibold mb-2">Gelişim Trendi</div>
          {(() => {
            const examData = prepareChartData();
            if (!examData || examData.length < 2) {
              return <div className="text-gray-600 text-sm">Trend analizi için en az 2 deneme gerekli</div>;
            }
            
            const sortedExams = examData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const firstExam = sortedExams[0];
            const lastExam = sortedExams[sortedExams.length - 1];
            const improvement = lastExam.totalNet - firstExam.totalNet;
            
            return (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  İlk deneme: <span className="font-medium">{firstExam.totalNet.toFixed(2)} net</span>
                </div>
                <div className="text-sm text-gray-600">
                  Son deneme: <span className="font-medium">{lastExam.totalNet.toFixed(2)} net</span>
                </div>
                <div className={`text-sm font-medium ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement >= 0 ? '+' : ''}{improvement.toFixed(2)} net gelişim
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ExamAnalysisChart;
