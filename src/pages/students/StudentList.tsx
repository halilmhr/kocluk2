import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StudentCard from '../../components/students/StudentCard';
import { GraduationCap, Plus, User, Mail, School, BookOpen, Phone, Users, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const StudentList: React.FC = () => {
  const { user } = useAuthStore();
  const { students, fetchStudents, addStudent } = useDataStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentSchool, setNewStudentSchool] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentParentName, setNewStudentParentName] = useState('');
  const [newStudentParentPhone, setNewStudentParentPhone] = useState('');
  const [newStudentField, setNewStudentField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchStudents(user.id);
    }
  }, [user, fetchStudents]);
  
  const validateForm = () => {
    const errors = [];
    
    if (!newStudentName.trim()) {
      errors.push('Öğrenci adı gereklidir');
    }
    
    if (!newStudentEmail.trim()) {
      errors.push('E-posta adresi gereklidir');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newStudentEmail)) {
      errors.push('Geçerli bir e-posta adresi girin');
    }
    
    if (!newStudentPassword.trim()) {
      errors.push('Şifre gereklidir');
    } else if (newStudentPassword.length < 6) {
      errors.push('Şifre en az 6 karakter olmalıdır');
    }
    
    if (newStudentPhone && !/^[\d\s\-\(\)\+]+$/.test(newStudentPhone)) {
      errors.push('Geçerli bir telefon numarası girin');
    }
    
    if (newStudentParentPhone && !/^[\d\s\-\(\)\+]+$/.test(newStudentParentPhone)) {
      errors.push('Geçerli bir veli telefon numarası girin');
    }
    
    return errors;
  };

  const handleAddStudent = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
      return;
    }
    
    setIsSubmitting(true);
    
    if (user) {
      const result = await addStudent(
        user.id, 
        newStudentName.trim(), 
        newStudentEmail.trim(),
        newStudentPassword.trim(),
        newStudentSchool.trim(),
        newStudentGrade.trim(),
        newStudentPhone.trim(),
        newStudentParentName.trim(),
        newStudentParentPhone.trim(),
        newStudentField.trim()
      );
      
      if (result) {
        toast.success('Öğrenci başarıyla eklendi');
        // Tüm form alanlarını temizle
        setNewStudentName('');
        setNewStudentEmail('');
        setNewStudentPassword('');
        setNewStudentSchool('');
        setNewStudentGrade('');
        setNewStudentPhone('');
        setNewStudentParentName('');
        setNewStudentParentPhone('');
        setNewStudentField('');
        setIsModalOpen(false);
      } else {
        toast.error('Öğrenci eklenirken bir hata oluştu. Bu e-posta adresi zaten kullanımda olabilir.');
      }
    }
    
    setIsSubmitting(false);
  };
  
  if (!user) return null;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900">Öğrenciler</h1>
          <p className="text-gray-600">Öğrencilerinizi yönetin</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Öğrenci Ekle
          </Button>
        </motion.div>
      </div>
      
      {students.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student, index) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              index={index} 
            />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white p-8 rounded-lg shadow-sm text-center"
        >
          <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Henüz öğrenci eklenmemiş</h3>
          <p className="text-gray-600 mb-4">Başlamak için ilk öğrencinizi ekleyin</p>
          <Button 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} className="mr-1" />
            Öğrenci Ekle
          </Button>
        </motion.div>
      )}
      
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Öğrenci Ekle"
        size="lg"
      >
        <div className="p-2 md:p-4 space-y-3 md:space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {/* Öğrenci Temel Bilgileri */}
            <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-800">Öğrenci Bilgileri</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-blue-500" />
                  <Input
                    label="Öğrenci Adı"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Öğrenci adını giriniz"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <Input
                    label="E-posta"
                    type="email"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <Input
                    label="Şifre"
                    type="password"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <Input
                    label="Telefon Numarası"
                    value={newStudentPhone}
                    onChange={(e) => setNewStudentPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    fullWidth
                  />
                </div>
              </div>
            </div>

            {/* Eğitim Bilgileri */}
            <div className="bg-green-50 p-3 md:p-4 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center mb-3">
                <School className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-green-800">Eğitim Bilgileri</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <School className="w-4 h-4 text-green-500" />
                  <Input
                    label="Okul"
                    value={newStudentSchool}
                    onChange={(e) => setNewStudentSchool(e.target.value)}
                    placeholder="Okul adını giriniz"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <Input
                    label="Sınıf"
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    placeholder="Sınıf seviyesini giriniz"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <Input
                    label="Alan"
                    value={newStudentField}
                    onChange={(e) => setNewStudentField(e.target.value)}
                    placeholder="Öğrenci alanını giriniz"
                    fullWidth
                  />
                </div>
              </div>
            </div>
          
            {/* Veli Bilgileri */}
            <div className="bg-orange-50 p-3 md:p-4 rounded-lg border border-orange-200 shadow-sm">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-orange-600 mr-2" />
                <h3 className="text-lg font-semibold text-orange-800">Veli Bilgileri</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <Input
                    label="Veli Adı"
                    value={newStudentParentName}
                    onChange={(e) => setNewStudentParentName(e.target.value)}
                    placeholder="Veli adını giriniz"
                    fullWidth
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-orange-500" />
                  <Input
                    label="Veli Telefon Numarası"
                    value={newStudentParentPhone}
                    onChange={(e) => setNewStudentParentPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    fullWidth
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Butonları - Modal dışında sabit */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2"
            >
              İptal
            </Button>
            <Button
              variant="primary"
              onClick={handleAddStudent}
              isLoading={isSubmitting}
              className="px-6 py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Öğrenci Ekle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentList;