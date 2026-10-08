import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

function Feedback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [feedbackData, setFeedbackData] = useState(null)

  useEffect(() => {
    // Get feedback data passed from the Interview page
    if (location.state?.feedback) {
      setFeedbackData(location.state.feedback)
    } else {
      // Fallback: try localStorage
      const stored = localStorage.getItem('latestFeedback')
      if (stored) {
        try {
          setFeedbackData(JSON.parse(stored))
        } catch (e) {
          console.error('Failed to parse feedback:', e)
        }
      }
    }

    // Security check
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/')
    }
  }, [location, navigate])

  if (!feedbackData) {
    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <h2>Loading feedback...</h2>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Interview Feedback Report</h1>
      
      <div style={{ backgroundColor: '#ffffff', border: '2px solid #2E5C8A', borderRadius: '15px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', color: '#28a745', marginTop: 0 }}> Interview Evaluation Complete!</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '30px', gap: '20px' }}>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '10px', flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Technical Score</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#2E5C8A' }}>{feedbackData.technical_score}/10</p>
          </div>
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f0fff0', borderRadius: '10px', flex: 1 }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#28a745' }}>Behavioral Score</h3>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>{feedbackData.behavioral_score}/10</p>
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#28a745', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>✅ Strengths</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.strengths}</p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#dc3545', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>️ Areas for Improvement</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.weaknesses}</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#2E5C8A', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>🚀 Career Recommendations</h3>
          <p style={{ lineHeight: '1.8', color: '#333', fontSize: '16px' }}>{feedbackData.career_recommendations}</p>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{ padding: '12px 30px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            Go to Dashboard
          </button>
          <button 
            onClick={() => navigate('/interview')} 
            style={{ padding: '12px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            Take Another Interview
          </button>
        </div>
      </div>
    </div>
  )
}

export default Feedback