import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10
  
  // NEW: View Details Modal State
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('http://127.0.0.1:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setUsers(res.data.data)
    } catch (err) {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This will delete all their interview data.`)) return
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`http://127.0.0.1:5000/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('User deleted successfully')
      fetchUsers()
    } catch (err) {
      toast.error('Failed to delete user')
    }
  }

  const handleResetPassword = async (userId, userEmail) => {
    if (!window.confirm(`Reset password for ${userEmail}? A temporary password will be emailed.`)) return
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://127.0.0.1:5000/api/admin/users/${userId}/reset-password`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success('Password reset successfully')
    } catch (err) {
      toast.error('Failed to reset password')
    }
  }

  const handleToggleBlock = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
    try {
      const token = localStorage.getItem('token')
      await axios.post(`http://127.0.0.1:5000/api/admin/users/${userId}/toggle-block`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      toast.success(`User ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`)
      fetchUsers()
    } catch (err) {
      toast.error('Failed to update user status')
    }
  }

  // NEW: Fetch User Details
  const fetchUserDetails = async (user) => {
    setIsDetailsLoading(true)
    setSelectedUser(user)
    try {
      const token = localStorage.getItem('token')
      // Fetch user's interview history
      const res = await axios.get('http://127.0.0.1:5000/api/user/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setUserDetails(res.data)
    } catch (err) {
      toast.error('Failed to load user details')
    } finally {
      setIsDetailsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  if (isLoading) return <div className="text-cyan-500 text-xl animate-pulse">Loading Users...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Candidate Management</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage registered users and their access</p>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/20 dark:border-slate-700/50">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-input px-4 py-2 text-sm w-full"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Candidate</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Role</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Interviews</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-slate-500">No users found</td></tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.user_id} className="border-b border-slate-200 dark:border-slate-700/50 hover:bg-white/5 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">{user.role}</td>
                    <td className="py-4 px-4 text-sm font-bold text-cyan-600 dark:text-cyan-400">{user.interviews_count}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        user.status === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}>
                        {user.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => fetchUserDetails(user)}
                          className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 px-3 py-1.5 rounded hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-colors font-medium border border-cyan-200 dark:border-cyan-800"
                        >
                          👁️ View Details
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.user_id, user.email)}
                          className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors font-medium border border-amber-200 dark:border-amber-800"
                        >
                          🔑 Reset PW
                        </button>
                        <button
                          onClick={() => handleToggleBlock(user.user_id, user.status)}
                          className={`text-xs px-3 py-1.5 rounded transition-colors font-medium border ${
                            user.status === 'active'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {user.status === 'active' ? '🚫 Block' : '✅ Unblock'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id, user.name)}
                          className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1.5 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium border border-red-200 dark:border-red-800"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed glass-button-secondary"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed glass-button-secondary"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-700/50 p-6 max-w-4xl w-full bg-slate-900/95 shadow-2xl my-8">
            {isDetailsLoading ? (
              <div className="text-center py-20 text-cyan-500 animate-pulse">Loading User Details...</div>
            ) : userDetails && (
              <>
                <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                       Candidate Details
                    </h2>
                    <p className="text-slate-400 mt-1">{selectedUser.name} ({selectedUser.email})</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setUserDetails(null) }} className="text-slate-400 hover:text-white text-2xl"></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="glass-card p-4 rounded-xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total Interviews</p>
                    <p className="text-3xl font-bold text-cyan-500 mt-2">{userDetails.total_interviews}</p>
                  </div>
                  <div className="glass-card p-4 rounded-xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Technical Score</p>
                    <p className="text-3xl font-bold text-purple-500 mt-2">{userDetails.average_technical_score}/10</p>
                  </div>
                  <div className="glass-card p-4 rounded-xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Avg. Behavioral Score</p>
                    <p className="text-3xl font-bold text-emerald-500 mt-2">{userDetails.average_behavioral_score}/10</p>
                  </div>
                </div>

                {/* Progress Chart */}
                {userDetails.interview_history && userDetails.interview_history.length > 0 && (
                  <div className="glass-card p-6 rounded-xl">
                    <h3 className="text-lg font-bold text-white mb-4">Performance Progress</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userDetails.interview_history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                          <XAxis dataKey="interview_number" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" domain={[0, 10]} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="technical_score" stroke="#a855f7" strokeWidth={2} name="Technical" />
                          <Line type="monotone" dataKey="behavioral_score" stroke="#10b981" strokeWidth={2} name="Behavioral" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsers