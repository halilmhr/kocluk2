import { supabaseAdmin, supabase } from './supabase';

// Auth user'dan student ID'yi alma fonksiyonu
export async function getStudentIdFromAuthUser(authUserId: string): Promise<{ studentId: string; error: null }> {
  // Öğrenci giriş sisteminde student.id doğrudan auth store'da user.id olarak saklanıyor
  // Bu nedenle auth user'ın id'sini direkt student_id olarak kullanıyoruz
  return { studentId: authUserId, error: null };
}

export interface TYTExamData {
  examName: string;
  turkce: { correct: string; wrong: string; blank: string };
  matematik: { correct: string; wrong: string; blank: string };
  fen: {
    fizik: { correct: string; wrong: string; blank: string };
    kimya: { correct: string; wrong: string; blank: string };
    biyoloji: { correct: string; wrong: string; blank: string };
  };
  sosyal: {
    tarih: { correct: string; wrong: string; blank: string };
    cografya: { correct: string; wrong: string; blank: string };
    felsefe: { correct: string; wrong: string; blank: string };
    dinKultur: { correct: string; wrong: string; blank: string };
  };
}

export interface SingleSubjectExamData {
  examName: string;
  subject: string;
  correct: string;
  wrong: string;
  blank: string;
}

export interface StudentExam {
  id: string;
  student_id: string;
  exam_type: 'TYT' | 'AYT' | 'LGS';
  exam_date: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  empty_answers: number;
  score: number;
  net_score: number;
  subject_scores: any;
  created_at: string;
  updated_at: string;
}

export interface QuestionEntry {
  id: string;
  date: string;
  subject: string;
  correctAnswers: number;
  wrongAnswers: number;
  totalQuestions: number;
}

export interface StudentQuestionStat {
  id: string;
  student_id: string;
  date: string;
  subject: string;
  correct_answers: number;
  wrong_answers: number;
  total_questions: number;
  success_rate: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Mevcut dersleri getiren fonksiyon
export const getAvailableSubjects = async () => {
  try {
    const { data: books, error } = await supabaseAdmin
      .from('books')
      .select('subject')
      .not('subject', 'is', null);

    if (error) throw error;

    // Benzersiz dersleri filtrele
    const uniqueSubjects = [...new Set(books?.map(book => book.subject) || [])];
    return { subjects: uniqueSubjects, error: null };
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return { subjects: [], error };
  }
};

// TYT denemesi kaydetme
export const saveTYTExam = async (studentId: string, examData: TYTExamData) => {
  try {
    const turkceCorrect = parseInt(examData.turkce.correct) || 0;
    const turkceWrong = parseInt(examData.turkce.wrong) || 0;
    const matematikCorrect = parseInt(examData.matematik.correct) || 0;
    const matematikWrong = parseInt(examData.matematik.wrong) || 0;
    
    // Fen bilimleri alt kategorilerini topla
    const fenCorrect = (parseInt(examData.fen.fizik.correct) || 0) + 
                      (parseInt(examData.fen.kimya.correct) || 0) + 
                      (parseInt(examData.fen.biyoloji.correct) || 0);
    const fenWrong = (parseInt(examData.fen.fizik.wrong) || 0) + 
                    (parseInt(examData.fen.kimya.wrong) || 0) + 
                    (parseInt(examData.fen.biyoloji.wrong) || 0);
    
    // Sosyal bilimler alt kategorilerini topla
    const sosyalCorrect = (parseInt(examData.sosyal.tarih.correct) || 0) + 
                         (parseInt(examData.sosyal.cografya.correct) || 0) + 
                         (parseInt(examData.sosyal.felsefe.correct) || 0) + 
                         (parseInt(examData.sosyal.dinKultur.correct) || 0);
    const sosyalWrong = (parseInt(examData.sosyal.tarih.wrong) || 0) + 
                       (parseInt(examData.sosyal.cografya.wrong) || 0) + 
                       (parseInt(examData.sosyal.felsefe.wrong) || 0) + 
                       (parseInt(examData.sosyal.dinKultur.wrong) || 0);

    const totalCorrect = turkceCorrect + matematikCorrect + fenCorrect + sosyalCorrect;
    const totalWrong = turkceWrong + matematikWrong + fenWrong + sosyalWrong;
    const totalQuestions = 120; // TYT toplam soru sayısı
    const emptyAnswers = totalQuestions - totalCorrect - totalWrong;
    const netScore = totalCorrect - (totalWrong * 0.25);
    const score = (netScore / totalQuestions) * 100;

    const subjectScores = {
      examName: examData.examName,
      turkce: { correct: turkceCorrect, wrong: turkceWrong },
      matematik: { correct: matematikCorrect, wrong: matematikWrong },
      fen: {
        correct: fenCorrect,
        wrong: fenWrong,
        fizik: { 
          correct: parseInt(examData.fen.fizik.correct) || 0, 
          wrong: parseInt(examData.fen.fizik.wrong) || 0 
        },
        kimya: { 
          correct: parseInt(examData.fen.kimya.correct) || 0, 
          wrong: parseInt(examData.fen.kimya.wrong) || 0 
        },
        biyoloji: { 
          correct: parseInt(examData.fen.biyoloji.correct) || 0, 
          wrong: parseInt(examData.fen.biyoloji.wrong) || 0 
        }
      },
      sosyal: {
        correct: sosyalCorrect,
        wrong: sosyalWrong,
        tarih: { 
          correct: parseInt(examData.sosyal.tarih.correct) || 0, 
          wrong: parseInt(examData.sosyal.tarih.wrong) || 0 
        },
        cografya: { 
          correct: parseInt(examData.sosyal.cografya.correct) || 0, 
          wrong: parseInt(examData.sosyal.cografya.wrong) || 0 
        },
        felsefe: { 
          correct: parseInt(examData.sosyal.felsefe.correct) || 0, 
          wrong: parseInt(examData.sosyal.felsefe.wrong) || 0 
        },
        dinKultur: { 
          correct: parseInt(examData.sosyal.dinKultur.correct) || 0, 
          wrong: parseInt(examData.sosyal.dinKultur.wrong) || 0 
        }
      }
    };

    const { data, error } = await supabaseAdmin
      .from('student_exams')
      .insert({
        student_id: studentId,
        exam_type: 'TYT',
        exam_date: new Date().toISOString().split('T')[0],
        total_questions: totalQuestions,
        correct_answers: totalCorrect,
        wrong_answers: totalWrong,
        empty_answers: emptyAnswers,
        score: score,
        net_score: netScore,
        subject_scores: subjectScores
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('TYT deneme kaydetme hatası:', error);
    return { data: null, error };
  }
};

// AYT/LGS denemesi kaydetme
export const saveSingleSubjectExam = async (
  studentId: string, 
  examType: 'AYT' | 'LGS', 
  examData: SingleSubjectExamData
) => {
  try {
    const correct = parseInt(examData.correct) || 0;
    const wrong = parseInt(examData.wrong) || 0;
    const blank = parseInt(examData.blank) || 0;
    const totalQuestions = correct + wrong + blank;
    const netScore = correct - (wrong * 0.25);
    const score = totalQuestions > 0 ? (netScore / totalQuestions) * 100 : 0;

    const subjectScores = {
      examName: examData.examName,
      subject: examData.subject,
      correct: correct,
      wrong: wrong,
      blank: blank
    };

    const { data, error } = await supabaseAdmin
      .from('student_exams')
      .insert({
        student_id: studentId,
        exam_type: examType,
        exam_date: new Date().toISOString().split('T')[0],
        total_questions: totalQuestions,
        correct_answers: correct,
        wrong_answers: wrong,
        empty_answers: blank,
        score: score,
        net_score: netScore,
        subject_scores: subjectScores
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error(`${examType} deneme kaydetme hatası:`, error);
    return { data: null, error };
  }
};

// Öğrencinin denemelerini getirme
export const getStudentExams = async (studentId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_exams')
      .select('*')
      .eq('student_id', studentId)
      .order('exam_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Deneme listesi getirme hatası:', error);
    return { data: null, error };
  }
};

// Deneme silme
export const deleteStudentExam = async (examId: string) => {
  try {
    const { error } = await supabaseAdmin
      .from('student_exams')
      .delete()
      .eq('id', examId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Deneme silme hatası:', error);
    return { error };
  }
};

// Deneme türüne göre istatistikler
export const getExamStatistics = async (studentId: string, examType?: 'TYT' | 'AYT' | 'LGS') => {
  try {
    let query = supabaseAdmin
      .from('student_exams')
      .select('*')
      .eq('student_id', studentId);

    if (examType) {
      query = query.eq('exam_type', examType);
    }

    const { data, error } = await query.order('exam_date', { ascending: false });

    if (error) throw error;

    // İstatistikleri hesapla
    const stats = {
      totalExams: data?.length || 0,
      averageNet: data?.length ? (data.reduce((sum, exam) => sum + exam.net_score, 0) / data.length).toFixed(2) : '0',
      bestNet: data?.length ? Math.max(...data.map(exam => exam.net_score)).toFixed(2) : '0',
      latestNet: data?.length ? data[0].net_score.toFixed(2) : '0',
      improvement: data?.length >= 2 ? (data[0].net_score - data[data.length - 1].net_score).toFixed(2) : '0'
    };

    return { data, stats, error: null };
  } catch (error) {
    console.error('Deneme istatistikleri getirme hatası:', error);
    return { data: null, stats: null, error };
  }
};

// Öğrenci soru istatistikleri - ödevlerden
export const getStudentQuestionStats = async (studentId: string) => {
  try {
    // Öğrencinin tüm ödevlerini ve soru istatistiklerini getir
    const { data: allAssignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        day,
        correct_answers,
        wrong_answers,
        blank_answers,
        is_completed,
        books (
          title,
          subject
        ),
        programs (
          title
        )
      `)
      .eq('student_id', studentId);

    if (error) throw error;

    // Sadece soru istatistikleri olan ödevleri filtrele
    const assignments = allAssignments?.filter(assignment => 
      assignment.correct_answers !== null || 
      assignment.wrong_answers !== null || 
      assignment.blank_answers !== null
    ) || [];

    // İstatistikleri hesapla
    const totalCorrect = assignments?.reduce((sum, a) => sum + (a.correct_answers || 0), 0) || 0;
    const totalWrong = assignments?.reduce((sum, a) => sum + (a.wrong_answers || 0), 0) || 0;
    const totalBlank = assignments?.reduce((sum, a) => sum + (a.blank_answers || 0), 0) || 0;
    const totalQuestions = totalCorrect + totalWrong + totalBlank;
    
    // Ders bazında istatistikler
    const subjectStats: { [key: string]: { correct: number; wrong: number; blank: number; total: number } } = {};
    
    assignments?.forEach(assignment => {
      const subject = assignment.books?.[0]?.subject || 'Diğer';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { correct: 0, wrong: 0, blank: 0, total: 0 };
      }
      subjectStats[subject].correct += assignment.correct_answers || 0;
      subjectStats[subject].wrong += assignment.wrong_answers || 0;
      subjectStats[subject].blank += assignment.blank_answers || 0;
      subjectStats[subject].total += (assignment.correct_answers || 0) + (assignment.wrong_answers || 0) + (assignment.blank_answers || 0);
    });

    // Günlük istatistikler
    const dailyStats: { [key: string]: { correct: number; wrong: number; blank: number; total: number } } = {};
    
    assignments?.forEach(assignment => {
      const day = assignment.day?.toString() || 'Belirtilmemiş';
      if (!dailyStats[day]) {
        dailyStats[day] = { correct: 0, wrong: 0, blank: 0, total: 0 };
      }
      dailyStats[day].correct += assignment.correct_answers || 0;
      dailyStats[day].wrong += assignment.wrong_answers || 0;
      dailyStats[day].blank += assignment.blank_answers || 0;
      dailyStats[day].total += (assignment.correct_answers || 0) + (assignment.wrong_answers || 0) + (assignment.blank_answers || 0);
    });

    const stats = {
      totalAssignments: assignments?.length || 0,
      totalQuestions,
      totalCorrect,
      totalWrong,
      totalBlank,
      successRate: totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '0',
      subjectStats: Object.entries(subjectStats).map(([subject, data]) => ({
        subject,
        ...data,
        successRate: data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : '0'
      })).sort((a, b) => b.total - a.total),
      dailyStats: Object.entries(dailyStats).map(([day, data]) => ({
        day: parseInt(day) || 0,
        ...data,
        successRate: data.total > 0 ? ((data.correct / data.total) * 100).toFixed(1) : '0'
      })).sort((a, b) => a.day - b.day)
    };

    return { data: assignments, stats, error: null };
  } catch (error) {
    console.error('Soru istatistikleri getirme hatası:', error);
    return { data: null, stats: null, error };
  }
};

// ============== STUDENT QUESTION STATISTICS DATABASE FUNCTIONS ==============

// Öğrenci soru istatistiği ekleme/güncelleme
export async function saveStudentQuestionStat(
  studentId: string,
  entry: Omit<QuestionEntry, 'id' | 'totalQuestions'>
): Promise<{ data: StudentQuestionStat | null; error: any }> {
  try {
    console.log('Saving to database:', { studentId, entry });
    
    // Supabase credentials kontrolü
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      console.warn('Supabase credentials not configured, using localStorage only');
      return { 
        data: {
          id: Date.now().toString(),
          student_id: studentId,
          date: entry.date,
          subject: entry.subject,
          correct_answers: entry.correctAnswers,
          wrong_answers: entry.wrongAnswers,
          total_questions: entry.correctAnswers + entry.wrongAnswers,
          success_rate: ((entry.correctAnswers / (entry.correctAnswers + entry.wrongAnswers)) * 100),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as StudentQuestionStat, 
        error: null 
      };
    }
    
    // Önce service role client ile deneme yapalım (RLS bypass için)
    try {
      const { data: testData, error: testError } = await supabaseAdmin
        .from('student_question_stats')
        .upsert({
          student_id: studentId,
          program_id: '00000000-0000-0000-0000-000000000000', // Geçici program ID
          date: entry.date,
          math_correct: entry.subject === 'Matematik' ? entry.correctAnswers : 0,
          math_wrong: entry.subject === 'Matematik' ? entry.wrongAnswers : 0,
          math_blank: 0,
          turkish_correct: entry.subject === 'Türkçe' ? entry.correctAnswers : 0,
          turkish_wrong: entry.subject === 'Türkçe' ? entry.wrongAnswers : 0,
          turkish_blank: 0,
          science_correct: (entry.subject === 'Fen Bilimleri' || entry.subject === 'Fizik' || entry.subject === 'Kimya' || entry.subject === 'Biyoloji') ? entry.correctAnswers : 0,
          science_wrong: (entry.subject === 'Fen Bilimleri' || entry.subject === 'Fizik' || entry.subject === 'Kimya' || entry.subject === 'Biyoloji') ? entry.wrongAnswers : 0,
          science_blank: 0,
          social_correct: (entry.subject === 'Sosyal Bilgiler' || entry.subject === 'Tarih' || entry.subject === 'Coğrafya' || entry.subject === 'Felsefe') ? entry.correctAnswers : 0,
          social_wrong: (entry.subject === 'Sosyal Bilgiler' || entry.subject === 'Tarih' || entry.subject === 'Coğrafya' || entry.subject === 'Felsefe') ? entry.wrongAnswers : 0,
          social_blank: 0
        }, {
          onConflict: 'student_id,date,program_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (testError) {
        console.error('Service role database save error:', testError);
        throw testError;
      }

      console.log('Service role database save successful:', testData);
      return { 
        data: {
          id: testData.id?.toString() || Date.now().toString(),
          student_id: testData.student_id,
          date: testData.date,
          subject: entry.subject,
          correct_answers: entry.correctAnswers,
          wrong_answers: entry.wrongAnswers,
          total_questions: testData.total_questions,
          success_rate: testData.success_rate,
          created_at: testData.created_at,
          updated_at: testData.updated_at
        } as StudentQuestionStat, 
        error: null 
      };
    } catch (serviceRoleError) {
      console.error('Service role error, trying with regular client:', serviceRoleError);
      
      // Normal client ile deneme
      const { data, error } = await supabase
        .from('student_question_stats')
        .upsert({
          student_id: studentId,
          program_id: '00000000-0000-0000-0000-000000000000', // Geçici program ID
          date: entry.date,
          math_correct: entry.subject === 'Matematik' ? entry.correctAnswers : 0,
          math_wrong: entry.subject === 'Matematik' ? entry.wrongAnswers : 0,
          math_blank: 0,
          turkish_correct: entry.subject === 'Türkçe' ? entry.correctAnswers : 0,
          turkish_wrong: entry.subject === 'Türkçe' ? entry.wrongAnswers : 0,
          turkish_blank: 0,
          science_correct: (entry.subject === 'Fen Bilimleri' || entry.subject === 'Fizik' || entry.subject === 'Kimya' || entry.subject === 'Biyoloji') ? entry.correctAnswers : 0,
          science_wrong: (entry.subject === 'Fen Bilimleri' || entry.subject === 'Fizik' || entry.subject === 'Kimya' || entry.subject === 'Biyoloji') ? entry.wrongAnswers : 0,
          science_blank: 0,
          social_correct: (entry.subject === 'Sosyal Bilgiler' || entry.subject === 'Tarih' || entry.subject === 'Coğrafya' || entry.subject === 'Felsefe') ? entry.correctAnswers : 0,
          social_wrong: (entry.subject === 'Sosyal Bilgiler' || entry.subject === 'Tarih' || entry.subject === 'Coğrafya' || entry.subject === 'Felsefe') ? entry.wrongAnswers : 0,
          social_blank: 0
        }, {
          onConflict: 'student_id,date,program_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Regular client database save error:', error);
        throw error;
      }

      console.log('Regular client database save successful:', data);
      return { 
        data: {
          id: data.id?.toString() || Date.now().toString(),
          student_id: data.student_id,
          date: data.date,
          subject: entry.subject,
          correct_answers: entry.correctAnswers,
          wrong_answers: entry.wrongAnswers,
          total_questions: data.total_questions,
          success_rate: data.success_rate,
          created_at: data.created_at,
          updated_at: data.updated_at
        } as StudentQuestionStat, 
        error: null 
      };
    }
  } catch (error) {
    console.error('Soru istatistiği kaydetme hatası:', error);
    return { data: null, error };
  }
}

// Öğrenci soru istatistiklerini getirme
export async function getStudentQuestionStatsFromDB(
  studentId: string,
  days: number = 30
): Promise<{ data: QuestionEntry[] | null; error: any }> {
  try {
    console.log('Loading from database:', { studentId, days });
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('student_question_stats')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Database load error:', error);
      throw error;
    }

    console.log('Database load successful:', data);

    // Her satırı ayrı derslere böl
    const formattedData: QuestionEntry[] = [];
    
    data?.forEach((item: any) => {
      // Matematik
      if (item.math_correct > 0 || item.math_wrong > 0 || item.math_blank > 0) {
        formattedData.push({
          id: `${item.id}-math`,
          date: item.date,
          subject: 'Matematik',
          correctAnswers: item.math_correct || 0,
          wrongAnswers: item.math_wrong || 0,
          totalQuestions: (item.math_correct || 0) + (item.math_wrong || 0) + (item.math_blank || 0)
        });
      }
      
      // Türkçe
      if (item.turkish_correct > 0 || item.turkish_wrong > 0 || item.turkish_blank > 0) {
        formattedData.push({
          id: `${item.id}-turkish`,
          date: item.date,
          subject: 'Türkçe',
          correctAnswers: item.turkish_correct || 0,
          wrongAnswers: item.turkish_wrong || 0,
          totalQuestions: (item.turkish_correct || 0) + (item.turkish_wrong || 0) + (item.turkish_blank || 0)
        });
      }
      
      // Fen Bilimleri
      if (item.science_correct > 0 || item.science_wrong > 0 || item.science_blank > 0) {
        formattedData.push({
          id: `${item.id}-science`,
          date: item.date,
          subject: 'Fen Bilimleri',
          correctAnswers: item.science_correct || 0,
          wrongAnswers: item.science_wrong || 0,
          totalQuestions: (item.science_correct || 0) + (item.science_wrong || 0) + (item.science_blank || 0)
        });
      }
      
      // Sosyal Bilgiler
      if (item.social_correct > 0 || item.social_wrong > 0 || item.social_blank > 0) {
        formattedData.push({
          id: `${item.id}-social`,
          date: item.date,
          subject: 'Sosyal Bilgiler',
          correctAnswers: item.social_correct || 0,
          wrongAnswers: item.social_wrong || 0,
          totalQuestions: (item.social_correct || 0) + (item.social_wrong || 0) + (item.social_blank || 0)
        });
      }
    });

    console.log('Formatted data:', formattedData);
    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Soru istatistikleri getirme hatası:', error);
    return { data: null, error };
  }
}

// Öğrenci ders bazında istatistikler
export async function getStudentSubjectStatsFromDB(
  studentId: string,
  subject?: string
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_student_subject_stats', {
        p_student_id: studentId,
        p_subject: subject || null
      });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Ders bazında istatistik getirme hatası:', error);
    return { data: null, error };
  }
}

// Öğrencinin mevcut derslerini getirme
export async function getStudentAvailableSubjectsFromDB(
  studentId: string
): Promise<{ data: string[] | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_student_available_subjects', {
        p_student_id: studentId
      });

    if (error) throw error;

    const subjects = data?.map((item: any) => item.subject) || [];
    return { data: subjects, error: null };
  } catch (error) {
    console.error('Mevcut dersler getirme hatası:', error);
    return { data: null, error };
  }
}

// Öğrenci genel performans özeti
export async function getStudentOverallPerformance(
  studentId: string
): Promise<{ data: any | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_overall_performance')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error) throw error;

    return { data: data || null, error: null };
  } catch (error) {
    console.error('Genel performans getirme hatası:', error);
    return { data: null, error };
  }
}

// Haftalık ilerleme getirme
export async function getStudentWeeklyProgress(
  studentId: string,
  weeks: number = 4
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('student_weekly_progress')
      .select('*')
      .eq('student_id', studentId)
      .gte('week_start', new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('week_start', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Haftalık ilerleme getirme hatası:', error);
    return { data: null, error };
  }
}