import { useState, useContext } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'
import ThemeToggle from '../components/ThemeToggle'

function Login() {
  const navigate = useNavigate()
  const { theme } = useContext(ThemeContext)
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLoginRequest = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/login', { email, password })
      toast.success(res.data.message)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally { setIsLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/verify-login-otp', { email, otp })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Login successful! Redirecting...')
      setTimeout(() => navigate('/dashboard'), 1000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
    } finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      
      {/* Floating Theme Toggle for Auth Pages */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* MOVING FLOATING BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/30 dark:bg-cyan-500/20 rounded-full blur-3xl animate-bg-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/30 dark:bg-blue-500/20 rounded-full blur-3xl animate-bg-2"></div>
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-bg-3"></div>
      </div>

      {/* STARRY NIGHT GLOWING EFFECT */}
      <StarryBackground />

      {/* Main Login Card */}
      <div className="w-full max-w-4xl glass-card rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10">
        
        {/* Left Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mb-2">
              {step === 1 ? 'Welcome Back' : 'Verify Identity'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {step === 1 ? 'Enter your credentials to access the sandbox.' : 'Enter the 6-digit code sent to your email.'}
            </p>
          </div>
          
          {step === 1 ? (
            <form onSubmit={handleLoginRequest} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full glass-input px-4 py-3" placeholder="candidate@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full glass-input px-4 py-3" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full glass-button py-3 text-base flex items-center justify-center gap-2">
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">6-Digit OTP</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required className="w-full glass-input px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000" />
              </div>
              <button type="submit" disabled={isLoading} className="w-full glass-button py-3 text-base flex items-center justify-center gap-2">
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Verify & Login'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-cyan-600 dark:text-cyan-400 hover:underline mt-2">← Back to Login</button>
            </form>
          )}
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-8">Need an account? <Link to="/signup" className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">Sign up here</Link></p>
        </div>

        {/* Right Side: Visual */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-cyan-600 to-blue-700 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-2xl font-bold mb-3">Secure Multi-Agent System</h3>
            <p className="text-cyan-100 text-sm leading-relaxed mb-6">Powered by advanced RAG vector ingestion and real-time cognitive evaluation. Your data is encrypted and processed locally.</p>
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-mono border border-white/30">LangChain</span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-mono border border-white/30">ChromaDB</span>
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-mono border border-white/30">Groq</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login