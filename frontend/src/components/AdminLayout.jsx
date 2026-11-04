import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import StarryBackground from './StarryBackground'

function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')) || {}

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/users', label: 'Candidates', icon: '👥' },
    { path: '/admin/interviews', label: 'Interviews', icon: '🎙️' },
    { path: '/admin/proctoring', label: 'Proctoring', icon: '👁️' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 flex">
      <StarryBackground />
      
      {/* Glassmorphic Sidebar */}
      <aside className="w-64 glass-card border-r border-white/20 dark:border-slate-700/50 flex flex-col fixed h-full z-20 bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl">
        <div className="p-6 border-b border-white/20 dark:border-slate-700/50">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🤖</span> Admin Panel
          </h1>
          <p className="text-[10px] font-mono text-emerald-500 mt-1 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full w-fit border border-emerald-200 dark:border-emerald-800">
            ● SYSTEM V2.4 ACTIVE
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/20 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 py-2 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-800">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 relative z-10 min-h-screen">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default AdminLayout