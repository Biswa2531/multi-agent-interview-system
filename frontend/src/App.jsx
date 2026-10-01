import { useState } from 'react'
import axios from 'axios'

function App() {
  const [userInput, setUserInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Technical Interviewer. What role are you interviewing for today?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [jobRole, setJobRole] = useState('Python Developer')
  
  const [showDashboard, setShowDashboard] = useState(false)
  const [savedInterviews, setSavedInterviews] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  // New state for Resume Upload
  const [resumeStatus, setResumeStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const MAX_QUESTIONS = 5;

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    setResumeStatus('Processing resume...')
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResumeStatus(response.data.message)
    } catch (error) {
      setResumeStatus('❌ Error uploading resume.')
      console.error(error)
    } finally {
      setIsUploading(false)
    }
  }

  const sendMessage = async () => {
    if (!userInput.trim()) return

    const newHistory = [...chatHistory, { role: 'user', text: userInput }]
    setChatHistory(newHistory)
    setUserInput('')
    setIsLoading(true)

    try {
      const response = await axios.post('http://127.0.0.1:5000/api/interview', {
        message: userInput,
        job_role: jobRole,
        chat_history: newHistory
      })
      
      const updatedHistory = [...newHistory, { role: 'ai', text: response.data.response }]
      setChatHistory(updatedHistory)

      const userAnswerCount = updatedHistory.filter(msg => msg.role === 'user').length;
      if (userAnswerCount >= MAX_QUESTIONS) {
        setTimeout(() => { endInterviewAndGetFeedback(); }, 2000);
      }
    } catch (error) {
      setChatHistory([...newHistory, { role: 'ai', text: 'Error connecting to AI.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const endInterviewAndGetFeedback = async () => {
    setIsEvaluating(true)
    try {
      const sessionsRes = await axios.get('http://127.0.0.1:5000/api/interviews')
      const latestSession = sessionsRes.data.data[0]
      if (!latestSession) { alert("No interview data found!"); return; }

      const evalRes = await axios.post(`http://127.0.0.1:5000/api/evaluate/${latestSession.session_id}`)
      setFeedback(evalRes.data.feedback)
      setShowDashboard(true) 
    } catch (error) {
      alert("Failed to generate feedback.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const fetchSavedInterviews = async () => {
    setShowDashboard(true)
    setFeedback(null)
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/interviews')
      setSavedInterviews(response.data.data)
    } catch (error) {
      console.error("Failed to fetch interviews:", error)
    }
  }

  const userAnswerCount = chatHistory.filter(msg => msg.role === 'user').length;
  const isInterviewComplete = userAnswerCount >= MAX_QUESTIONS;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Multi-Agent Interview System</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button onClick={() => { setShowDashboard(false); setFeedback(null); }} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: !showDashboard ? '#2E5C8A' : '#ccc', color: !showDashboard ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Live Interview</button>
        <button onClick={fetchSavedInterviews} style={{ padding: '10px 20px', backgroundColor: showDashboard ? '#2E5C8A' : '#ccc', color: showDashboard ? 'white' : 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>View Saved Interviews</button>
      </div>

      {!showDashboard ? (
        <div>
          {/* Resume Upload Section */}
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '10px', border: '1px dashed #2E5C8A' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Step 1: Upload Your Resume (PDF)</h3>
            <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={isUploading} style={{ padding: '5px' }} />
            {resumeStatus && <p style={{ marginTop: '10px', fontWeight: 'bold', color: isUploading ? 'gray' : 'green' }}>{resumeStatus}</p>}
          </div>

          <div style={{ textAlign: 'center', marginBottom: '10px', fontWeight: 'bold', color: '#555' }}>Question {Math.min(userAnswerCount + 1, MAX_QUESTIONS)} of {MAX_QUESTIONS}</div>

          {isInterviewComplete && (
            <div style={{ textAlign: 'center', marginBottom: '15px', padding: '10px', backgroundColor: '#e0f7fa', color: '#006064', borderRadius: '5px', fontWeight: 'bold' }}>Interview Concluded! Generating feedback...</div>
          )}

          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Interviewing for:</label>
            <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} disabled={isInterviewComplete} />
          </div>

          <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
            {chatHistory.map((msg, index) => (
              <div key={index} style={{ marginBottom: '15px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.role === 'user' ? '#2E5C8A' : '#e0e0e0', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%', textAlign: 'left' }}>
                  <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>{msg.text}
                </div>
              </div>
            ))}
            {isLoading && <p style={{ color: 'gray', fontStyle: 'italic' }}>AI is thinking...</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder={isInterviewComplete ? "Interview is complete..." : "Type your answer here..."} style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} disabled={isLoading || isInterviewComplete || isEvaluating} />
            <button onClick={sendMessage} disabled={isLoading || isInterviewComplete || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Send</button>
            <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End & Get Feedback'}</button>
          </div>
        </div>
      ) : (
        <div>
          {feedback ? (
            <div style={{ border: '2px solid #28a745', borderRadius: '10px', padding: '20px', backgroundColor: '#f0fff4' }}>
              <h2 style={{ textAlign: 'center', color: '#28a745' }}>🎯 AI Career Coach Evaluation</h2>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><h3>Technical Score</h3><p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E5C8A' }}>{feedback.technical_score}/10</p></div>
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><h3>Behavioral Score</h3><p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2E5C8A' }}>{feedback.behavioral_score}/10</p></div>
              </div>
              <div style={{ marginBottom: '15px' }}><h4 style={{ color: '#28a745' }}>✅ Strengths:</h4><p style={{ whiteSpace: 'pre-line' }}>{feedback.strengths}</p></div>
              <div style={{ marginBottom: '15px' }}><h4 style={{ color: '#dc3545' }}>️ Areas for Improvement:</h4><p style={{ whiteSpace: 'pre-line' }}>{feedback.weaknesses}</p></div>
              <div><h4 style={{ color: '#2E5C8A' }}>💡 Career Recommendations:</h4><p style={{ whiteSpace: 'pre-line' }}>{feedback.career_recommendations}</p></div>
            </div>
          ) : (
            <div>
              <h2 style={{ textAlign: 'center' }}>Saved Interview Records</h2>
              {savedInterviews.length === 0 ? <p style={{ textAlign: 'center', color: 'gray' }}>No interviews saved yet.</p> : savedInterviews.map((session) => (
                <div key={session.session_id} style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: 'white' }}>
                  <h3 style={{ color: '#2E5C8A', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Session #{session.session_id} | Role: {session.job_role} | Status: {session.status}</h3>
                  {session.qa_pairs.map((qa, idx) => (<div key={idx} style={{ marginBottom: '15px' }}><p style={{ fontWeight: 'bold', color: '#333' }}>Q: {qa.question}</p><p style={{ color: '#555', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '5px' }}><strong>A:</strong> {qa.answer}</p></div>))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App