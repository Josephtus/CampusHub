import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  PlusCircle, Users, Settings, X, Mail,
  BookOpen, UserMinus, Loader2, Crown, ShieldAlert,
  ArrowRight, Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext'; // Auth eklendi
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function ClubDashboard() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Üye yönetimi modal state'leri
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberLoading, setMemberLoading] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchClubs();
  }, [user]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      // Admin ise tüm aktif kulüpleri, değilse sadece yönettiklerini çek
      const endpoint = isAdmin ? '/clubs/' : '/clubs/my-clubs';
      const { data } = await api.get(endpoint);
      setClubs(data.clubs || []);
    } catch (err) {
      toast.error(t('club_dashboard.toast_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const openMemberManager = async (club) => {
    setSelectedClub(club);
    setIsMemberModalOpen(true);
    setMemberLoading(true);
    try {
      const { data } = await api.get(`/clubs/${club.id}/members`);
      setMembers(data.members || []);
    } catch (err) {
      toast.error(t('club_dashboard.toast_members_error'));
      setIsMemberModalOpen(false);
    } finally {
      setMemberLoading(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm(t('club_dashboard.toast_remove_confirm'))) return;
    try {
      // Admin veya Kulüp Başkanı yetkisiyle silme
      await api.delete(`/admin/clubs/${selectedClub.id}/members/${userId}`);
      setMembers(prev => prev.filter(m => m.id !== userId));
      toast.success(t('club_dashboard.toast_remove_success'));
    } catch (err) {
      toast.error(t('club_dashboard.toast_remove_error'));
    }
  };

  const filteredClubs = clubs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-8 font-sans text-left pb-20">

      {/* Header Bölümü */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 pt-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-2xl ${isAdmin ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {isAdmin ? <ShieldAlert size={28} /> : <Crown size={28} />}
            </div>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">
              {isAdmin ? t('club_dashboard.title_admin') : t('club_dashboard.title_president')}
            </h1>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] ml-1">
            {isAdmin ? t('club_dashboard.desc_admin') : t('club_dashboard.desc_president')}
          </p>
        </div>

        {isAdmin && (
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('club_dashboard.search_placeholder')}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Kulüp Kartları Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClubs.length > 0 ? filteredClubs.map(club => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={club.id}
            className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-300 relative group"
          >
            <div className="flex items-center space-x-5 mb-8">
              <div className="relative">
                <img
                  src={club.image_url || 'https://via.placeholder.com/80'}
                  className="w-20 h-20 rounded-[2rem] object-cover shadow-xl group-hover:scale-105 transition-transform"
                  alt="Club Logo"
                />
                <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-xl border-4 border-white ${isAdmin ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                  {isAdmin ? <ShieldAlert size={14} className="text-white" /> : <Crown size={14} className="text-white" />}
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight mb-1">{club.name}</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isAdmin ? t('club_dashboard.badge_admin_check') : t('club_dashboard.badge_active_mgmt')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to={`/club/${club.id}/create-event`}
                className="flex flex-col items-center justify-center p-5 bg-blue-50 text-blue-700 rounded-[2rem] hover:bg-blue-600 hover:text-white transition-all group/btn shadow-sm"
              >
                <PlusCircle size={24} className="mb-2 group-hover/btn:rotate-90 transition-transform" />
                <span className="font-black uppercase text-[10px] tracking-widest">{t('club_dashboard.btn_event')}</span>
              </Link>

              <button
                onClick={() => openMemberManager(club)}
                className="flex flex-col items-center justify-center p-5 bg-purple-50 text-purple-700 rounded-[2rem] hover:bg-purple-600 hover:text-white transition-all group/btn shadow-sm"
              >
                <Users size={24} className="mb-2 group-hover/btn:scale-110 transition-transform" />
                <span className="font-black uppercase text-[10px] tracking-widest">{t('club_dashboard.btn_members')}</span>
              </button>

              <button
                onClick={() => navigate(`/clubs/${club.id}`)}
                className="col-span-2 flex items-center justify-center p-4 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-all font-black uppercase text-[10px] tracking-widest gap-2"
              >
                {t('club_dashboard.btn_go_club')} <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-32 bg-white rounded-[4rem] border-4 border-dashed border-gray-100 text-center">
            <Settings size={64} className="mx-auto text-gray-200 mb-6 animate-spin-slow" />
            <p className="text-gray-400 font-black uppercase italic tracking-[0.2em]">
              {isAdmin ? t('club_dashboard.no_club_admin') : t('club_dashboard.no_club_president')}
            </p>
            <button onClick={() => navigate('/clubs')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:shadow-xl transition-all">{t('club_dashboard.btn_discover')}</button>
          </div>
        )}
      </div>

      {/* --- ÜYE YÖNETİM MODALI (Değişmedi, aynı kalsın) --- */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMemberModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden z-10">
              <div className={`p-8 flex justify-between items-center text-white ${isAdmin ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                <div className="text-left">
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">{t('club_dashboard.modal_title', { name: selectedClub?.name })}</h2>
                  <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{t('club_dashboard.modal_registered', { count: members.length })}</p>
                </div>
                <button onClick={() => setIsMemberModalOpen(false)} className="bg-white/20 p-3 rounded-2xl hover:bg-white/30 transition"><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
                {memberLoading ? <div className="py-20 text-center animate-pulse font-black text-gray-300">{t('club_dashboard.modal_loading')}</div> : members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-white hover:border-indigo-200 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black">
                        {member.full_name?.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-gray-800 text-sm uppercase">{member.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{member.email} • {member.department}</p>
                      </div>
                    </div>
                    <button onClick={() => handleRemoveMember(member.id)} className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><UserMinus size={20} /></button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}