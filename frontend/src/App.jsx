import React from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';

// Sayfa importları
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Clubs from './pages/Clubs';
import ClubProfile from './pages/ClubProfile'; 
import EventDetail from './pages/EventDetail';
import Profile from './pages/Profile';
import Discover from './pages/Discover'; // YENİ EKLENDİ
import ClubDashboard from './pages/ClubDashboard';
import CreateEvent from './pages/CreateEvent';
import EventEdit from './pages/EventEdit';
import AdminDashboard from './pages/AdminDashboard';
import ClubMembers from './pages/ClubMembers';
import CreateClubRequest from './pages/CreateClubRequest';

// Rota Koruma Bileşeni
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.role)) return <Navigate to="/" />;
  }
  
  return children;
};

// Genel Sayfa Düzeni (Navbar içeren)
const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="pt-4">
        {children}
      </div>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans">
            <Routes>
              {/* --- 1. AUTH ROTALARI --- */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* --- 2. GENEL ROTALAR --- */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/clubs" element={<Layout><Clubs /></Layout>} />
              <Route path="/clubs/:clubId" element={<Layout><ClubProfile /></Layout>} />
              <Route path="/events/:id" element={<Layout><EventDetail /></Layout>} />
              
              {/* --- 3. KORUMALI ROTALAR (Keşfet ve Profiller) --- */}
              <Route path="/discover" element={
                <ProtectedRoute>
                  <Layout><Discover /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <Layout><Profile /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/create-club-request" element={
                <ProtectedRoute>
                  <Layout><CreateClubRequest /></Layout>
                </ProtectedRoute>
              } />

              {/* --- 4. YÖNETİM ROTALARI --- */}
              <Route path="/events/edit/:id" element={
                <ProtectedRoute allowedRole={['admin', 'club_admin']}>
                  <Layout><EventEdit /></Layout>
                </ProtectedRoute>
              } />

              {/* --- 5. KULÜP YÖNETİMİ ROTALARI --- */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRole="club_admin">
                  <Layout><ClubDashboard /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/club/:clubId/create-event" element={
                <ProtectedRoute allowedRole="club_admin">
                  <Layout><CreateEvent /></Layout>
                </ProtectedRoute>
              } />
              <Route path="/club/:clubId/members" element={
                <ProtectedRoute allowedRole="club_admin">
                  <Layout><ClubMembers /></Layout>
                </ProtectedRoute>
              } />
              
              {/* --- 6. ADMIN YÖNETİM ROTALARI --- */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRole="admin">
                  <Layout><AdminDashboard /></Layout>
                </ProtectedRoute>
              } />

              <Route path="/admin/:tab" element={
                <ProtectedRoute allowedRole="admin">
                  <Layout><AdminDashboard /></Layout>
                </ProtectedRoute>
              } />

              {/* --- 7. HATA ROTALARI --- */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;