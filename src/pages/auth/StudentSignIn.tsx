import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, getStudentByEmail, updateStudentPassword } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const StudentSignIn: React.FC = () => {
  const [email, setEmail] = useState('halil@gmail.com');
  const [password, setPassword] = useState('232323');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<any>(null);
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('Student login attempt:', { email, passwordLength: password.length });

    try {
      // Öğrenci veritabanından kontrol et
      const { data: student, error: studentError } = await getStudentByEmail(email);
      console.log('getStudentByEmail result:', { student, studentError });

      if (studentError || !student) {
        console.log('Student not found or error:', studentError);
        setError('E-posta adresi bulunamadı.');
        return;
      }

      // Şifre kontrolü - detaylı log
      console.log('Password comparison:', {
        enteredPassword: password,
        storedPassword: student.password,
        passwordsMatch: student.password === password,
        storedPasswordLength: student.password?.length,
        enteredPasswordLength: password.length
      });
      
      if (student.password !== password) {
        console.log('Password mismatch!');
        setError('Şifre hatalı.');
        return;
      }

      // İlk giriş kontrolü (password_changed false ise ilk giriş)
      if (!student.password_changed) {
        console.log('First login detected, showing password change');
        setCurrentStudent(student);
        setShowPasswordChange(true);
        return;
      }

      // Başarılı giriş
      console.log('Login successful');
      setUser({ id: student.id, email: student.email, name: student.name });
      navigate('/student/welcome');
      toast.success('Giriş başarılı!');
    } catch (error) {
      console.error('Login error:', error);
      setError('Giriş sırasında bir hata oluştu.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('handlePasswordChange started with:', { 
      currentStudent: currentStudent?.id, 
      newPassword: newPassword.length + ' characters' 
    });

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır!');
      return;
    }

    try {
      // Şifreyi güncelle
      console.log('Calling updateStudentPassword...');
      const { data, error } = await updateStudentPassword(currentStudent.id, newPassword);
      console.log('updateStudentPassword response:', { data, error });

      if (error) {
        console.error('Password update error:', error);
        setError('Şifre güncellenirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
        return;
      }

      // Giriş yap
      setUser({ id: currentStudent.id, email: currentStudent.email, name: currentStudent.name });
      navigate('/student/welcome');
      toast.success('Şifreniz başarıyla güncellendi!');
    } catch (error) {
      console.error('Password change catch error:', error);
      setError('Şifre güncellenirken hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    }
  };

  if (showPasswordChange) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">Şifre Değiştir</h2>
          <p className="text-gray-600 text-center mb-6">İlk girişiniz! Güvenliğiniz için lütfen şifrenizi değiştirin.</p>
          <form onSubmit={handlePasswordChange}>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block text-gray-700 text-sm font-bold mb-2">Yeni Şifre:</label>
              <input
                type="password"
                id="newPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 6 karakter"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">Şifre Tekrar:</label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifrenizi tekrar girin"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                Şifreyi Güncelle
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center pt-16 sm:pt-20 bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Öğrenci Girişi</h2>
          <p className="text-gray-600">Ödevlerinizi takip etmek için giriş yapın</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Parola
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parolanızı girin"
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02]"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentSignIn;