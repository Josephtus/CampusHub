import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, Save, Loader2, Calendar, MapPin, 
  Image as ImageIcon, Type, Clock, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // <--- EKLENDİ

export default function EventEdit() {
  const { t } = useTranslation(); // <--- EKLENDİ
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    image_url: '',
    capacity: ''
  });

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      const ev = data.event || data;
      setFormData({
        title: ev.title || '',
        description: ev.description || '',
        date: ev.date || '',
        location: ev.location || '',
        image_url: ev.image_url || '',
        capacity: ev.capacity || ''
      });
    } catch (err) {
      toast.error(t('event_edit.load_error'));
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/events/${id}`, formData);
      toast.success(t('event_edit.update_success'));
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      toast.error(t('event_edit.update_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black uppercase italic text-indigo-600 animate-pulse">
      {t('event_edit.loading')}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans text-left">
      <div className="max-w-3xl mx-auto">
        {/* GERİ DÖN BUTONU */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-all font-black uppercase text-[10px] tracking-[0.2em] mb-8"
        >
          <ArrowLeft size={20} /> {t('event_edit.cancel_edit')}
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[3.5rem] shadow-2xl border-2 border-gray-100 overflow-hidden"
        >
          {/* HEADER */}
          <div className="bg-gray-900 p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3 relative z-10">
              <Sparkles className="text-indigo-400" /> {t('event_edit.title')}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mt-2 relative z-10">
              {t('event_edit.subtitle')}
            </p>
          </div>

          {/* FORM AREA */}
          <form onSubmit={handleSubmit} className="p-10 space-y-8 text-left">
            
            {/* ETKİNLİK BAŞLIĞI */}
            <div className="group">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 italic">
                <Type size={14} className="text-indigo-500" /> {t('event_edit.label_name')}
              </label>
              <input 
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 shadow-inner"
                placeholder={t('event_edit.ph_name')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* TARİH */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 italic text-left">
                  <Calendar size={14} className="text-indigo-500" /> {t('event_edit.label_date')}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 shadow-inner"
                  placeholder={t('event_edit.ph_date')}
                />
              </div>

              {/* KONUM */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 italic text-left">
                  <MapPin size={14} className="text-indigo-500" /> {t('event_edit.label_location')}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 shadow-inner"
                  placeholder={t('event_edit.ph_location')}
                />
              </div>
            </div>

            {/* AÇIKLAMA */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 italic text-left">
                <Clock size={14} className="text-indigo-500" /> {t('event_edit.label_desc')}
              </label>
              <textarea 
                required
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2.5rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 shadow-inner resize-none italic"
                placeholder={t('event_edit.ph_desc')}
              />
            </div>

            {/* GÖRSEL URL */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 italic text-left">
                <ImageIcon size={14} className="text-indigo-500" /> {t('event_edit.label_image')}
              </label>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <input 
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent rounded-[2rem] focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold text-gray-800 shadow-inner"
                  placeholder="https://..."
                />
                {formData.image_url && (
                  <img src={formData.image_url} className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg" alt="preview" />
                )}
              </div>
            </div>

            {/* KAYDET BUTONU */}
            <button 
              type="submit"
              disabled={saving}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2.5rem] font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" /> {t('event_edit.btn_saving')}
                </>
              ) : (
                <>
                  <Save size={20} /> {t('event_edit.btn_save')}
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}