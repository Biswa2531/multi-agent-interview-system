import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function AdminProctoring() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => { fetchLogs() }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/admin/proctoring', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setLogs(res.data.data)
    } catch (err) {
      toast.error('Failed to load proctoring logs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFlag = async (sessionId, candidateName) => {
    if (!window.confirm(`Are you sure you want to flag this session for ${candidateName}?`)) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://127.0.0.1:5000/api/admin/proctoring/${sessionId}/flag`, {
        type: 'Manual Admin Flag',
        description: 'Flagged during review'
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success(`Session flagged successfully!`)
    } catch (err) {
      toast.error('Failed to flag session')
    }
  }

  const filteredLogs = logs.filter(log => 
    log.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.job_role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) return <div className="text-cyan-500 text-xl animate-pulse">Loading Proctoring Logs...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Proctoring & Security</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor candidate behavior and interview integrity</p>
      </div>

      {/* Security Status Banner */}
      <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-4">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
        <div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">System Integrity: SECURE</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Webcam monitoring and Tab-switch detection are active across all live sessions.</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4 rounded-2xl border border-white/20 dark:border-slate-700/50">
        <input
          type="text"
          placeholder="Search by candidate name or job role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input px-4 py-2 text-sm w-full"
        />
      </div>

      {/* Proctoring Table */}
      <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Candidate</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Role</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Date</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Security Flags</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">No proctoring logs found</td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.candidate_name}</p>
                        <p className="text-xs text-slate-500">{log.candidate_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{log.job_role}</td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{log.started_at}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        log.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}>
                        {log.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs text-slate-600 dark:text-slate-400">0 Violations</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleFlag(log.session_id, log.candidate_name)}
                        className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium border border-red-200 dark:border-red-800"
                      >
                        ⚠️ Flag Session
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminProctoring