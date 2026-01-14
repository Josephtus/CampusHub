import { useEffect, useState } from 'react';
import api from '../api/axios';
import { 
  Search, Calendar as CalendarIcon, MapPin, Loader2, TrendingUp, 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  PlusCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import WeatherWidget from '../components/WeatherWidget';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next'; // <--- EKLENDİ

export default function Home() {
  const { t, i18n } = useTranslation(); // <--- EKLENDİ
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 9; 

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      params.append('page', currentPage);
      params.append('limit', ITEMS_PER_PAGE);
      
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter) params.append('date', dateFilter);

      const { data } = await api.get(`/events/?${params.toString()}`);
      
      setEvents(data.events);
      
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
      }
    } catch (err) {
      console.error("Etkinlikler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, dateFilter, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- SAYFA NUMARASI HESAPLAMA ---
  const getPageNumbers = () => {
    if (totalPages <= 2) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage === totalPages) {
      return [totalPages - 1, totalPages];
    }
    return [currentPage, currentPage + 1];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero & Arama Bölümü */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 inline-block">
            <span className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold">
              {t('home.badge')}
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            {t('home.hero_title')} <span className="text-yellow-300">{t('home.hero_title_highlight')}</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            {t('home.hero_desc')}
          </p>
          
          {/* --- ARAMA KUTUSU --- */}
          <div className="bg-white p-3 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-3 max-w-3xl mx-auto mb-8">
            <div className="flex-1 flex items-center px-4 bg-gray-50 rounded-2xl">
              <Search className="text-gray-400 mr-3" size={22} />
              <input 
                type="text"
                placeholder={t('home.search_placeholder')}
                className="w-full py-4 outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center px-4 bg-gray-50 rounded-2xl">
              <CalendarIcon className="text-gray-400 mr-3" size={22} />
              <input 
                type="date"
                className="bg-transparent py-4 outline-none text-gray-700"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>

          {/* --- BUTONLAR (TEKRAR EKLENDİ) --- */}
          <div className="flex flex-wrap justify-center gap-4">

            {user ? (
              <Link 
                to="/create-club-request" 
                className="flex items-center px-8 py-4 bg-yellow-400 text-yellow-900 rounded-2xl font-black uppercase tracking-wide hover:bg-yellow-300 hover:scale-105 transition-all shadow-lg shadow-yellow-500/30"
              >
                <PlusCircle className="mr-2" size={20} />
                {t('home.btn_create_club')}
              </Link>
            ) : (
              <Link 
                to="/register" 
                className="flex items-center px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold hover:bg-indigo-400 transition-all shadow-lg"
              >
                {t('home.btn_join')}
              </Link>
            )}
          </div>

        </div>
      </div>

      {/* Ana İçerik */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        
        {/* Hava Durumu + İstatistik Kartları */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <div className="lg:col-span-1">
            <WeatherWidget />
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-100 hover:shadow-lg transition">
              <div className="text-4xl font-black text-blue-600 mb-2">{events.length}</div>
              <div className="text-sm text-gray-600 font-semibold">{t('home.stat_events')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-green-100 hover:shadow-lg transition">
              <div className="text-4xl font-black text-green-600 mb-2">12</div>
              <div className="text-sm text-gray-600 font-semibold">{t('home.stat_clubs')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-purple-100 hover:shadow-lg transition">
              <div className="text-4xl font-black text-purple-600 mb-2">250+</div>
              <div className="text-sm text-gray-600 font-semibold">{t('home.stat_students')}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-orange-100 hover:shadow-lg transition">
              <div className="text-4xl font-black text-orange-600 mb-2">48</div>
              <div className="text-sm text-gray-600 font-semibold">{t('home.stat_month')}</div>
            </div>
          </div>
        </div>

        {/* Etkinlik Başlığı */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black text-gray-900 flex items-center">
              <TrendingUp className="mr-3 text-blue-600" size={32} />
              {t('home.upcoming_title')}
            </h2>
            {searchTerm && (
              <p className="text-gray-500 mt-2">
                "<span className="text-blue-600 font-semibold">{searchTerm}</span>" {t('home.search_results')}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{t('home.page_info')}</p>
            <p className="text-3xl font-black text-blue-600">{currentPage} / {totalPages}</p>
          </div>
        </div>

        {/* Etkinlik Listesi */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={56} />
            <p className="text-gray-500 font-medium">{t('home.loading')}</p>
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map(event => (
                <Link 
                  to={`/events/${event.id}`} 
                  key={event.id}
                  className="group bg-white rounded-3xl border-2 border-gray-100 overflow-hidden hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img 
                      src={event.image_url || 'https://placehold.co/400x200?text=CampusHub'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={event.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="inline-block bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-lg mb-2">
                        {event.club_name}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon size={16} className="mr-2 text-blue-500" />
                        <span className="font-medium">
                          {new Date(event.date).toLocaleDateString(i18n.language || 'tr', { 
                            day: 'numeric', 
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2 text-red-500" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-blue-600 font-semibold text-sm group-hover:text-blue-700">
                        {t('home.view_details')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* --- PAGINATION (SAYFALAMA) BUTONLARI --- */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-12 flex-wrap">
                {/* İLK SAYFA */}
                <button 
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:hover:border-gray-200 disabled:cursor-not-allowed"
                  title={t('home.first_page')}
                >
                  <ChevronsLeft size={20} />
                </button>

                {/* ÖNCEKİ */}
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:hover:border-gray-200 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} className="mr-1" />
                  {t('home.prev_page')}
                </button>
                
                {/* SAYFA NUMARALARI (Max 2) */}
                <div className="flex items-center gap-2">
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-110' 
                          : 'bg-white text-gray-600 hover:bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* SONRAKİ */}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:hover:border-gray-200 disabled:cursor-not-allowed"
                >
                  {t('home.next_page')}
                  <ChevronRight size={20} className="ml-1" />
                </button>

                {/* SON SAYFA */}
                <button 
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-blue-500 hover:text-blue-600 transition disabled:opacity-50 disabled:hover:border-gray-200 disabled:cursor-not-allowed"
                  title={t('home.last_page')}
                >
                  <ChevronsRight size={20} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-xl font-semibold mb-2">{t('home.no_events_title')}</p>
            <p className="text-gray-400">{t('home.no_events_desc')}</p>
          </div>
        )}
      </div>
    </div>
  );
}