import { useState, useEffect, useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'
import toast from 'react-hot-toast'

function Profile() {
  const { theme } = useContext(ThemeContext)
  const [user, setUser] = useState({ name: '', email: '' })
  const [profilePic, setProfilePic] = useState(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
    // Load saved profile pic from localStorage
    const savedPic = localStorage.getItem('profilePic')
    if (savedPic) setProfilePic(savedPic)
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error("Image size should be less than 2MB!")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePic(reader.result)
        localStorage.setItem('profilePic', reader.result) // Save for Navbar
        toast.success("Profile photo updated!")
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Profile <span className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">Settings</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your account details and preferences.</p>
        </div>

        {/* Profile Photo & Personal Info Card */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          
          {/* Profile Photo Upload Section */}
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-500">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              {/* Upload Button Overlay */}
              <label className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full cursor-pointer shadow-lg transition-transform transform group-hover:scale-110">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Click the camera icon to upload a new photo (Max 2MB)</p>
          </div>

          {/* Personal Info Form */}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input 
                type="text" 
                defaultValue={user.name} 
                className="w-full glass-input px-4 py-3" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <input 
                type="email" 
                defaultValue={user.email} 
                disabled 
                className="w-full glass-input px-4 py-3 opacity-60 cursor-not-allowed" 
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="glass-button px-6 py-2 text-sm">
              Save Changes
            </button>
          </div>
        </div>

        {/* Security Card */}
        <div className="glass-card rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700 pb-3">Security & Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
              <input type="password" className="w-full glass-input px-4 py-3" placeholder="••••••••" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input type="password" className="w-full glass-input px-4 py-3" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input type="password" className="w-full glass-input px-4 py-3" placeholder="••••••••" />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="glass-button px-6 py-2 text-sm">
              Update Password
            </button>
          </div>
        </div>

        {/* Resume Management Card */}
        <div className="glass-card rounded-2xl p-8 border-l-4 border-l-cyan-500">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">RAG Vector Engine (Resume)</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Manage the PDF data ingested by the ChromaDB vector engine.</p>
          
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
            <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Drag and drop your resume here</p>
            <p className="text-slate-500 text-xs mt-1">PDF up to 5MB</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Profile