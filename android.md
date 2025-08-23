# Android Öğrenci Takip Sistemi - AI Geliştirme Promptu

## Proje Genel Bakış

Bu prompt, mevcut web tabanlı öğrenci takip sisteminin Android uygulaması versiyonunu geliştirmek için hazırlanmıştır. Sistem, öğretmenlerin (koçların) öğrencilerini takip etmesini ve öğrencilerin kendi ilerlemelerini görüntülemesini sağlayan kapsamlı bir eğitim yönetim platformudur.

## Sistem Mimarisi

### Backend: Supabase
- **Veritabanı**: PostgreSQL
- **Kimlik Doğrulama**: Supabase Auth
- **Gerçek Zamanlı Güncellemeler**: Supabase Realtime
- **Row Level Security (RLS)**: Veri güvenliği için aktif
- **API**: Supabase REST API

### Frontend Gereksinimler (Android)
- **Platform**: Android (Kotlin/Java)
- **Minimum SDK**: API 21 (Android 5.0)
- **Hedef SDK**: API 34 (Android 14)
- **Mimari**: MVVM (Model-View-ViewModel)
- **Veritabanı Bağlantısı**: Supabase Android SDK
- **UI Framework**: Material Design 3

## Veritabanı Şeması

### Ana Tablolar

#### `students` - Öğrenci Bilgileri
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT,
  school TEXT,
  grade TEXT,
  phone TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  field TEXT, -- Alan (sayısal, sözel, eşit ağırlık)
  password TEXT, -- Öğrenci giriş şifresi
  password_changed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `books` - Kitap Bilgileri
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  subject TEXT, -- Ders kategorisi
  is_story_book BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `programs` - Eğitim Programları
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  is_scheduled BOOLEAN DEFAULT false, -- Saatli program
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `assignments` - Ödevler
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id),
  student_id UUID NOT NULL REFERENCES students(id),
  book_id UUID REFERENCES books(id), -- Nullable
  page_start INTEGER NOT NULL,
  page_end INTEGER NOT NULL,
  day TEXT NOT NULL, -- Gün bilgisi
  time TEXT, -- Saat bilgisi (opsiyonel)
  note TEXT, -- Ödev notu
  is_completed BOOLEAN DEFAULT FALSE,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  blank_answers INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `coach_notes` - Koç Notları
```sql
CREATE TABLE coach_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  coach_id UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `reading_status` - Kitap Okuma Durumu
```sql
CREATE TABLE reading_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  book_id UUID NOT NULL REFERENCES books(id),
  is_read BOOLEAN DEFAULT FALSE,
  reading_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `student_exams` - Sınav Sonuçları
```sql
CREATE TABLE student_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  exam_type VARCHAR(10) NOT NULL CHECK (exam_type IN ('TYT', 'AYT', 'LGS')),
  exam_name VARCHAR(255) NOT NULL,
  exam_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- TYT sınavları için ders bazlı
  turkce_correct INTEGER DEFAULT 0,
  turkce_wrong INTEGER DEFAULT 0,
  matematik_correct INTEGER DEFAULT 0,
  matematik_wrong INTEGER DEFAULT 0,
  fen_correct INTEGER DEFAULT 0,
  fen_wrong INTEGER DEFAULT 0,
  sosyal_correct INTEGER DEFAULT 0,
  sosyal_wrong INTEGER DEFAULT 0,
  
  -- AYT ve LGS için tek ders
  subject_name VARCHAR(100),
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  blank_answers INTEGER DEFAULT 0,
  
  total_correct INTEGER DEFAULT 0,
  total_wrong INTEGER DEFAULT 0,
  total_net DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Veritabanı View'ları

#### `student_question_stats` - Öğrenci Soru İstatistikleri
```sql
CREATE VIEW student_question_stats AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    p.id as program_id,
    p.title as program_title,
    SUM(a.correct_answers) as total_correct,
    SUM(a.wrong_answers) as total_wrong,
    SUM(a.blank_answers) as total_blank,
    COUNT(*) as total_assignments,
    COUNT(CASE WHEN a.is_completed = true THEN 1 END) as completed_assignments
FROM students s
LEFT JOIN assignments a ON s.id = a.student_id
LEFT JOIN programs p ON a.program_id = p.id
GROUP BY s.id, s.name, p.id, p.title;
```

## Kullanıcı Rolleri ve Yetkilendirme

### 1. Koç (Öğretmen) Rolü
- **Kimlik Doğrulama**: Email/şifre ile Supabase Auth
- **Yetkiler**:
  - Öğrenci ekleme/düzenleme/silme
  - Kitap ekleme/düzenleme/silme
  - Program oluşturma/düzenleme/silme
  - Ödev atama ve takip
  - Öğrenci notları ekleme
  - İstatistik görüntüleme
  - Sınav sonuçları girme

### 2. Öğrenci Rolü
- **Kimlik Doğrulama**: Öğrenci ID + şifre
- **Yetkiler**:
  - Kendi ödevlerini görüntüleme
  - Ödev tamamlama durumu güncelleme
  - Kendi istatistiklerini görüntüleme
  - Ders analizi sayfasını kullanma
  - Sınav sonuçlarını görüntüleme

## Android Uygulama Yapısı

### Ana Aktiviteler ve Fragmentlar

#### 1. Giriş ve Kimlik Doğrulama
- `LoginActivity`: Ana giriş ekranı
- `CoachLoginFragment`: Koç girişi
- `StudentLoginFragment`: Öğrenci girişi

#### 2. Koç Paneli
- `CoachMainActivity`: Ana koç ekranı
- `DashboardFragment`: Genel bakış ve istatistikler
- `StudentsFragment`: Öğrenci listesi ve yönetimi
- `StudentDetailActivity`: Öğrenci detay sayfası
- `BooksFragment`: Kitap yönetimi
- `ProgramsFragment`: Program yönetimi
- `AssignmentsFragment`: Ödev yönetimi
- `StatsFragment`: Detaylı istatistikler

#### 3. Öğrenci Paneli
- `StudentMainActivity`: Ana öğrenci ekranı
- `StudentDashboardFragment`: Öğrenci ana sayfa
- `AssignmentsListFragment`: Ödev listesi
- `SubjectAnalysisActivity`: Ders analizi
- `ExamResultsFragment`: Sınav sonuçları
- `StatsFragment`: Kişisel istatistikler

### Koç Sayfaları Detayları

#### Dashboard (Ana Sayfa)
- **Özellikler**:
  - Toplam öğrenci sayısı
  - Aktif program sayısı
  - Tamamlanan/bekleyen ödev sayıları
  - Son eklenen öğrenciler
  - Günlük aktivite özeti
  - Hızlı erişim butonları

#### Öğrenci Yönetimi
- **Öğrenci Listesi**:
  - Arama ve filtreleme
  - Öğrenci kartları (isim, okul, sınıf, alan)
  - Hızlı eylemler (düzenle, sil, detay)
  - Yeni öğrenci ekleme FAB

- **Öğrenci Detay Sayfası**:
  - Kişisel bilgiler düzenleme
  - Atanmış kitaplar listesi
  - Ödev geçmişi
  - İstatistikler (doğru/yanlış/boş)
  - Koç notları ekleme/düzenleme
  - Sınav sonuçları
  - İlerleme grafikleri

#### Kitap Yönetimi
- **Kitap Listesi**:
  - Ders kategorilerine göre gruplandırma
  - Hikaye kitabı işaretleme
  - Arama ve filtreleme
  - Yeni kitap ekleme

- **Kitap Atama**:
  - Öğrencilere kitap atama
  - Okuma durumu takibi
  - Okuma tarihi ve notları

#### Program Yönetimi
- **Program Oluşturma**:
  - Program başlığı
  - Saatli/saatsiz program seçimi
  - Öğrenci seçimi
  - Kitap ve sayfa aralığı
  - Gün ve saat planlaması

- **Ödev Atama**:
  - Toplu ödev oluşturma
  - Günlük program düzenleme
  - Ödev notları ekleme
  - Soru sayısı ve türü belirleme

#### İstatistikler
- **Genel İstatistikler**:
  - Öğrenci başarı oranları
  - Ders bazlı performans
  - Günlük/haftalık/aylık raporlar
  - Grafik ve çizelgeler

- **Öğrenci Bazlı Raporlar**:
  - Bireysel ilerleme takibi
  - Karşılaştırmalı analizler
  - Eksik konular tespiti

### Öğrenci Sayfaları Detayları

#### Öğrenci Ana Sayfası
- **Özellikler**:
  - Hoş geldin mesajı
  - Günlük ödev özeti
  - Tamamlanan/bekleyen ödevler
  - İlerleme yüzdesi
  - Hızlı erişim butonları
  - Motivasyon mesajları

#### Ödev Listesi
- **Özellikler**:
  - Günlere göre gruplandırılmış ödevler
  - Ödev detayları (kitap, sayfa, not)
  - Tamamlama durumu toggle
  - Soru istatistikleri girme
  - Filtreleme (tamamlanan/bekleyen)
  - Arama fonksiyonu

#### Ders Analizi
- **TYT Dersleri**:
  - Matematik (34 konu)
  - Türkçe (29 konu)
  - Tarih (25 konu)
  - Coğrafya (19 konu)
  - Felsefe (9 konu)
  - Din Kültürü (15 konu)
  - Fizik (12 konu)
  - Kimya (11 konu)
  - Biyoloji (konu listesi)

- **AYT Dersleri**:
  - Matematik (31 konu)
  - Fizik (25 konu)
  - Kimya (22 konu)
  - Biyoloji (15 konu)
  - Edebiyat (17 konu)

- **Özellikler**:
  - Konu bazlı tamamlama durumu
  - İlerleme yüzdesi
  - Görsel konu kartları
  - Animasyonlu geçişler
  - Tamamlanan konular için checkmark
  - Renk kodlu kategorizasyon

#### Sınav Sonuçları
- **Sınav Türleri**:
  - TYT (ders bazlı)
  - AYT (tek ders)
  - LGS (tek ders)

- **Özellikler**:
  - Sınav sonuçları listesi
  - Net hesaplamaları
  - Grafik gösterimler
  - İlerleme takibi
  - Karşılaştırmalı analizler

## Teknik Gereksinimler

### Supabase Entegrasyonu

#### Bağlantı Ayarları
```kotlin
// Supabase Client Configuration
val supabase = createSupabaseClient(
    supabaseUrl = "YOUR_SUPABASE_URL",
    supabaseKey = "YOUR_SUPABASE_ANON_KEY"
) {
    install(Auth)
    install(Postgrest)
    install(Realtime)
}
```

#### Kimlik Doğrulama
```kotlin
// Koç Girişi
suspend fun signInCoach(email: String, password: String) {
    supabase.auth.signInWith(Email) {
        this.email = email
        this.password = password
    }
}

