import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Service role client for bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

// Subject Analysis Functions
export interface StudentSubjectAnalysis {
  id: string;
  student_id: string;
  subject_id: string;
  subject_name: string;
  subject_category: 'TYT' | 'AYT';
  progress: number;
  completed_topics: string[];
  created_at: string;
  updated_at: string;
}

// Get all subject analysis for a student
export async function getStudentSubjectAnalysis(studentId: string) {
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .select('*')
    .eq('student_id', studentId)
    .order('subject_category', { ascending: true })
    .order('subject_name', { ascending: true });
  
  return { data, error };
}

// Get specific subject analysis
export async function getSubjectAnalysis(studentId: string, subjectId: string) {
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .select('*')
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .single();
  
  return { data, error };
}

// Create or update subject analysis
export async function upsertSubjectAnalysis(
  studentId: string,
  subjectId: string,
  subjectName: string,
  subjectCategory: 'TYT' | 'AYT',
  completedTopics: string[],
  progress: number
) {
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .upsert({
      student_id: studentId,
      subject_id: subjectId,
      subject_name: subjectName,
      subject_category: subjectCategory,
      completed_topics: completedTopics,
      progress: progress
    }, {
      onConflict: 'student_id,subject_id'
    })
    .select()
    .single();
  
  return { data, error };
}

// Update topic completion status
export async function updateTopicCompletion(
  studentId: string,
  subjectId: string,
  topicId: string,
  isCompleted: boolean
) {
  // First get current data
  const { data: currentData, error: fetchError } = await getSubjectAnalysis(studentId, subjectId);
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { data: null, error: fetchError };
  }
  
  let completedTopics: string[] = currentData?.completed_topics || [];
  
  if (isCompleted) {
    // Add topic if not already completed
    if (!completedTopics.includes(topicId)) {
      completedTopics.push(topicId);
    }
  } else {
    // Remove topic from completed list
    completedTopics = completedTopics.filter(id => id !== topicId);
  }
  
  // Calculate progress (this should match the total topics count from frontend)
  // For now, we'll use a simple calculation, but this could be enhanced
  const progress = Math.round((completedTopics.length / 35) * 100); // Assuming max 35 topics per subject
  
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .upsert({
      student_id: studentId,
      subject_id: subjectId,
      subject_name: currentData?.subject_name || subjectId,
      subject_category: currentData?.subject_category || 'TYT',
      completed_topics: completedTopics,
      progress: progress
    }, {
      onConflict: 'student_id,subject_id'
    })
    .select()
    .single();
  
  return { data, error };
}

// Bulk update subject analysis (for migrating from localStorage)
export async function bulkUpsertSubjectAnalysis(
  studentId: string,
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    subjectCategory: 'TYT' | 'AYT';
    completedTopics: string[];
    progress: number;
  }>
) {
  const dataToInsert = subjects.map(subject => ({
    student_id: studentId,
    subject_id: subject.subjectId,
    subject_name: subject.subjectName,
    subject_category: subject.subjectCategory,
    completed_topics: subject.completedTopics,
    progress: subject.progress
  }));
  
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .upsert(dataToInsert, {
      onConflict: 'student_id,subject_id'
    })
    .select();
  
  return { data, error };
}

// Delete subject analysis
export async function deleteSubjectAnalysis(studentId: string, subjectId: string) {
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .delete()
    .eq('student_id', studentId)
    .eq('subject_id', subjectId)
    .select()
    .single();
  
  return { data, error };
}

// Get subject analysis statistics
export async function getSubjectAnalysisStats(studentId: string) {
  const { data, error } = await supabase
    .from('student_subject_analysis')
    .select('subject_category, progress, completed_topics')
    .eq('student_id', studentId);
  
  if (error) {
    return { data: null, error };
  }
  
  const stats = {
    tyt: {
      totalSubjects: 0,
      completedSubjects: 0,
      averageProgress: 0,
      totalTopics: 0,
      completedTopics: 0
    },
    ayt: {
      totalSubjects: 0,
      completedSubjects: 0,
      averageProgress: 0,
      totalTopics: 0,
      completedTopics: 0
    }
  };
  
  data?.forEach(subject => {
    const category = subject.subject_category.toLowerCase() as 'tyt' | 'ayt';
    stats[category].totalSubjects++;
    stats[category].averageProgress += subject.progress;
    stats[category].totalTopics += subject.completed_topics?.length || 0;
    
    if (subject.progress === 100) {
      stats[category].completedSubjects++;
    }
  });
  
  // Calculate averages
  if (stats.tyt.totalSubjects > 0) {
    stats.tyt.averageProgress = Math.round(stats.tyt.averageProgress / stats.tyt.totalSubjects);
  }
  if (stats.ayt.totalSubjects > 0) {
    stats.ayt.averageProgress = Math.round(stats.ayt.averageProgress / stats.ayt.totalSubjects);
  }
  
  return { data: stats, error: null };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

export async function getStudents(userId: string) {
  // Use supabaseAdmin to bypass RLS
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching students:', error);
  }

  return { data, error };
}

