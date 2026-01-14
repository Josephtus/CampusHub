import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Calendar, MapPin, Users, Send, MessageSquare, 
  Clock, ArrowLeft, CheckCircle, Loader2, ShieldCheck, Lock
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next'; // <--- EKLENDİ

export default function EventDetail() {
  const { t } = useTranslation(); // <--- EKLENDİ
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchEventDetails();
      fetchComments();
    }
  }, [id, authLoading]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data.event);
      if (data.event?.is_joined) setHasJoined(true);
    } catch (err) {
      showToast(t('event_detail.load_error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/events/${id}/comments`);
      setComments(data.comments || []);
    } catch (err) {
      console.error('Yorumlar yüklenemedi');
    }
  };

  const handleJoin = async () => {
    if (!user) {
      showToast(t('event_detail.login_warning_join'), 'warning');
      setTimeout(() => {
        navigate('/login', { state: { from: location.pathname } });
      }, 1000); 
      return;
    }

    if (user.role === 'admin') {
      showToast(t('event_detail.admin_warning'), 'error');
      return;
    }

    if (hasJoined) return;
    setIsJoining(true);
    try {
      await api.post(`/events/${id}/join`);
      setHasJoined(true);
      setEvent(prev => ({ ...prev, participant_count: (prev.participant_count || 0) + 1 }));
      showToast(t('event_detail.join_success'), 'success');
    } catch (err) {
      showToast(t('event_detail.join_error'), 'error');
    } finally {
      setIsJoining(false);
    }
  };

  const handleAddComment = async (e) => {
    if (e) e.preventDefault(); 
    
    if (!user) {
      showToast(t('event_detail.login_warning_comment'), "warning");
      setTimeout(() => {
        navigate('/login', { state: { from: location.pathname } });
      }, 1000);
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/events/${id}/comments`, { content: newComment });
      
      if (data && data.comment) {
        setComments(prevComments => [data.comment, ...prevComments]);
        setNewComment(""); 
        showToast(t('event_detail.comment_success'), "success");
      } else {
        await fetchComments();
        setNewComment("");
      }
    } catch (err) {
      showToast(t('event_detail.comment_error'), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (loading && !event)) return <LoadingSpinner size="lg" text={t('event_detail.loading')} />;
  if (!event) return <div className="text-center py-20 font-bold">{t('event_detail.not_found')}</div>;

  const isFull = event.capacity > 0 && event.participant_count >= event.capacity;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-indigo-600 mb-6 font-bold transition">
          <ArrowLeft size={20} className="mr-2" /> {t('event_detail.back')}
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden mb-8">
          <div className="relative h-80">
            <img src={event.image_url || 'https://via.placeholder.com/1200x400'} className="w-full h-full object-cover" alt={event.title} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            <div className="absolute bottom-10 left-10 text-white">
              <span className="bg-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase mb-3 inline-block tracking-widest">{event.club_name}</span>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{event.title}</h1>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
               <div className="flex items-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                 <Calendar className="text-indigo-600 mr-3" size={24} />
                 <div><p className="text-[9px] font-black text-indigo-400 uppercase">{t('event_detail.date')}</p><p className="font-bold text-gray-800 text-sm">{event.date}</p></div>
               </div>
               <div className="flex items-center p-4 bg-rose-50 rounded-2xl border border-rose-100">
                 <MapPin className="text-rose-600 mr-3" size={24} />
                 <div><p className="text-[9px] font-black text-rose-400 uppercase">{t('event_detail.location')}</p><p className="font-bold text-gray-800 text-sm">{event.location}</p></div>
               </div>
               <div className="flex items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <Users className="text-emerald-600 mr-3" size={24} />
                 <div><p className="text-[9px] font-black text-emerald-400 uppercase">{t('event_detail.quota')}</p><p className="font-bold text-gray-800 text-sm">{event.participant_count} / {event.capacity || '∞'}</p></div>
               </div>
            </div>

            <div className="mb-8 border-t pt-8 text-left">
              <h3 className="text-xs font-black text-gray-400 uppercase mb-3 flex items-center tracking-widest"><Clock size={16} className="mr-2"/> {t('event_detail.about')}</h3>
              <p className="text-gray-700 text-lg leading-relaxed font-medium italic">"{event.description}"</p>
            </div>

            <div className="flex flex-col items-center">
              {user?.role === 'admin' ? (
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center space-x-3 px-8 py-4 bg-amber-50 border-2 border-amber-200 rounded-2xl shadow-sm">
                    <ShieldCheck className="text-amber-600" size={24} />
                    <div>
                      <p className="text-[11px] font-black text-amber-800 uppercase tracking-widest leading-none mb-1">{t('event_detail.admin_mode_title')}</p>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">{t('event_detail.admin_mode_desc')}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={isJoining || hasJoined || (isFull && !hasJoined)}
                  className={`px-12 py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
                    hasJoined ? 'bg-green-100 text-green-600 border-2 border-green-200 cursor-default' : isFull ? 'bg-gray-200 text-gray-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isJoining ? <Loader2 className="animate-spin" size={20} /> : 
                   hasJoined ? <><CheckCircle size={22} /> {t('event_detail.btn_registered')}</> : 
                   isFull ? t('event_detail.btn_full') : t('event_detail.btn_join')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* YORUMLAR / TARTIŞMALAR BÖLÜMÜ */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-left">
          <h2 className="text-xl font-black mb-6 flex items-center tracking-tight uppercase italic">
            <MessageSquare className="mr-3 text-indigo-600" /> {t('event_detail.discussion_title')} ({comments.length})
          </h2>
          
          <form onSubmit={handleAddComment} className="mb-8 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!user}
              placeholder={user ? t('event_detail.comment_placeholder_auth') : t('event_detail.comment_placeholder_guest')}
              className={`w-full p-5 border-2 rounded-2xl outline-none transition-all resize-none h-28 font-medium shadow-inner ${
                !user 
                  ? 'bg-gray-100 border-gray-200 cursor-not-allowed italic text-gray-400' 
                  : 'bg-gray-50 border-transparent focus:border-indigo-500 focus:bg-white text-gray-700'
              }`}
            />
            <button 
              type="submit"
              disabled={isSubmitting}
              className="absolute bottom-4 right-4 bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition shadow-lg flex items-center justify-center"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : user ? <Send size={18} /> : <Lock size={18} />}
            </button>
          </form>

          <div className="space-y-4">
            {comments.length > 0 ? comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-md">
                
                {/* AVATAR KISMI: Tıklanınca Profile Gider */}
                <div 
                  onClick={() => comment.user_id && navigate(`/profile/${comment.user_id}`)}
                  className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform"
                >
                  {comment.profile_photo ? (
                    <img src={comment.profile_photo} alt="user" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-indigo-600 font-black text-sm uppercase">
                      {comment.user_name?.[0] || 'U'}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  {/* İSİM VE BÖLÜM BİLGİSİ */}
                  <div className="flex items-center justify-between mb-1">
                    <div 
                      onClick={() => comment.user_id && navigate(`/profile/${comment.user_id}`)}
                      className="flex flex-col cursor-pointer group"
                    >
                      <span className="font-black text-gray-800 text-xs uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                        {comment.user_name}
                      </span>
                      {/* Bölüm Bilgisi Varsa Göster */}
                      {comment.department && (
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                          {comment.department}
                        </span>
                      )}
                    </div>
                    
                    <span className="text-[9px] text-gray-400 font-bold uppercase whitespace-nowrap ml-2">
                      {comment.created_at}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm font-medium leading-relaxed mt-1">
                    {comment.content}
                  </p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-300 font-bold italic">
                {t('event_detail.no_comments')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}