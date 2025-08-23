import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import BookCard from '../../components/books/BookCard';
import { Book as BookIcon, Plus, Search, BookOpen, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const BookList: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    books, 
    students, 
    fetchBooks, 
    fetchStudents, 
    addBook,
    assignBook,
    removeBook
  } = useDataStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (user) {
      fetchBooks(user.id);
      fetchStudents(user.id);
    }
  }, [user, fetchBooks, fetchStudents]);  const handleAddBook = async () => {
    if (!newBookTitle) {
      toast.error('Kitap başlığı gereklidir');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (user) {
        console.log('📚 Kitap ekleniyor:', { 
          title: newBookTitle, 
          author: newBookAuthor, 
          selectedStudent: selectedStudentId 
        });
        
        const book = await addBook(user.id, newBookTitle, newBookAuthor, false, undefined);
        
        if (book) {
          console.log('✅ Kitap başarıyla eklendi:', book);
          
          if (selectedStudentId) {
            console.log('👨‍🎓 Öğrenciye atanıyor:', selectedStudentId);
            await assignBook(selectedStudentId, book.id);
          }
          
          toast.success('Kitap başarıyla eklendi');
          setNewBookTitle('');
          setNewBookAuthor('');
          setSelectedStudentId('');
          setIsModalOpen(false);
        } else {
          console.error('❌ Kitap ekleme başarısız');
          toast.error('Kitap eklenirken hata oluştu');
        }
      }
    } catch (error) {
      console.error('❌ Kitap ekleme hatası:', error);
      toast.error(`Kitap eklenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kitap silme fonksiyonu
  const handleDeleteBook = async (bookId: string) => {
    await removeBook(bookId);
    toast.success('Kitap silindi');
  };
  
  // Kitap filtreleme fonksiyonu
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.author && book.author.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));
  
  if (!user) return null;
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <BookOpen className="mr-3" size={32} />
                Kitap Yönetimi
              </h1>
              <p className="text-blue-100 text-lg">
                Kitaplarınızı organize edin ve öğrencilerinize atayın
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">{books.length}</div>
                <div className="text-blue-100">Toplam Kitap</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border p-6"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Kitap ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          {/* Add Book Button */}
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2.5"
          >
            <Plus size={20} className="mr-2" />
            Yeni Kitap Ekle
          </Button>
        </div>
      </motion.div>
      
      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredBooks.map((book, index) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <BookCard 
                book={book} 
                index={index} 
                onDelete={handleDeleteBook}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : books.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <BookIcon size={40} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Henüz kitap yok</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Öğrencileriniz için kitap koleksiyonunuzu oluşturmaya başlayın. 
              İlk kitabınızı ekleyerek başlayabilirsiniz.
            </p>
            <Button 
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
            >
              <Plus size={20} className="mr-2" />
              İlk Kitabınızı Ekleyin
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Arama sonucu bulunamadı</h3>
            <p className="text-gray-600 mb-6">
              "{searchTerm}" ile eşleşen kitap bulunamadı. 
              Farklı bir arama terimi deneyin.
            </p>
            <Button 
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
              }}
              className="mr-4"
            >
              Filtreleri Temizle
            </Button>
            <Button 
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus size={16} className="mr-2" />
              Yeni Kitap Ekle
            </Button>
          </div>
        </motion.div>
      )}

      {/* Statistics Cards */}
      {books.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Kitap</p>
                <p className="text-2xl font-bold text-gray-900">{books.length}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <BookIcon className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kayıtlı Öğrenci</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Book Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title=""
      >
        <div className="p-1">
          {/* Compact Form */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-2 shadow-lg">
                <BookOpen size={20} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">📚 Kitap Ekle</h2>
            </div>

            <div className="space-y-3">
              {/* Title Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Kitap başlığını yazın..."
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200 placeholder-gray-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  📖
                </div>
              </div>

              {/* Author Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Yazar adı (isteğe bağlı)"
                  value={newBookAuthor}
                  onChange={(e) => setNewBookAuthor(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200 placeholder-gray-400"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  ✍️
                </div>
              </div>

              {/* Student Assignment */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className="mr-2">👥</span>
                  <span className="font-medium text-gray-700 text-sm">Öğrenciye Ata</span>
                  <span className="ml-auto text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">İsteğe Bağlı</span>
                </div>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all duration-200 bg-white"
                >
                  <option value="">Şimdilik kimseye atama</option>
                  {studentOptions.map(student => (
                    <option key={student.value} value={student.value}>
                      {student.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200"
                >
                  ❌ İptal
                </button>
                <button
                  onClick={handleAddBook}
                  disabled={!newBookTitle.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin mr-2">⏳</span>
                      Ekleniyor...
                    </span>
                  ) : (
                    '✨ Kitap Ekle'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookList;