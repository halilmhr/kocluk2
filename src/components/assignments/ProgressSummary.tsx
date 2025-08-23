import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';

interface ProgressSummaryProps {
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments?: number;
  showDetails?: boolean;
  animate?: boolean;
  className?: string;
  onFilterChange?: (filter: 'all' | 'completed' | 'pending') => void;
  activeFilter?: 'all' | 'completed' | 'pending';
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({
  totalAssignments,
  completedAssignments,
  overdueAssignments = 0,
  showDetails = true,
  animate = true,
  className = '',
  onFilterChange,
  activeFilter = 'all'
}) => {
  // Calculate statistics
  const completionPercentage = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 0;
  
  const remainingAssignments = totalAssignments - completedAssignments;
  
  // Determine status color
  let statusColor = 'bg-gray-500';
  let statusText = 'Başlanmadı';
  
  if (completionPercentage === 100) {
    statusColor = 'bg-green-500';
    statusText = 'Tamamlandı';
  } else if (completionPercentage >= 75) {
    statusColor = 'bg-emerald-500';
    statusText = 'İyi Gidiyor';
  } else if (completionPercentage >= 50) {
    statusColor = 'bg-blue-500';
    statusText = 'Devam Ediyor';
  } else if (completionPercentage >= 25) {
    statusColor = 'bg-yellow-500';
    statusText = 'Başlandı';
  } else if (completionPercentage > 0) {
    statusColor = 'bg-orange-500';
    statusText = 'Yeni Başlandı';
  }
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="p-4 pb-5">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">İlerleme Durumu</h3>
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full ${statusColor} mr-2`}></span>
            <span className="text-sm font-medium text-gray-700">{statusText}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={animate ? { width: '0%' } : { width: `${completionPercentage}%` }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            className={`absolute top-0 left-0 h-full ${statusColor}`}
          />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-md">
              {completionPercentage}%
            </span>
          </div>
        </div>
          {showDetails && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div 
              className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                onFilterChange ? 'hover:bg-green-200' : 'bg-green-100'
              } ${activeFilter === 'completed' ? 'bg-green-200 ring-2 ring-green-400 shadow-md' : 'bg-green-100'}`}
              onClick={() => onFilterChange && onFilterChange('completed')}
            >
              <div className="flex items-center">
                <CheckCircle size={18} className="text-green-600 mr-1" />
                <span className="font-bold text-green-800 text-lg">{completedAssignments}</span>
              </div>
              <span className="text-sm text-green-700 mt-1 font-medium">Tamamlanan</span>
            </div>
            
            <div 
              className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                onFilterChange ? 'hover:bg-blue-200' : 'bg-blue-100'
              } ${activeFilter === 'pending' ? 'bg-blue-200 ring-2 ring-blue-400 shadow-md' : 'bg-blue-100'}`}
              onClick={() => onFilterChange && onFilterChange('pending')}
            >
              <div className="flex items-center">
                <Clock size={18} className="text-blue-600 mr-1" />
                <span className="font-bold text-blue-800 text-lg">{remainingAssignments}</span>
              </div>
              <span className="text-sm text-blue-700 mt-1 font-medium">Bekleyen</span>
            </div>
            
            {overdueAssignments > 0 && (
              <div className="flex flex-col items-center p-3 bg-red-100 rounded-lg shadow-md">
                <div className="flex items-center">
                  <AlertCircle size={18} className="text-red-600 mr-1" />
                  <span className="font-bold text-red-800 text-lg">{overdueAssignments}</span>
                </div>
                <span className="text-sm text-red-700 mt-1 font-medium">Gecikmiş</span>
              </div>
            )}
            
            {overdueAssignments === 0 && (
              <div 
                className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                  onFilterChange ? 'hover:bg-gray-200' : 'bg-gray-100'
                } ${activeFilter === 'all' ? 'bg-gray-200 ring-2 ring-gray-400 shadow-md' : 'bg-gray-100'}`}
                onClick={() => onFilterChange && onFilterChange('all')}
              >
                <div className="flex items-center">
                  <span className="font-bold text-gray-800 text-lg">{totalAssignments}</span>
                </div>
                <span className="text-sm text-gray-700 mt-1 font-medium">Toplam</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProgressSummary;
