import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'
import StarryBackground from '../components/StarryBackground'

function Feedback() {
  const { id } = useParams() // Gets the ID from the URL
  const navigate = useNavigate()
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      toast.error("No interview ID found.")
      navigate('/dashboard')
      return
    }
    fetchFeedback()
  }, [id])

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('token')
      // Fetch all interviews and find the specific one by ID
      const res = await axios.get('http://127.0.0.1:5000/api/interviews', { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      
      const session = res.data.data.find(s => s.session_id === parseInt(id))
      
      if (session && session.technical_score !== null) {
        setFeedback(session)
      } else {
        toast.error("Feedback not ready or not found.")
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error("Failed to load feedback")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-cyan-500 text-xl animate-pulse">Generating your report...</div>
    </div>
  )

  if (!feedback) return null

  // Data for Radar Chart
  const chartData = [
    { subject: 'Technical', A: feedback.technical_score, fullMark: 10 },
    { subject: 'Behavioral', A: feedback.behavioral_score, fullMark: 10 },
    { subject: 'Overall', A: Math.round((feedback.technical_score + feedback.behavioral_score) / 2), fullMark: 10 },
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Interview Feedback</h1>
          <p className="text-slate-600 dark:text-slate-400">Role: <span className="font-semibold text-cyan-500">{feedback.job_role}</span></p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Technical Score</p>
            <p className="text-4xl font-bold text-purple-500">{feedback.technical_score}/10</p>
          </div>
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Behavioral Score</p>
            <p className="text-4xl font-bold text-emerald-500">{feedback.behavioral_score}/10</p>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 mb-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">Performance Metrics</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Score" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold py-3 px-8 rounded-lg hover:opacity-90 transition-all">
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/interview')} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            Start New Interview
          </button>
        </div>

      </div>
    </div>
  )
}

export default Feedback