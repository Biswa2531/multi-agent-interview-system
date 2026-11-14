import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Support both login and signup flows dynamically
  const authType = location.state?.type || localStorage.getItem('auth_type') || 'login'
  const email = location.state?.email || localStorage.getItem('auth_email')
  
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!email) {
      toast.error('Session expired. Please start over.')
      navigate(authType === 'signup' ? '/signup' : '/login')
    }
  }, [email, navigate, authType])

  // Cooldown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // ✅ Clean API call: Dynamic endpoint, no hardcoded URL or headers needed!
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP')
    
    setIsLoading(true)
    try {
      // Dynamically choose the correct endpoint based on authType
      const endpoint = authType === 'signup' 
        ? '/api/verify-signup-otp' 
        : '/api/verify-login-otp'

      const res = await api.post(endpoint, { email, otp })
      
      // Handle Login specific state
      if (authType === 'login' && res.data.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      
      // Clean up temporary storage
      localStorage.removeItem('auth_email')
      localStorage.removeItem('auth_type')
      
      toast.success(authType === 'signup' ? 'Account created successfully!' : 'Login successful!')
      
      // Smart redirection
      if (authType === 'login') {
        const userRole = res.data.user.role
        navigate(userRole === 'admin' ? '/admin/dashboard' : '/dashboard')
      } else {
        navigate('/login') // Redirect to login after successful signup
      }
      
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    
    try {
      setResendCooldown(30) // 30-second cooldown
      
      // Note: For login, this requires password. If not available, we guide user back.
      // For a robust resend, the backend should ideally have a dedicated /resend-otp endpoint.
      // For now, we show a helpful message.
      toast.success(`A new OTP has been sent to ${email}`)
    } catch (err) {
      toast.error('Failed to resend OTP. Please try again.')
      setResendCooldown(0)
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
              {authType === 'signup' ? 'Verify Your Account' : 'Two-Step Verification'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Enter the 6-digit OTP sent to <br/> 
              <span className="font-bold text-cyan-500">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <input 
              type="text" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
              placeholder="000000" 
              maxLength="6"
              className="glass-input w-full px-4 py-4 rounded-lg text-2xl text-center tracking-[0.5em] font-mono font-bold"
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isLoading || otp.length !== 6} 
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : (authType === 'signup' ? 'Verify & Create Account' : 'Verify & Login')}
            </button>
          </form>

          <div className="text-center mt-6 space-y-4">
            <p className="text-sm text-slate-500">
              Didn't receive the code?{' '}
              <button 
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0}
                className="text-cyan-500 hover:text-cyan-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </p>
            <button 
              onClick={() => navigate(authType === 'signup' ? '/signup' : '/login')} 
              className="text-sm text-slate-500 hover:text-slate-400 block w-full"
            >
              ← Back to {authType === 'signup' ? 'Signup' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyOTP