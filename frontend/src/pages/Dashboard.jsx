import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import StarryBackground from '../components/StarryBackground'

function Dashboard() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }
    if (user.role === 'admin') { navigate('/admin/dashboard'); return }
    fetchInterviews()
    fetchUserStats()
  }, [])

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/interviews', { headers: { 'Authorization': `Bearer ${token}` } })
      setInterviews(res.data.data || [])
    } catch (err) { toast.error('Failed to load interviews') }
  }

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/user/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      setStats(res.data)
    } catch (err) { console.error('Stats error:', err) } 
    finally { setIsLoading(false) }
  }

  const handleDeleteInterview = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this interview?')) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://127.0.0.1:5000/api/interview/${sessionId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      toast.success('Interview deleted successfully')
      fetchInterviews(); fetchUserStats()
    } catch (err) { toast.error('Failed to delete interview') }
  }

  const getStatusBadge = (status) => {
    const badges = {
      'completed': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      'in_progress': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'
    }
    return badges[status] || badges['in_progress']
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-cyan-500 text-xl animate-pulse">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      {/* FIXED: Added pt-24 to push content below Navbar */}
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24">
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-2">Welcome back, {user.name || 'Candidate'}!</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your interview progress and performance analytics</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Total Interviews</div>
              <div className="text-4xl font-bold text-cyan-600 dark:text-cyan-400">{stats.total_interviews}</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Avg Technical Score</div>
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.average_technical_score}/10</div>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Avg Behavioral Score</div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats.average_behavioral_score}/10</div>
            </div>
          </div>
        )}

        {stats && stats.interview_history && stats.interview_history.length > 0 ? (
          <div className="glass-card rounded-2xl p-6 mb-8 border border-white/20 dark:border-slate-700/50">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">📈 Performance Trends</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.interview_history} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                  <XAxis dataKey="interview_number" stroke="rgb(148, 163, 184)" label={{ value: 'Interview #', position: 'insideBottom', offset: -5, fill: 'rgb(148, 163, 184)' }} />
                  <YAxis stroke="rgb(148, 163, 184)" domain={[0, 10]} label={{ value: 'Score (out of 10)', angle: -90, position: 'insideLeft', fill: 'rgb(148, 163, 184)' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(148, 163, 184, 0.3)', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="technical_score" stroke="#06b6d4" strokeWidth={3} name="Technical Score" dot={{ fill: '#06b6d4', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="behavioral_score" stroke="#a855f7" strokeWidth={3} name="Behavioral Score" dot={{ fill: '#a855f7', strokeWidth: 2, r: 6 }} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="average_score" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" name="Average Score" dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 mb-8 border border-white/20 dark:border-slate-700/50 text-center">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No Performance Data Yet</h2>
            <p className="text-slate-600 dark:text-slate-400">Complete your first interview to start tracking your progress!</p>
          </div>
        )}

        <div className="glass-card rounded-2xl p-6 border border-white/20 dark:border-slate-700/50">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">📋 Interview History</h2>
          
          {interviews.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-600 dark:text-slate-400 mb-4">No interviews yet. Start your first interview!</p>
              <button onClick={() => navigate('/interview')} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all">Start Interview</button>
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
                  {interviews.map((interview) => (
                    <tr key={interview.session_id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-800 dark:text-slate-200">{interview.job_role}</td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">{interview.started_at}</td>
                      <td className="py-3 px-4"><span className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusBadge(interview.status)}`}>{interview.status.toUpperCase()}</span></td>
                      <td className="py-3 px-4 text-sm">{interview.technical_score ? <span className="text-purple-600 dark:text-purple-400 font-bold">{interview.technical_score}/10</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="py-3 px-4 text-sm">{interview.behavioral_score ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">{interview.behavioral_score}/10</span> : <span className="text-slate-400">-</span>}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {interview.status === 'completed' && <button onClick={() => navigate('/feedback', { state: { sessionId: interview.session_id } })} className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-3 py-1 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors">View</button>}
                          <button onClick={() => handleDeleteInterview(interview.session_id)} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Delete</button>
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