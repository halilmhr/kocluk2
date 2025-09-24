import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import { Calendar, Check, X, Users, Target } from 'lucide-react';
import { Program } from '../../types';
import { motion } from 'framer-motion';

interface RecentProgramCardProps {
  program: Program & {
    assignments: {
      id: string;
      is_completed: boolean;
      students: {
        name: string;
      };
    }[];
  };
  index: number;
}

const RecentProgramCard: React.FC<RecentProgramCardProps> = ({ program, index }) => {
  // Calculate completion percentage
  const totalAssignments = program.assignments?.length || 0;
  const completedAssignments = program.assignments?.filter(a => a.is_completed)?.length || 0;
  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  const students = Array.from(new Set(program.assignments?.map(a => a.students?.name).filter(Boolean) || []));
  
  // Tamamlanma durumuna göre renk seçimi
  const statusColor = completionPercentage === 100 
    ? 'from-emerald-50 to-green-100 border-emerald-200' 
    : completionPercentage > 50 
    ? 'from-blue-50 to-indigo-100 border-blue-200'
    : 'from-orange-50 to-amber-100 border-orange-200';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Link to={`/programs/${program.id}`}>
        <Card className={`p-2 h-full bg-gradient-to-br ${statusColor} border hover:shadow-md hover:scale-[1.01] transition-all duration-200`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 text-xs truncate pr-1">{program.title}</h3>
            <span className={`text-xs py-0.5 px-1 rounded ${
              program.is_scheduled 
                ? 'bg-green-100 text-green-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {program.is_scheduled ? '📅' : '⏳'}
            </span>
          </div>
          
          <div className="flex items-center text-xs text-gray-600 mb-1 bg-white/50 rounded p-1">
            <Calendar size={10} className="mr-1 text-blue-500" />
            <span className="text-xs">{new Date(program.created_at).toLocaleDateString('tr-TR')}</span>
          </div>
          
          {students.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center mb-0.5">
                <Users size={8} className="mr-0.5 text-indigo-500" />
                <p className="text-xs text-gray-700">Öğrenciler:</p>
              </div>
              <div className="flex flex-wrap gap-0.5">
                {students.slice(0, 2).map((student, i) => (
                  <span 
                    key={i} 
                    className="text-xs bg-white/80 text-gray-800 py-0.5 px-1 rounded"
                  >
                    {student}
                  </span>
                ))}
                {students.length > 2 && (
                  <span className="text-xs bg-gray-200 text-gray-600 py-0.5 px-1 rounded">
                    +{students.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-1 bg-white/60 rounded p-1.5">
            <div className="flex items-center justify-between text-xs mb-0.5">
              <div className="flex items-center">
                <Target size={8} className="mr-0.5 text-purple-500" />
                <span className="text-gray-700">Tamamlanma</span>
              </div>
              <span className={`font-bold text-xs ${
                completionPercentage === 100 
                  ? 'text-green-600' 
                  : completionPercentage > 50 
                  ? 'text-blue-600' 
                  : 'text-orange-600'
              }`}>
                %{completionPercentage}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.6, ease: "easeOut" }}
                className={`h-1.5 rounded-full ${
                  completionPercentage === 100 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                    : completionPercentage > 50 
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                    : 'bg-gradient-to-r from-orange-400 to-amber-500'
                }`}
              ></motion.div>
            </div>
          </div>
          
          <div className="mt-1 flex items-center justify-center gap-2">
            <div className="flex items-center bg-green-100/80 text-green-600 px-1.5 py-0.5 rounded">
              <Check size={10} className="mr-0.5" />
              <span className="text-xs font-bold">{completedAssignments}</span>
            </div>
            <div className="flex items-center bg-red-100/80 text-red-600 px-1.5 py-0.5 rounded">
              <X size={10} className="mr-0.5" />
              <span className="text-xs font-bold">{totalAssignments - completedAssignments}</span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
};

export default RecentProgramCard;