import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (user.role !== 'admin') {
      toast.error('Access Denied')
      navigate('/dashboard')
      return
    }
    fetchAdminStats()
  }, [])

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/admin/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setStats(res.data.data)
    } catch (err) { 
      toast.error('Failed to load admin data') 
    } finally { 
      setIsLoading(false) 
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-cyan-500 text-xl animate-pulse">Loading Admin Panel...</div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      {/* FIXED: Added pt-24 to push content below Navbar */}
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Admin Control Panel</h1>
          <p className="text-slate-600 dark:text-slate-400">System-wide overview and management</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Registered Candidates</div>
              <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{stats.total_users}</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Interviews Conducted</div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.total_interviews}</div>
            </div>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">⚙️ Management Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/admin/users')}
              className="flex items-center justify-center p-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg"
            >
              <span className="text-xl mr-3">👥</span> Manage Candidates & Users
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center p-6 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
            >
              <span className="text-xl mr-3"></span> My Admin Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard