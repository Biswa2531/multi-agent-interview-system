import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()
  const [interviews, setInterviews] = useState([])
  const [userName, setUserName] = useState('Candidate')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/') }
    
    // Get user name from token/localStorage if available
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserName(user.name || 'Candidate')
      } catch(e) {}
    }

    fetchInterviews()
  }, [navigate])

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:5000/api/interviews', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setInterviews(response.data.data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2E5C8A', margin: 0 }}>Welcome back, {userName}!</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
        <button onClick={() => navigate('/interview')} style={{ flex: 1, padding: '20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>
          ➕ Start New Interview
        </button>
      </div>

      <h2 style={{ color: '#2E5C8A', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Your Interview History</h2>
      
      {interviews.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>You haven't taken any interviews yet. Click "Start New Interview" to begin!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {interviews.map((interview) => (
            <div key={interview.session_id} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>{interview.job_role}</h3>
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>📅 {interview.started_at}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Technical</p>
                  <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: interview.technical_score >= 7 ? '#28a745' : '#dc3545', fontSize: '18px' }}>
                    {interview.technical_score !== null ? `${interview.technical_score}/10` : 'N/A'}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Behavioral</p>
                  <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', color: interview.behavioral_score >= 7 ? '#28a745' : '#dc3545', fontSize: '18px' }}>
                    {interview.behavioral_score !== null ? `${interview.behavioral_score}/10` : 'N/A'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <span style={{ padding: '5px 10px', backgroundColor: interview.status === 'completed' ? '#d4edda' : '#fff3cd', color: interview.status === 'completed' ? '#155724' : '#856404', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                  {interview.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard