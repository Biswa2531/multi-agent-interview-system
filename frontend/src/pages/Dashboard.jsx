import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Dashboard() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [userName, setUserName] = useState('Candidate')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/') }
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try { setUserName(JSON.parse(userStr).name || 'Candidate') } catch(e) {}
    }
    fetchInterviews(token)
  }, [navigate])

  const fetchInterviews = async (token) => {
    try {
      if (!token) token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:5000/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setInterviews(response.data.data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const handleResume = (session) => {
    navigate('/interview', { state: { sessionId: session.session_id } })
  }

  const handleDelete = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this interview record?")) return;
    
    const token = localStorage.getItem('token')
    try {
      await axios.delete(`http://127.0.0.1:5000/api/interview/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success("Interview deleted successfully!")
      fetchInterviews(token)
    } catch (error) {
      toast.error("Failed to delete interview.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back, <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">{userName}</span>!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Ready to ace your next technical evaluation?</p>
          </div>
        </div>

        {/* Start New Interview CTA */}
        <div className="glass-card rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-cyan-500">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Start a New Interview Session</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Initialize a 3-round AI evaluation with real-time RAG context and proctoring.</p>
          </div>
          <button 
            onClick={() => navigate('/interview')} 
            className="glass-button px-8 py-3 text-base whitespace-nowrap shadow-lg shadow-cyan-500/20"
          >
            ➕ Start New Interview
          </button>
        </div>

        {/* Interview History Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Interview History</h2>
          <span className="text-sm font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            {interviews.length} RECORDS FOUND
          </span>
        </div>
        
        {interviews.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-lg">You haven't taken any interviews yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interviews.map((interview) => (
              <div key={interview.session_id} className="glass-card rounded-2xl p-6 relative group hover:scale-[1.02] transition-transform duration-300">
                
                {/* Delete Button */}
                <button 
                  onClick={() => handleDelete(interview.session_id)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete Interview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white pr-8">{interview.job_role}</h3>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">📅 {interview.started_at}</p>
                </div>

                <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                
                <div className="text-center">
                  {interview.status === 'in_progress' ? (
                    <button 
                      onClick={() => handleResume(interview)}
                      className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
                    >
                      ▶️ Resume Interview
                    </button>
                  ) : (
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                      COMPLETED
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard