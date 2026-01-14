import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users, Calendar, Loader2, ArrowLeft, ShieldCheck, Trash2, MapPin,
  Sparkles, Edit, Save, XCircle, ShieldAlert, X, Camera, Link as LinkIcon, Palette, Check, Layout, Lock, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const PRESET_GRADIENTS = [
  { id: 'indigo', class: 'from-indigo-600 via-blue-700 to-purple-800', color: '#4f46e5' },
  { id: 'sunset', class: 'from-rose-500 via-orange-600 to-amber-500', color: '#f43f5e' },
  { id: 'emerald', class: 'from-emerald-500 via-teal-600 to-cyan-700', color: '#10b981' },
  { id: 'midnight', class: 'from-gray-800 via-slate-900 to-black', color: '#1e293b' },
  { id: 'royal', class: 'from-violet-600 via-purple-700 to-fuchsia-800', color: '#8b5cf6' },
];

export default function ClubProfile() {
  const { t } = useTranslation();
  const { clubId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [isMembersForbidden, setIsMembersForbidden] = useState(false);

  // Pagination State for Events
  const [postPage, setPostPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [selectedBg, setSelectedBg] = useState(PRESET_GRADIENTS[0]);

  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isPresidentOfThisClub = club?.president_id === user?.sub || (user?.role === 'club_admin' && club?.president_id === user?.id);
  const canEdit = isAdmin || isPresidentOfThisClub;

  useEffect(() => {
    if (clubId) {
      fetchClubData();
      fetchClubPosts(1, true); // Postları ayrıca çek
    }
  }, [clubId]);

  const fetchClubData = async () => {
    setLoading(true);
    try {
      const clubRes = await api.get(`/clubs/${clubId}`);
      const data = clubRes.data.club || clubRes.data;

      setClub(data);
      setEditData({ name: data.name || '', description: data.description || '' });
      setTempPhotoUrl(data.image_url || '');

      const countFromApi = data.follower_count || data.followers_count || 0;
      setFollowerCount(countFromApi);

      const localBgId = localStorage.getItem(`club_bg_${clubId}`);
      const bgId = localBgId || data.bg_style || 'indigo';
      const savedBg = PRESET_GRADIENTS.find(g => g.id === bgId);
      if (savedBg) setSelectedBg(savedBg);

      await fetchMembers(countFromApi);

    } catch (err) {
      toast.error(t('club_profile.sync_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClubPosts = async (pageNum = 1, reset = false) => {
    try {
      setIsLoadingPosts(true);
      const { data } = await api.get(`/clubs/${clubId}/posts?page=${pageNum}&limit=5`);

      if (reset) {
        setEvents(data.events);
      } else {
        setEvents(prev => [...prev, ...data.events]);
      }

      setHasMorePosts(data.pagination.has_more);
    } catch (err) {
      console.error(t('club_profile.posts_fetch_error'));
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const handleLoadMorePosts = () => {
    const nextPage = postPage + 1;
    setPostPage(nextPage);
    fetchClubPosts(nextPage);
  };

  const fetchMembers = async (initialCount) => {
    try {
      setIsMembersForbidden(false);
      const mRes = await api.get(`/clubs/${clubId}/members`);
      const membersList = mRes.data.members || [];
      setMembers(membersList);
      if (membersList.length > 0) setFollowerCount(membersList.length);
    } catch (err) {
      if (err.response?.status === 403) setIsMembersForbidden(true);
      setMembers([]);
    }
  };

  const updateClubInfo = async (payload) => {
    setSaving(true);
    try {
      if (payload.bg_style) {
        const newBg = PRESET_GRADIENTS.find(g => g.id === payload.bg_style);
        if (newBg) {
          setSelectedBg(newBg);
          localStorage.setItem(`club_bg_${clubId}`, payload.bg_style);
        }
      }
      await api.put(`/clubs/${clubId}`, payload);
      setClub(prev => ({ ...prev, ...payload }));
      toast.success(t('club_profile.update_success'));
    } catch (err) {
      if (!payload.bg_style) toast.error(t('club_profile.update_error'));
    } finally {
      setSaving(false);
      setIsEditingPhoto(false);
      setShowPalette(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(t('club_profile.delete_confirm'))) return;
    setDeletingId(eventId);
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      toast.success(t('club_profile.delete_success'));
    } catch (err) {
      toast.error(t('club_profile.delete_error'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="font-black uppercase tracking-widest text-gray-400 italic text-[10px]">{t('club_profile.loading')}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-left relative selection:bg-indigo-100 overflow-x-hidden text-left">

      {/* ÜYE LİSTESİ MODAL */}
      <AnimatePresence>
        {showMembersModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMembersModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden z-[101]">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">{t('club_profile.portfolio_title')}</h3>
                <button onClick={() => setShowMembersModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400"><X size={24} /></button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                {isMembersForbidden ? (
                  <div className="py-16 text-center flex flex-col items-center px-10">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                      <Lock size={40} className="text-indigo-400" />
                    </div>
                    <p className="text-gray-900 font-black uppercase italic text-sm tracking-tighter mb-2">{t('club_profile.privacy_mode')}</p>
                    <p className="text-gray-400 font-medium text-[11px] leading-relaxed uppercase tracking-widest italic text-center">
                      {t('club_profile.privacy_desc')}
                    </p>
                    <div className="mt-8 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] italic">
                      {t('club_profile.total_followers', { count: followerCount })}
                    </div>
                  </div>
                ) : (
                  members.length > 0 ? (
                    members.map(m => (
                      <div key={m.id || m.user_id} className="flex items-center gap-4 p-3 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer" onClick={() => navigate(`/profile/${m.user_id || m.id}`)}>
                        <img src={m.profile_photo || `https://ui-avatars.com/api/?name=${m.full_name}&background=${selectedBg.color.replace('#', '')}&color=fff`} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="avatar" />
                        <div className="text-left font-bold uppercase text-[10px]">
                          <p className="text-gray-800 leading-none mb-1 tracking-tighter">{m.full_name}</p>
                          <p className="text-gray-400 tracking-widest italic">{m.department || t('club_profile.active_member')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center flex flex-col items-center">
                      <Users className="text-gray-200 mb-4" size={48} />
                      <p className="text-gray-400 font-black uppercase italic text-[10px] tracking-widest">{t('club_profile.no_members')}</p>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className={`relative h-72 md:h-80 w-full bg-gradient-to-br transition-all duration-700 ${selectedBg.class} shadow-inner`}>
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-xl z-30"><ArrowLeft size={24} /></button>
        <div className="absolute inset-0 overflow-hidden opacity-10 font-black italic text-white text-[20rem] leading-none select-none flex items-center justify-center translate-y-10">{club?.name[0]}</div>

        {canEdit && (
          <div className="absolute top-8 right-8 z-30">
            <button onClick={() => setShowPalette(!showPalette)} className="bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-2xl hover:bg-white/30 transition-all flex items-center gap-2 font-black text-[10px] uppercase border border-white/20 tracking-widest shadow-xl italic"><Palette size={18} /> {t('club_profile.appearance')}</button>
            <AnimatePresence>{showPalette && (
              <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="absolute top-16 right-0 bg-white p-4 rounded-3xl shadow-2xl flex gap-3 border border-gray-100 min-w-max">
                {PRESET_GRADIENTS.map((g) => (
                  <button key={g.id} onClick={() => updateClubInfo({ bg_style: g.id })} className={`w-8 h-8 rounded-xl bg-gradient-to-br ${g.class} relative flex items-center justify-center transition-transform hover:scale-125 shadow-sm`}>
                    {selectedBg.id === g.id && <Check className="text-white" size={14} />}
                  </button>
                ))}
              </motion.div>
            )}</AnimatePresence>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 text-left">
        <div className="relative -mt-32 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 pb-12">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-10 text-left">
            <div className="relative group shrink-0">
              <div className="p-2 rounded-[4rem] bg-white shadow-2xl transition-transform duration-500 hover:scale-105">
                <img src={club?.image_url || `https://ui-avatars.com/api/?name=${club?.name}&background=${selectedBg.color.replace('#', '')}&color=fff`} className="w-52 h-52 rounded-[3.5rem] object-cover bg-white shadow-inner" />
              </div>
              {canEdit && <button onClick={() => setIsEditingPhoto(!isEditingPhoto)} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[3.5rem] text-white opacity-0 group-hover:opacity-100 transition-opacity border-8 border-transparent"><Camera size={40} /></button>}
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 uppercase italic tracking-tighter leading-none mb-4">{club?.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button onClick={() => setShowMembersModal(true)} className="flex items-center gap-4 bg-white px-6 py-4 rounded-[2rem] border border-gray-100 hover:border-indigo-200 transition-all shadow-sm hover:shadow-xl group">
                  <div className="flex flex-col text-left font-black" style={{ color: selectedBg.color }}>
                    <span className="text-3xl leading-none tracking-tighter">{followerCount}</span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-[0.2em] mt-1 italic leading-none">{t('club_profile.followers_label')}</span>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <span className="text-[9px] font-black text-gray-400 uppercase group-hover:text-indigo-600 tracking-[0.2em] italic leading-none transition-colors">
                    {isMembersForbidden ? t('club_profile.summary_info') : t('club_profile.view_members')}
                  </span>
                </button>
                {canEdit && (
                  <div className="px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 italic shadow-2xl">
                    <ShieldAlert size={18} className="text-indigo-400" />
                    {isAdmin ? t('club_profile.admin_access') : t('club_profile.club_president')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LOGO EDIT */}
        <AnimatePresence>
          {isEditingPhoto && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mt-8">
              <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 w-full relative text-left">
                  <p className="text-[10px] font-black text-indigo-100 uppercase mb-3 ml-2 italic tracking-widest">{t('club_profile.media_center')}</p>
                  <div className="relative">
                    <LinkIcon size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" />
                    <input type="text" value={tempPhotoUrl} onChange={(e) => setTempPhotoUrl(e.target.value)} placeholder={t('club_profile.image_url_placeholder')} className="w-full pl-14 pr-6 py-5 rounded-2xl outline-none bg-white/10 text-white font-bold text-sm placeholder:text-white/30" />
                  </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={() => setIsEditingPhoto(false)} className="px-6 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all"><X size={28} /></button>
                  <button onClick={() => updateClubInfo({ image_url: tempPhotoUrl })} disabled={saving} className="flex-1 md:px-12 h-16 bg-white text-indigo-600 rounded-2xl font-black uppercase italic tracking-widest shadow-xl active:scale-95 transition-all">{t('club_profile.update_btn')}</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-16 text-left">
          {/* MANIFESTO */}
          <div className="lg:col-span-4 italic text-left">
            <section className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-3 h-full opacity-50" style={{ backgroundColor: selectedBg.color }} />
              <div className="flex items-center justify-between mb-10 text-left leading-none">
                <h3 className="text-[10px] text-indigo-600 uppercase tracking-[0.4em] flex items-center gap-2 font-black italic"><Layout size={20} /> {t('club_profile.manifest')}</h3>
                {canEdit && <button onClick={() => setIsEditing(!isEditing)} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all shadow-sm">{isEditing ? <XCircle size={20} /> : <Edit size={20} />}</button>}
              </div>
              {isEditing ? (
                <div className="space-y-6">
                  <textarea className="w-full p-6 border-2 border-indigo-50 rounded-[2rem] min-h-[220px] outline-none focus:border-indigo-500 font-bold italic text-gray-700 bg-gray-50 text-lg leading-relaxed shadow-inner" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                  <button onClick={() => updateClubInfo({ description: editData.description })} className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase italic shadow-2xl tracking-widest active:scale-95 transition-all"><Save size={20} /> {t('club_profile.publish_btn')}</button>
                </div>
              ) : (
                <p className="text-gray-800 font-medium italic text-2xl leading-relaxed text-left opacity-90">{club?.description || t('club_profile.no_manifest')}</p>
              )}
            </section>
          </div>

          {/* POSTLAR PANELİ */}
          <div className="lg:col-span-8 space-y-12 text-left">
            <h2 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-4 leading-none"><Sparkles size={40} className="text-amber-500" /> {t('club_profile.club_posts')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {events.length > 0 ? events.map(event => (
                <motion.div whileHover={{ y: -12 }} key={event.id} className="group bg-white rounded-[4rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-[0_40px_80px_rgba(0,0,0,0.05)] transition-all duration-700 border-b-8" style={{ borderBottomColor: selectedBg.color }}>
                  <div className="h-64 overflow-hidden cursor-pointer relative" onClick={() => navigate(`/events/${event.id}`)}>
                    <img src={event.image_url || 'https://via.placeholder.com/800x600'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="event" />
                    <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 shadow-xl italic leading-none">{t('club_profile.post_badge')}</div>
                  </div>
                  <div className="p-10 text-left italic uppercase font-black tracking-tighter">
                    <h4 className="text-3xl text-gray-900 leading-tight mb-8 group-hover:text-indigo-600 transition-colors line-clamp-2">{event.title}</h4>
                    <div className="flex justify-between items-end border-t border-gray-50 pt-8">
                      <div className="flex flex-col gap-4 tracking-widest text-[10px]">
                        <span className="text-gray-900 flex items-center gap-3 italic leading-none"><Calendar size={18} className="text-indigo-600" /> {event.date}</span>
                        <span className="text-gray-400 flex items-center gap-3 leading-none"><MapPin size={18} className="text-rose-500" /> {event.location}</span>
                      </div>
                      {canEdit && (
                        <div className="flex gap-3">
                          <button onClick={() => navigate(`/events/edit/${event.id}`)} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"><Edit size={20} /></button>
                          <button onClick={() => handleDeleteEvent(event.id)} disabled={deletingId === event.id} className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm">{deletingId === event.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}</button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-32 text-center bg-white border-4 border-dashed border-gray-100 rounded-[5rem] flex flex-col items-center justify-center font-black uppercase italic text-gray-300 text-sm tracking-[0.3em]">
                  <Layout size={64} className="mb-8 opacity-20" /> {t('club_profile.no_posts')}
                </div>
              )}
            </div>

            {/* DAHA FAZLA YÜKLE BUTONU */}
            {hasMorePosts && (
              <div className="flex justify-center pt-8">
                <button
                  onClick={handleLoadMorePosts}
                  disabled={isLoadingPosts}
                  className="px-10 py-5 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isLoadingPosts ? <Loader2 className="animate-spin" /> : <ArrowDown size={20} />}
                  {t('club_profile.load_more')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}