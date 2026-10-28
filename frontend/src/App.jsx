import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'

import Login from './pages/Login'
import Signup from './pages/Signup'
import VerifyOTP from './pages/VerifyOTP' // <-- NEW: Imported for 2-Step Verification
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Feedback from './pages/Feedback'
import Profile from './pages/Profile'

function App() {
  return (
    <Router>
      {/* Navbar is rendered globally, but it hides itself on Login/Signup pages */}
      <Navbar />
      
      {/* Global Toast Notifications */}
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
        }} 
      />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* NEW: Route for the 2-Step OTP Verification Page */}
        <Route path="/verify-otp" element={<VerifyOTP />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  )
}

export default App