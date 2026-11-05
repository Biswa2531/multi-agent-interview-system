import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'

// Auth Pages
import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOTP from './pages/VerifyOTP'

// Candidate Pages
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Feedback from './pages/Feedback'
import Profile from './pages/Profile'

// Admin Pages
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminInterviews from './pages/AdminInterviews' // NEW

function Layout() {
  const location = useLocation()
  const hideNavbar = ['/login', '/signup', '/verify-otp'].includes(location.pathname)
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  return (
    <>
      {!hideNavbar && !isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/feedback/:id" element={<Feedback />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Admin Routes wrapped in AdminLayout */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="interviews" element={<AdminInterviews />} /> {/* UPDATED */}
          <Route path="proctoring" element={<div className="text-slate-800 dark:text-white text-xl font-bold">Proctoring Module (Coming Soon)</div>} />
          <Route path="settings" element={<div className="text-slate-800 dark:text-white text-xl font-bold">Settings Module (Coming Soon)</div>} />
        </Route>
      </Routes>
    </>
  )
}

function App() {
  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Layout />
    </Router>
  )
}

export default App