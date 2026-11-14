import { useState, useEffect } from 'react'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const COLORS = ['#06b6d4', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchMetrics() }, [])

  // ✅ Clean GET call: No URL, no headers needed!
  const fetchMetrics = async () => {
    try {
      const res = await api.get('/api/admin/metrics')
      setMetrics(res.data.data)
    } catch (err) {
      toast.error('Failed to load admin metrics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="text-cyan-500 text-xl animate-pulse">Loading Admin Dashboard...</div>
  if (!metrics) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Control Panel</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">System-wide overview and management</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Registered Candidates</p>
          <p className="text-3xl font-bold text-cyan-500 mt-2">{metrics.total_candidates}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Interviews Conducted</p>
          <p className="text-3xl font-bold text-purple-500 mt-2">{metrics.total_interviews}</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Technical Score</p>
          <p className="text-3xl font-bold text-emerald-500 mt-2">{metrics.avg_tech_score}/10</p>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Behavioral Score</p>
          <p className="text-3xl font-bold text-amber-500 mt-2">{metrics.avg_behav_score}/10</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart: Interview Volume */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Interview Volume (Last 30 Days)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.volume_chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Job Role Distribution */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Job Role Distribution</h2>
          <div className="h-64 w-full">
            {metrics.role_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.role_chart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {metrics.role_chart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">No interview data available yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard