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

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
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
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>You haven't taken any interviews yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {interviews.map((interview) => (
            <div key={interview.session_id} style={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '10px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
              
              <button 
                onClick={() => handleDelete(interview.session_id)}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px', padding: '5px' }}
                title="Delete Interview"
              >
                🗑️
              </button>

              <div>
                <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A', paddingRight: '20px' }}>{interview.job_role}</h3>
                {/* Directly displaying the IST string sent by Python */}
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
              </div>
              
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                {interview.status === 'in_progress' ? (
                  <button 
                    onClick={() => handleResume(interview)}
                    style={{ width: '100%', padding: '10px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                  >
                    ▶️ Resume Interview
                  </button>
                ) : (
                  <span style={{ padding: '5px 10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>
                    COMPLETED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard