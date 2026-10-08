import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Interview() {
  const navigate = useNavigate()
  const [userInput, setUserInput] = useState('')
  const [codeInput, setCodeInput] = useState('') // New state for code
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Technical Interviewer. We will have 3 rounds: Technical, Coding, and Behavioral. Let\'s start Round 1! What role are you interviewing for today?' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [jobRole, setJobRole] = useState('Python Developer')
  const [resumeStatus, setResumeStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const timerRef = useRef(null)

  const ROUND_NAMES = { 1: "Technical/Conceptual", 2: "Coding/Problem Solving", 3: "Behavioral/HR" }
  const ROUND_TIME = 300 

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { alert('Please login first!'); navigate('/') }
  }, [navigate])

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0 && isTimerActive) {
      clearInterval(timerRef.current)
      handleNextRound()
    }
    return () => clearInterval(timerRef.current)
  }, [isTimerActive, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleNextRound = async () => {
    if (currentRound < 3) {
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)
      setTimeLeft(ROUND_TIME)
      const transitionMsg = { role: 'ai', text: `⏰ Time's up for Round ${currentRound}! Moving to Round ${nextRound}: ${ROUND_NAMES[nextRound]}. Let's begin!` }
      setChatHistory(prev => [...prev, transitionMsg])
    } else {
      setIsTimerActive(false)
      endInterviewAndGetFeedback()
    }
  }

  const handleClearResume = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/clear-resume', {}, { headers: { 'Authorization': `Bearer ${token}` } })
      setResumeStatus(response.data.message)
      document.querySelector('input[type="file"]').value = ""
    } catch (error) { setResumeStatus('❌ Error clearing resume.') }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true); setResumeStatus('Processing resume...')
    const formData = new FormData(); formData.append('file', file)
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/upload-resume', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } })
      setResumeStatus(response.data.message)
    } catch (error) { setResumeStatus(' Error uploading resume.') }
    finally { setIsUploading(false) }
  }

  // Handles normal chat messages (Rounds 1 & 3)
  const sendMessage = async () => {
    if (!userInput.trim()) return
    if (!isTimerActive) setIsTimerActive(true)
    const newHistory = [...chatHistory, { role: 'user', text: userInput }]
    setChatHistory(newHistory); setUserInput(''); setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://127.0.0.1:5000/api/interview', 
        { message: userInput, job_role: jobRole, chat_history: newHistory, current_round: currentRound },
        { headers: { 'Authorization': `Bearer ${token}` } })
      setChatHistory([...newHistory, { role: 'ai', text: response.data.response }])
      if (response.data.is_complete) setTimeout(() => endInterviewAndGetFeedback(), 1000)
    } catch (error) { setChatHistory([...newHistory, { role: 'ai', text: 'Error connecting to AI.' }]) }
    finally { setIsLoading(false) }
  }

  // Handles Code Submissions (Round 2)
  const submitCode = async () => {
    if (!codeInput.trim()) return
    if (!isTimerActive) setIsTimerActive(true)
    const codeBlock = `Here is my code solution:\n\n\`\`\`\n${codeInput}\n\`\`\``
    const newHistory = [...chatHistory, { role: 'user', text: codeBlock }]
    setChatHistory(newHistory); setCodeInput(''); setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://127.0.0.1:5000/api/interview', 
        { message: codeBlock, job_role: jobRole, chat_history: newHistory, current_round: currentRound },
        { headers: { 'Authorization': `Bearer ${token}` } })
      setChatHistory([...newHistory, { role: 'ai', text: response.data.response }])
      if (response.data.is_complete) setTimeout(() => endInterviewAndGetFeedback(), 1000)
    } catch (error) { setChatHistory([...newHistory, { role: 'ai', text: 'Error connecting to AI.' }]) }
    finally { setIsLoading(false) }
  }

  const endInterviewAndGetFeedback = async () => {
    setIsTimerActive(false); setIsEvaluating(true)
    try {
      const sessionsRes = await axios.get('http://127.0.0.1:5000/api/interviews')
      const latestSession = sessionsRes.data.data[0]
      if (!latestSession) { alert("No interview data found!"); return; }
      const evalRes = await axios.post(`http://127.0.0.1:5000/api/evaluate/${latestSession.session_id}`)
      localStorage.setItem('latestFeedback', JSON.stringify(evalRes.data.feedback))
      navigate('/feedback', { state: { feedback: evalRes.data.feedback } })
    } catch (error) { alert("Failed to generate feedback.") }
    finally { setIsEvaluating(false) }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Live Interview Session</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '10px', border: '1px dashed #2E5C8A' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Step 1: Manage Your Resume</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={isUploading} style={{ padding: '5px' }} />
          <button onClick={handleClearResume} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>️ Clear Resume</button>
        </div>
        {resumeStatus && <p style={{ marginTop: '10px', fontWeight: 'bold', color: isUploading ? 'gray' : (resumeStatus.includes('Error') ? 'red' : 'green') }}>{resumeStatus}</p>}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#2E5C8A', color: 'white', borderRadius: '10px' }}>
        <div><strong style={{ fontSize: '18px' }}>Round {currentRound}: {ROUND_NAMES[currentRound]}</strong></div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '5px' }}>⏱️ {formatTime(timeLeft)}</div>
        <div>
          <label style={{ marginRight: '10px' }}>Role:</label>
          <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: 'none' }} disabled={isTimerActive} />
        </div>
      </div>

      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: '15px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.role === 'user' ? '#2E5C8A' : '#e0e0e0', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>{msg.text}
            </div>
          </div>
        ))}
        {isLoading && <p style={{ color: 'gray', fontStyle: 'italic' }}>AI is thinking...</p>}
        {isEvaluating && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}> AI is analyzing your answers...</p>}
      </div>

      {/* --- CONDITIONAL INPUT AREA --- */}
      {currentRound === 2 ? (
        // CODE EDITOR FOR ROUND 2
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea 
            value={codeInput} 
            onChange={(e) => setCodeInput(e.target.value)} 
            placeholder="Write your code here..." 
            style={{ width: '100%', height: '150px', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', fontFamily: 'monospace', backgroundColor: '#1e1e1e', color: '#d4d4d4' }} 
            disabled={isLoading || isEvaluating} 
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={submitCode} disabled={isLoading || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Submit Code</button>
            <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End Interview'}</button>
          </div>
        </div>
      ) : (
        // NORMAL CHAT FOR ROUNDS 1 & 3
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <input 
            type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
            placeholder="Type your answer..." 
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} 
            disabled={isLoading || isEvaluating} 
          />
          <button onClick={sendMessage} disabled={isLoading || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Send</button>
          <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End Interview'}</button>
        </div>
      )}
    </div>
  )
}

export default Interview