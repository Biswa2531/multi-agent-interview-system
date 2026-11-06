import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function AdminInterviews() {
  const [interviews, setInterviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Deep Dive Modal State
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false)
  const [transcriptData, setTranscriptData] = useState(null)
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false)

  // Override State
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

  const fetchTranscript = async (sessionId) => {
    setIsTranscriptLoading(true)
    setIsTranscriptOpen(true)
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`http://127.0.0.1:5000/api/admin/interviews/${sessionId}/transcript`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setTranscriptData(res.data.data)
      setNewTechScore(res.data.data.technical_score || 0)
      setNewBehavScore(res.data.data.behavioral_score || 0)
      setOverrideReason('')
    } catch (err) {
      toast.error('Failed to load transcript')
    } finally {
      setIsTranscriptLoading(false)
    }
  }

  const handleOverride = async () => {
    if (!transcriptData) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://127.0.0.1:5000/api/admin/interviews/${transcriptData.session_id || transcriptData.candidate_email}/override-score`, {
        technical_score: newTechScore,
        behavioral_score: newBehavScore,
        reason: overrideReason
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Scores overridden successfully!')
      setIsTranscriptOpen(false)
      fetchInterviews()
    } catch (err) {
      toast.error('Failed to override scores')
    }
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
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="glass-input px-4 py-2 text-sm bg-slate-900/50">
          <option value="all">All Roles</option>
          {uniqueRoles.map(role => (<option key={role} value={role}>{role}</option>))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="glass-input px-4 py-2 text-sm bg-slate-900/50">
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
                <tr><td colSpan="7" className="text-center py-12 text-slate-500">No interviews found</td></tr>
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
                      {interview.admin_override && <span className="ml-1 text-[10px] bg-amber-500 text-white px-1 rounded">OVERRIDE</span>}
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-emerald-500">
                      {interview.behavioral_score !== null ? `${interview.behavioral_score}/10` : '—'}
                    </td>
                    <td className="py-4 px-4">
                      {interview.status === 'completed' && (
                        <button
                          onClick={() => fetchTranscript(interview.session_id)}
                          className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors font-medium border border-cyan-200 dark:border-cyan-800"
                        >
                          🔍 View Transcript
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

      {/* Deep-Dive Transcript Modal */}
      {isTranscriptOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 max-w-5xl w-full bg-slate-900/95 shadow-2xl my-8">
            {isTranscriptLoading ? (
              <div className="text-center py-20 text-cyan-500 animate-pulse">Loading Deep-Dive Transcript...</div>
            ) : transcriptData && (
              <>
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      📄 Deep-Dive Transcript
                      {transcriptData.admin_override && <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded-full">ADMIN OVERRIDE APPLIED</span>}
                    </h2>
                    <p className="text-slate-400 mt-1">{transcriptData.candidate_name} ({transcriptData.candidate_email}) - {transcriptData.job_role}</p>
                  </div>
                  <button onClick={() => setIsTranscriptOpen(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Q&A and Logs */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Q&A History */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <h3 className="text-lg font-bold text-cyan-400 mb-3">💬 Full Q&A History</h3>
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {transcriptData.qa_history.map((qa, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="bg-cyan-900/20 border-l-4 border-cyan-500 p-3 rounded-r-lg">
                              <p className="text-xs text-cyan-400 font-bold mb-1">AI INTERVIEWER (Q{idx + 1})</p>
                              <p className="text-sm text-slate-200">{qa.question}</p>
                            </div>
                            <div className="bg-purple-900/20 border-l-4 border-purple-500 p-3 rounded-r-lg ml-4">
                              <p className="text-xs text-purple-400 font-bold mb-1">CANDIDATE RESPONSE</p>
                              <p className="text-sm text-slate-200">{qa.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliberation Stream */}
                    <div className="bg-black/60 rounded-xl p-4 border border-slate-700 font-mono text-xs">
                      <h3 className="text-lg font-bold text-emerald-400 mb-3">🤖 Agent Deliberation Stream</h3>
                      <div className="space-y-1">
                        {transcriptData.deliberation_logs.map((log, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-slate-500">[{log.time}]</span>
                            <span className={`${log.type === 'warning' ? 'text-amber-400' : log.type === 'success' ? 'text-emerald-400' : 'text-cyan-300'}`}>
                              {log.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scores, RAG, Override */}
                  <div className="space-y-6">
                    {/* AI Scoring Breakdown */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <h3 className="text-lg font-bold text-purple-400 mb-3">📊 AI Scoring Breakdown</h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400">Technical</p>
                          <p className="text-2xl font-bold text-purple-500">{transcriptData.technical_score}/10</p>
                        </div>
                        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
                          <p className="text-xs text-slate-400">Behavioral</p>
                          <p className="text-2xl font-bold text-emerald-500">{transcriptData.behavioral_score}/10</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-400"><span className="text-emerald-400 font-bold">Strengths:</span> {transcriptData.strengths}</p>
                        <p className="text-slate-400"><span className="text-red-400 font-bold">Weaknesses:</span> {transcriptData.weaknesses}</p>
                      </div>
                    </div>

                    {/* RAG Context */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                      <h3 className="text-lg font-bold text-amber-400 mb-2">🧠 RAG Context Used</h3>
                      <p className="text-xs text-slate-300 italic bg-black/30 p-2 rounded">{transcriptData.rag_context}</p>
                    </div>

                    {/* Override Grading Form */}
                    <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl p-4 border border-amber-500/30">
                      <h3 className="text-lg font-bold text-amber-400 mb-3">⚡ Override Grading</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Technical Score (0-10)</label>
                          <input type="number" min="0" max="10" value={newTechScore} onChange={(e) => setNewTechScore(e.target.value)} className="glass-input w-full px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Behavioral Score (0-10)</label>
                          <input type="number" min="0" max="10" value={newBehavScore} onChange={(e) => setNewBehavScore(e.target.value)} className="glass-input w-full px-3 py-1.5 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Reason for Override</label>
                          <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows="2" className="glass-input w-full px-3 py-1.5 text-sm" placeholder="e.g. Candidate showed exceptional logic..." />
                        </div>
                        <button onClick={handleOverride} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-2 rounded-lg transition-all text-sm">
                          Apply Override & Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInterviews