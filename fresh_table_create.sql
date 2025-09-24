-- BASIT FIX - Supabase Dashboard'da çalıştırın
-- Önce mevcut tabloyu tamamen kaldırıp yeniden oluşturalım

-- 1. Mevcut tabloyu kaldır (eğer varsa)
DROP TABLE IF EXISTS student_question_stats CASCADE;

-- 2. Tabloyu sıfırdan oluştur
CREATE TABLE student_question_stats (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    program_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
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

-- 3. Unique constraint
CREATE UNIQUE INDEX student_question_stats_unique 
ON student_question_stats (student_id, date, program_id);

-- 4. RLS'yi kapat (GEÇİCİ TEST İÇİN)
ALTER TABLE student_question_stats DISABLE ROW LEVEL SECURITY;

-- 5. Index'ler
CREATE INDEX idx_student_question_stats_student_id ON student_question_stats (student_id);
CREATE INDEX idx_student_question_stats_date ON student_question_stats (date);

-- 6. Update trigger
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

-- 7. Test verisi ekle
INSERT INTO student_question_stats (
    student_id, 
    program_id, 
    date, 
    math_correct, 
    math_wrong, 
    math_blank
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    CURRENT_DATE,
    10,
    5,
    2
) ON CONFLICT DO NOTHING;