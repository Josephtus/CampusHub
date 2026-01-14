import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, ChevronRight, User, Loader2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // <--- EKLENDİ

export default function Discover() {
  const { t } = useTranslation(); // <--- EKLENDİ
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (query.trim().length >= 2) handleSearch();
      else setUsers([]);
    }, 400); // Debounce: Kullanıcı yazmayı bırakınca 400ms sonra ara

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${query}`);
      setUsers(data.users || []);
    } catch (err) {
      console.error("Arama başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-left selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-12 mt-10">
          <h1 className="text-6xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">
            {t('discover.title_campus')} <span className="text-indigo-600">{t('discover.title_radar')}</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 mt-4 ml-1">
            {t('discover.subtitle')}
          </p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-12">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-600 transition-all">
            {loading ? <Loader2 className="animate-spin" size={28} /> : <Search size={28} />}
          </div>
          <input 
            type="text"
            placeholder={t('discover.search_placeholder')}
            className="w-full pl-20 pr-8 py-8 bg-white rounded-[2.5rem] border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-black text-xl italic text-gray-800 placeholder:text-gray-300 shadow-indigo-100"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* RESULTS AREA */}
        <div className="space-y-4">
          <AnimatePresence>
            {users.length > 0 ? users.map((u, idx) => (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/profile/${u.id}`)}
                className="bg-white p-6 rounded-[2.5rem] flex items-center justify-between hover:shadow-2xl hover:scale-[1.02] cursor-pointer group transition-all border border-gray-50"
              >
                <div className="flex items-center gap-6">
                  <img 
                    src={u.profile_photo || `https://ui-avatars.com/api/?name=${u.full_name}&background=6366f1&color=fff`} 
                    className="w-16 h-16 rounded-[1.5rem] object-cover shadow-lg border-2 border-white"
                    alt="avatar" 
                  />
                  <div className="text-left">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none mb-1">
                      {u.full_name}
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{u.department}</p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <ChevronRight size={24} />
                </div>
              </motion.div>
            )) : query.length >= 2 && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
                <Sparkles size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-black uppercase italic tracking-widest text-sm leading-none">{t('discover.no_results')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}