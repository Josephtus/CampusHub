import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, Crown, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [role, setRole] = useState('student'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const from = location.state?.from;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRole = await login(email, password, role); 
      
      toast.success(t('login.welcome_back'));
      
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (userRole === 'admin') {
          navigate('/admin/dashboard');
        } else if (userRole === 'club_admin') {
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || t('login.login_error');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // DİL DEĞİŞTİRME FONKSİYONU
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 flex items-center justify-center p-4 relative">
      
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
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Rol Seçici Tablar */}
        <div className="flex bg-gray-100 p-1.5 m-8 mb-4 rounded-2xl border border-gray-200">
          {['student', 'club_admin', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              disabled={loading}
              onClick={() => setRole(r)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                role === r 
                  ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' 
                  : 'text-gray-400 hover:text-gray-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {r === 'student' ? t('login.role_student') : r === 'club_admin' ? t('login.role_president') : t('login.role_admin')}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form 
            key={role}
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -10, opacity: 0 }}
            onSubmit={handleLogin} 
            className="p-8 pt-0 space-y-4"
          >
            <div className="text-left mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-3 rounded-2xl bg-opacity-10 ${
                  role === 'student' ? 'bg-blue-500 text-blue-600' : 
                  role === 'club_admin' ? 'bg-yellow-500 text-yellow-600' : 
                  'bg-red-500 text-red-600'
                }`}>
                  {role === 'student' && <User size={28} />}
                  {role === 'club_admin' && <Crown size={28} />}
                  {role === 'admin' && <ShieldCheck size={28} />}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
                    {role === 'student' ? t('login.role_student') : role === 'club_admin' ? t('login.role_president') : t('login.role_admin')}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t('login.subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">{t('login.email_label')}</label>
                <input 
                  type="email" 
                  placeholder={t('login.email_placeholder')}
                  required
                  disabled={loading}
                  value={email}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-50 font-bold text-sm"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">{t('login.password_label')}</label>
                  <Link 
                    to="/forgot-password"
                    className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline italic transition-colors hover:text-indigo-800"
                  >
                    {t('login.forgot_password')}
                  </Link>
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  required
                  disabled={loading}
                  value={password}
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all disabled:opacity-50 font-bold text-sm"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-[0.98] flex items-center justify-center space-x-3 mt-4 ${
                role === 'student' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 
                role === 'club_admin' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 
                'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
              } disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span className="uppercase tracking-widest">{t('login.verifying')}</span>
                </>
              ) : (
                <>
                  <KeyRound size={20} />
                  <span className="uppercase tracking-widest italic">{t('login.login_button')}</span>
                </>
              )}
            </button>
          </motion.form>
        </AnimatePresence>

        <div className="p-8 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {t('login.no_account')} <Link to="/register" className="text-indigo-600 hover:underline">{t('login.register_now')}</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}