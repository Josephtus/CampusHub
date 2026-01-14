import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, CheckCircle, Search, Sparkles, BellRing,
  Loader2, ShieldCheck, LogOut, UserPlus, Info, ArrowDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Clubs() {
  const { t } = useTranslation();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Pagination States
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    fetchClubs(1, true); // İlk yükleme
  }, []);

  const fetchClubs = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setIsLoadingMore(true);

      const { data } = await api.get(`/clubs/?page=${pageNum}&limit=12`);

      if (reset) {
        setClubs(data.clubs);
      } else {
        setClubs(prev => [...prev, ...data.clubs]);
      }

      setHasMore(pageNum < data.pagination.total_pages);
    } catch (err) {
      toast.error(t('clubs.fetch_error'));
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClubs(nextPage);
  };

  const handleToggleFollow = async (e, clubId, isCurrentlyFollowing) => {
    e.stopPropagation();
    if (!user) { toast.warning(t('clubs.login_warning')); return; }
    if (user.role === 'admin') { toast.error(t('clubs.admin_warning')); return; }

    setProcessingId(clubId);
    try {
      if (isCurrentlyFollowing) {
        await api.post(`/clubs/${clubId}/leave`);
        toast.success(t('clubs.leave_success'));
        setClubs(prev => prev.map(c => c.id === clubId ? { ...c, is_following: false } : c));
      } else {
        await api.post(`/clubs/${clubId}/follow`);
        toast.success(t('clubs.join_success'));
        setClubs(prev => prev.map(c => c.id === clubId ? { ...c, is_following: true } : c));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('clubs.error_generic'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6 md:p-12 text-left selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center space-x-2 text-blue-600 font-bold mb-2 uppercase tracking-wider text-sm">
              <Sparkles size={20} /> <span>{t('clubs.badge_campus')}</span>
            </motion.div>
            <h1 className="text-5xl font-black text-gray-900 leading-tight uppercase italic tracking-tighter">{t('clubs.hero_title')}</h1>
            <p className="text-gray-600 mt-4 text-lg italic font-medium">{t('clubs.hero_desc')}</p>
          </div>
          <div className="relative group w-full md:w-80 shadow-2xl rounded-2xl overflow-hidden">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input type="text" placeholder={t('clubs.search_placeholder')} className="w-full pl-12 pr-4 py-4 bg-white border-none outline-none font-bold text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300 font-black uppercase italic tracking-[0.3em] animate-pulse">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p>{t('clubs.loading')}</p>
          </div>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredClubs.map((club) => (
                  <motion.div
                    layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={club.id}
                    onClick={() => navigate(`/clubs/${club.id}`)}
                    className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col group cursor-pointer relative"
                  >
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="relative shrink-0">
                          <img src={club.image_url || `https://ui-avatars.com/api/?name=${club.name}&background=eff6ff&color=3b82f6`} className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-50 shadow-inner group-hover:rotate-6 transition-transform" alt={club.name} />
                          {club.status === 'active' && <div className="absolute -top-2 -right-2 bg-blue-500 text-white p-1 rounded-lg shadow-lg"><CheckCircle size={14} /></div>}
                        </div>
                        <div className="text-left overflow-hidden">
                          <h2 className="text-xl font-black text-gray-800 leading-tight uppercase italic tracking-tighter truncate">{club.name}</h2>
                          <div className="flex items-center mt-1 text-blue-600 font-black text-[9px] uppercase tracking-widest leading-none">
                            <BellRing size={10} className="mr-1" /> {t('clubs.active_community')}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed italic font-medium">"{club.description || t('clubs.default_desc')}"</p>
                      <div className="flex flex-col space-y-4 mt-auto pt-6 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-[10px] font-black uppercase tracking-widest italic">
                            {club.is_president ? (
                              <span className="text-indigo-600 flex items-center bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                                <ShieldCheck size={16} className="mr-2" /> {t('clubs.role_president')}
                              </span>
                            ) : club.is_following ? (
                              <span className="text-emerald-600 flex items-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                <CheckCircle size={16} className="mr-2" /> {t('clubs.role_member')}
                              </span>
                            ) : (
                              <div className="flex items-center text-gray-400">
                                <Users size={16} className="mr-2 text-blue-500" /> {t('clubs.role_community_member')}
                              </div>
                            )}
                          </div>
                          {!club.is_president && (
                            user?.role === 'admin' ? (
                              <div className="flex items-center space-x-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                                <ShieldCheck size={14} className="text-amber-600" />
                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter">{t('clubs.admin_mode')}</span>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleToggleFollow(e, club.id, club.is_following)}
                                disabled={processingId === club.id}
                                className={`group/btn relative px-8 py-3 rounded-2xl font-black text-xs uppercase italic tracking-widest transition-all active:scale-95 shadow-xl overflow-hidden ${club.is_following
                                    ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                                  }`}
                              >
                                {processingId === club.id ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : club.is_following ? (
                                  <>
                                    <span className="group-hover/btn:hidden">{t('clubs.btn_member')}</span>
                                    <span className="hidden group-hover/btn:flex items-center gap-1"><LogOut size={14} /> {t('clubs.btn_leave')}</span>
                                  </>
                                ) : (
                                  <span className="flex items-center gap-1"><UserPlus size={14} /> {t('clubs.btn_join')}</span>
                                )}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* DAHA FAZLA YÜKLE BUTONU */}
            {hasMore && filteredClubs.length > 0 && !searchTerm && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-4 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all uppercase tracking-widest flex items-center gap-3 shadow-sm hover:shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isLoadingMore ? <Loader2 className="animate-spin" /> : <ArrowDown size={20} />}
                  {t('clubs.load_more')}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && filteredClubs.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border-4 border-dashed border-gray-100 flex flex-col items-center">
            <Info className="text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-black uppercase italic tracking-widest">{t('clubs.no_results')}</p>
          </div>
        )}
      </div>
    </div>
  );
}