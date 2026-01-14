import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, User, LogOut, Home as HomeIcon, 
  LayoutGrid, Shield, Crown, Search as SearchIcon, Sparkles 
} from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 180000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications/');
      if (data && data.notifications) {
        const count = data.notifications.filter(n => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        console.error('Bildirim sayısı senkronize edilemedi');
      }
    }
  };

  const handleCloseNotif = () => {
    setIsNotifOpen(false);
    fetchUnreadCount();
  };

  const handleLogout = () => {
    logout();
    setUnreadCount(0);
    navigate('/login');
  };

  // Dili değiştiren yardımcı fonksiyon
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition shadow-indigo-100 shadow-lg">
              <span className="text-white font-black text-lg">C</span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter italic">
              CampusHub
            </span>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-500 hover:text-indigo-600 flex items-center font-black uppercase text-[11px] tracking-widest transition group italic">
              <HomeIcon size={16} className="mr-2 group-hover:scale-110 transition text-gray-400 group-hover:text-indigo-500" /> 
              {t('navbar.home')}
            </Link>
            
            <Link to="/discover" className="text-gray-500 hover:text-indigo-600 flex items-center font-black uppercase text-[11px] tracking-widest transition group italic">
              <Sparkles size={16} className="mr-2 group-hover:scale-110 transition text-gray-400 group-hover:text-indigo-500" /> 
              {t('navbar.discover')}
            </Link>

            <Link to="/clubs" className="text-gray-500 hover:text-indigo-600 flex items-center font-black uppercase text-[11px] tracking-widest transition group italic">
              <LayoutGrid size={16} className="mr-2 group-hover:scale-110 transition text-gray-400 group-hover:text-indigo-500" /> 
              {t('navbar.clubs')}
            </Link>
          </div>

          {/* Right Action Section */}
          <div className="flex items-center space-x-4">
            
            {/* --- DİL SEÇİM ALANI (YENİ) --- */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button 
                onClick={() => changeLanguage('tr')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  i18n.language === 'tr' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                TR
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  i18n.language === 'en' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                EN
              </button>
            </div>

            {user ? (
              <>
                {/* Admin/President Dashboards */}
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="hidden lg:flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-2 rounded-xl font-black hover:bg-red-600 hover:text-white transition uppercase text-[9px] tracking-widest border border-red-100 italic">
                    <Shield size={14} />
                    <span>{t('navbar.admin')}</span>
                  </Link>
                )}

                {user.role === 'club_admin' && (
                  <Link to="/dashboard" className="hidden lg:flex items-center space-x-2 bg-yellow-50 text-yellow-700 px-3 py-2 rounded-xl font-black hover:bg-yellow-600 hover:text-white transition uppercase text-[9px] tracking-widest border border-yellow-100 italic">
                    <Crown size={14} />
                    <span>{t('navbar.president')}</span>
                  </Link>
                )}

                {/* Notifications */}
                <div className="relative">
                  <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={`relative p-2.5 rounded-xl transition ${isNotifOpen ? 'bg-indigo-100 text-indigo-600 shadow-inner' : 'text-gray-400 hover:bg-gray-100 hover:text-indigo-600'}`}
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown isOpen={isNotifOpen} onClose={handleCloseNotif} />
                </div>

                {/* User Profile Capsule */}
                <Link to="/profile" className="flex items-center space-x-3 bg-gray-50 px-4 py-1.5 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-white transition group shadow-sm">
                  <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:rotate-6 transition-transform">
                    <span className="text-white font-black text-xs uppercase italic">
                      {user.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left leading-none">
                    <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter group-hover:text-indigo-600 transition italic">
                      {user.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('navbar.member')}</p>
                  </div>
                </Link>

                <button onClick={handleLogout} className="text-gray-300 hover:text-red-500 p-2 rounded-xl transition hover:bg-red-50" title={t('navbar.logout_title')}>
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="text-gray-500 font-black uppercase text-[11px] tracking-widest px-4 py-2 hover:text-indigo-600 transition italic">
                  {t('navbar.login')}
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition active:scale-95 italic">
                  {t('navbar.join')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}