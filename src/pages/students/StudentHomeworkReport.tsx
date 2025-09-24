import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, Calendar, ChevronDown, Book, FileText } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import type { Student } from '../../types';

export default function StudentHomeworkReport() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { students, fetchStudentAssignments, studentAssignments, loading } = useDataStore();
  const [student, setStudent] = useState<Student | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  useEffect(() => {
    if (studentId) {
      const foundStudent = students.find(s => s.id === studentId);
      if (foundStudent) {
        setStudent(foundStudent);
        // Öğrencinin ödevlerini getir
        fetchStudentAssignments(studentId);
      }
    }
  }, [studentId, students, fetchStudentAssignments]);

  // Debug için verileri konsola yazdır
  useEffect(() => {
    console.log('Student Assignments:', studentAssignments);
  }, [studentAssignments]);

  // Ödevleri program başlıklarına göre grupla
  const groupedAssignments = studentAssignments.reduce((groups: any, assignment: any) => {
    const programTitle = assignment.programs?.title || 'Başlıksız Program';
    const programId = assignment.program_id;
    
    if (!groups[programId]) {
      groups[programId] = {
        title: programTitle,
        assignments: [],
        totalAssignments: 0,
        completedAssignments: 0
      };
    }
    
    groups[programId].assignments.push(assignment);
    groups[programId].totalAssignments++;
    if (assignment.is_completed) {
      groups[programId].completedAssignments++;
    }
    
    return groups;
  }, {});

  if (!student) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600">Öğrenci bulunamadı</h2>
          <button
            onClick={() => navigate('/students')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Öğrenci Listesine Dön
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Ödev verileri yükleniyor...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ödev istatistikleri hesapla
  const completedAssignments = studentAssignments.filter((a: any) => a.is_completed).length;
  const pendingAssignments = studentAssignments.filter((a: any) => !a.is_completed).length;
  const totalAssignments = studentAssignments.length;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/students/${studentId}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ödev Analizi</h1>
                <p className="text-gray-600">{student.name} - {student.grade || 'Sınıf Belirtilmemiş'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-blue-600">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">{totalAssignments} Toplam Ödev</span>
            </div>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                <p className="text-2xl font-bold text-green-600">{completedAssignments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Bekleyen</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAssignments}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                <p className="text-2xl font-bold text-blue-600">{completionRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        </div>

        {/* Ödev Listesi - Program Başlıklarına Göre Gruplu */}
        {Object.keys(groupedAssignments).length > 0 ? (
          Object.entries(groupedAssignments).map(([programId, programData]: [string, any]) => (
            <motion.div
              key={programId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm mb-6"
            >
              {/* Program Başlığı */}
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg p-6 cursor-pointer"
                onClick={() => setExpandedProgram(expandedProgram === programId ? null : programId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">📚</span>
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-white">{programData.title}</h2>
                      <p className="text-blue-100 text-sm">{programData.assignments.length} ödev</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <span className="text-sm bg-white bg-opacity-40 text-white px-4 py-2 rounded-full font-bold">
                        {programData.completedAssignments}/{programData.totalAssignments} Tamamlandı
                      </span>
                      {/* İlerleme Çubuğu */}
                      <div className="mt-2">
                        <div className="w-32 bg-white bg-opacity-30 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${programData.totalAssignments > 0 ? (programData.completedAssignments / programData.totalAssignments) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`w-6 h-6 text-white transform transition-transform ${
                        expandedProgram === programId ? 'rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
              </div>

              {/* Ödev Listesi - Tablo Formatında */}
              {expandedProgram === programId && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      {/* Tablo Başlıkları */}
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                            <div className="flex items-center">
                              <Book className="mr-2 h-4 w-4" />
                              Ödev Adı
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              Açıklama
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Tarih
                            </div>
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-200">
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              Saat
                            </div>
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Durum
                            </div>
                          </th>
                        </tr>
                      </thead>
                      
                      {/* Tablo Satırları */}
                      <tbody className="bg-white divide-y divide-gray-200">
                        {programData.assignments.map((assignment: any, index: number) => (
                          <motion.tr
                            key={assignment.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.3 }}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            {/* Ödev Adı */}
                            <td className="px-6 py-4 border-r border-gray-200">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">
                                  {assignment.title || 'Ödev Başlığı'}
                                </span>
                              </div>
                            </td>
                            
                            {/* Açıklama */}
                            <td className="px-6 py-4 border-r border-gray-200">
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-900">
                                  {assignment.note || `Sayfa ${assignment.page_start}-${assignment.page_end}`}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {assignment.books?.title || assignment.programs?.title || 'Kaynak belirtilmemiş'}
                                </span>
                              </div>
                            </td>
                            
                            {/* Tarih */}
                            <td className="px-6 py-4 border-r border-gray-200">
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Calendar className="mr-1 h-3 w-3" />
                                  {assignment.day}
                                </span>
                              </div>
                            </td>
                            
                            {/* Saat */}
                            <td className="px-6 py-4 border-r border-gray-200">
                              <div className="flex items-center">
                                {assignment.time ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Clock className="mr-1 h-3 w-3" />
                                    {assignment.time}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Belirtilmemiş</span>
                                )}
                              </div>
                            </td>
                            
                            {/* Durum */}
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold ${
                                  assignment.is_completed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {assignment.is_completed ? (
                                  <>
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Tamamlandı
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Bekliyor
                                  </>
                                )}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Ödev yoksa */}
                  {programData.assignments.length === 0 && (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <h4 className="text-base font-medium text-gray-800 mb-1">Bu programa ait ödev bulunmuyor</h4>
                      <p className="text-sm text-gray-500">Henüz ödev atanmamış</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center"
          >
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Bu öğrenci için henüz ödev atanmamış</h3>
            <p className="text-gray-600 mb-4">Ödevler oluşturuldukça burada görünecektir</p>
            <button
              onClick={() => navigate('/programs')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Program Oluştur
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}