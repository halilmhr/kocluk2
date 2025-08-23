import { StudentExam } from '../lib/examService';

export interface ExamAnalysisData {
  examName: string;
  totalNet: number;
  date: string;
  exams: StudentExam[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      mode: string;
      intersect: boolean;
    };
  };
  scales?: {
    x: {
      display: boolean;
      grid: {
        display: boolean;
      };
    };
    y: {
      display: boolean;
      beginAtZero: boolean;
      grid: {
        color: string;
      };
    };
  };
}
