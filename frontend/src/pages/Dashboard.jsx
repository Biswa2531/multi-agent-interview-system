import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StarryBackground from '../components/StarryBackground'

function Dashboard() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const [stats, setStats] = useState({
    total_interviews: 0,
    average_technical_score: 0,
    average_behavioral_score: 0,
    interview_history: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  // ✅ No more token header, no more hardcoded URL
  const fetchStats = async () => {
    try {
      const res = await api.get('/api/user/stats')
      setStats(res.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  // ✅ Clean DELETE call
  const handleDeleteInterview = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this interview record?')) return
    try {
      await api.delete(`/api/interview/${sessionId}`)
      toast.success('Interview deleted successfully')
      fetchStats()
    } catch (err) {
      toast.error('Failed to delete interview')
    }
  }

  const handleStartInterview = () => {
    navigate('/interview')
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-cyan-500 text-xl animate-pulse">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24 max-w-7xl">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome back, {user.name}!</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your interview progress and performance analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Interviews</p>
            <p className="text-3xl font-bold text-cyan-500">{stats.total_interviews}</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg. Technical Score</p>
            <p className="text-3xl font-bold text-purple-500">{stats.average_technical_score}/10</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Avg. Behavioral Score</p>
            <p className="text-3xl font-bold text-emerald-500">{stats.average_behavioral_score}/10</p>
          </div>
        </div>

        {/* Progress Chart */}
        {stats.interview_history.length > 0 && (
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Performance Progress</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.interview_history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="interview_number" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 10]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="technical_score" stroke="#a855f7" strokeWidth={2} name="Technical" />
                  <Line type="monotone" dataKey="behavioral_score" stroke="#10b981" strokeWidth={2} name="Behavioral" />
                  <Line type="monotone" dataKey="average_score" stroke="#06b6d4" strokeWidth={2} name="Average" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Interview History */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">📋 Interview History</h2>
          
          {stats.interview_history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400 mb-4">No interviews yet. Start your first interview!</p>
              <button onClick={handleStartInterview} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-3 rounded-lg transition-all">
                Start Interview
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Job Role</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Tech Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Behav Score</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.interview_history.map((session) => (
                    <tr key={session.session_id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-4 text-sm text-slate-800 dark:text-slate-200 font-medium">{session.job_role}</td>
                      <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{session.date}</td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-bold px-3 py-1 rounded-full border bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                          COMPLETED
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-bold text-purple-500">{session.technical_score}/10</td>
                      <td className="py-4 px-4 text-sm font-bold text-emerald-500">{session.behavioral_score}/10</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => navigate(`/feedback/${session.session_id}`)} 
                            className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors font-medium"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleDeleteInterview(session.session_id)} 
                            className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Dashboard