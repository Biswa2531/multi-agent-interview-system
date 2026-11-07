import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')) || {}
  
  // 3-Way Theme Logic
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // NEW: Profile Dropdown Logic
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef(null)

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20 dark:border-slate-700/50 px-6 py-3 backdrop-blur-md bg-white/30 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo & System Status Badge */}
        <div className="flex items-center gap-4">
          <Link to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🤖</span> AI Interview
          </Link>
          {/* NEW: System Status Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">MULTI-AGENT V2.4 ACTIVE</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          
          {/* Role-Based Links */}
          {user.role === 'admin' ? (
            <>
              <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Dashboard</Link>
              <Link to="/admin/users" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Candidates</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Dashboard</Link>
              <Link to="/interview" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Interview</Link>
            </>
          )}
          
          {/* Theme Toggle */}
          <div className="relative">
            <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="p-2 rounded-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-white/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </button>
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                <button onClick={() => { setTheme('light'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'light' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>☀ Light</button>
                <button onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'dark' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>🌙 Dark</button>
                <button onClick={() => { setTheme('system'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'system' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>🖥 System</button>
              </div>
            )}
          </div>

          {/* NEW: User Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setProfileMenuOpen(!profileMenuOpen)} 
              className="flex items-center gap-2 p-1 pr-3 rounded-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 hover:bg-white/20 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block">{user.name || 'User'}</span>
            </button>
            
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 mb-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                </div>
                <Link 
                  to={user.role === 'admin' ? '/admin/settings' : '/profile'} 
                  onClick={() => setProfileMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  ⚙️ Settings
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-slate-700 dark:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 flex flex-col gap-4 pb-4 border-t border-white/20 dark:border-slate-700/50 pt-4">
          {user.role === 'admin' ? (
            <>
              <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dashboard</Link>
              <Link to="/admin/users" className="text-sm font-medium text-slate-700 dark:text-slate-300">Candidates</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dashboard</Link>
              <Link to="/interview" className="text-sm font-medium text-slate-700 dark:text-slate-300">Interview</Link>
            </>
          )}
          <Link to={user.role === 'admin' ? '/admin/settings' : '/profile'} className="text-sm font-medium text-slate-700 dark:text-slate-300">Settings</Link>
          <button onClick={handleLogout} className="text-sm font-medium text-red-500 text-left">Logout</button>
        </div>
      )}
    </nav>
  )
}

export default Navbar