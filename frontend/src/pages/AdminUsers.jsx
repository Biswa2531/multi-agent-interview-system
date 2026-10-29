import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import StarryBackground from '../components/StarryBackground'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })
      setUsers(res.data.data || [])
    } catch (err) { toast.error('Failed to load users') } 
    finally { setIsLoading(false) }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${userName} and all their data?`)) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://127.0.0.1:5000/api/admin/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) { toast.error('Failed to delete user') }
  }

  const handleResetPassword = async (userId, userEmail) => {
    if (!window.confirm(`Reset password for ${userEmail} to 'TempPass123!'?`)) return
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post(`http://127.0.0.1:5000/api/admin/users/${userId}/reset-password`, {}, { headers: { 'Authorization': `Bearer ${token}` } })
      toast.success(res.data.message)
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset password') }
  }

  const filteredUsers = users.filter(user => user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-cyan-500 text-xl animate-pulse">Loading users...</div>
    </div>
  )

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <StarryBackground />
      {/* FIXED: Added pt-24 to push content below Navbar */}
      <div className="relative z-10 container mx-auto px-6 py-8 pt-24">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Candidate Management</h1>
            <p className="text-slate-600 dark:text-slate-400">View, manage, and moderate system users</p>
          </div>
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="glass-input w-full md:w-80 px-4 py-2 rounded-lg text-sm" />
        </div>

        <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100/50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Name</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Interviews</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8 text-slate-500">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.user_id} className="border-t border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 text-sm text-slate-800 dark:text-slate-200 font-medium">{user.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800'}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">{user.interviews_count}</td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button onClick={() => handleResetPassword(user.user_id, user.email)} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium">Reset PW</button>
                          <button onClick={() => handleDeleteUser(user.user_id, user.name)} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers