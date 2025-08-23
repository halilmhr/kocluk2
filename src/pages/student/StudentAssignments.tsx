import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Calendar, Clock, FileText, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

interface Assignment {
  id: string;
  day: string;
  time?: string;
  note?: string;
  page_start?: number;
  page_end?: number;
  is_completed: boolean;
  programs?: {
    id: string;
    title: string;
  };
  books?: {
    id: string;
    title: string;
    subject?: string;
  };
}

interface Program {
  id: string;
  title: string;
  assignments: Assignment[];
}

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  const getDayColor = (day: string) => {
    const dayColors: { [key: string]: string } = {
      'Pazartesi': 'text-red-600 bg-red-50',
      'Salı': 'text-orange-600 bg-orange-50',
      'Çarşamba': 'text-yellow-600 bg-yellow-50',
      'Perşembe': 'text-green-600 bg-green-50',
      'Cuma': 'text-blue-600 bg-blue-50',
      'Cumartesi': 'text-purple-600 bg-purple-50',
      'Pazar': 'text-pink-600 bg-pink-50'
    };
    return dayColors[day] || 'text-gray-600 bg-gray-50';
  };

  const getDayButtonColor = (day: string, isSelected: boolean) => {
    const baseColors: { [key: string]: string } = {
      'Pazartesi': isSelected ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100',
      'Salı': isSelected ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
      'Çarşamba': isSelected ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
      'Perşembe': isSelected ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100',
      'Cuma': isSelected ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      'Cumartesi': isSelected ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-100',
      'Pazar': isSelected ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
    };
    return baseColors[day] || (isSelected ? 'bg-gray-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100');
  };

  const getFilteredAssignments = () => {
    if (!selectedProgram) return [];
    if (!selectedDay) {
      // Tüm ödevleri günlere göre sırala ve tamamlananları en alta taşı
      return selectedProgram.assignments.sort((a, b) => {
        // Önce tamamlanma durumuna göre sırala (tamamlanmayanlar üstte)
        if (a.is_completed !== b.is_completed) {
          return a.is_completed ? 1 : -1;
        }
        // Sonra günlere göre sırala
        const dayIndexA = daysOfWeek.indexOf(a.day);
        const dayIndexB = daysOfWeek.indexOf(b.day);
        return dayIndexA - dayIndexB;
      });
    }
    // Seçili gün için de aynı sıralama mantığını uygula
    return selectedProgram.assignments
      .filter(assignment => assignment.day === selectedDay)
      .sort((a, b) => {
        // Tamamlanmayanları üstte göster
        if (a.is_completed !== b.is_completed) {
          return a.is_completed ? 1 : -1;
        }
        return 0;
      });
  };

  const getAvailableDays = () => {
    if (!selectedProgram) return [];
    const assignmentDays = selectedProgram.assignments.map(a => a.day);
    return daysOfWeek.filter(day => assignmentDays.includes(day));
  };

  const getProgressStats = () => {
    if (!selectedProgram) return { completed: 0, total: 0, percentage: 0 };
    
    const assignments = selectedDay 
      ? selectedProgram.assignments.filter(a => a.day === selectedDay)
      : selectedProgram.assignments;
    
    const completed = assignments.filter(a => a.is_completed).length;
    const total = assignments.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  useEffect(() => {
    setSelectedDay(null);
  }, [selectedProgram]);

  const fetchAssignments = async () => {
    if (!user?.id) {
      setError('Kullanıcı bilgisi bulunamadı');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          day,
          time,
          note,
          page_start,
          page_end,
          is_completed,
          programs!inner (
            id,
            title
          ),
          books (
            id,
            title,
            subject
          )
        `)
        .eq('student_id', user.id)
        .order('day');

      if (assignmentsError) {
        console.error('Assignments fetch error:', assignmentsError);
        throw assignmentsError;
      }

      const programsMap = new Map<string, Program>();
      
      assignmentsData?.forEach((assignment) => {
        const programId = assignment.programs?.id;
        const programTitle = assignment.programs?.title;
        
        if (programId && programTitle) {
          if (!programsMap.has(programId)) {
            programsMap.set(programId, {
              id: programId,
              title: programTitle,
              assignments: []
            });
          }
          
          programsMap.get(programId)?.assignments.push(assignment);
        }
      });

      const programsList = Array.from(programsMap.values());
      setPrograms(programsList);
      
      if (programsList.length > 0 && !selectedProgram) {
        setSelectedProgram(programsList[0]);
      }
      
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Ödevler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .update({ is_completed: true })
        .eq('id', assignmentId);

      if (error) {
        console.error('Error updating assignment:', error);
        return;
      }

      // Yerel state'i güncelle
      setPrograms(prevPrograms => 
        prevPrograms.map(program => ({
          ...program,
          assignments: program.assignments.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, is_completed: true }
              : assignment
          )
        }))
      );

      // Seçili programı da güncelle
      if (selectedProgram) {
        setSelectedProgram({
          ...selectedProgram,
          assignments: selectedProgram.assignments.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, is_completed: true }
              : assignment
          )
        });
      }
    } catch (err) {
      console.error('Error completing assignment:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ödevler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <BookOpen size={48} className="mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Ana Sayfaya Dön
          </button>
          
          <div className="flex items-center mb-6">
            <BookOpen className="text-blue-600 mr-3" size={32} />
            <h1 className="text-3xl font-bold text-gray-900">Ödevlerim</h1>
          </div>

          {programs.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Seçin
              </label>
              <select
                value={selectedProgram?.id || ''}
                onChange={(e) => {
                  const program = programs.find(p => p.id === e.target.value);
                  setSelectedProgram(program || null);
                }}
                className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Program seçin...</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {programs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ödev bulunmuyor</h3>
            <p className="text-gray-600">Size atanmış herhangi bir ödev bulunmuyor.</p>
          </div>
        ) : selectedProgram && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{selectedProgram.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Toplam {selectedProgram.assignments.length} ödev
              </p>
              
              {/* İlerleme Durumu */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    İlerleme Durumu {selectedDay ? `(${selectedDay})` : ''}
                  </span>
                  <span className="text-sm text-gray-600">
                    {getProgressStats().completed}/{getProgressStats().total} tamamlandı
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${getProgressStats().percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">0%</span>
                  <span className="text-sm font-semibold text-green-600">
                    %{getProgressStats().percentage}
                  </span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
              </div>
            </div>

            {getAvailableDays().length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDay(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      !selectedDay
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Calendar size={16} className="inline mr-2" />
                    Tümü ({selectedProgram.assignments.length})
                  </button>
                  {getAvailableDays().map((day) => {
                    const dayCount = selectedProgram.assignments.filter(a => a.day === day).length;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          getDayButtonColor(day, selectedDay === day)
                        }`}
                      >
                        <Calendar size={16} className="inline mr-2" />
                        {day} ({dayCount})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Kitap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Not
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Gün
                    </th>
                    {getFilteredAssignments().some(assignment => assignment.time) && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                        Saat
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredAssignments().length > 0 ? (
                    getFilteredAssignments().map((assignment, index) => (
                      <motion.tr
                        key={assignment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`hover:bg-gray-50 transition-colors ${
                          assignment.is_completed ? 'bg-green-200' : ''
                        }`}
                      >

                        <td className="px-6 py-4 min-w-[120px]">
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.books?.title || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 min-w-[150px]">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {assignment.note || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap min-w-[120px]">
                          <div className={`flex items-center text-sm px-3 py-1 rounded-full font-medium ${getDayColor(assignment.day)}`}>
                            <Calendar size={16} className="mr-2" />
                            {assignment.day}
                          </div>
                        </td>
                        {getFilteredAssignments().some(assignment => assignment.time) && (
                          <td className="px-6 py-4 whitespace-nowrap min-w-[100px]">
                            <div className="text-sm text-gray-600">
                              {assignment.time ? (
                                <div className="flex items-center">
                                  <Clock size={16} className="mr-2" />
                                  {assignment.time}
                                </div>
                              ) : (
                                '-'
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                          {!assignment.is_completed ? (
                            <button
                              onClick={() => handleCompleteAssignment(assignment.id)}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                              <CheckCircle size={14} className="mr-1" />
                              Tamamlandı
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-green-800 bg-green-100">
                              <CheckCircle size={14} className="mr-1" />
                              Tamamlandı
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {selectedDay ? `${selectedDay} günü için ödev bulunamadı` : 'Ödev bulunamadı'}
                          </h3>
                          <p className="text-gray-600">
                            {selectedDay ? 'Bu güne ait herhangi bir ödev bulunmuyor.' : 'Bu programda henüz ödev bulunmuyor.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAssignments;