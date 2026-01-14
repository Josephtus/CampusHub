import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import {
  CheckCircle2, XCircle, Clock,
  User, Mail, Building2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AdminClubRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { showToast } = useToast(); // ToastContext yapına göre güncellendi

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Backend'deki mevcut yapına göre pending olanları çeken endpoint'i çağırıyoruz
      // Not: Backend blueprint'ine "/pending" endpoint'ini eklemelisin
      const { data } = await api.get('/clubs/pending-requests');
      setRequests(data.clubs || []);
    } catch (err) {
      showToast(t('admin_club_requests.toast_fetch_error'), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (clubId, action) => {
    setProcessingId(clubId);
    try {
      if (action === 'approved') {
        // Senin Backend yapın: @clubs_bp.post("/<club_id:int>/approve")
        await api.post(`/clubs/${clubId}/approve`);
        showToast(t('admin_club_requests.toast_success_approve'), "success");
      } else {
        // Senin Backend yapın: @clubs_bp.delete("/<club_id:int>") -> Soft Delete
        const confirmDelete = window.confirm(t('admin_club_requests.toast_reject_confirm'));
        if (!confirmDelete) return;

        await api.delete(`/clubs/${clubId}`);
        showToast(t('admin_club_requests.toast_success_reject'), "success");
      }
      // Listeyi yenile
      fetchRequests();
    } catch (err) {
      const errorMsg = err.response?.data?.error || t('admin_club_requests.toast_error_generic');
      showToast(errorMsg, "error");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <Loader2 className="animate-spin mb-4" size={40} />
      <p className="font-black uppercase tracking-widest text-xs italic">{t('admin_club_requests.loading')}</p>
    </div>
  );

  return (
    <div className="text-left">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-3">
          <Building2 className="text-indigo-600" size={32} /> {t('admin_club_requests.title')}
        </h2>
        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">
          {t('admin_club_requests.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Sol Taraf: Kulüp Bilgileri */}
                <div className="flex-1 p-8 border-b lg:border-b-0 lg:border-r border-gray-50">
                  <div className="flex items-center gap-4 mb-6">
                    {req.image_url ? (
                      <img src={req.image_url} alt="logo" className="w-14 h-14 rounded-2xl object-cover border border-gray-100" />
                    ) : (
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Building2 size={28} />
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                        {req.name}
                      </h3>
                      <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {t('admin_club_requests.badge_pending')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium italic leading-relaxed mb-6">
                    "{req.description || t('admin_club_requests.no_desc')}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <User size={16} className="text-indigo-400" />
                      <span className="text-xs font-bold">{t('admin_club_requests.president_id', { id: req.president_id })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock size={16} className="text-indigo-400" />
                      <span className="text-xs font-bold">{new Date(req.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf: Aksiyonlar */}
                <div className="bg-gray-50/50 p-8 flex flex-col justify-center gap-4 min-w-[240px]">
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleReview(req.id, 'approved')}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {processingId === req.id ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> {t('admin_club_requests.btn_approve')}</>}
                  </button>
                  <button
                    disabled={processingId === req.id}
                    onClick={() => handleReview(req.id, 'rejected')}
                    className="w-full py-4 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black uppercase italic tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <XCircle size={20} /> {t('admin_club_requests.btn_reject')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {requests.length === 0 && (
          <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
            <Clock size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-black uppercase italic tracking-widest">{t('admin_club_requests.no_requests')}</p>
          </div>
        )}
      </div>
    </div>
  );
}