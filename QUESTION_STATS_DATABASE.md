# Student Question Statistics Database Implementation

Bu doküman, öğrenci soru istatistikleri için veritabanı yapısını ve kullanımını açıklar.

## 📊 Veritabanı Yapısı

### Ana Tablo: `student_question_stats`

Bu tablo öğrencilerin günlük soru çalışma istatistiklerini saklar:

```sql
CREATE TABLE student_question_stats (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  date DATE NOT NULL,
  subject VARCHAR(100) NOT NULL,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  wrong_answers INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER GENERATED ALWAYS AS (correct_answers + wrong_answers) STORED,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (...) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Özellikler

- **Otomatik Hesaplama**: `total_questions` ve `success_rate` otomatik hesaplanır
- **Unique Constraint**: Bir öğrenci, aynı tarih ve derste sadece bir kayıt yapabilir
- **RLS (Row Level Security)**: Öğrenciler sadece kendi verilerini görür
- **Foreign Key**: `students` tablosu ile bağlantılı

## 🔧 Migrations

Aşağıdaki migration dosyalarını sırayla çalıştırın:

1. `20250923000000_add_student_question_stats.sql` - Ana tablo ve fonksiyonlar
2. `20250923000001_student_question_stats_views.sql` - Views ve analiz fonksiyonları

```bash
# Supabase CLI ile migration çalıştırma
supabase db push
```

## 📈 Views (Görünümler)

### 1. `student_daily_question_summary`
Günlük özet istatistikler

### 2. `student_subject_performance`
Ders bazında performans analizi

### 3. `student_overall_performance`
Genel performans özeti

### 4. `student_weekly_progress`
Haftalık ilerleme takibi

## 🛠 Fonksiyonlar

### `upsert_student_question_stats()`
Veri ekleme/güncelleme fonksiyonu:
```sql
SELECT upsert_student_question_stats(
  p_student_id UUID,
  p_date DATE,
  p_subject VARCHAR(100),
  p_correct_answers INTEGER,
  p_wrong_answers INTEGER,
  p_notes TEXT DEFAULT NULL
);
```

### `get_student_recent_stats()`
Son X gün içindeki istatistikler:
```sql
SELECT * FROM get_student_recent_stats(
  p_student_id UUID,
  p_days INTEGER DEFAULT 30
);
```

### `get_student_subject_stats()`
Ders bazında detaylı istatistikler

### `get_student_available_subjects()`
Öğrencinin çalıştığı dersler listesi

## 💻 Frontend Integration

### TypeScript Interfaces

```typescript
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
```

### examService.ts Functions

Aşağıdaki fonksiyonlar `examService.ts` dosyasına eklenmiştir:

- `saveStudentQuestionStat()` - Veri kaydetme
- `getStudentQuestionStatsFromDB()` - İstatistikleri getirme
- `getStudentSubjectStatsFromDB()` - Ders bazında analiz
- `getStudentAvailableSubjectsFromDB()` - Mevcut dersler
- `getStudentOverallPerformance()` - Genel performans
- `getStudentWeeklyProgress()` - Haftalık ilerleme

### Kullanım Örneği

```typescript
import { 
  saveStudentQuestionStat,
  getStudentQuestionStatsFromDB 
} from '../lib/examService';

// Yeni kayıt ekleme
const result = await saveStudentQuestionStat(userId, {
  date: '2025-09-23',
  subject: 'Matematik',
  correctAnswers: 15,
  wrongAnswers: 3
});

// Verileri getirme
const { data, error } = await getStudentQuestionStatsFromDB(userId, 30);
```

## 🔒 Güvenlik

- **RLS Policies**: Öğrenciler sadece kendi verilerini görebilir
- **Authentication**: `auth.uid()` ile kullanıcı doğrulama
- **Validation**: Negatif değerler ve boş kayıtlar engellenir
- **Foreign Key Constraints**: Veri bütünlüğü korunur

## 📋 Test Etme

Test verisi eklemek için `test_question_stats.sql` dosyasını kullanın:

```sql
-- Test verisi ekleme
INSERT INTO student_question_stats (student_id, date, subject, correct_answers, wrong_answers)
VALUES ('your-student-id', CURRENT_DATE, 'Matematik', 15, 3);

-- Fonksiyonları test etme
SELECT * FROM get_student_recent_stats('your-student-id', 30);
```

## 🚀 Deployment

1. Migration dosyalarını Supabase'e push edin
2. `examService.ts` güncellemelerini deploy edin
3. Frontend bileşenlerini güncelleyin
4. Test edin ve doğrulayın

## 📊 Dashboard Integration

Bu yapı sayesinde:
- ✅ Gerçek zamanlı istatistikler
- ✅ Ders bazında performans analizi
- ✅ Haftalık/aylık ilerleme takibi
- ✅ Başarı oranı hesaplamaları
- ✅ Karşılaştırmalı analizler

Artık öğrenciler sorularını veritabanına kaydedebilir ve detaylı analizler görebilir! 🎉