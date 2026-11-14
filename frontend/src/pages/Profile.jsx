import { useState, useEffect } from 'react'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function Profile() {
  const user = JSON.parse(localStorage.getItem('user')) || {}
  const [name, setName] = useState(user.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [stats, setStats] = useState({ total_interviews: 0, average_technical_score: 0, average_behavioral_score: 0 })
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => { fetchStats() }, [])

  // ✅ Clean GET call
  const fetchStats = async () => {
    try {
      const res = await api.get('/api/user/stats')
      setStats(res.data)
    } catch (err) { 
      console.error(err) 
    }
  }

  // ✅ Clean POST call
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/api/update-profile', { name })
      toast.success(res.data.message)
      const updatedUser = { ...user, name }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      window.location.reload() // Reload to update navbar
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Update failed') 
    }
  }

  // ✅ Clean POST call
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPw.length < 6) return toast.error('Password must be at least 6 characters')
    try {
      const res = await api.post('/api/change-password', { current_password: currentPw, new_password: newPw })
      toast.success(res.data.message)
      setCurrentPw(''); setNewPw('')
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Failed to change password') 
    }
  }

  // ✅ Clean POST call for FormData (Axios automatically handles multipart/form-data boundary)
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/api/upload-resume', formData)
      toast.success(res.data.message)
    } catch (err) { 
      toast.error(err.response?.data?.error || 'Upload failed') 
    } finally { 
      setIsUploading(false) 
    }
  }

  // ✅ Clean POST call
  const handleClearResume = async () => {
    if (!window.confirm('Are you sure you want to clear your resume data from the AI?')) return
    try {
      const res = await api.post('/api/clear-resume', {})
      toast.success(res.data.message)
    } catch (err) { 
      toast.error('Failed to clear resume') 
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24 max-w-5xl">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Profile Settings</h1>

        {/* Quick Stats */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Info */}
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Personal Info</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="glass-input w-full px-4 py-2 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
                <input type="email" value={user.email} disabled className="glass-input w-full px-4 py-2 rounded-lg text-sm opacity-60 cursor-not-allowed" />
              </div>
              <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors">Update Profile</button>
            </form>
          </div>

          {/* Security */}
          <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Security</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Current Password" className="glass-input w-full px-4 py-2 rounded-lg text-sm" />
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New Password" className="glass-input w-full px-4 py-2 rounded-lg text-sm" />
              <button type="submit" className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 rounded-lg transition-colors">Change Password</button>
            </form>
          </div>
        </div>

        {/* Resume Management */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 mt-8">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Resume Management</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-400">PDF only</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleResumeUpload} />
              </label>
            </div>
            <div className="flex flex-col items-center gap-2">
              {isUploading ? <p className="text-sm text-cyan-500 animate-pulse">Uploading & Parsing...</p> : <p className="text-sm text-slate-500 dark:text-slate-400">Upload your latest resume</p>}
              <button onClick={handleClearResume} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">Clear AI Memory</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile