import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Interview() {
  const navigate = useNavigate()
  const [userInput, setUserInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Technical Interviewer. What role are you interviewing for today?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [jobRole, setJobRole] = useState('Python Developer')
  const [resumeStatus, setResumeStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Security Check on Page Load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login first!')
      navigate('/')
    }
  }, [navigate])

  // Clear Resume Function
  const handleClearResume = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/clear-resume', {}, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      setResumeStatus(response.data.message)
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ""
    } catch (error) {
      setResumeStatus('❌ Error clearing resume.')
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    setResumeStatus('Processing resume...')
    const formData = new FormData()
    formData.append('file', file)
    
    const token = localStorage.getItem('token')
    
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/upload-resume', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}` 
        } 
      })
      setResumeStatus(response.data.message)
    } catch (error) {
      setResumeStatus('❌ Error uploading resume. Please login again.')
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
      const token = localStorage.getItem('token')
      const response = await axios.post('http://127.0.0.1:5000/api/interview', 
        { message: userInput, job_role: jobRole, chat_history: newHistory },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      
      const updatedHistory = [...newHistory, { role: 'ai', text: response.data.response }]
      setChatHistory(updatedHistory)
      
      // --- NEW: Check if the backend says the interview is complete ---
      if (response.data.is_complete) {
        setTimeout(() => { endInterviewAndGetFeedback(); }, 2000);
      }
    } catch (error) {
      setChatHistory([...newHistory, { role: 'ai', text: 'Error connecting to AI. Please check if you are logged in.' }])
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
      alert("Interview Completed! Check the Dashboard for your feedback.")
      navigate('/dashboard') 
    } catch (error) {
      alert("Failed to generate feedback.")
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Live Interview Session</h1>
      
      {/* Manage Resume Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '10px', border: '1px dashed #2E5C8A' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Step 1: Manage Your Resume</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={isUploading} style={{ padding: '5px' }} />
          <button onClick={handleClearResume} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            🗑️ Clear Resume
          </button>
        </div>
        {resumeStatus && <p style={{ marginTop: '10px', fontWeight: 'bold', color: isUploading ? 'gray' : (resumeStatus.includes('Error') ? 'red' : 'green') }}>{resumeStatus}</p>}
      </div>

      {/* Job Role Input */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Interviewing for:</label>
        <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }} disabled={isEvaluating} />
      </div>

      {/* Chat Box */}
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: '15px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.role === 'user' ? '#2E5C8A' : '#e0e0e0', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%', textAlign: 'left' }}>
              <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>{msg.text}
            </div>
          </div>
        ))}
        {isLoading && <p style={{ color: 'gray', fontStyle: 'italic' }}>AI is thinking...</p>}
        {isEvaluating && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center' }}>Interview Concluded! Generating feedback...</p>}
      </div>

      {/* Input Area */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <input 
          type="text" 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
          placeholder={isEvaluating ? "Interview is complete..." : "Type your answer or ask a doubt..."} 
          style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} 
          disabled={isLoading || isEvaluating} 
        />
        <button onClick={sendMessage} disabled={isLoading || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Send</button>
        <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End & Get Feedback'}</button>
      </div>
    </div>
  )
}

export default Interview