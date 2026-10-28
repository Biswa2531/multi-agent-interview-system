import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/login', { email, password })
      toast.success(res.data.message)
      localStorage.setItem('login_email', email)
      navigate('/verify-otp', { state: { type: 'login', email } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-slate-600 dark:text-slate-400">Sign in to continue your interview journey</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input w-full px-4 py-3 rounded-lg text-sm" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input w-full px-4 py-3 rounded-lg text-sm" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button onClick={() => setIsForgotModalOpen(true)} className="text-sm text-cyan-500 hover:text-cyan-400 font-medium transition-colors">
              Forgot Password?
            </button>
          </div>

          <div className="text-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-500 hover:text-cyan-400 font-bold">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  )
}

export default Login