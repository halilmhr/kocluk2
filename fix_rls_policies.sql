-- RLS Politikalarını Düzelt
-- Bu SQL kodunu Supabase Dashboard'da çalıştırın

-- 1. Önce mevcut student_question_stats tablosunu kontrol et
CREATE TABLE IF NOT EXISTS student_question_stats (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    math_correct INTEGER DEFAULT 0,
    math_wrong INTEGER DEFAULT 0,
    math_blank INTEGER DEFAULT 0,
    turkish_correct INTEGER DEFAULT 0,
    turkish_wrong INTEGER DEFAULT 0,
    turkish_blank INTEGER DEFAULT 0,
    science_correct INTEGER DEFAULT 0,
    science_wrong INTEGER DEFAULT 0,
    science_blank INTEGER DEFAULT 0,
    social_correct INTEGER DEFAULT 0,
    social_wrong INTEGER DEFAULT 0,
    social_blank INTEGER DEFAULT 0,
    total_correct INTEGER GENERATED ALWAYS AS (
        COALESCE(math_correct, 0) + COALESCE(turkish_correct, 0) + 
        COALESCE(science_correct, 0) + COALESCE(social_correct, 0)
    ) STORED,
    total_wrong INTEGER GENERATED ALWAYS AS (
        COALESCE(math_wrong, 0) + COALESCE(turkish_wrong, 0) + 
        COALESCE(science_wrong, 0) + COALESCE(social_wrong, 0)
    ) STORED,
    total_blank INTEGER GENERATED ALWAYS AS (
        COALESCE(math_blank, 0) + COALESCE(turkish_blank, 0) + 
        COALESCE(science_blank, 0) + COALESCE(social_blank, 0)
    ) STORED,
    total_questions INTEGER GENERATED ALWAYS AS (
        COALESCE(math_correct, 0) + COALESCE(math_wrong, 0) + COALESCE(math_blank, 0) +
        COALESCE(turkish_correct, 0) + COALESCE(turkish_wrong, 0) + COALESCE(turkish_blank, 0) +
        COALESCE(science_correct, 0) + COALESCE(science_wrong, 0) + COALESCE(science_blank, 0) +
        COALESCE(social_correct, 0) + COALESCE(social_wrong, 0) + COALESCE(social_blank, 0)
    ) STORED,
    success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN (COALESCE(math_correct, 0) + COALESCE(math_wrong, 0) + COALESCE(math_blank, 0) +
                  COALESCE(turkish_correct, 0) + COALESCE(turkish_wrong, 0) + COALESCE(turkish_blank, 0) +
                  COALESCE(science_correct, 0) + COALESCE(science_wrong, 0) + COALESCE(science_blank, 0) +
                  COALESCE(social_correct, 0) + COALESCE(social_wrong, 0) + COALESCE(social_blank, 0)) > 0
            THEN ROUND(
                (COALESCE(math_correct, 0) + COALESCE(turkish_correct, 0) + 
                 COALESCE(science_correct, 0) + COALESCE(social_correct, 0))::DECIMAL / 
                (COALESCE(math_correct, 0) + COALESCE(math_wrong, 0) + COALESCE(math_blank, 0) +
                 COALESCE(turkish_correct, 0) + COALESCE(turkish_wrong, 0) + COALESCE(turkish_blank, 0) +
                 COALESCE(science_correct, 0) + COALESCE(science_wrong, 0) + COALESCE(science_blank, 0) +
                 COALESCE(social_correct, 0) + COALESCE(social_wrong, 0) + COALESCE(social_blank, 0)) * 100, 
                2
            )
            ELSE 0
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Benzersiz constraint ekle (aynı öğrenci, aynı gün, aynı program için sadece bir kayıt)
CREATE UNIQUE INDEX IF NOT EXISTS student_question_stats_unique 
ON student_question_stats (student_id, date, program_id);

-- 3. RLS'yi etkinleştir
ALTER TABLE student_question_stats ENABLE ROW LEVEL SECURITY;

-- 4. Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view their students' question stats" ON student_question_stats;
DROP POLICY IF EXISTS "Users can insert their students' question stats" ON student_question_stats;
DROP POLICY IF EXISTS "Users can update their students' question stats" ON student_question_stats;
DROP POLICY IF EXISTS "Students can view their own stats" ON student_question_stats;
DROP POLICY IF EXISTS "Students can insert their own stats" ON student_question_stats;
DROP POLICY IF EXISTS "Students can update their own stats" ON student_question_stats;

-- 5. Yeni politikalar oluştur

-- Öğretmenler kendi programlarındaki öğrencilerin verilerini görebilir
CREATE POLICY "Teachers can view their students' question stats" ON student_question_stats
    FOR SELECT USING (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- Öğretmenler kendi programlarındaki öğrencilerin verilerini ekleyebilir
CREATE POLICY "Teachers can insert their students' question stats" ON student_question_stats
    FOR INSERT WITH CHECK (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- Öğretmenler kendi programlarındaki öğrencilerin verilerini güncelleyebilir
CREATE POLICY "Teachers can update their students' question stats" ON student_question_stats
    FOR UPDATE USING (
        program_id IN (
            SELECT id FROM programs WHERE user_id = auth.uid()
        )
    );

-- 6. Geçici olarak RLS'yi kapat (test için)
-- Bu satırları test amaçlı kullanabilirsiniz
-- ALTER TABLE student_question_stats DISABLE ROW LEVEL SECURITY;

-- 7. Public erişim politikası (geçici test için)
-- Eğer hala sorun yaşarsanız, bu politikayı aktif edin:
CREATE POLICY "Allow public access for testing" ON student_question_stats
    FOR ALL USING (true) WITH CHECK (true);

-- 8. Updated_at trigger'ını ekle
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_question_stats_updated_at
    BEFORE UPDATE ON student_question_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Index'leri ekle performans için
CREATE INDEX IF NOT EXISTS idx_student_question_stats_student_id ON student_question_stats (student_id);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_program_id ON student_question_stats (program_id);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_date ON student_question_stats (date);
CREATE INDEX IF NOT EXISTS idx_student_question_stats_created_at ON student_question_stats (created_at);