export async function getBooks(userId: string) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function getPrograms(userId: string) {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      assignments (
        id,
        is_completed,
        student_id,
        students (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (data) {
    // Process the data to add studentName
    return {
      data: data.map(program => ({
        ...program,
        studentName: program.assignments?.[0]?.students?.name
      })),
      error
    };
  }
  
  return { data, error };
}

export async function createStudent(
  userId: string, 
  name: string, 
  email?: string,
  password?: string,
  school?: string,
  grade?: string,
  phone?: string,
  parent_name?: string,
  parent_phone?: string,
  field?: string
) {
  // E-posta varsa, önce aynı e-posta ile öğrenci olup olmadığını kontrol et
  if (email) {
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingStudent) {
      return { data: null, error: { message: 'Bu e-posta adresi ile zaten bir öğrenci kayıtlı.' } };
    }
  }

  const { data, error } = await supabaseAdmin
    .from('students')
    .insert([{ 
      user_id: userId, 
      name, 
      email,
      password,
      school,
      grade,
      phone,
      parent_name,
      parent_phone,
      field
    }])
    .select()
    .single();
  
  return { data, error };
}

export async function updateStudentPassword(studentId: string, newPassword: string) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .update({ 
      password: newPassword,
      password_changed: true 
    })
    .eq('id', studentId)
    .select()
    .single();

  return { data, error };
}

export async function getStudentByEmail(email: string) {
  const { data, error } = await supabaseAdmin
    .from('students')
    .select('*')
    .eq('email', email)
    .single();

  return { data, error };
}

export async function createBook(userId: string, title: string, author?: string, isStoryBook?: boolean, subject?: string) {
  // Önce books tablosunun yapısını kontrol edelim
  console.log('🔍 Supabase: Books tablosu yapısını kontrol ediyorum...');
  
  const { data: testData, error: testError } = await supabase
    .from('books')
    .select('*')
    .limit(1);
    
  if (testError) {
    console.error('❌ Books tablosu test hatası:', testError);
  } else {
    console.log('✅ Books tablosu mevcut, örnek satır:', testData);
  }

  const bookData: any = { 
    user_id: userId, 
    title 
  };
  
  if (author) {
    bookData.author = author;
  }
  
  if (isStoryBook !== undefined) {
    bookData.is_story_book = isStoryBook;
  }
  
  // subject sütunu varsa ekle - yoksa hata vermesin
  if (subject) {
    try {
      bookData.subject = subject;
    } catch (err) {
      console.warn('⚠️ Subject sütunu desteklenmiyor, atlanıyor...');
    }
  }
  
  console.log('📚 Supabase: Kitap verisi hazırlandı:', bookData);
  console.log('📚 Supabase: subject değeri:', subject);
  console.log('📚 Supabase: isStoryBook değeri:', isStoryBook);
  
  // Önce subject olmadan deneyeceğiz, hata alırsak subject'siz tekrar deneyeceğiz
  let { data, error } = await supabase
    .from('books')
    .insert([bookData])
    .select()
    .single();
  
  // Eğer subject sütunu yok hatası alırsak, subject'i çıkarıp tekrar deneyelim
  if (error && error.message.includes('subject')) {
    console.warn('⚠️ Subject sütunu yok, subject olmadan tekrar deniyorum...');
    const { subject: _, ...bookDataWithoutSubject } = bookData;
    
    const result = await supabase
      .from('books')
      .insert([bookDataWithoutSubject])
      .select()
      .single();
      
    data = result.data;
    error = result.error;
  }
  
  if (error) {
    console.error('❌ Supabase: Kitap ekleme hatası:', error);
    console.error('❌ Supabase: Hata detayı:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Supabase: Kitap başarıyla eklendi:', data);
  }
  
  return { data, error };
}

export async function assignBookToStudent(studentId: string, bookId: string) {
  const { data, error } = await supabase
    .from('student_books')
    .insert([{ student_id: studentId, book_id: bookId }])
    .select()
    .single();
  
  return { data, error };
}

export async function getStudentBooks(studentId: string) {
  const { data, error } = await supabase
    .from('student_books')
    .select(`
      id,
      book_id,
      books (
        id,
        title
      )
    `)
    .eq('student_id', studentId);
  
  return { data, error };
}

export async function createProgram(userId: string, title: string, isScheduled: boolean) {
  const { data, error } = await supabase
    .from('programs')
    .insert([{ user_id: userId, title, is_scheduled: isScheduled }])
    .select()
    .single();
  
  return { data, error };
}

export async function createAssignment(
  programId: string,
  studentId: string,
  bookId: string | null,
  pageStart: number,
  pageEnd: number,
  day: string,
  time?: string,
  note?: string
) {
  const assignmentData: any = {
    program_id: programId,
    student_id: studentId,
    page_start: pageStart,
    page_end: pageEnd,
    day,
    time,
    note,
    is_completed: false
  };
  
  // bookId varsa ekle, yoksa null bırak
  // Eğer veritabanında NOT NULL constraint varsa, geçici olarak dummy değer ver
  if (bookId) {
    assignmentData.book_id = bookId;
  } else {
    // Geçici çözüm: book_id null olamıyorsa, özel bir placeholder book oluştur
    // Bu durumda null bırakıyoruz, eğer hata alırsak migration gerekli
    assignmentData.book_id = null;
  }
  
  console.log('📝 Assignment verisi:', assignmentData);
  
  const { data, error } = await supabase
    .from('assignments')
    .insert([assignmentData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Assignment ekleme hatası:', error);
    
    // Eğer NOT NULL constraint hatası alırsak, özel bir message döndür
    if (error.code === '23502' && error.message.includes('book_id')) {
      console.error('⚠️ Veritabanında book_id NULL olamıyor. Migration gerekli!');
      return { 
        data: null, 
        error: { 
          ...error, 
          message: 'Veritabanı güncellenmesi gerekiyor. Lütfen yöneticiyle iletişime geçin.' 
        } 
      };
    }
  }
  
  return { data, error };
}

export async function getAssignmentsByProgram(programId: string) {  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      students (name),
      books (title, subject)
    `)
    .eq('program_id', programId)
    .order('day');
  
  return { data, error };
}

export async function getStudentAssignments(studentId: string) {
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      programs (title, is_scheduled),
      books (title, subject)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

export async function updateAssignmentStatus(assignmentId: string, isCompleted: boolean) {
  const { data, error } = await supabase
    .from('assignments')
    .update({ is_completed: isCompleted })
    .eq('id', assignmentId)
    .select()
    .single();
  
  return { data, error };
}

export async function deleteStudent(studentId: string) {
  // Delete student's books
  const { error: bookError } = await supabase
    .from('student_books')
    .delete()
    .eq('student_id', studentId);

  if (bookError) {
    return { error: bookError };
  }

  // Delete student's assignments
  const { error: assignmentError } = await supabase
    .from('assignments')
    .delete()
    .eq('student_id', studentId);

  if (assignmentError) {
    return { error: assignmentError };
  }

  // Delete the student
  const { error: studentError } = await supabase
    .from('students')
    .delete()
    .eq('id', studentId);

  return { error: studentError };
}

export async function deleteBook(bookId: string) {
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);
  
  return { error };
}

export async function deleteProgram(programId: string) {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', programId);
  
  return { error };
}

export async function getStats(userId: string) {
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  const { data: books, error: booksError } = await supabase
    .from('books')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  const { data: programs, error: programsError } = await supabase
    .from('programs')
    .select('id', { count: 'exact' })
    .eq('user_id', userId);
  
  return {
    studentCount: students?.length || 0,
    bookCount: books?.length || 0,
    programCount: programs?.length || 0,
    error: studentsError || booksError || programsError
  };
}

export async function getRecentPrograms(userId: string, limit = 5) {
  const { data, error } = await supabase
    .from('programs')
    .select(`
      *,
      assignments (
        id,
        is_completed,
        students (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}

// Reading status fonksiyonları için supabase.ts'e ekleme
export async function getReadingStatus(studentId: string) {
  const { data, error } = await supabase
    .from('reading_status')
    .select(`
      *,
      books(id, title, author, is_story_book)
    `)
    .eq('student_id', studentId);
  
  return { data, error };
}

export async function updateReadingStatus(studentId: string, bookId: string, isRead: boolean, readingDate?: string, notes?: string) {
  const updateData: any = {
    student_id: studentId,
    book_id: bookId,
    is_read: isRead
  };
  
  if (readingDate) {
    updateData.reading_date = readingDate;
  }
  
  if (notes) {
    updateData.notes = notes;
  }
  
  const { data, error } = await supabase
    .from('reading_status')
    .upsert(updateData, {
      onConflict: 'student_id,book_id'
    })
    .select()
    .single();
  
  return { data, error };
}