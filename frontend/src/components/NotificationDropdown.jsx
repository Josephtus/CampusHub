import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Bell, CheckCheck, X, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotificationDropdown({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications/');
      // Backend'den gelen verinin yapısına göre (notifications veya direkt liste)
      setNotifications(data.notifications || data || []);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    // undefined/read hatasını önlemek için kontrol
    if (!notifId) {
      console.warn("Geçersiz bildirim ID'si.");
      return;
    }

    try {
      await api.post(`/notifications/${notifId}/read`);
      // Lokal state'i güncelle
      setNotifications(prev =>
        prev.map(n => {
          const id = n.id || n.notification_id;
          return id === notifId ? { ...n, is_read: true } : n;
        })
      );
    } catch (err) {
      console.error('İşaretleme başarısız:', err);
    }
  };

  const handleClearAll = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length === 0) return;

    if (unreadNotifications.length === 0) return;

    if (window.confirm(t('notification_dropdown.confirm_read_all'))) {
      try {
        // Backend'de toplu okuma endpoint'i varsa burayı api.post('/notifications/read-all') yapabilirsiniz
        // Yoksa mevcut döngü mantığını daha güvenli çalıştıralım
        const promises = unreadNotifications.map(n =>
          handleMarkAsRead(n.id || n.notification_id)
        );
        await Promise.all(promises);
      } catch (err) {
        console.error('Toplu işaretleme başarısız');
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Dışarı tıklayınca kapat */}
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
      />

      {/* Dropdown Container */}
      <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border-2 border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-5 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Bell size={20} className="animate-tada" />
            <h3 className="font-black text-sm uppercase tracking-widest">{t('notification_dropdown.title')}</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadCount} {t('notification_dropdown.new_badge')}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-1.5 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">
              {t('notification_dropdown.total_msg', { count: notifications.length })}
            </span>
            <button
              onClick={handleClearAll}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black uppercase flex items-center space-x-1 tracking-tighter transition"
            >
              <CheckCheck size={12} />
              <span>{t('notification_dropdown.mark_all_read')}</span>
            </button>
          </div>
        )}

        {/* Notification List Area */}
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-xs font-bold uppercase tracking-widest">{t('notification_dropdown.loading')}</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif, index) => {
              const currentId = notif.id || notif.notification_id;
              return (
                <div
                  key={currentId || `notif-${index}`}
                  className={`p-4 border-b border-gray-50 transition-all duration-300 flex gap-3 ${!notif.is_read ? 'bg-indigo-50/50' : 'opacity-70'
                    }`}
                >
                  {/* Status Indicator */}
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notif.is_read ? 'bg-indigo-600' : 'bg-gray-300'}`} />

                  <div className="flex-1">
                    <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-bold text-gray-900' : 'text-gray-600'
                      }`}>
                      {notif.message || notif.content}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-gray-400 font-bold flex items-center">
                          <Clock size={10} className="mr-1" />
                          {new Date(notif.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {notif.event_id && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg font-black uppercase">{t('notification_dropdown.badge_event')}</span>
                        )}
                      </div>

                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(currentId)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                          title={t('notification_dropdown.title_mark_read')}
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-gray-200" />
              </div>
              <p className="text-gray-400 text-sm font-bold tracking-tight">{t('notification_dropdown.empty_title')}</p>
              <p className="text-[10px] text-gray-300 mt-1 uppercase font-black">{t('notification_dropdown.empty_desc')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t text-center">
          <button className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black uppercase tracking-widest transition">
            {t('notification_dropdown.settings_btn')}
          </button>
        </div>
      </div>
    </>
  );
}