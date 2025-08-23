import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { updatePublicAssignmentStatus } from '../../lib/publicSupabase';
import AssignmentCardWrapper from '../../components/assignments/AssignmentCardWrapper';
import ProgressSummary from '../../components/assignments/ProgressSummary';
import Card from '../../components/ui/Card';
import { Book, GraduationCap, Calendar, Clock, CheckCircle, XCircle, FileText, User } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Yapılanlar ve Yapılmayanlar filtresi için state
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'incomplete'>('all');
  // Seçili gün için state
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Seçili hafta için state
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  
  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      
      setLoading(true);
      
      try {
        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (studentError) throw studentError;
        
        // Fetch assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            books (title),
            programs (title, is_scheduled)
          `)
          .eq('student_id', studentId)
          .order('day');
        
        if (assignmentsError) throw assignmentsError;
        
        setStudent(studentData);
        setAssignments(assignmentsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);
  
  const handleToggleStatus = async (id: string, status: boolean) => {
    try {
      // Try to use authenticated Supabase client first
      let error;
      try {
        const result = await supabase
          .from('assignments')
          .update({ is_completed: status })
          .eq('id', id);
        error = result.error;
      } catch (e) {
        error = e;
      }
      
      // If there's an error (likely permission error), fall back to public client
      if (error) {
        const { error: publicError } = await updatePublicAssignmentStatus(id, status);
        if (publicError) throw publicError;
      }
      
      // Update local state
      setAssignments(
        assignments.map(assignment => 
          assignment.id === id 
            ? { ...assignment, is_completed: status } 
            : assignment
        )
      );
      
      // Filtreyi 'all' moduna geçir ki kullanıcı tıkladığı ödevi görebilsin
      setFilterStatus('all');
      
      toast.success(status ? 'Ödev tamamlandı olarak işaretlendi!' : 'Ödev bekliyor olarak işaretlendi!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };
  
  // Extract unique weeks from programs
  const weeks = Array.from(new Set(
    assignments
      .map(assignment => assignment.programs?.title)
      .filter(title => title && title.includes('hafta'))
  )).sort();
  
  // Filter assignments by selected week
  const getWeekFilteredAssignments = () => {
    if (!selectedWeek) {
      // İlk hafta varsayılan olarak seçili
      return weeks.length > 0 ? assignments.filter(assignment => assignment.programs?.title === weeks[0]) : assignments;
    }
    return assignments.filter(assignment => 
      assignment.programs?.title === selectedWeek
    );
  };
  
  // Update filtered assignments based on week selection
  const weekFilteredAssignments = getWeekFilteredAssignments();
  
  // Group assignments by program and day (using week filtered assignments)
  const assignmentsByProgram: Record<string, Record<string, any[]>> = {};
  
  weekFilteredAssignments.forEach(assignment => {
    const programTitle = assignment.programs?.title || 'Genel Program';
    
    if (!assignmentsByProgram[programTitle]) {
      assignmentsByProgram[programTitle] = {};
    }
    
    if (!assignmentsByProgram[programTitle][assignment.day]) {
      assignmentsByProgram[programTitle][assignment.day] = [];
    }
    
    assignmentsByProgram[programTitle][assignment.day].push(assignment);
  });
  
  // Group assignments by day for day-based filtering (using week filtered assignments)
  const assignmentsByDay: Record<string, any[]> = {};
  
  weekFilteredAssignments.forEach(assignment => {
    if (!assignmentsByDay[assignment.day]) {
      assignmentsByDay[assignment.day] = [];
    }
    assignmentsByDay[assignment.day].push(assignment);
  });
  
  // Sort days
  const weekdayOrder = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  
  // Get all programs
  const programs = Object.keys(assignmentsByProgram);
  
  // Get all days
  const days = Object.keys(assignmentsByDay).sort((a, b) => {
    return weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b);
  });
  
  // Gün renkleri
  const dayColors: Record<string, string> = {
    Pazartesi: 'bg-blue-500 hover:bg-blue-600 text-white',
    Salı: 'bg-purple-500 hover:bg-purple-600 text-white',
    Çarşamba: 'bg-green-500 hover:bg-green-600 text-white',
    Perşembe: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    Cuma: 'bg-pink-500 hover:bg-pink-600 text-white',
    Cumartesi: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    Pazar: 'bg-red-500 hover:bg-red-600 text-white',
  };
  
  // Calculate completion stats for progress summary (using week filtered assignments)
  const totalAssignments = weekFilteredAssignments.length;
  const completedAssignments = weekFilteredAssignments.filter(a => a.is_completed).length;
  
  // Filtrelenmiş ödevleri elde et
  const getFilteredAssignments = (dayAssignments: any[]) => {
    if (filterStatus === 'completed') {
      return dayAssignments.filter(a => a.is_completed);
    } else if (filterStatus === 'incomplete') {
      return dayAssignments.filter(a => !a.is_completed);
    }
    return dayAssignments;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md mx-auto text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Student Not Found</h1>
          <p className="text-gray-600">The student you're looking for doesn't exist or has been removed.</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto"
      >
        {/* Yeni Header Tasarımı - Tek Kart İçinde */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl overflow-hidden mb-8"
        >
          {/* Arka Plan Deseni */}
          <div className="absolute inset-0 bg-black/10">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute top-8 right-8 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
              <div className="absolute bottom-4 left-1/3 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            </div>
          </div>
          
          <div className="relative z-10 p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Sol Taraf - Portal Bilgisi */}
              <div className="text-white text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-3">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">Öğrenci Portal</h1>
                </div>
                <p className="text-white/90 text-lg mb-4">Ödevlerinizi takip edin ve başarıya ulaşın</p>
                <div className="flex items-center justify-center md:justify-start text-sm text-white/80">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Sistem Aktif
                </div>
              </div>
              
              {/* Sağ Taraf - Öğrenci Kartı */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[220px]"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/30">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {student.name}
                  </h2>
                  {student.email && (
                    <p className="text-white/80 text-xs mb-3">{student.email}</p>
                  )}
                  <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-medium border border-white/30">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Aktif Öğrenci
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        
        {/* Add progress summary here */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
            <ProgressSummary 
              totalAssignments={totalAssignments}
              completedAssignments={completedAssignments}
              className="bg-transparent shadow-none"
            />
          </div>
        </motion.div>
        
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-2 flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filterStatus === 'all' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              📊 Tümü
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filterStatus === 'completed' 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              ✅ Yapılanlar
            </button>
            <button
              onClick={() => setFilterStatus('incomplete')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                filterStatus === 'incomplete' 
                  ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg transform scale-105' 
                  : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
              }`}
            >
              ⏳ Yapılmayanlar
            </button>
          </div>
        </div>
        
        {/* Hafta Seçimi */}
        {weeks.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-6">📚 Hafta Seçimi</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => setSelectedWeek(null)}
                  className={`px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 ${
                    selectedWeek === null
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-xl transform scale-110'
                      : 'bg-white/80 text-gray-700 hover:bg-white border-2 border-gray-200 hover:border-blue-300 shadow-lg hover:scale-105'
                  }`}
                >
                  🌟 Tüm Haftalar
                </button>
                {weeks.map((week, index) => (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 shadow-xl ${
                      selectedWeek === week || (selectedWeek === null && index === 0)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white transform scale-110'
                        : 'bg-white/80 text-gray-700 hover:bg-white border-2 border-gray-200 hover:border-purple-300 hover:scale-105'
                    }`}
                  >
                    📚 {week}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Günler Tab Sistemi */}
        {days.length > 0 && (
          <div className="mb-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-6">📅 Günlük Program</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => setSelectedDay(null)}
                  className={`px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 ${
                    selectedDay === null
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xl transform scale-110'
                      : 'bg-white/80 text-gray-700 hover:bg-white border-2 border-gray-200 hover:border-indigo-300 shadow-lg hover:scale-105'
                  }`}
                >
                  🌟 Tüm Günler
                </button>
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-8 py-4 rounded-2xl text-base font-bold transition-all duration-300 shadow-xl ${
                      selectedDay === day
                        ? `${dayColors[day]} ring-4 ring-white ring-opacity-60 transform scale-115 shadow-2xl`
                        : `${dayColors[day]} opacity-95 hover:opacity-100 hover:transform hover:scale-110 hover:shadow-2xl`
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-white bg-opacity-40 flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-lg">{day[0]}</span>
                      </span>
                      <span className="text-white font-bold text-lg">{day}</span>
                      <span className="ml-4 text-sm bg-white bg-opacity-40 text-white px-4 py-2 rounded-full font-bold">
                        {getFilteredAssignments(assignmentsByDay[day]).length}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {programs.length > 0 ? (
          <div className="space-y-8">
            {programs.map((programTitle, programIndex) => {
              const programDays = Object.keys(assignmentsByProgram[programTitle]).sort((a, b) => {
                return weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b);
              });
              
              return (
                <motion.div
                  key={programTitle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: programIndex * 0.1, duration: 0.5 }}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 overflow-hidden"
                >
                  {/* Program Başlığı */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-10 h-10 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">📚</span>
                        </span>
                        <span>{programTitle}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm bg-white bg-opacity-40 text-white px-4 py-2 rounded-full font-bold">
                          {Object.values(assignmentsByProgram[programTitle]).flat().length} ödev
                        </span>
                      </div>
                    </h2>
                  </div>
                  
                  {/* Günlük Ödevler */}
                  <div className="space-y-6 p-6">
                    {(selectedDay ? programDays.filter(day => day === selectedDay) : programDays).map((day, dayIndex) => (
                      <div key={`${programTitle}-${day}`} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
                          <h3 className="text-white font-bold text-lg flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="w-8 h-8 rounded-full bg-white bg-opacity-30 flex items-center justify-center mr-3">
                                <span className="text-white font-bold text-sm">{day[0]}</span>
                              </span>
                              <span>{day}</span>
                            </div>
                            <span className="text-sm bg-white bg-opacity-40 text-white px-3 py-1 rounded-full font-bold">
                              {getFilteredAssignments(assignmentsByProgram[programTitle][day]).length}
                            </span>
                          </h3>
                        </div>
                        <div className="p-4">
                          {/* Tablo İçeriği */}
                          {getFilteredAssignments(assignmentsByProgram[programTitle][day]).length > 0 ? (
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
                            {getFilteredAssignments(assignmentsByProgram[programTitle][day]).map((assignment, index) => (
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
                                  <button
                                    onClick={() => handleToggleStatus(assignment.id, !assignment.is_completed)}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 hover:scale-105 ${
                                      assignment.is_completed
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
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
                                  </button>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                            /* Ödev Yok Durumu */
                            <div className="p-6 text-center">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FileText className="h-6 w-6 text-gray-400" />
                              </div>
                              {filterStatus === 'all' ? (
                                <>
                                  <h4 className="text-base font-medium text-gray-800 mb-1">Bu gün için ödev bulunmuyor</h4>
                                  <p className="text-sm text-gray-500">Henüz bu güne ödev atanmamış</p>
                                </>
                              ) : filterStatus === 'completed' ? (
                                <>
                                  <h4 className="text-base font-medium text-gray-800 mb-1">Tamamlanan ödev yok</h4>
                                  <p className="text-sm text-gray-500">Bu gün için henüz tamamlanan ödev bulunmuyor</p>
                                </>
                              ) : (
                                <>
                                  <h4 className="text-base font-medium text-gray-800 mb-1">Bekleyen ödev yok</h4>
                                  <p className="text-sm text-gray-500">Bu gün için tüm ödevler tamamlanmış</p>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-12 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book className="h-12 w-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Henüz ödev atanmamış</h3>
            <p className="text-gray-600 text-lg">Öğretmeniniz size ödev atadığında burada görünecek.</p>
          </motion.div>
        )}
        
        {/* Filtre seçiliyken gösterilecek ödev yoksa */}
        {programs.length > 0 && programs.every(program => 
          Object.keys(assignmentsByProgram[program]).every(day => 
            getFilteredAssignments(assignmentsByProgram[program][day]).length === 0
          )
        ) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-12 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Book className="h-12 w-12 text-white" />
            </div>
            {filterStatus === 'all' ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ödev bulunmuyor</h3>
                <p className="text-gray-600 text-lg">Henüz hiç ödev atanmamış</p>
              </>
            ) : filterStatus === 'completed' ? (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tamamlanmış ödev yok</h3>
                <p className="text-gray-600 text-lg">Henüz hiç ödev tamamlanmamış</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tamamlanmamış ödev yok</h3>
                <p className="text-gray-600 text-lg">Tüm ödevler tamamlanmış, tebrikler!</p>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StudentView;