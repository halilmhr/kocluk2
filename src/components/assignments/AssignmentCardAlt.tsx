import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Calendar, Clock, CheckCircle, Clock3, BookOpen, LayoutList, User, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface AssignmentCardProps {
  assignment: any;
  index: number;
  isStudent?: boolean;
  onToggleStatus?: (id: string, status: boolean) => void;
}

const AssignmentCardAlt: React.FC<AssignmentCardProps> = ({ 
  assignment, 
  index,
  isStudent = false,
  onToggleStatus 
}) => {
  const handleToggle = () => {
    if (onToggleStatus) {
      onToggleStatus(assignment.id, !assignment.is_completed);
    }
  };

  // Calculate progress for the visual indicator (if page range is provided)
  const totalPages = assignment.page_end - assignment.page_start + 1;
    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="w-full"
    >
      <Card
        className={`overflow-hidden border-0 ${assignment.is_completed ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-emerald-100/50' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-slate-200/50'} shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border border-gray-100/50`}
      >

        {/* Main card content */}
        <div className="p-6">
          {/* Header with book title and date */}
          <div className="flex flex-row items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shadow-sm ${assignment.is_completed ? 'bg-emerald-100 shadow-emerald-200/50' : 'bg-indigo-100 shadow-indigo-200/50'}`}>
                  <BookOpen size={18} className={assignment.is_completed ? 'text-emerald-600' : 'text-indigo-600'} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1" title={assignment.books?.title || assignment.book_title || 'Genel Not'}>
                    {assignment.books?.title || assignment.book_title || 'Genel Not'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="font-medium">
                      {assignment.day}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${assignment.is_completed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {assignment.is_completed ? 'Tamamlandı' : 'Bekliyor'}
            </div>
          </div>          {/* Assignment details */}
          <div className="space-y-4">
            {/* Assignment note section */}
            {assignment.note && (
              <div className={`rounded-xl p-6 border-l-4 shadow-lg transition-all duration-300 hover:shadow-xl ${assignment.is_completed ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-500' : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-500'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shadow-md ${assignment.is_completed ? 'bg-emerald-200' : 'bg-indigo-200'}`}>
                    <FileText size={20} className={assignment.is_completed ? 'text-emerald-700' : 'text-indigo-700'} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg mb-3 ${assignment.is_completed ? 'text-emerald-800' : 'text-indigo-800'}`}>📚 Ödev Detayı</h4>
                    <p className={`text-base leading-relaxed font-medium ${assignment.is_completed ? 'text-emerald-700' : 'text-gray-800'}`}>
                      {assignment.note}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">İlerleme Durumu</span>
                <span className={`font-semibold ${assignment.is_completed ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {assignment.is_completed ? '100%' : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${assignment.is_completed ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gray-300'}`} 
                  style={{ width: assignment.is_completed ? '100%' : '0%' }}
                />
              </div>
            </div>

            {/* Time section */}
            {assignment.time && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Tahmini Süre</p>
                  <p className="text-sm text-purple-700 font-semibold">{assignment.time}</p>
                </div>
              </div>
            )}            {/* Student name */}
            {!isStudent && assignment.students && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <User size={16} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Öğrenci</p>
                  <p className="text-sm text-indigo-700 font-semibold">{assignment.students.name}</p>
                </div>
              </div>
            )}

            {/* Action button for students */}
            {isStudent && (
              <div className="pt-2">
                <button
                  onClick={handleToggle}
                  className={`w-full px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                    assignment.is_completed 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    <span>{assignment.is_completed ? 'Tamamlandı ✓' : 'Tamamla'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>


      </Card>
    </motion.div>
  );
};

export default AssignmentCardAlt;
