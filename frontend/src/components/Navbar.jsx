import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')) || {}
  
  // 3-Way Theme Logic
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20 dark:border-slate-700/50 px-6 py-4 backdrop-blur-md bg-white/30 dark:bg-slate-900/30">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        
        {/* Logo */}
        <Link to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span> AI Interview
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          
          {/* Role-Based Links */}
          {user.role === 'admin' ? (
            <>
              <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Dashboard</Link>
              <Link to="/admin/users" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Manage Users</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Dashboard</Link>
              <Link to="/interview" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Interview</Link>
              <Link to="/profile" className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-500 transition-colors">Profile</Link>
            </>
          )}
          
          {/* Theme Toggle */}
          <div className="relative">
            <button onClick={() => setThemeMenuOpen(!themeMenuOpen)} className="p-2 rounded-full bg-white/10 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700 text-slate-700 dark:text-white hover:bg-white/20 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </button>
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1">
                <button onClick={() => { setTheme('light'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'light' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>☀ Light</button>
                <button onClick={() => { setTheme('dark'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'dark' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>🌙 Dark</button>
                <button onClick={() => { setTheme('system'); setThemeMenuOpen(false); }} className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700 ${theme === 'system' ? 'text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>🖥 System</button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800">Logout</button>
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
              <Link to="/admin/users" className="text-sm font-medium text-slate-700 dark:text-slate-300">Manage Users</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-700 dark:text-slate-300">Dashboard</Link>
              <Link to="/interview" className="text-sm font-medium text-slate-700 dark:text-slate-300">Interview</Link>
              <Link to="/profile" className="text-sm font-medium text-slate-700 dark:text-slate-300">Profile</Link>
            </>
          )}
          <button onClick={handleLogout} className="text-sm font-medium text-red-500 text-left">Logout</button>
        </div>
      )}
    </nav>
  )
}

export default Navbar