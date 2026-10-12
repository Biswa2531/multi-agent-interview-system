import { useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThemeContext } from '../context/ThemeContext'
import ThemeToggle from './ThemeToggle'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useContext(ThemeContext)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  const userStr = localStorage.getItem('user')
  const userName = userStr ? JSON.parse(userStr).name : 'Candidate'
  const profilePic = localStorage.getItem('profilePic')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  // Don't show navbar on login/signup pages
  if (location.pathname === '/' || location.pathname === '/signup') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo & System Status */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                Multi-Agent Interview
              </h1>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                ● SYSTEM V2.4 ACTIVE
              </span>
            </div>
          </div>

          {/* Right Side: Theme Toggle & Profile */}
          <div className="flex items-center gap-4">
            {/* 3-Way Theme Toggle */}
            <ThemeToggle />

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-full glass-button-secondary hover:bg-white/30 dark:hover:bg-slate-700/50 transition-all"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm border-2 border-white/20 shadow-sm">
                  {profilePic ? (
                    <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    userName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-200">{userName}</span>
                <svg className="w-4 h-4 text-slate-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-2xl py-2 z-50 border border-white/20 dark:border-slate-700/50">
                  <button onClick={() => { navigate('/dashboard'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors">
                    Dashboard
                  </button>
                  <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white/20 dark:hover:bg-slate-700/50 transition-colors">
                    Profile Settings
                  </button>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar