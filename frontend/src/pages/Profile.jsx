import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, Mail, BookOpen, Calendar, ShieldCheck, Edit3, 
  Save, X, Award, Loader2, Camera, Link, Check, MessageSquare, 
  ArrowRight, Palette, Building2, MapPin, Clock, Sparkles, ExternalLink,
  ArrowLeft, ChevronLeft, ChevronRight 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // <--- EKLENDİ

const PRESET_GRADIENTS = [
  { id: 'blue', class: 'from-blue-600 via-indigo-600 to-purple-600', color: '#4f46e5' },
  { id: 'sunset', class: 'from-orange-500 via-pink-600 to-rose-600', color: '#e11d48' },
  { id: 'emerald', class: 'from-emerald-500 via-teal-600 to-cyan-700', color: '#0d9488' },
  { id: 'midnight', class: 'from-gray-800 via-slate-900 to-black', color: '#1e293b' },
  { id: 'royal', class: 'from-indigo-600 via-purple-600 to-blue-700', color: '#7c3aed' },
];

export default function Profile() {
  const { t } = useTranslation(); // <--- EKLENDİ
  const { userId } = useParams(); 
  const { user: authUser } = useAuth(); 
  const navigate = useNavigate();
  const toast = useToast();

  const [profileData, setProfileData] = useState(null);
  const [userComments, setUserComments] = useState([]); 
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('none');
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [selectedBg, setSelectedBg] = useState(PRESET_GRADIENTS[0]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 6; 

  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const [editForm, setEditForm] = useState({ bio: '', interests: '', full_name: '', department: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !userId || String(userId) === String(authUser?.sub || authUser?.id);
  const isAdmin = authUser?.role === 'admin';
  const canEdit = isOwnProfile || isAdmin; 
  const targetId = userId || authUser?.id || authUser?.sub;

  useEffect(() => {
    if (targetId) fetchProfile();
  }, [userId, targetId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      let response;
      if (isOwnProfile) {
        response = await api.get('/users/profile');
      } else {
        try {
          response = await api.get(`/users/${targetId}`);
        } catch (err) {
          response = await api.get(`/users/${targetId}/profile`);
        }
      }

      const data = response.data.user || response.data;
      setProfileData(data);
      
      setTempPhotoUrl(data.profile?.profile_photo || '');
      setEditForm({
        bio: data.profile?.bio || '',
        interests: data.profile?.interests || '',
        full_name: data.profile?.full_name || '',
        department: data.profile?.department || ''
      });

      const savedBgId = localStorage.getItem(`profile_bg_${data.profile?.id}`);
      if (savedBgId) {
        const bg = PRESET_GRADIENTS.find(g => g.id === savedBgId);
        if (bg) setSelectedBg(bg);
      }

      try {
        const commentsResponse = await api.get(`/users/${targetId}/comments`);
        const sortedComments = (commentsResponse.data.comments || []).reverse();
        setUserComments(sortedComments);
      } catch (commentErr) {
        console.error("Yorum geçmişi yüklenemedi:", commentErr);
      }

    } catch (err) {
      toast.error(t('profile.sync_error'));
      if (!isOwnProfile) navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = isAdmin && !isOwnProfile 
        ? `/admin/users/${targetId}/profile` 
        : '/users/profile';

      await api.put(endpoint, editForm);
      
      setProfileData(prev => ({
        ...prev,
        profile: { 
            ...prev.profile, 
            bio: editForm.bio, 
            interests: editForm.interests,
            full_name: editForm.full_name,
            department: editForm.department
        }
      }));
      setIsEditing(false);
      toast.success(t('profile.update_success'));
    } catch (err) {
      toast.error(t('profile.update_error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSave = async () => {
    setSaving(true);
    try {
      const endpoint = isAdmin && !isOwnProfile 
        ? `/admin/users/${targetId}/profile` 
        : '/users/profile';

      await api.put(endpoint, { profile_photo: tempPhotoUrl });
      setProfileData(prev => ({
        ...prev,
        profile: { ...prev.profile, profile_photo: tempPhotoUrl }
      }));
      setIsEditingPhoto(false);
      toast.success(t('profile.photo_success'));
    } catch (err) {
      toast.error(t('profile.photo_error'));
    } finally {
      setSaving(false);
    }
  };

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = userComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(userComments.length / commentsPerPage);

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  if (loading) return <LoadingSpinner size="lg" text={t('profile.loading')} />;
  if (!profileData) return null;

  const { profile, activities } = profileData;

  const statCards = [
    { id: 'events', label: t('profile.stat_events'), value: activities?.participated_events?.length || 0, icon: Calendar },
    { id: 'clubs', label: t('profile.stat_clubs'), value: activities?.followed_clubs?.length || 0, icon: ShieldCheck },
    { id: 'points', label: t('profile.stat_points'), value: (activities?.participated_events?.length || 0) * 10, icon: Award }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans text-left selection:bg-indigo-100">
      
      {/* KAPAK */}
      <div className={`relative h-64 w-full bg-gradient-to-r transition-all duration-700 ${selectedBg.class} shadow-inner`}>
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 p-4 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/30 transition-all border border-white/20 shadow-xl z-30">
          <ArrowLeft size={24} />
        </button>
        
        {canEdit && (
          <div className="absolute top-8 right-8 z-30 flex gap-2">
            <button onClick={() => setShowPalette(!showPalette)} className="bg-white/20 backdrop-blur-md text-white p-3 rounded-2xl hover:bg-white/30 border border-white/20 shadow-xl italic font-black text-[10px] uppercase">
              <Palette size={18} className="mr-2 inline" /> {t('profile.btn_style')}
            </button>
            <AnimatePresence>
              {showPalette && (
                <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} className="absolute top-14 right-0 bg-white p-4 rounded-3xl shadow-2xl flex gap-3 border border-gray-100 min-w-max">
                  {PRESET_GRADIENTS.map((g) => (
                    <button key={g.id} onClick={() => { setSelectedBg(g); localStorage.setItem(`profile_bg_${profile.id}`, g.id); setShowPalette(false); }} className={`w-8 h-8 rounded-xl bg-gradient-to-br ${g.class} relative transition-transform hover:scale-110 shadow-sm`}>
                      {selectedBg.id === g.id && <Check className="text-white mx-auto" size={14} />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 text-left">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 -mt-24 relative z-10 overflow-hidden mb-12">
          <div className="px-10 py-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-10 mb-12">
              <div className="relative group shrink-0">
                <div className={`p-1.5 rounded-[4rem] bg-gradient-to-tr ${selectedBg.class} shadow-2xl`}>
                  <img src={profile.profile_photo || `https://ui-avatars.com/api/?name=${profile.full_name}&background=fff&color=${selectedBg.color.replace('#','')}`} className="w-48 h-48 rounded-[3.5rem] object-cover border-8 border-white bg-white" alt="avatar" />
                </div>
                {canEdit && (
                  <button onClick={() => setIsEditingPhoto(!isEditingPhoto)} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-[3.5rem] text-white z-20"><Camera size={40} /></button>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                {isEditing ? (
                    <input 
                        type="text" 
                        value={editForm.full_name} 
                        onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                        className="text-4xl md:text-5xl font-black text-gray-900 mb-4 bg-gray-50 p-4 rounded-2xl w-full border-2 border-indigo-100 outline-none"
                        placeholder={t('profile.ph_name_edit')}
                    />
                ) : (
                    <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic leading-none">{profile.full_name}</h1>
                )}
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-8 font-black uppercase italic">
                  <span className="flex items-center text-[10px] text-gray-400 tracking-widest"><Mail size={14} className="mr-2 text-indigo-500" /> {profile.email}</span>
                  
                  {isEditing ? (
                      <input 
                        type="text" 
                        value={editForm.department} 
                        onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                        className="text-[10px] bg-gray-50 border border-indigo-100 p-2 rounded-lg"
                        placeholder={t('profile.ph_dept_edit')}
                      />
                  ) : (
                      <span className="flex items-center text-[10px] text-gray-400 tracking-widest"><BookOpen size={14} className="mr-2 text-indigo-500" /> {profile.department}</span>
                  )}
                  
                  <span className="px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] bg-indigo-50 text-indigo-600 border border-indigo-100">{profile.role}</span>
                </div>

                {canEdit && (
                  <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center mx-auto md:mx-0 space-x-3 px-12 py-5 rounded-2xl font-black uppercase italic text-xs tracking-widest transition-all shadow-xl active:scale-95 ${isEditing ? 'bg-gray-100 text-gray-500' : 'bg-gray-900 text-white hover:bg-black'}`}>
                    {isEditing ? <><X size={20} /> {t('profile.btn_cancel')}</> : <><Edit3 size={20} /> {t('profile.btn_edit_profile')}</>}
                  </button>
                )}
              </div>
            </div>

            {/* FOTOĞRAF DÜZENLEME MODALI */}
            <AnimatePresence>
                {isEditingPhoto && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-8 p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <label className="text-xs font-black uppercase text-indigo-600 block mb-3 tracking-widest">{t('profile.label_photo_url')}</label>
                        <div className="flex gap-4">
                            <input type="text" value={tempPhotoUrl} onChange={(e) => setTempPhotoUrl(e.target.value)} className="flex-1 p-4 rounded-2xl border-2 border-white outline-none focus:border-indigo-400" placeholder="https://..." />
                            <button onClick={handlePhotoSave} disabled={saving} className="bg-indigo-600 text-white px-8 rounded-2xl font-black uppercase text-xs">{t('profile.btn_update')}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HAKKIMDA BÖLÜMÜ */}
            <div className="bg-gray-50/50 rounded-[3rem] p-12 border border-gray-100 text-left">
              <h3 className="text-[10px] font-black text-indigo-600 uppercase mb-8 tracking-[0.4em] italic flex items-center gap-2"><Sparkles size={16}/> {t('profile.manifesto_title')}</h3>
              {isEditing ? (
                <div className="space-y-6">
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} className="w-full border-2 border-gray-100 rounded-[2rem] px-8 py-6 outline-none focus:border-indigo-500 focus:bg-white resize-none transition-all font-medium text-gray-700 shadow-inner text-xl" rows="4" placeholder={t('profile.ph_bio')} />
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <input type="text" value={editForm.interests} onChange={(e) => setEditForm({ ...editForm, interests: e.target.value })} className="flex-1 border-2 border-gray-100 rounded-[2rem] px-8 py-6 outline-none focus:border-indigo-500 shadow-inner font-bold italic" placeholder={t('profile.ph_interests')} />
                    <button onClick={handleSave} disabled={saving} className="w-full md:w-auto bg-emerald-600 text-white px-14 py-6 rounded-[2rem] font-black uppercase italic tracking-widest shadow-2xl active:scale-95 transition-all flex items-center gap-3">
                      {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} {t('profile.btn_save')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-800 mb-10 font-medium italic leading-relaxed text-3xl max-w-5xl opacity-90 text-left">
                    {profile.bio ? `"${profile.bio}"` : t('profile.no_manifesto')}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {profile.interests?.split(',').map((interest, idx) => (
                      <span key={idx} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-white border border-gray-100 shadow-sm text-gray-500 hover:text-indigo-600 transition-all">
                        #{interest.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* İSTATİSTİKLER VE DİNAMİK PANELLER */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {statCards.map((stat) => (
            <motion.div whileHover={{ y: -10 }} key={stat.id} onClick={() => stat.id !== 'points' && setActiveTab(activeTab === stat.id ? 'none' : stat.id)}
              className={`bg-white rounded-[4rem] p-12 border-4 transition-all cursor-pointer group shadow-xl ${activeTab === stat.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-white'}`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="p-5 rounded-3xl bg-gray-50 transition-transform group-hover:rotate-12 shadow-inner" style={{ color: selectedBg.color }}><stat.icon size={40} /></div>
                {stat.id !== 'points' && <ArrowRight size={28} className={`text-gray-200 transition-all ${activeTab === stat.id ? 'rotate-90 text-indigo-500' : 'group-hover:translate-x-2'}`} />}
              </div>
              <div className="text-left font-black uppercase">
                <div className="text-7xl text-gray-900 mb-2 tracking-tighter italic leading-none">{stat.value}</div>
                <div className="text-[11px] text-gray-400 tracking-[0.3em] italic">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab !== 'none' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-[5rem] shadow-2xl border-2 border-gray-50 p-12 md:p-20 mb-16 overflow-hidden text-left">
              <div className="flex justify-between items-center mb-16">
                <h3 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center">
                  {activeTab === 'events' ? <><Calendar className="mr-6 text-rose-500" size={56}/> {t('profile.tab_events')}</> : <><ShieldCheck className="mr-6 text-indigo-500" size={56}/> {t('profile.tab_clubs')}</>}
                </h3>
                <button onClick={() => setActiveTab('none')} className="w-16 h-16 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-3xl flex items-center justify-center transition-all text-gray-400 shadow-inner"><X size={32} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {activeTab === 'events' ? (
                  activities?.participated_events?.length > 0 ? activities.participated_events.map(event => (
                    <motion.div whileHover={{ y: -8 }} key={event.id} onClick={() => navigate(`/events/${event.id}`)} className="group bg-gray-50 p-4 pb-10 rounded-[3rem] border border-transparent hover:border-rose-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer text-left">
                      <div className="h-56 rounded-[2.5rem] overflow-hidden mb-6 relative shadow-lg">
                        <img src={event.image_url || 'https://via.placeholder.com/600x400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="event" />
                        <div className="absolute top-5 left-5 bg-white/95 backdrop-blur px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 shadow-sm italic">{t('profile.badge_joined')}</div>
                      </div>
                      <div className="px-4 text-left font-black uppercase italic">
                        <h4 className="text-gray-900 text-xl tracking-tighter leading-tight group-hover:text-rose-600 transition-all mb-4 line-clamp-2">{event.title}</h4>
                        <div className="flex flex-col gap-2">
                           <div className="flex items-center text-gray-400 text-[10px] tracking-widest"><MapPin size={14} className="mr-2 text-rose-400" /> {event.location}</div>
                           <div className="flex items-center text-gray-400 text-[10px] tracking-widest"><Clock size={14} className="mr-2 text-indigo-400" /> {event.date}</div>
                        </div>
                      </div>
                    </motion.div>
                  )) : <div className="col-span-full py-20 text-center text-gray-300 font-black italic uppercase tracking-widest">{t('profile.no_data_events')}</div>
                ) : (
                  activities?.followed_clubs?.length > 0 ? activities.followed_clubs.map(club => (
                    <motion.div whileHover={{ scale: 1.05 }} key={club.id} onClick={() => navigate(`/clubs/${club.id}`)} className="flex items-center p-10 bg-gray-50 rounded-[3.5rem] border border-transparent hover:border-indigo-100 hover:bg-white hover:shadow-2xl transition-all cursor-pointer group text-left">
                      <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center font-black mr-8 shadow-2xl group-hover:rotate-12 transition-transform uppercase text-white text-3xl bg-gradient-to-br ${selectedBg.class}`}>
                        {club.name[0]}
                      </div>
                      <div className="text-left font-black uppercase italic">
                        <h4 className="text-gray-900 text-2xl tracking-tighter mb-1 leading-none">{club.name}</h4>
                        <p className="text-[9px] text-indigo-500 tracking-[0.3em] not-italic font-bold">{t('profile.view_profile')}</p>
                      </div>
                    </motion.div>
                  )) : <div className="col-span-full py-20 text-center text-gray-300 font-black italic uppercase tracking-widest">{t('profile.no_data_clubs')}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-10 md:p-12 text-left mb-20">
          <div className="flex justify-between items-end mb-10">
            <h3 className="text-3xl font-black text-gray-900 flex items-center tracking-tighter uppercase italic leading-none">
              <MessageSquare size={36} className="mr-4 text-emerald-600" /> {t('profile.archive_title')}
              <span className="ml-4 text-sm font-bold text-gray-400 not-italic bg-gray-100 px-3 py-1 rounded-full">{userComments.length}</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentComments.length > 0 ? currentComments.map((comment) => (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                key={comment.id} 
                onClick={() => navigate(`/events/${comment.event_id}`)} 
                className="p-6 bg-[#fdfdfd] rounded-[2.5rem] border border-gray-100 hover:border-emerald-200 hover:bg-white hover:shadow-xl transition-all duration-300 group relative overflow-hidden text-left cursor-pointer border-l-4 h-full flex flex-col justify-between" 
                style={{ borderLeftColor: selectedBg.color }}
              >
                <p className="text-base text-gray-700 font-medium italic mb-6 leading-relaxed opacity-90 line-clamp-4">"{comment.content}"</p>
                
                <div className="flex justify-between items-end pt-4 border-t border-gray-50 font-black uppercase italic">
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <span className="text-[9px] text-gray-400 tracking-[0.2em]">{t('profile.label_event')}</span>
                    <span className="text-xs text-emerald-600 tracking-tighter truncate w-full group-hover:underline">{comment.event_title || t('profile.default_event')}</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex shrink-0 items-center justify-center text-emerald-600 group-hover:translate-x-1 transition-all shadow-sm">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-[3rem] border-4 border-dashed border-gray-100 text-gray-300 font-black italic uppercase tracking-[0.3em]">{t('profile.no_comments')}</div>
            )}
          </div>

          {userComments.length > commentsPerPage && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button 
                onClick={prevPage} 
                disabled={currentPage === 1}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black shadow-lg'}`}
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="font-black text-gray-400 italic text-sm tracking-widest">
                {t('profile.page_info', { current: currentPage, total: totalPages })}
              </span>

              <button 
                onClick={nextPage} 
                disabled={currentPage === totalPages}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black shadow-lg'}`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}