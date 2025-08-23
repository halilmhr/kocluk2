import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calculator, Globe, Beaker, Atom, Dna, TrendingUp, Star, ChevronDown, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getStudentSubjectAnalysis, bulkUpsertSubjectAnalysis, updateTopicCompletion } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Topic {
  id: string;
  name: string;
  completed: boolean;
}

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  progress: number;
  topics: Topic[];
  category: 'TYT' | 'AYT';
}

const getInitialSubjects = (): Subject[] => [
  {
    id: 'math',
    name: 'Matematik',
    icon: <Calculator />,
    color: 'bg-blue-500',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'math-1', name: 'Temel Kavramlar', completed: false },
      { id: 'math-2', name: 'Tek Çift Sayılar', completed: false },
      { id: 'math-3', name: 'Ardışık Sayılar', completed: false },
      { id: 'math-4', name: 'Asal Sayılar', completed: false },
      { id: 'math-5', name: 'Faktöriyel Kavramı', completed: false },
      { id: 'math-6', name: 'Sayı Basamakları', completed: false },
      { id: 'math-7', name: 'Bölme Bölünebilme', completed: false },
      { id: 'math-8', name: 'EBOB EKOK', completed: false },
      { id: 'math-9', name: 'Rasyonel Sayılar', completed: false },
      { id: 'math-10', name: '1.Dereceden Denklemler', completed: false },
      { id: 'math-11', name: 'Basit Eşitsizlikler', completed: false },
      { id: 'math-12', name: 'Mutlak Değer', completed: false },
      { id: 'math-13', name: 'Üslü Sayılar', completed: false },
      { id: 'math-14', name: 'Köklü Sayılar', completed: false },
      { id: 'math-15', name: 'Çarpanlara Ayırma', completed: false },
      { id: 'math-16', name: 'Oran Orantı', completed: false },
      { id: 'math-17', name: 'Sayı Problemleri', completed: false },
      { id: 'math-18', name: 'Kesir Problemleri', completed: false },
      { id: 'math-19', name: 'Yaş Problemleri', completed: false },
      { id: 'math-20', name: 'İşçi Problemleri', completed: false },
      { id: 'math-21', name: 'Yüzde Problemleri', completed: false },
      { id: 'math-22', name: 'Kar Zarar Problemleri', completed: false },
      { id: 'math-23', name: 'Karışım Problemleri', completed: false },
      { id: 'math-24', name: 'Hareket Problemleri', completed: false },
      { id: 'math-25', name: 'Grafik Problemleri', completed: false },
      { id: 'math-26', name: 'Mantık', completed: false },
      { id: 'math-27', name: 'Kümeler', completed: false },
      { id: 'math-28', name: 'Fonksiyonlar', completed: false },
      { id: 'math-29', name: 'Permütasyon', completed: false },
      { id: 'math-30', name: 'Kombinasyon', completed: false },
      { id: 'math-31', name: 'Binom Açılımı', completed: false },
      { id: 'math-32', name: 'Olasılık', completed: false },
      { id: 'math-33', name: 'Veri Analizi', completed: false },
      { id: 'math-34', name: 'Polinomlar', completed: false }
    ]
  },
  {
    id: 'turkish',
    name: 'Türkçe',
    icon: <BookOpen />,
    color: 'bg-green-500',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'turkish-1', name: 'Sözcükte Anlam', completed: false },
      { id: 'turkish-2', name: 'Söz Yorumu', completed: false },
      { id: 'turkish-3', name: 'Deyim ve Atasözü', completed: false },
      { id: 'turkish-4', name: 'Cümlede Anlam', completed: false },
      { id: 'turkish-5', name: 'Paragraf', completed: false },
      { id: 'turkish-6', name: 'Paragrafta Anlatım Teknikleri', completed: false },
      { id: 'turkish-7', name: 'Paragrafta Düşünceyi Geliştirme Yolları', completed: false },
      { id: 'turkish-8', name: 'Paragrafta Yapı', completed: false },
      { id: 'turkish-9', name: 'Paragrafta Konu-Ana Düşünce', completed: false },
      { id: 'turkish-10', name: 'Paragrafta Yardımcı Düşünce', completed: false },
      { id: 'turkish-11', name: 'Ses Bilgisi', completed: false },
      { id: 'turkish-12', name: 'Yazım Kuralları', completed: false },
      { id: 'turkish-13', name: 'Noktalama İşaretleri', completed: false },
      { id: 'turkish-14', name: 'Sözcükte Yapı/Ekler', completed: false },
      { id: 'turkish-15', name: 'Sözcük Türleri', completed: false },
      { id: 'turkish-16', name: 'İsimler', completed: false },
      { id: 'turkish-17', name: 'Zamirler', completed: false },
      { id: 'turkish-18', name: 'Sıfatlar', completed: false },
      { id: 'turkish-19', name: 'Zarflar', completed: false },
      { id: 'turkish-20', name: 'Edat – Bağlaç – Ünlem', completed: false },
      { id: 'turkish-21', name: 'Fiiller', completed: false },
      { id: 'turkish-22', name: 'Fiilde Anlam (Kip-Kişi-Yapı)', completed: false },
      { id: 'turkish-23', name: 'Ek Fiil', completed: false },
      { id: 'turkish-24', name: 'Fiilimsi', completed: false },
      { id: 'turkish-25', name: 'Fiilde Çatı', completed: false },
      { id: 'turkish-26', name: 'Sözcük Grupları', completed: false },
      { id: 'turkish-27', name: 'Cümlenin Ögeleri', completed: false },
      { id: 'turkish-28', name: 'Cümle Türleri', completed: false },
      { id: 'turkish-29', name: 'Anlatım Bozukluğu', completed: false }
    ]
  },
  {
    id: 'history',
    name: 'Tarih',
    icon: <Globe />,
    color: 'bg-amber-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'history-1', name: 'Tarih ve Zaman', completed: false },
      { id: 'history-2', name: 'İnsanlığın İlk Dönemleri', completed: false },
      { id: 'history-3', name: 'Ortaçağ\'da Dünya', completed: false },
      { id: 'history-4', name: 'İlk ve Orta Çağlarda Türk Dünyası', completed: false },
      { id: 'history-5', name: 'İslam Medeniyetinin Doğuşu', completed: false },
      { id: 'history-6', name: 'İlk Türk İslam Devletleri', completed: false },
      { id: 'history-7', name: 'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi', completed: false },
      { id: 'history-8', name: 'Beylikten Devlete Osmanlı Siyaseti(1300-1453)', completed: false },
      { id: 'history-9', name: 'Dünya Gücü Osmanlı Devleti (1453-1600)', completed: false },
      { id: 'history-10', name: 'Yeni Çağ Avrupa Tarihi', completed: false },
      { id: 'history-11', name: 'Yakın Çağ Avrupa Tarihi', completed: false },
      { id: 'history-12', name: 'Osmanlı Devletinde Arayış Yılları', completed: false },
      { id: 'history-13', name: '18. Yüzyılda Değişim ve Diplomasi', completed: false },
      { id: 'history-14', name: 'En Uzun Yüzyıl', completed: false },
      { id: 'history-15', name: 'Osmanlı Kültür ve Medeniyeti', completed: false },
      { id: 'history-16', name: '20. Yüzyılda Osmanlı Devleti', completed: false },
      { id: 'history-17', name: 'I. Dünya Savaşı', completed: false },
      { id: 'history-18', name: 'Mondros Ateşkesi, İşgaller ve Cemiyetler', completed: false },
      { id: 'history-19', name: 'Kurtuluş Savaşına Hazırlık Dönemi', completed: false },
      { id: 'history-20', name: 'I. TBMM Dönemi', completed: false },
      { id: 'history-21', name: 'Kurtuluş Savaşı ve Antlaşmalar', completed: false },
      { id: 'history-22', name: 'II. TBMM Dönemi ve Çok Partili Hayata Geçiş', completed: false },
      { id: 'history-23', name: 'Türk İnkılabı', completed: false },
      { id: 'history-24', name: 'Atatürk İlkeleri', completed: false },
      { id: 'history-25', name: 'Atatürk Dönemi Türk Dış Politikası', completed: false }
    ]
  },
  {
    id: 'geography',
    name: 'Coğrafya',
    icon: <Globe />,
    color: 'bg-emerald-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'geography-1', name: 'Doğa ve İnsan', completed: false },
      { id: 'geography-2', name: 'Dünya\'nın Şekli ve Hareketleri', completed: false },
      { id: 'geography-3', name: 'Coğrafi Konum', completed: false },
      { id: 'geography-4', name: 'Harita Bilgisi', completed: false },
      { id: 'geography-5', name: 'Atmosfer ve Sıcaklık', completed: false },
      { id: 'geography-6', name: 'İklimler', completed: false },
      { id: 'geography-7', name: 'Basınç ve Rüzgarlar', completed: false },
      { id: 'geography-8', name: 'Nem, Yağış ve Buharlaşma', completed: false },
      { id: 'geography-9', name: 'İç Kuvvetler / Dış Kuvvetler', completed: false },
      { id: 'geography-10', name: 'Su – Toprak ve Bitkiler', completed: false },
      { id: 'geography-11', name: 'Nüfus', completed: false },
      { id: 'geography-12', name: 'Göç', completed: false },
      { id: 'geography-13', name: 'Yerleşme', completed: false },
      { id: 'geography-14', name: 'Türkiye\'nin Yer Şekilleri', completed: false },
      { id: 'geography-15', name: 'Ekonomik Faaliyetler', completed: false },
      { id: 'geography-16', name: 'Bölgeler', completed: false },
      { id: 'geography-17', name: 'Uluslararası Ulaşım Hatları', completed: false },
      { id: 'geography-18', name: 'Çevre ve Toplum', completed: false },
      { id: 'geography-19', name: 'Doğal Afetler', completed: false }
    ]
  },
  {
    id: 'philosophy',
    name: 'Felsefe',
    icon: <Globe />,
    color: 'bg-indigo-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'philosophy-1', name: 'Felsefenin Konusu', completed: false },
      { id: 'philosophy-2', name: 'Bilgi Felsefesi', completed: false },
      { id: 'philosophy-3', name: 'Varlık Felsefesi', completed: false },
      { id: 'philosophy-4', name: 'Din, Kültür ve Medniyet', completed: false },
      { id: 'philosophy-5', name: 'Ahlak Felsefesi', completed: false },
      { id: 'philosophy-6', name: 'Sanat Felsefesi', completed: false },
      { id: 'philosophy-7', name: 'Din Felsefesi', completed: false },
      { id: 'philosophy-8', name: 'Siyaset Felsefesi', completed: false },
      { id: 'philosophy-9', name: 'Bilim Felsefesi', completed: false }
    ]
  },
  {
    id: 'religion',
    name: 'Din Kültürü ve Ahlak Bilgisi',
    icon: <Globe />,
    color: 'bg-teal-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'religion-1', name: 'İnanç', completed: false },
      { id: 'religion-2', name: 'İbadet', completed: false },
      { id: 'religion-3', name: 'Ahlak ve Değerler', completed: false },
      { id: 'religion-4', name: 'Din, Kültür ve Medniyet', completed: false },
      { id: 'religion-5', name: 'Hz. Mhammed (S.A.V.)', completed: false },
      { id: 'religion-6', name: 'Vahiy ve Akıl', completed: false },
      { id: 'religion-7', name: 'Dünya ve Ahiret', completed: false },
      { id: 'religion-8', name: 'Kur\'an\'a göre Hz. Muhammed (S.A.V.)', completed: false },
      { id: 'religion-9', name: 'İnançla İlgili Meseleler', completed: false },
      { id: 'religion-10', name: 'Yahudilik ve Hristiyanlık', completed: false },
      { id: 'religion-11', name: 'İslam ve Bilim', completed: false },
      { id: 'religion-12', name: 'Anadolu da İslam', completed: false },
      { id: 'religion-13', name: 'İslam Düşüncesinde Tasavvufi Yorumlar', completed: false },
      { id: 'religion-14', name: 'Güncel Dini Meseler', completed: false },
      { id: 'religion-15', name: 'Hint ve Çin Dinleri', completed: false }
    ]
  },
  {
    id: 'tyt-physics',
    name: 'Fizik',
    icon: <Atom />,
    color: 'bg-blue-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'tyt-physics-1', name: 'Fizik Bilimine Giriş', completed: false },
      { id: 'tyt-physics-2', name: 'Madde ve Özellikleri', completed: false },
      { id: 'tyt-physics-3', name: 'Sıvıların Kaldırma Kuvveti', completed: false },
      { id: 'tyt-physics-4', name: 'Basınç', completed: false },
      { id: 'tyt-physics-5', name: 'Isı, Sıcaklık ve Genleşme', completed: false },
      { id: 'tyt-physics-6', name: 'Hareket ve Kuvvet', completed: false },
      { id: 'tyt-physics-7', name: 'Dinamik', completed: false },
      { id: 'tyt-physics-8', name: 'İş, Güç ve Enerji', completed: false },
      { id: 'tyt-physics-9', name: 'Elektrik', completed: false },
      { id: 'tyt-physics-10', name: 'Manyetizma', completed: false },
      { id: 'tyt-physics-11', name: 'Dalgalar', completed: false },
      { id: 'tyt-physics-12', name: 'Optik', completed: false }
    ]
  },
  {
    id: 'tyt-chemistry',
    name: 'Kimya',
    icon: <Beaker />,
    color: 'bg-purple-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'tyt-chemistry-1', name: 'Kimya Bilimi', completed: false },
      { id: 'tyt-chemistry-2', name: 'Atom ve Yapısı', completed: false },
      { id: 'tyt-chemistry-3', name: 'Periyodik Sistem', completed: false },
      { id: 'tyt-chemistry-4', name: 'Kimyasal Türler Arası Etkileşimler', completed: false },
      { id: 'tyt-chemistry-5', name: 'Maddenin Halleri', completed: false },
      { id: 'tyt-chemistry-6', name: 'Kimyanın Temel Kanunları', completed: false },
      { id: 'tyt-chemistry-7', name: 'Asitler, Bazlar ve Tuzlar', completed: false },
      { id: 'tyt-chemistry-8', name: 'Kimyasal Hesaplamalar', completed: false },
      { id: 'tyt-chemistry-9', name: 'Karışımlar', completed: false },
      { id: 'tyt-chemistry-10', name: 'Endüstride ve Canlılarda Enerji', completed: false },
      { id: 'tyt-chemistry-11', name: 'Kimya Her Yerde', completed: false }
    ]
  },
  {
    id: 'tyt-biology',
    name: 'Biyoloji',
    icon: <Dna />,
    color: 'bg-green-600',
    progress: 0,
    category: 'TYT',
    topics: [
      { id: 'tyt-biology-1', name: 'Canlıların Ortak Özellikleri', completed: false },
      { id: 'tyt-biology-2', name: 'Canlıların Temel Bileşenleri', completed: false },
      { id: 'tyt-biology-3', name: 'Hücre ve Organeller – Madde Geçişleri', completed: false },
      { id: 'tyt-biology-4', name: 'Canlıların Sınıflandırılması', completed: false },
      { id: 'tyt-biology-5', name: 'Hücrede Bölünme – Üreme', completed: false },
      { id: 'tyt-biology-6', name: 'Kalıtım', completed: false },
      { id: 'tyt-biology-8', name: 'Ekoloji', completed: false }
    ]
  },
  {
    id: 'ayt-math',
    name: 'AYT Matematik',
    icon: <Calculator />,
    color: 'bg-indigo-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'ayt-math-1', name: 'Temel Kavramlar', completed: false },
      { id: 'ayt-math-2', name: 'Sayı Basamakları', completed: false },
      { id: 'ayt-math-3', name: 'Bölme ve Bölünebilme', completed: false },
      { id: 'ayt-math-4', name: 'EBOB - EKOK', completed: false },
      { id: 'ayt-math-5', name: 'Rasyonel Sayılar', completed: false },
      { id: 'ayt-math-6', name: 'Basit Eşitsizlikler', completed: false },
      { id: 'ayt-math-7', name: 'Mutlak Değer', completed: false },
      { id: 'ayt-math-8', name: 'Üslü Sayılar', completed: false },
      { id: 'ayt-math-9', name: 'Köklü Sayılar', completed: false },
      { id: 'ayt-math-10', name: 'Çarpanlara Ayırma', completed: false },
      { id: 'ayt-math-11', name: 'Oran Orantı', completed: false },
      { id: 'ayt-math-12', name: 'Denklem Çözme', completed: false },
      { id: 'ayt-math-13', name: 'Problemler', completed: false },
      { id: 'ayt-math-14', name: 'Kümeler', completed: false },
      { id: 'ayt-math-15', name: 'Kartezyen Çarpım', completed: false },
      { id: 'ayt-math-16', name: 'Mantık', completed: false },
      { id: 'ayt-math-17', name: 'Fonksiyonlar', completed: false },
      { id: 'ayt-math-18', name: 'Polinomlar', completed: false },
      { id: 'ayt-math-19', name: '2.Dereceden Denklemler', completed: false },
      { id: 'ayt-math-20', name: 'Permütasyon ve Kombinasyon', completed: false },
      { id: 'ayt-math-21', name: 'Binom ve Olasılık', completed: false },
      { id: 'ayt-math-22', name: 'İstatistik', completed: false },
      { id: 'ayt-math-23', name: 'Karmaşık Sayılar', completed: false },
      { id: 'ayt-math-24', name: '2.Dereceden Eşitsizlikler', completed: false },
      { id: 'ayt-math-25', name: 'Parabol', completed: false },
      { id: 'ayt-math-26', name: 'Trigonometri', completed: false },
      { id: 'ayt-math-27', name: 'Logaritma', completed: false },
      { id: 'ayt-math-28', name: 'Diziler', completed: false },
      { id: 'ayt-math-29', name: 'Limit', completed: false },
      { id: 'ayt-math-30', name: 'Türev', completed: false },
      { id: 'ayt-math-31', name: 'İntegral', completed: false }
    ]
  },
  {
    id: 'physics',
    name: 'Fizik',
    icon: <Atom />,
    color: 'bg-cyan-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'physics-1', name: 'Vektörler', completed: false },
      { id: 'physics-2', name: 'Kuvvet, Tork ve Denge', completed: false },
      { id: 'physics-3', name: 'Kütle Merkezi', completed: false },
      { id: 'physics-4', name: 'Basit Makineler', completed: false },
      { id: 'physics-5', name: 'Hareket', completed: false },
      { id: 'physics-6', name: 'Newton\'un Hareket Yasaları', completed: false },
      { id: 'physics-7', name: 'İş, Güç ve Enerji II', completed: false },
      { id: 'physics-8', name: 'Atışlar', completed: false },
      { id: 'physics-9', name: 'İtme ve Momentum', completed: false },
      { id: 'physics-10', name: 'Elektrik Alan ve Potansiyel', completed: false },
      { id: 'physics-11', name: 'Paralel Levhalar ve Sığa', completed: false },
      { id: 'physics-12', name: 'Manyetik Alan ve Manyetik Kuvvet', completed: false },
      { id: 'physics-13', name: 'İndüksiyon, Alternatif Akım ve Transformatörler', completed: false },
      { id: 'physics-14', name: 'Çembersel Hareket', completed: false },
      { id: 'physics-15', name: 'Dönme, Yuvarlanma ve Açısal Momentum', completed: false },
      { id: 'physics-16', name: 'Kütle Çekim ve Kepler Yasaları', completed: false },
      { id: 'physics-17', name: 'Basit Harmonik Hareket', completed: false },
      { id: 'physics-18', name: 'Dalga Mekaniği ve Elektromanyetik Dalgalar', completed: false },
      { id: 'physics-19', name: 'Atom Modelleri', completed: false },
      { id: 'physics-20', name: 'Büyük Patlama ve Parçacık Fiziği', completed: false },
      { id: 'physics-21', name: 'Radyoaktivite', completed: false },
      { id: 'physics-22', name: 'Özel Görelilik', completed: false },
      { id: 'physics-23', name: 'Kara Cisim Işıması', completed: false },
      { id: 'physics-24', name: 'Fotoelektrik Olay ve Compton Olayı', completed: false },
      { id: 'physics-25', name: 'Modern Fiziğin Teknolojideki Uygulamaları', completed: false }
    ]
  },
  {
    id: 'chemistry',
    name: 'Kimya',
    icon: <Beaker />,
    color: 'bg-orange-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'chemistry-1', name: 'Kimya Bilimi', completed: false },
      { id: 'chemistry-2', name: 'Atom ve Periyodik Sistem', completed: false },
      { id: 'chemistry-3', name: 'Kimyasal Türler Arası Etkileşimler', completed: false },
      { id: 'chemistry-4', name: 'Kimyasal Hesaplamalar', completed: false },
      { id: 'chemistry-5', name: 'Kimyanın Temel Kanunları', completed: false },
      { id: 'chemistry-6', name: 'Asit, Baz ve Tuz', completed: false },
      { id: 'chemistry-7', name: 'Maddenin Halleri', completed: false },
      { id: 'chemistry-8', name: 'Karışımlar', completed: false },
      { id: 'chemistry-9', name: 'Doğa ve Kimya', completed: false },
      { id: 'chemistry-10', name: 'Kimya Her Yerde', completed: false },
      { id: 'chemistry-11', name: 'Modern Atom Teorisi', completed: false },
      { id: 'chemistry-12', name: 'Gazlar', completed: false },
      { id: 'chemistry-13', name: 'Sıvı Çözeltiler', completed: false },
      { id: 'chemistry-14', name: 'Kimyasal Tepkimelerde Enerji', completed: false },
      { id: 'chemistry-15', name: 'Kimyasal Tepkimelerde Hız', completed: false },
      { id: 'chemistry-16', name: 'Kimyasal Tepkimelerde Denge', completed: false },
      { id: 'chemistry-17', name: 'Asit-Baz Dengesi', completed: false },
      { id: 'chemistry-18', name: 'Çözünürlük Dengesi', completed: false },
      { id: 'chemistry-19', name: 'Kimya ve Elektrik', completed: false },
      { id: 'chemistry-20', name: 'Organik Kimyaya Giriş', completed: false },
      { id: 'chemistry-21', name: 'Organik Kimya', completed: false },
      { id: 'chemistry-22', name: 'Enerji Kaynakları ve Bilimsel Gelişmeler', completed: false }
    ]
  },
  {
    id: 'biology',
    name: 'Biyoloji',
    icon: <Dna />,
    color: 'bg-emerald-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'biology-1', name: 'Sinir Sistemi', completed: false },
      { id: 'biology-2', name: 'Endokrin Sistem ve Hormonlar', completed: false },
      { id: 'biology-3', name: 'Duyu Organları', completed: false },
      { id: 'biology-4', name: 'Destek ve Hareket Sistemi', completed: false },
      { id: 'biology-5', name: 'Sindirim Sistemi', completed: false },
      { id: 'biology-6', name: 'Dolaşım ve Bağışıklık Sistemi', completed: false },
      { id: 'biology-7', name: 'Solunum Sistemi', completed: false },
      { id: 'biology-8', name: 'Üriner Sistem (Boşaltım Sistemi)', completed: false },
      { id: 'biology-9', name: 'Üreme Sistemi ve Embriyonik Gelişim', completed: false },
      { id: 'biology-10', name: 'Komünite Ekolojisi', completed: false },
      { id: 'biology-11', name: 'Popülasyon Ekolojisi', completed: false },
      { id: 'biology-13', name: 'Genetik Şifre ve Protein Sentezi', completed: false },
      { id: 'biology-14', name: 'Canlılık ve Enerji', completed: false },
      { id: 'biology-17', name: 'Hücresel Solunum', completed: false },
      { id: 'biology-18', name: 'Bitki Biyolojisi', completed: false },
      { id: 'biology-19', name: 'Canlılar ve Çevre', completed: false }
    ]
  },
  {
    id: 'literature',
    name: 'Edebiyat',
    icon: <BookOpen />,
    color: 'bg-rose-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'literature-1', name: 'Anlam Bilgisi', completed: false },
      { id: 'literature-2', name: 'Dil Bilgisi', completed: false },
      { id: 'literature-3', name: 'Güzel Sanatlar ve Edebiyat', completed: false },
      { id: 'literature-4', name: 'Metinlerin Sınıflandırılması', completed: false },
      { id: 'literature-5', name: 'Şiir Bilgisi', completed: false },
      { id: 'literature-6', name: 'Edebi Sanatlar', completed: false },
      { id: 'literature-7', name: 'Türk Edebiyatı Dönemleri', completed: false },
      { id: 'literature-8', name: 'İslamiyet Öncesi Türk Edebiyatı ve Geçiş Dönemi', completed: false },
      { id: 'literature-9', name: 'Halk Edebiyatı', completed: false },
      { id: 'literature-10', name: 'Divan Edebiyatı', completed: false },
      { id: 'literature-11', name: 'Tanzimat Edebiyatı', completed: false },
      { id: 'literature-12', name: 'Servet-i Fünun Edebiyatı', completed: false },
      { id: 'literature-13', name: 'Fecr-i Ati Edebiyatı', completed: false },
      { id: 'literature-14', name: 'Milli Edebiyat', completed: false },
      { id: 'literature-15', name: 'Cumhuriyet Dönemi Edebiyatı', completed: false },
      { id: 'literature-16', name: 'Edebiyat Akımları', completed: false },
      { id: 'literature-17', name: 'Dünya Edebiyatı', completed: false }
    ]
  },
  {
    id: 'ayt-geography',
    name: 'Coğrafya',
    icon: <Globe />,
    color: 'bg-teal-500',
    progress: 0,
    category: 'AYT',
    topics: [
      { id: 'ayt-geography-1', name: 'Ekosistem', completed: false },
      { id: 'ayt-geography-2', name: 'İlk Medeniyet ve Şehirler', completed: false },
      { id: 'ayt-geography-3', name: 'Nüfus Politikaları', completed: false },
      { id: 'ayt-geography-4', name: 'Göç ve Şehirleşme', completed: false },
      { id: 'ayt-geography-5', name: 'Türkiye\'nin Jeopolitik Konumu', completed: false },
      { id: 'ayt-geography-6', name: 'Türkiye Ekonomisi', completed: false },
      { id: 'ayt-geography-7', name: 'Türkiye\'de Doğal Afetler', completed: false },
      { id: 'ayt-geography-8', name: 'Türkiye ve Dünyada Bölgeler', completed: false },
      { id: 'ayt-geography-9', name: 'İklim ve Yer Şekilleri', completed: false },
      { id: 'ayt-geography-10', name: 'Ülkeler Arası Etkileşim', completed: false },
      { id: 'ayt-geography-11', name: 'Küresel ve Bölgesel Örgütler', completed: false },
      { id: 'ayt-geography-12', name: 'Üretim Alanları ve Ulaşım Ağları', completed: false },
      { id: 'ayt-geography-13', name: 'Ülkeler', completed: false }
    ]
  }
];

