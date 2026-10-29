import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || localStorage.getItem('login_email')
  
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please login again.')
      navigate('/login')
    }
  }, [email, navigate])

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP')
    
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/verify-login-otp', { email, otp })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.removeItem('login_email')
      toast.success('Login successful!')
      
      // --- SMART REDIRECTION BASED ON ROLE ---
      const userRole = res.data.user.role;
      if (userRole === 'admin') {
        navigate('/admin/dashboard')
      } else {
        navigate('/dashboard')
      }
      // ---------------------------------------
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-bg-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-bg-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Two-Step Verification</h1>
            <p className="text-slate-600 dark:text-slate-400">Enter the 6-digit OTP sent to <br/> <span className="font-bold text-cyan-500">{email}</span></p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
              placeholder="0 0 0 0 0 0" 
              maxLength="6"
              className="glass-input w-full px-4 py-4 rounded-lg text-2xl text-center tracking-[0.5em] font-mono font-bold"
              autoFocus
            />
            <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-slate-400">← Back to Login</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP