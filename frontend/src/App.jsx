import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import AdminLayout from './components/AdminLayout'

// Security Wrapper
import ProtectedRoute from './components/ProtectedRoute'

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
import AdminInterviews from './pages/AdminInterviews'
import AdminProctoring from './pages/AdminProctoring'
import AdminSettings from './pages/AdminSettings'

function Layout() {
  const location = useLocation()
  const hideNavbar = ['/login', '/signup', '/verify-otp'].includes(location.pathname)
  const isAdminRoute = location.pathname.startsWith('/admin')
  
  return (
    <>
      {!hideNavbar && !isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        {/* ✅ Task 12: Protected Candidate Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
        <Route path="/feedback/:id" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* ✅ Task 12: Protected Admin Routes (adminOnly) */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="interviews" element={<AdminInterviews />} />
          <Route path="proctoring" element={<AdminProctoring />} /> 
          <Route path="settings" element={<AdminSettings />} /> 
          {/* ✅ Task 13: Removed the duplicate "Coming Soon" settings route */}
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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