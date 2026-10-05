import { useState, useEffect } from 'react'
import axios from 'axios'

function Dashboard() {
  const [savedInterviews, setSavedInterviews] = useState([])

  const fetchSavedInterviews = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/interviews')
      setSavedInterviews(response.data.data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  useEffect(() => {
    fetchSavedInterviews()
  }, [])

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Candidate Dashboard</h1>
      
      <div>
        <h2 style={{ textAlign: 'center' }}>Saved Interview Records</h2>
        {savedInterviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'gray' }}>No interviews saved yet.</p>
        ) : (
          savedInterviews.map((session) => (
            <div key={session.session_id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: 'white' }}>
              <h3 style={{ color: '#2E5C8A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Session #{session.session_id} | Role: {session.job_role} | Status: {session.status}
              </h3>
              {session.qa_pairs.map((qa, idx) => (
                <div key={idx} style={{ marginBottom: '15px' }}>
                  <p style={{ fontWeight: 'bold', color: '#333' }}>Q: {qa.question}</p>
                  <p style={{ color: '#555', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '5px' }}>
                    <strong>A:</strong> {qa.answer}
                  </p>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard