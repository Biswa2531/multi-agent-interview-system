import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function Feedback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [interviews, setInterviews] = useState([])
  const [selectedInterview, setSelectedInterview] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/') }
    fetchInterviews(token)
  }, [navigate])

  const fetchInterviews = async (token) => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setInterviews(response.data.data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const handleViewDetails = (interview) => {
    setSelectedInterview(interview)
  }

  const handleExportPDF = async (sessionId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://127.0.0.1:5000/api/interview/${sessionId}/report`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `interview_report_${sessionId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF report downloaded!')
    } catch (error) {
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-bg-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-bg-2"></div>
      </div>

      <div className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Feedback <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">Reports</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">View your interview history and detailed evaluation reports.</p>
          </div>

          {/* Interview History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((interview) => (
              <div key={interview.session_id} className="glass-card rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-300">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{interview.job_role}</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1"> {interview.started_at}</p>
                </div>

                <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Technical</p>
                    <p className={`text-xl font-bold ${interview.technical_score >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {interview.technical_score !== null ? `${interview.technical_score}/10` : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Behavioral</p>
                    <p className={`text-xl font-bold ${interview.behavioral_score >= 7 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {interview.behavioral_score !== null ? `${interview.behavioral_score}/10` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(interview)}
                    className="flex-1 glass-button-secondary py-2 text-xs font-semibold"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => handleExportPDF(interview.session_id)}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white py-2 rounded-lg text-xs font-bold transition-all"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Report Modal */}
          {selectedInterview && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedInterview(null)}>
              <div className="glass-card rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedInterview.job_role}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedInterview.started_at}</p>
                  </div>
                  <button onClick={() => setSelectedInterview(null)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Technical Score</h3>
                    <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{selectedInterview.technical_score || 'N/A'}/10</p>
                  </div>

                  <div className="glass-card rounded-xl p-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Behavioral Score</h3>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{selectedInterview.behavioral_score || 'N/A'}/10</p>
                  </div>

                  {selectedInterview.feedback && (
                    <div className="glass-card rounded-xl p-4">
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">AI Feedback</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">{selectedInterview.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => handleExportPDF(selectedInterview.session_id)}
                    className="flex-1 glass-button py-3"
                  >
                    Export Full Report
                  </button>
                  <button 
                    onClick={() => setSelectedInterview(null)}
                    className="flex-1 glass-button-secondary py-3"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Feedback