// Öğrenci Girişi (Custom Logic)
suspend fun signInStudent(studentId: String, password: String) {
    // Öğrenci tablosundan doğrulama
    val student = supabase.from("students")
        .select()
        .eq("id", studentId)
        .eq("password", password)
        .single()
        .decodeAs<Student>()
}
```

#### Veri İşlemleri
```kotlin
// Öğrenci Listesi Çekme
suspend fun getStudents(userId: String): List<Student> {
    return supabase.from("students")
        .select()
        .eq("user_id", userId)
        .decodeList<Student>()
}

// Ödev Güncelleme
suspend fun updateAssignment(assignmentId: String, isCompleted: Boolean) {
    supabase.from("assignments")
        .update({
            set("is_completed", isCompleted)
            set("completed_at", if (isCompleted) Clock.System.now() else null)
        })
        .eq("id", assignmentId)
}
```

### UI/UX Tasarım Gereksinimleri

#### Material Design 3
- **Renk Paleti**: Modern ve eğitim temalı
- **Tipografi**: Okunabilir ve hiyerarşik
- **Komponentler**: Material 3 standartları
- **Animasyonlar**: Smooth ve anlamlı geçişler

#### Responsive Tasarım
- **Tablet Desteği**: Geniş ekranlar için optimize
- **Farklı Ekran Boyutları**: Adaptive layout
- **Orientation**: Portrait ve landscape desteği

#### Accessibility
- **TalkBack Desteği**: Görme engelliler için
- **Büyük Metin**: Yaşlı kullanıcılar için
- **Renk Kontrastı**: WCAG standartları

### Performans ve Güvenlik

#### Performans
- **Lazy Loading**: Büyük listeler için
- **Caching**: Offline kullanım desteği
- **Image Optimization**: Kitap kapakları için
- **Database Indexing**: Hızlı sorgular

#### Güvenlik
- **Row Level Security**: Supabase RLS aktif
- **Data Encryption**: Hassas veriler için
- **Session Management**: Güvenli oturum yönetimi
- **Input Validation**: XSS ve injection koruması

## Özel Özellikler

### Gerçek Zamanlı Güncellemeler
- Ödev tamamlama durumları
- Yeni ödev atamaları
- Koç notları güncellemeleri
- İstatistik değişiklikleri

### Offline Destek
- Temel veri önbellekleme
- Offline ödev tamamlama
- Senkronizasyon mekanizması
- Bağlantı durumu göstergesi

### Bildirimler
- Yeni ödev bildirimleri
- Hatırlatma bildirimleri
- İlerleme milestone'ları
- Koç mesajları

### Raporlama
- PDF rapor oluşturma
- Email ile rapor gönderme
- Grafik ve çizelge exportu
- Veli raporları

## Geliştirme Aşamaları

### Faz 1: Temel Yapı
1. Proje kurulumu ve Supabase entegrasyonu
2. Kimlik doğrulama sistemi
3. Temel navigasyon yapısı
4. Veri modelleri ve repository pattern

### Faz 2: Koç Paneli
1. Dashboard implementasyonu
2. Öğrenci yönetimi
3. Kitap yönetimi
4. Program ve ödev sistemi

### Faz 3: Öğrenci Paneli
1. Öğrenci dashboard
2. Ödev listesi ve tamamlama
3. Ders analizi sistemi
4. İstatistik görüntüleme

### Faz 4: İleri Özellikler
1. Gerçek zamanlı güncellemeler
2. Bildirim sistemi
3. Offline destek
4. Raporlama sistemi

### Faz 5: Test ve Optimizasyon
1. Unit ve integration testleri
2. UI testleri
3. Performans optimizasyonu
4. Güvenlik testleri

## Sonuç

Bu prompt, kapsamlı bir öğrenci takip sistemi Android uygulaması geliştirmek için gerekli tüm detayları içermektedir. Supabase backend altyapısı ile entegre çalışan, modern UI/UX tasarımına sahip, güvenli ve performanslı bir mobil uygulama geliştirilmesi hedeflenmektedir.

Uygulama, hem koçların (öğretmenlerin) öğrencilerini etkili bir şekilde takip etmesini hem de öğrencilerin kendi ilerlemelerini görüntüleyip motive olmalarını sağlayacak şekilde tasarlanmıştır.