const SubjectAnalysis: React.FC = () => {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>(getInitialSubjects());
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [tytExpanded, setTytExpanded] = useState(false);
  const [aytExpanded, setAytExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await getStudentSubjectAnalysis(user.id);
        
        if (error) {
          console.error('Error loading subjects:', error);
          toast.error('Konu analizi yüklenirken hata oluştu');
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Merge saved data with initial subjects
          const initialSubjects = getInitialSubjects();
          const updatedSubjects = initialSubjects.map(subject => {
            const savedSubject = data.find(s => s.subject_name === subject.name && s.subject_category === subject.category);
            if (savedSubject) {
              return {
                ...subject,
                progress: savedSubject.progress,
                topics: subject.topics.map(topic => ({
                  ...topic,
                  completed: savedSubject.completed_topics.includes(topic.name)
                }))
              };
            }
            return subject;
          });
          setSubjects(updatedSubjects);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        toast.error('Konu analizi yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [user?.id]);

  useEffect(() => {
    const saveSubjects = async () => {
      if (!user?.id || loading) return;

      try {
        const subjectsToSave = subjects.map(subject => ({
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCategory: subject.category,
          progress: subject.progress,
          completedTopics: subject.topics.filter(topic => topic.completed).map(topic => topic.name)
        }));

        const { error } = await bulkUpsertSubjectAnalysis(user.id, subjectsToSave);
        
        if (error) {
          console.error('Error saving subjects:', error);
          toast.error('Konu analizi kaydedilirken hata oluştu');
        }
      } catch (error) {
        console.error('Error saving subjects:', error);
        toast.error('Konu analizi kaydedilirken hata oluştu');
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveSubjects, 1000);
    return () => clearTimeout(timeoutId);
  }, [subjects, user?.id, loading]);

  const toggleTopic = async (subjectId: string, topicId: string) => {
    if (!user?.id) {
      toast.error('Kullanıcı bilgisi bulunamadı');
      return;
    }

    // Find the subject and topic
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    const topic = subject.topics.find(t => t.id === topicId);
    if (!topic) return;

    // Optimistic update
    setSubjects(prevSubjects => 
      prevSubjects.map(subj => {
        if (subj.id === subjectId) {
          const updatedTopics = subj.topics.map(t => 
            t.id === topicId ? { ...t, completed: !t.completed } : t
          );
          const completedCount = updatedTopics.filter(t => t.completed).length;
          const progress = Math.round((completedCount / updatedTopics.length) * 100);
          
          const updatedSubject = { ...subj, topics: updatedTopics, progress };
          
          if (selectedSubject && selectedSubject.id === subjectId) {
            setSelectedSubject(updatedSubject);
          }
          
          return updatedSubject;
        }
        return subj;
      })
    );

    try {
      const { error } = await updateTopicCompletion(
        user.id,
        subject.id,
        topic.id,
        !topic.completed
      );

      if (error) {
        console.error('Error updating topic:', error);
        toast.error('Konu durumu güncellenirken hata oluştu');
        // Revert optimistic update on error
        setSubjects(prevSubjects => 
          prevSubjects.map(subj => {
            if (subj.id === subjectId) {
              const revertedTopics = subj.topics.map(t => 
                t.id === topicId ? { ...t, completed: topic.completed } : t
              );
              const completedCount = revertedTopics.filter(t => t.completed).length;
              const progress = Math.round((completedCount / revertedTopics.length) * 100);
              
              const revertedSubject = { ...subj, topics: revertedTopics, progress };
              
              if (selectedSubject && selectedSubject.id === subjectId) {
                setSelectedSubject(revertedSubject);
              }
              
              return revertedSubject;
            }
            return subj;
          })
        );
      }
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Konu durumu güncellenirken hata oluştu');
    }
  };

  const getOverallProgress = () => {
    const totalTopics = subjects.reduce((sum, subject) => sum + subject.topics.length, 0);
    const completedTopics = subjects.reduce((sum, subject) => 
      sum + subject.topics.filter(topic => topic.completed).length, 0
    );
    return totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  };

  if (selectedSubject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setSelectedSubject(null)}
            className="mb-6 flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:bg-white/90 hover:shadow-xl transition-all duration-300 text-gray-700 hover:text-gray-900 group"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Konu Analizine Dön</span>
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/50"
          >
            <div className="flex items-center mb-8">
              <div className={`w-16 h-16 ${selectedSubject.color} rounded-3xl flex items-center justify-center text-3xl mr-6 shadow-lg`}>
                {selectedSubject.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedSubject.name}</h1>
                <div className="flex items-center">
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mr-4">
                    {selectedSubject.progress}% Tamamlandı
                  </div>
                  {selectedSubject.progress >= 80 && <Star className="h-6 w-6 text-yellow-500" />}
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${selectedSubject.progress}%` }}
                  transition={{ duration: 1 }}
                  className={`h-4 rounded-full bg-gradient-to-r ${selectedSubject.color.replace('bg-', 'from-')} to-purple-500 shadow-sm`}
                ></motion.div>
              </div>
            </div>
            
            <div className="grid gap-4">
              {selectedSubject.topics.map((topic, index) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => toggleTopic(selectedSubject.id, topic.id)}
                  className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    topic.completed 
                      ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 border-2 border-emerald-300 shadow-lg' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300 hover:from-purple-100 hover:to-purple-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      topic.completed ? 'text-emerald-800' : 'text-gray-700'
                    }`}>
                      {topic.name}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      topic.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-gray-400 hover:border-purple-500'
                    }`}>
                      {topic.completed && '✓'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Konu Analizi
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            İlerlemenizi takip edin ve başarıya ulaşın
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/50">
            <div className="text-xl font-bold text-purple-600 mb-1">{getOverallProgress()}%</div>
            <div className="text-gray-600 text-sm font-medium">Genel İlerleme</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/50">
            <div className="text-xl font-bold text-blue-600 mb-1">{subjects.length}</div>
            <div className="text-gray-600 text-sm font-medium">Toplam Ders</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/50">
            <div className="text-xl font-bold text-emerald-600 mb-1">
              {subjects.reduce((sum, subject) => sum + subject.topics.filter(topic => topic.completed).length, 0)}
            </div>
            <div className="text-gray-600 text-sm font-medium">Tamamlanan Konu</div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-md border border-white/50">
            <div className="text-xl font-bold text-yellow-600 mb-1">
              {subjects.filter(subject => subject.progress >= 80).length}
            </div>
            <div className="text-gray-600 text-sm font-medium">Başarılı Ders</div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button 
            onClick={() => setTytExpanded(!tytExpanded)}
            className="flex items-center mb-6 w-full group hover:bg-white/50 rounded-2xl p-4 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent flex-1 text-left">TYT Dersleri</h2>
            <div className={`transform transition-transform duration-300 ${tytExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-6 w-6 text-blue-600" />
            </div>
          </button>
          {tytExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8"
            >
              {subjects.filter(subject => subject.category === 'TYT').map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => setSelectedSubject(subject)}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-white/50 hover:bg-white/90"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${subject.color} rounded-2xl flex items-center justify-center text-2xl mr-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors truncate">{subject.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{subject.topics.length} konu</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-700">İlerleme</span>
                      <div className="flex items-center">
                        {subject.progress >= 80 && <Star className="h-3 w-3 text-yellow-500 mr-1" />}
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{subject.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 * index }}
                        className={`h-2 rounded-full bg-gradient-to-r ${subject.color.replace('bg-', 'from-')} to-purple-500 shadow-sm`}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-2 text-center">
                      <div className="text-lg font-bold text-emerald-600 mb-0">
                        {subject.topics.filter(t => t.completed).length}
                      </div>
                      <div className="text-xs text-emerald-700 font-medium">Tamam</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-2 text-center">
                      <div className="text-lg font-bold text-orange-600 mb-0">
                        {subject.topics.filter(t => !t.completed).length}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">Kalan</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
 
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button 
            onClick={() => setAytExpanded(!aytExpanded)}
            className="flex items-center mb-6 w-full group hover:bg-white/50 rounded-2xl p-4 transition-all duration-300"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent flex-1 text-left">AYT Dersleri</h2>
            <div className={`transform transition-transform duration-300 ${aytExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-6 w-6 text-purple-600" />
            </div>
          </button>
          {aytExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {subjects.filter(subject => subject.category === 'AYT').map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => setSelectedSubject(subject)}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-white/50 hover:bg-white/90"
                >
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${subject.color} rounded-2xl flex items-center justify-center text-2xl mr-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      {subject.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors truncate">{subject.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">{subject.topics.length} konu</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-gray-700">İlerleme</span>
                      <div className="flex items-center">
                        {subject.progress >= 80 && <Star className="h-3 w-3 text-yellow-500 mr-1" />}
                        <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{subject.progress}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 1, delay: 0.2 * index }}
                        className={`h-2 rounded-full bg-gradient-to-r ${subject.color.replace('bg-', 'from-')} to-purple-500 shadow-sm`}
                      ></motion.div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-2 text-center">
                      <div className="text-lg font-bold text-emerald-600 mb-0">
                        {subject.topics.filter(t => t.completed).length}
                      </div>
                      <div className="text-xs text-emerald-700 font-medium">Tamam</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-2 text-center">
                      <div className="text-lg font-bold text-orange-600 mb-0">
                        {subject.topics.filter(t => !t.completed).length}
                      </div>
                      <div className="text-xs text-orange-700 font-medium">Kalan</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SubjectAnalysis;