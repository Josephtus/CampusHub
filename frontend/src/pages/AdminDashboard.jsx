import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, CheckCircle, Trash2, ShieldAlert,
  TrendingUp, Calendar, Building2, Search,
  Megaphone, AlertTriangle, BarChart3, ChevronLeft, ChevronRight,
  Crown, User, ExternalLink, ShieldCheck, Loader2, Edit, MapPin,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { tab } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(tab || 'overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState('');

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    fetchStats();
    fetchClubs();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, page, searchTerm]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data.stats);
    } catch (err) {
      console.error('İstatistikler yüklenemedi');
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data.events || data);
    } catch (err) {
      console.error('Etkinlikler yüklenemedi');
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (searchTerm) params.append('search', searchTerm);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(t('admin_dashboard.users.toast_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClubs = async () => {
    try {
      const { data } = await api.get('/clubs/my-clubs');
      setClubs(data.clubs);
    } catch (err) {
      console.error('Kulüpler yüklenemedi');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (newRole === 'club_admin' && !selectedClubId) {
      toast.warning(t('admin_dashboard.users.toast_select_club'));
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/role`, {
        role: newRole,
        club_id: selectedClubId ? parseInt(selectedClubId) : null
      });

      toast.success(t('admin_dashboard.users.toast_role_updated', { role: newRole }));
      fetchUsers();
      fetchClubs();
      setIsUserModalOpen(false);
      setSelectedClubId('');
    } catch (err) {
      toast.error(err.response?.data?.error || t('admin_dashboard.users.toast_role_error'));
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm(t('admin_dashboard.users.confirm_ban'))) return;
    try {
      const { data } = await api.post(`/admin/users/${userId}/ban`);
      toast.success(t('admin_dashboard.users.toast_ban_success', { message: data.message }));
      fetchUsers();
      setIsUserModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || t('admin_dashboard.users.toast_ban_error'));
    }
  };

  const handleApproveClub = async (clubId) => {
    try {
      await api.post(`/clubs/${clubId}/approve`);
      toast.success(t('admin_dashboard.clubs.toast_approve_success'));
      fetchClubs();
      fetchStats();
    } catch (err) {
      toast.error(t('admin_dashboard.clubs.toast_approve_error'));
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm(t('admin_dashboard.clubs.confirm_delete'))) return;
    try {
      await api.delete(`/clubs/${clubId}`);
      toast.success(t('admin_dashboard.clubs.toast_delete_success'));
      fetchClubs();
      fetchStats();
    } catch (err) {
      toast.error(t('admin_dashboard.clubs.toast_delete_error'));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm(t('admin_dashboard.events.confirm_delete'))) return;
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast.success(t('admin_dashboard.events.toast_delete_success'));
      fetchStats();
    } catch (err) {
      toast.error(t('admin_dashboard.events.toast_delete_error'));
    }
  };

  const changeTab = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
    navigate(`/admin/${tabId}`);
  };

  const closeModal = () => {
    setIsUserModalOpen(false);
    setSelectedClubId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50 p-6 font-sans text-left">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-[2.5rem] shadow-xl p-8 mb-8 text-white relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <ShieldAlert size={40} className="animate-pulse" />
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">{t('admin_dashboard.header_title')}</h1>
              </div>
              <p className="text-red-100 font-bold uppercase text-[10px] tracking-widest opacity-80">{t('admin_dashboard.header_subtitle')}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black">{stats?.users || 0}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-red-100">{t('admin_dashboard.total_students')}</div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-6 flex space-x-2 overflow-x-auto border border-gray-100">
          {[
            { id: 'overview', label: t('admin_dashboard.tabs.dashboard'), icon: BarChart3 },
            { id: 'users', label: t('admin_dashboard.tabs.users'), icon: Users },
            { id: 'clubs', label: t('admin_dashboard.tabs.clubs'), icon: Building2 },
            { id: 'events', label: t('admin_dashboard.tabs.events'), icon: Calendar },
            { id: 'announce', label: t('admin_dashboard.tabs.announce'), icon: Megaphone }
          ].map(tabItem => {
            const Icon = tabItem.icon;
            return (
              <button
                key={tabItem.id}
                onClick={() => changeTab(tabItem.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === tabItem.id ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'
                  }`}
              >
                <Icon size={16} />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <OverviewTab stats={stats} onCardClick={changeTab} t={t} />}
              {activeTab === 'users' && (
                <UsersTab
                  users={users}
                  loading={loading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  onUserClick={(u) => { setSelectedUser(u); setIsUserModalOpen(true); }}
                  pagination={pagination}
                  page={page}
                  setPage={setPage}
                  t={t}
                />
              )}
              {activeTab === 'clubs' && (
                <ClubsTab
                  clubs={clubs}
                  handleApproveClub={handleApproveClub}
                  handleDeleteClub={handleDeleteClub}
                  t={t}
                />
              )}
              {activeTab === 'events' && (
                <EventsTab
                  events={events}
                  handleDeleteEvent={handleDeleteEvent}
                  t={t}
                />
              )}
              {activeTab === 'announce' && <AnnounceTab t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* User Management Modal */}
      <AnimatePresence>
        {isUserModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden z-10"
            >
              <div className="h-24 bg-gradient-to-r from-red-600 to-pink-600" />
              <div className="p-8 -mt-12 text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={selectedUser.profile_photo || `https://ui-avatars.com/api/?name=${selectedUser.full_name}&background=ef4444&color=fff`}
                    className="w-24 h-24 rounded-3xl border-4 border-white shadow-2xl object-cover"
                    alt="Profile"
                  />
                </div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">{selectedUser.full_name}</h2>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">{selectedUser.email}</p>

                <div className="grid grid-cols-1 gap-3">
                  {selectedUser.role === 'student' && (
                    <div className="mb-2 text-left bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
                        {t('admin_dashboard.users.select_club_label')}
                      </label>
                      <select
                        className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-colors"
                        value={selectedClubId}
                        onChange={(e) => setSelectedClubId(e.target.value)}
                      >
                        <option value="">{t('admin_dashboard.users.select_club_default')}</option>
                        {clubs.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.president_id ? t('admin_dashboard.users.club_full') : t('admin_dashboard.users.club_empty')}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedUser.role !== 'club_admin' ? (
                    <button
                      onClick={() => handleUpdateRole(selectedUser.id, 'club_admin')}
                      className="w-full py-4 bg-yellow-50 text-yellow-700 rounded-2xl font-black uppercase text-xs hover:bg-yellow-500 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <Crown size={18} /> {t('admin_dashboard.users.btn_grant_president')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateRole(selectedUser.id, 'student')}
                      className="w-full py-4 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase text-xs hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <User size={18} /> {t('admin_dashboard.users.btn_revoke_president')}
                    </button>
                  )}

                  <button
                    onClick={() => handleBanUser(selectedUser.id)}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> {t('admin_dashboard.users.btn_ban')}
                  </button>
                  <button
                    onClick={() => { navigate(`/profile/${selectedUser.id}`); closeModal(); }}
                    className="w-full py-4 bg-gray-50 text-gray-600 rounded-2xl font-black uppercase text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink size={18} /> {t('admin_dashboard.users.btn_view_profile')}
                  </button>
                  <button
                    onClick={closeModal}
                    className="mt-4 text-gray-400 font-black text-[9px] uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    {t('admin_dashboard.users.btn_close_panel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SUB COMPONENTS ---

// 1. Pagination Component (Sliding Window & First/Last Buttons)
const PaginationControls = ({ currentPage, totalPages, onPageChange, t }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= 2) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage === totalPages) return [totalPages - 1, totalPages];
    return [currentPage, Math.min(currentPage + 1, totalPages)]; // [Aktif, Aktif+1]
  };

  return (
    <div className="flex justify-center items-center gap-3 mt-8 flex-wrap">
      {/* İLK SAYFA */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-red-300 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronsLeft size={16} />
      </button>

      {/* ÖNCEKİ */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 text-xs font-bold hover:border-red-300 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={14} className="mr-1" /> {t('home.prev_page')}
      </button>

      {/* SAYFA NUMARALARI */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center text-xs transition ${currentPage === page
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* SONRAKİ */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 text-xs font-bold hover:border-red-300 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {t('home.next_page')} <ChevronRight size={14} className="ml-1" />
      </button>

      {/* SON SAYFA */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-red-300 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );
};

function OverviewTab({ stats, onCardClick, t }) {
  if (!stats) return <div className="text-center py-20 animate-pulse text-gray-300 font-black uppercase tracking-widest">{t('loading_spinner.default_text')}</div>;

  const cards = [
    { id: 'users', label: t('admin_dashboard.overview.card_users'), value: stats.users, icon: Users, color: 'blue' },
    { id: 'clubs', label: t('admin_dashboard.overview.card_active_clubs'), value: stats.active_clubs, icon: Building2, color: 'green' },
    { id: 'clubs', label: t('admin_dashboard.overview.card_pending_clubs'), value: stats.pending_clubs, icon: AlertTriangle, color: 'yellow', alert: stats.pending_clubs > 0 },
    { id: 'events', label: t('admin_dashboard.overview.card_events'), value: stats.events, icon: Calendar, color: 'purple' }
  ];

  return (
    <div className="text-left">
      <h2 className="text-2xl font-black mb-8 flex items-center text-gray-800 uppercase tracking-tighter italic text-left">
        <TrendingUp className="mr-3 text-red-600" size={28} />
        {t('admin_dashboard.overview.title')}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-indigo-600 shadow-blue-100',
            green: 'from-green-500 to-emerald-600 shadow-green-100',
            yellow: 'from-yellow-500 to-orange-600 shadow-yellow-100',
            purple: 'from-purple-500 to-pink-600 shadow-purple-100'
          };
          return (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCardClick(card.id)}
              className="bg-white border-2 border-gray-50 rounded-3xl p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              {card.alert && (
                <span className="absolute top-4 right-4 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
              <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[card.color]} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-6 transition-transform`}>
                <Icon className="text-white" size={28} />
              </div>
              <div className="text-5xl font-black text-gray-900 mb-2 tracking-tighter">{card.value}</div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">{card.label}</div>
              <div className="text-[9px] text-indigo-500 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                {t('admin_dashboard.overview.go_details')} <ChevronRight size={10} className="ml-1" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// EVENTS TAB with CLIENT-SIDE PAGINATION (Max 10 Items per page)
function EventsTab({ events, handleDeleteEvent, t }) {
  const navigate = useNavigate();

  // Pagination State
  const [page, setPage] = useState(1);
  const LIMIT = 10; // İsteğine göre 10 yaptık

  const totalPages = Math.ceil(events.length / LIMIT);
  const currentEvents = events.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="text-left">
      <h2 className="text-2xl font-black mb-8 flex items-center text-gray-800 uppercase tracking-tighter italic">
        <Calendar className="mr-3 text-red-600" size={28} />
        {t('admin_dashboard.events.title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentEvents.length > 0 ? currentEvents.map(event => (
          <div key={event.id} className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <img src={event.image_url || 'https://via.placeholder.com/60'} className="w-12 h-12 rounded-xl object-cover" alt="Event" />
              <div className="text-left">
                <div className="font-black text-gray-900 uppercase text-sm tracking-tight line-clamp-1">{event.title}</div>
                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-widest">
                  <MapPin size={10} /> {event.location} | <Calendar size={10} /> {event.date}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/events/${event.id}`)}
                className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                title={t('admin_dashboard.events.btn_view')}
              >
                <ExternalLink size={18} />
              </button>
              <button
                onClick={() => navigate(`/events/edit/${event.id}`)}
                className="p-2 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
                title={t('admin_dashboard.events.btn_edit')}
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title={t('admin_dashboard.events.btn_delete')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )) : <p className="col-span-2 text-center py-20 text-gray-400 font-bold italic">{t('admin_dashboard.events.no_events')}</p>}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        t={t}
      />
    </div>
  );
}

function UsersTab({ users, loading, searchTerm, setSearchTerm, onUserClick, pagination, page, setPage, t }) {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 text-left">
        <h2 className="text-2xl font-black flex items-center text-gray-800 uppercase tracking-tighter italic">
          <Users className="mr-3 text-red-600" size={28} />
          {t('admin_dashboard.users.title')}
        </h2>
        <div className="flex items-center bg-gray-50 px-5 py-3 rounded-2xl border-2 border-gray-100 focus-within:border-red-200 transition-all">
          <Search size={18} className="text-gray-400 mr-3" />
          <input
            type="text"
            placeholder={t('admin_dashboard.users.search_placeholder')}
            className="bg-transparent outline-none text-sm font-bold text-gray-700 w-full md:w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-300 font-black uppercase text-xs animate-pulse italic">{t('admin_dashboard.users.syncing')}</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => onUserClick(user)}
              className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 hover:bg-white hover:border-red-200 hover:shadow-xl transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center space-x-5 text-left">
                <div className="relative">
                  <img
                    src={user.profile_photo || `https://ui-avatars.com/api/?name=${user.full_name}&background=ef4444&color=fff`}
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-110 transition-transform"
                    alt="Avatar"
                  />
                </div>
                <div>
                  <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{user.full_name}</div>
                  <div className="text-[10px] text-gray-400 font-bold lowercase mb-1">{user.email}</div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-100 text-red-600' :
                      user.role === 'club_admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
                      }`}>
                      {user.role}
                    </span>
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter italic">{user.department}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-red-500 group-hover:translate-x-1 transition-all" size={20} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls - UPDATED */}
      {pagination && (
        <PaginationControls
          currentPage={page}
          totalPages={pagination.total_pages}
          onPageChange={setPage}
          t={t}
        />
      )}
    </div>
  );
}

// 2. ClubsTab Component (GÜNCELLENDİ: SLIDING WINDOW PAGINATION EKLENDİ)
function ClubsTab({ clubs, handleApproveClub, handleDeleteClub, t }) {
  const navigate = useNavigate();

  // Ayrı Pagination State'leri
  const [pendingPage, setPendingPage] = useState(1);
  const [activePage, setActivePage] = useState(1);

  // Limitler
  const pendingLimit = 5;
  const activeLimit = 20;

  const pendingClubs = clubs.filter(c => c.status === 'pending');
  const activeClubs = clubs.filter(c => c.status === 'active');

  // Dilimleme (Slicing) - Client Side Pagination
  const currentPendingClubs = pendingClubs.slice((pendingPage - 1) * pendingLimit, pendingPage * pendingLimit);
  const currentActiveClubs = activeClubs.slice((activePage - 1) * activeLimit, activePage * activeLimit);

  const totalPendingPages = Math.ceil(pendingClubs.length / pendingLimit);
  const totalActivePages = Math.ceil(activeClubs.length / activeLimit);

  return (
    <div className="text-left">
      <h2 className="text-2xl font-black mb-8 flex items-center text-gray-800 uppercase tracking-tighter italic text-left">
        <Building2 className="mr-3 text-red-600" size={28} />
        {t('admin_dashboard.clubs.title')}
      </h2>

      {/* --- PENDING CLUBS SECTION (MAX 5 PER PAGE) --- */}
      {pendingClubs.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xs font-black text-yellow-600 mb-4 flex items-center uppercase tracking-[0.2em]">
            <AlertTriangle className="mr-2" size={16} />
            {t('admin_dashboard.clubs.pending_title')} ({pendingClubs.length})
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {currentPendingClubs.map(club => (
              <div
                key={club.id}
                onClick={() => navigate(`/clubs/${club.id}`)}
                className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border-2 border-yellow-100 rounded-[2rem] shadow-sm hover:shadow-lg transition-all gap-4 cursor-pointer"
              >
                <div className="flex items-center space-x-5">
                  <img src={club.image_url || 'https://via.placeholder.com/80'} className="w-16 h-16 rounded-2xl object-cover shadow-inner" alt="Club Logo" />
                  <div className="text-left">
                    <div className="font-black text-gray-900 uppercase text-lg tracking-tight">{club.name}</div>
                    <div className="text-[10px] text-yellow-600 font-black tracking-widest uppercase">{t('admin_dashboard.clubs.status_new')}</div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApproveClub(club.id); }}
                    className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition shadow-lg active:scale-95"
                  >
                    <CheckCircle size={16} className="mr-2" /> {t('admin_dashboard.clubs.btn_approve')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClub(club.id); }}
                    className="flex items-center px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 hover:text-white transition active:scale-95"
                  >
                    <Trash2 size={16} className="mr-2" /> {t('admin_dashboard.clubs.btn_reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination Controls for Pending */}
          <PaginationControls
            currentPage={pendingPage}
            totalPages={totalPendingPages}
            onPageChange={setPendingPage}
            t={t}
          />
        </div>
      )}

      {/* --- ACTIVE CLUBS SECTION (MAX 20 PER PAGE) --- */}
      <div>
        <h3 className="text-xs font-black text-emerald-600 mb-4 flex items-center uppercase tracking-[0.2em]">
          <ShieldCheck className="mr-2" size={16} />
          {t('admin_dashboard.clubs.active_title')} ({activeClubs.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentActiveClubs.map(club => (
            <div
              key={club.id}
              onClick={() => navigate(`/clubs/${club.id}`)}
              className="flex items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-[2rem] hover:bg-white hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <img src={club.image_url || 'https://via.placeholder.com/60'} className="w-12 h-12 rounded-xl object-cover" alt="Logo" />
                <div className="text-left">
                  <div className="font-black text-gray-900 uppercase text-sm tracking-tight">{club.name}</div>
                  <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{t('admin_dashboard.clubs.status_registered')}</div>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteClub(club.id); }}
                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title={t('admin_dashboard.clubs.btn_delete_tooltip')}
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
        {/* Pagination Controls for Active */}
        <PaginationControls
          currentPage={activePage}
          totalPages={totalActivePages}
          onPageChange={setActivePage}
          t={t}
        />
      </div>
    </div>
  );
}

function AnnounceTab({ t }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.warning(t('admin_dashboard.announce.toast_warning_empty')); return; }
    if (!window.confirm(t('admin_dashboard.announce.confirm_send'))) return;
    setSending(true);
    try {
      await api.post('/admin/announce', { message });
      toast.success(t('admin_dashboard.announce.toast_success'));
      setMessage('');
    } catch (err) {
      toast.error(t('admin_dashboard.announce.toast_error'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="text-left">
      <h2 className="text-2xl font-black mb-8 flex items-center text-gray-800 uppercase tracking-tighter italic">
        <Megaphone className="mr-3 text-red-600" size={28} />
        {t('admin_dashboard.announce.title')}
      </h2>
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-100 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex items-start mb-6 text-left">
          <AlertTriangle className="text-red-500 mr-4 mt-1 shrink-0" size={24} />
          <div className="text-left">
            <p className="text-sm text-red-700 font-black uppercase tracking-tight mb-1 text-left">{t('admin_dashboard.announce.protocol_title')}</p>
            <p className="text-xs text-red-600 font-bold leading-relaxed text-left">
              {t('admin_dashboard.announce.protocol_desc')}
            </p>
          </div>
        </div>
        <textarea
          className="w-full p-6 border-2 border-white rounded-[2rem] outline-none focus:border-red-500 resize-none bg-white/80 transition-all font-bold text-gray-700 shadow-inner"
          rows="6"
          placeholder={t('admin_dashboard.announce.placeholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="mt-6 w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-5 rounded-[1.5rem] font-black text-xl uppercase tracking-tighter hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {sending ? <Loader2 className="animate-spin" size={24} /> : <><Megaphone size={24} /> {t('admin_dashboard.announce.btn_publish')}</>}
        </button>
      </div>
    </div>
  );
}