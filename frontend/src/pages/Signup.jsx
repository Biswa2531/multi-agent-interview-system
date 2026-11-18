import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 3-Way Theme Logic
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = (currentTheme) => {
      if (currentTheme === 'dark') root.classList.add('dark')
      else if (currentTheme === 'light') root.classList.remove('dark')
      else { if (mediaQuery.matches) root.classList.add('dark'); else root.classList.remove('dark') }
      localStorage.setItem('theme', currentTheme)
    }
    applyTheme(theme)
    const handleChange = () => { if (theme === 'system') applyTheme('system') }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // ✅ Clean API call: No URL, no headers needed!
  const handleSignup = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) return toast.error('Please fill in all fields')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    
    setIsLoading(true)
    try {
      const res = await api.post('/api/signup', { name, email, password })
      toast.success(res.data.message)
      localStorage.setItem('login_email', email)
      navigate('/verify-otp', { state: { type: 'signup', email } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      
      {/* Floating Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="p-2.5 rounded-full bg-white/10 dark:bg-slate-800/50 backdrop-blur-md border border-white/20 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-white/20 transition-all shadow-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </button>
        {themeMenuOpen && (
          <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1">
            <button onClick={() => { setTheme('light'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'light' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}><span className="text-orange-500">☀</span> Light</button>
            <button onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'dark' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}><span className="text-yellow-400">🌙</span> Dark</button>
            <button onClick={() => { setTheme('system'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'system' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}><span className="text-blue-500">🖥</span> System</button>
          </div>
        )}
      </div>

      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-bg-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-bg-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="glass-card rounded-2xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Create Account</h1>
            <p className="text-slate-600 dark:text-slate-400">Join the Multi-Agent Interview System</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" placeholder="Full Name" />
            </div>

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input w-full pl-10 pr-4 py-3 rounded-lg text-sm" placeholder="Email Address" />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input w-full pl-10 pr-10 py-3 rounded-lg text-sm" placeholder="Password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>

            {/* Solid Dark Button */}
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isLoading ? 'Creating Account...' : 'Get Started'}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Already have an account? <Link to="/login" className="text-cyan-500 hover:text-cyan-400 font-bold">Login here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup