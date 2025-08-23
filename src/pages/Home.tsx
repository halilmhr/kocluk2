import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, BarChart3, CheckCircle, Star, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const features = [
    {
      icon: <BookOpen className="h-12 w-12 text-blue-600" />,
      title: "Ödev Yönetimi",
      description: "Öğrencilerinizin ödevlerini kolayca oluşturun, atayın ve takip edin."
    },
    {
      icon: <Users className="h-12 w-12 text-green-600" />,
      title: "Öğrenci Takibi",
      description: "Her öğrencinin ilerlemesini bireysel olarak izleyin ve değerlendirin."
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-purple-600" />,
      title: "Performans Analizi",
      description: "Detaylı grafiklerle öğrenci performansını analiz edin."
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-indigo-600" />,
      title: "Otomatik Değerlendirme",
      description: "Ödevleri otomatik olarak değerlendirin ve anında geri bildirim verin."
    }
  ];

  const stats = [
    { number: "500+", label: "Aktif Öğrenci" },
    { number: "50+", label: "Eğitmen" },
    { number: "1000+", label: "Tamamlanan Ödev" },
    { number: "98%", label: "Memnuniyet Oranı" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
             Ödev Takip
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Sistemi</span>
           </h1>
           <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
             Eğitim sürecinizi dijitalleştirin. Öğrencilerinizin ödevlerini takip edin, 
             performanslarını analiz edin ve eğitim kalitesini artırın.
           </p>
          
          {/* CTA Buttons */}
           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
             <Link
               to="/register"
               className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
             >
               <Star className="h-5 w-5 mr-2" />
               Ücretsiz Kayıt Ol
               <ArrowRight className="h-5 w-5 ml-2" />
             </Link>
             <Link
               to="/student-signin"
               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
             >
               <Users className="h-5 w-5 mr-2" />
               Öğrenci Girişi
               <ArrowRight className="h-5 w-5 ml-2" />
             </Link>
             <Link
               to="/login"
               className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-4 px-8 rounded-xl shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
             >
               <Star className="h-5 w-5 mr-2" />
               Koç Girişi
               <ArrowRight className="h-5 w-5 ml-2" />
             </Link>
           </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neden Bizi Seçmelisiniz?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Modern eğitim ihtiyaçlarınız için tasarlanmış kapsamlı çözümler sunuyoruz.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 transition duration-300 hover:shadow-lg">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Benefits Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-8">Eğitimde Yeni Dönem Başlıyor</h2>
          <p className="text-xl text-blue-100 mb-12 max-w-3xl mx-auto">
            Geleneksel yöntemlerden uzaklaşın, dijital çağın eğitim araçlarıyla 
            öğrencilerinizin potansiyelini maksimuma çıkarın.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Zaman Tasarrufu</h3>
              <p className="text-blue-100">Otomatik değerlendirme ile saatlerce zaman kazanın.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Detaylı Analiz</h3>
              <p className="text-blue-100">Her öğrencinin güçlü ve zayıf yönlerini keşfedin.</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-3">Kolay Kullanım</h3>
              <p className="text-blue-100">Sezgisel arayüz ile hemen kullanmaya başlayın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Hemen Başlayın</h3>
          <p className="text-gray-400 mb-8">Eğitim sürecinizi dijitalleştirmek için bugün kaydolun.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Ücretsiz Kayıt Ol
            </Link>
            <Link
              to="/login"
              className="border border-gray-600 hover:border-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-300"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;