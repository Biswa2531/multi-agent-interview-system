import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function AdminInterviews() {
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [overrideModal, setOverrideModal] = useState(null)
  const [newTechScore, setNewTechScore] = useState(0)
  const [newBehavScore, setNewBehavScore] = useState(0)
  const [overrideReason, setOverrideReason] = useState('')

  useEffect(() => { fetchInterviews() }, [])

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/admin/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setInterviews(res.data.data)
    } catch (err) {
      toast.error('Failed to load interviews')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOverride = async (sessionId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://127.0.0.1:5000/api/admin/interviews/${sessionId}/override-score`, {
        technical_score: newTechScore,
        behavioral_score: newBehavScore,
        reason: overrideReason
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Scores overridden successfully!')
      setOverrideModal(null)
      fetchInterviews()
    } catch (err) {
      toast.error('Failed to override scores')
    }
  }

  const openOverrideModal = (interview) => {
    setOverrideModal(interview)
    setNewTechScore(interview.technical_score || 0)
    setNewBehavScore(interview.behavioral_score || 0)
    setOverrideReason('')
  }

  const filteredInterviews = interviews.filter(interview => {
    const matchesRole = filterRole === 'all' || interview.job_role === filterRole
    const matchesStatus = filterStatus === 'all' || interview.status === filterStatus
    const matchesSearch = interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          interview.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          interview.job_role.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesStatus && matchesSearch
  })

  const uniqueRoles = [...new Set(interviews.map(i => i.job_role))]

  if (isLoading) return <div className="text-cyan-500 text-xl animate-pulse">Loading interviews...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Interviews Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage all candidate interviews</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input px-4 py-2 text-sm flex-1 min-w-[250px]"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="glass-input px-4 py-2 text-sm bg-slate-900/50"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-input px-4 py-2 text-sm bg-slate-900/50"
        >
          <option value="all">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Interviews Table */}
      <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Candidate</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Role</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Tech Score</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Behav Score</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500">No interviews found</td>
                </tr>
              ) : (
                filteredInterviews.map((interview) => (
                  <tr key={interview.session_id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{interview.candidate_name}</p>
                        <p className="text-xs text-slate-500">{interview.candidate_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{interview.job_role}</td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{interview.started_at}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        interview.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}>
                        {interview.status.toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-purple-500">
                      {interview.technical_score !== null ? `${interview.technical_score}/10` : '—'}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-emerald-500">
                      {interview.behavioral_score !== null ? `${interview.behavioral_score}/10` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {interview.status === 'completed' && (
                        <button
                          onClick={() => openOverrideModal(interview)}
                          className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium border border-amber-200 dark:border-amber-800"
                        >
                          Override Score
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 max-w-md w-full bg-slate-900/90 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Override AI Scores</h3>
            <p className="text-sm text-slate-400 mb-4">
              Candidate: <span className="text-cyan-400 font-medium">{overrideModal.candidate_name}</span>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Technical Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={newTechScore}
                  onChange={(e) => setNewTechScore(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Behavioral Score (0-10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={newBehavScore}
                  onChange={(e) => setNewBehavScore(e.target.value)}
                  className="glass-input w-full px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Reason for Override</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Candidate showed exceptional problem-solving..."
                  rows="3"
                  className="glass-input w-full px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setOverrideModal(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleOverride(overrideModal.session_id)}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-2 rounded-lg transition-all"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInterviews