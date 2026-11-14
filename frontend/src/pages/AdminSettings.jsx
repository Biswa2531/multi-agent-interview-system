import { useState, useEffect } from 'react'
import api from '../api' // ✅ Centralized API instance (auto-attaches JWT, handles 401)
import toast from 'react-hot-toast'

function AdminSettings() {
  const [maxViolations, setMaxViolations] = useState(3)
  const [webcamEnabled, setWebcamEnabled] = useState(true)
  const [adminName, setAdminName] = useState('Biswa')
  const [adminEmail, setAdminEmail] = useState('b.screation2004@gmail.com')
  
  // System Config State (UI only for now)
  const [aiDifficulty, setAiDifficulty] = useState('Medium')
  const [emailNotifications, setEmailNotifications] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  // ✅ No more token header, no more hardcoded URL
  const fetchSettings = async () => {
    try {
      const res = await api.get('/api/admin/settings/proctoring')
      setMaxViolations(res.data.data.max_violations)
      setWebcamEnabled(res.data.data.webcam_enabled)
    } catch (err) {
      console.error('Failed to load settings')
    }
  }

  // ✅ Clean POST call — api.js auto-attaches the Authorization header
  const handleSaveProctoringSettings = async () => {
    try {
      await api.post('/api/admin/settings/proctoring', {
        max_violations: maxViolations,
        webcam_enabled: webcamEnabled
      })
      toast.success('Proctoring settings saved to database!')
    } catch (err) {
      toast.error('Failed to save settings')
    }
  }

  const handleUpdateProfile = () => {
    toast.success('Admin profile updated successfully!')
  }

  const handleSaveSystemConfig = () => {
    toast.success('System configuration updated!')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">System Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Configure platform rules and admin preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Admin Profile Section */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-cyan-500">👤</span> Admin Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name</label>
              <input type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="glass-input w-full px-4 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="glass-input w-full px-4 py-2 text-sm" />
            </div>
            <button onClick={handleUpdateProfile} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-2 rounded-lg transition-all">
              Update Profile
            </button>
          </div>
        </div>

        {/* System Configuration Section (RESTORED) */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-purple-500">⚙️</span> System Configuration
          </h2>
          <div className="space-y-6">
            
            {/* AI Difficulty */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Default AI Interview Difficulty</label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map(level => (
                  <button
                    key={level}
                    onClick={() => setAiDifficulty(level)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                      aiDifficulty === level 
                        ? 'bg-purple-500 text-white border-purple-500' 
                        : 'bg-white/5 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-white/10'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Email Notifications</p>
                <p className="text-xs text-slate-500">Send feedback emails to candidates</p>
              </div>
              <button 
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-emerald-500' : 'bg-slate-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${emailNotifications ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>

            <button onClick={handleSaveSystemConfig} className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-2 rounded-lg transition-all">
              Save Configuration
            </button>
          </div>
        </div>

        {/* Proctoring & Security Rules Section */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-700/50 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-red-500">🛡️</span> Proctoring & Security Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Max Tab-Switch Violations before Auto-Submit: <span className="text-red-500 font-bold">{maxViolations}</span>
              </label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                value={maxViolations} 
                onChange={(e) => setMaxViolations(e.target.value)} 
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>1 (Strict)</span>
                <span>5 (Lenient)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Webcam Enforcement</p>
                <p className="text-xs text-slate-500">Require camera for all interviews</p>
              </div>
              <button 
                onClick={() => setWebcamEnabled(!webcamEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${webcamEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${webcamEnabled ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleSaveProctoringSettings} 
            className="w-full mt-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-400 hover:to-pink-500 text-white font-bold py-2 rounded-lg transition-all"
          >
            Save Proctoring Configuration
          </button>
        </div>

      </div>
    </div>
  )
}

export default AdminSettings