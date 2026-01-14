import { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, Mail, Lock, User, BookOpen, Loader2, ArrowLeft, Hash, Users } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ 
    first_name: '', 
    last_name: '', 
    email: '', 
    password: '', 
    department: '',
    student_number: '',
    gender: '' 
  });
  const [loading, setLoading] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Cinsiyet seçimi zorunlu kontrolü
    if (!formData.gender) {
      toast.warning(t('register.gender_warning'));
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      student_id: formData.student_number,
      school_id: formData.student_number   
    };

    try {
      await api.post('/auth/register', payload);
      toast.success(t('register.register_success'));
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || t('register.register_error'));
    } finally {
      setLoading(false);
    }
  };

  // DİL DEĞİŞTİRME FONKSİYONU
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-blue-900 flex items-center justify-center p-4 relative">
      
      {/* --- DİL DEĞİŞTİRME BUTONU (SAĞ ÜST) --- */}
      <div className="absolute top-6 right-6 z-50">
        <div className="flex items-center bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-2xl">
          <button 
            type="button"
            onClick={() => changeLanguage('tr')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              i18n.language === 'tr' 
                ? 'bg-white text-indigo-600 shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            TR
          </button>
          <button 
            type="button"
            onClick={() => changeLanguage('en')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
              i18n.language === 'en' 
                ? 'bg-white text-indigo-600 shadow-lg' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <Link to="/login" className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 mb-8 transition-colors">
            <ArrowLeft size={16} className="mr-2" /> {t('register.back_to_login')}
          </Link>

          <div className="text-left mb-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
              <UserPlus className="text-indigo-600" size={32} />
            </div>
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic text-left">{t('register.title')}</h2>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1 text-left">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            
            {/* İsim ve Soyisim */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group text-left">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                <input 
                  type="text" 
                  placeholder={t('register.ph_name')} 
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})} 
                />
              </div>
              <div className="relative group text-left">
                <input 
                  type="text" 
                  placeholder={t('register.ph_surname')} 
                  required
                  disabled={loading}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})} 
                />
              </div>
            </div>

            {/* CİNSİYET SEÇİM ALANI */}
            <div className="space-y-3 text-left">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 italic">
                <Users size={14} className="text-indigo-500" /> {t('register.label_gender')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'erkek', label: t('register.gender_male') },
                  { id: 'kadin', label: t('register.gender_female') },
                  { id: 'diger', label: t('register.gender_other') }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={loading}
                    onClick={() => setFormData({...formData, gender: item.id})}
                    className={`py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all border-2 active:scale-95 ${
                      formData.gender === item.id 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                        : 'bg-gray-50 text-gray-400 border-transparent hover:border-indigo-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Öğrenci Numarası */}
            <div className="relative group text-left">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder={t('register.ph_student_number')} 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                onChange={(e) => setFormData({...formData, student_number: e.target.value})} 
              />
            </div>

            {/* Email */}
            <div className="relative group text-left">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="email" 
                placeholder={t('register.ph_email')} 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            {/* Şifre */}
            <div className="relative group text-left">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="password" 
                placeholder={t('register.ph_password')} 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                onChange={(e) => setFormData({...formData, password: e.target.value})} 
              />
            </div>

            {/* Bölüm */}
            <div className="relative group text-left">
              <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder={t('register.ph_department')} 
                required
                disabled={loading}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-sm shadow-inner" 
                onChange={(e) => setFormData({...formData, department: e.target.value})} 
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span className="uppercase tracking-tighter italic">{t('register.btn_creating')}</span>
                </>
              ) : (
                <span className="uppercase tracking-tighter italic">{t('register.btn_create')}</span>
              )}
            </button>
          </form>

          <p className="text-center mt-10 text-gray-500 text-xs font-bold uppercase tracking-widest">
            {t('register.have_account')} <Link to="/login" className="text-indigo-600 hover:underline transition-all italic font-black">{t('register.login_link')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}