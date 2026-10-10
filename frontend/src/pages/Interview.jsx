import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'

function Interview() {
  const navigate = useNavigate()
  const location = useLocation() // Added to get session ID from Dashboard
  const [userInput, setUserInput] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [jobRole, setJobRole] = useState('Python Developer')
  const [resumeStatus, setResumeStatus] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  
  const [currentRound, setCurrentRound] = useState(1)
  const [timeLeft, setTimeLeft] = useState(300)
  const [isTimerActive, setIsTimerActive] = useState(false)
  const timerRef = useRef(null)

  const [isListening, setIsListening] = useState(false)
  const [isSpeechSupported, setIsSpeechSupported] = useState(true)
  const recognitionRef = useRef(null)

  const ROUND_NAMES = { 1: "Technical/Conceptual", 2: "Coding/Problem Solving", 3: "Behavioral/HR" }
  const ROUND_TIME = 300 

  useEffect(() => {
    document.body.style.backgroundColor = '#f4f6f8';
    document.body.style.color = '#333333';
    return () => { document.body.style.backgroundColor = ''; document.body.style.color = ''; };
  }, []);

  const handleVoiceSend = async (transcript) => {
    if (!transcript.trim()) return;
    if (!isTimerActive) setIsTimerActive(true);
    
    const newHistory = [...chatHistory, { role: 'user', text: transcript }];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://127.0.0.1:5000/api/interview', 
        { message: transcript, job_role: jobRole, chat_history: newHistory, current_round: currentRound },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setChatHistory([...newHistory, { role: 'ai', text: response.data.response }]);
      if (response.data.is_complete) setTimeout(() => endInterviewAndGetFeedback(), 1000);
    } catch (error) { 
      toast.error('Error connecting to AI.'); 
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setIsSpeechSupported(false); return }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      console.log("️ Microphone started listening...")
      setIsListening(true)
      toast('🎙️ Listening... Speak now!', { duration: 3000 })
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      console.log("✅ Voice captured:", transcript)
      setIsListening(false)
      toast.success('Voice captured! Sending answer...')
      handleVoiceSend(transcript);
    }
    
    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') toast.error('Microphone access denied. Click the 🔒 lock icon in the address bar.', { duration: 6000 })
      else if (event.error === 'no-speech') toast.error('No speech detected. Please try again.')
      else if (event.error === 'network') toast.error('Network error. Check your internet connection.')
      else toast.error(`Microphone error: ${event.error}`)
    }

    recognition.onend = () => {
      console.log("🛑 Microphone stopped.")
      setIsListening(false)
    }
    
    recognitionRef.current = recognition
  }, [chatHistory, isTimerActive, currentRound, jobRole])

  const toggleListening = () => {
    if (!isSpeechSupported) { toast.error('Voice input not supported. Use Chrome/Edge.', { duration: 5000 }); return }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      try {
        recognitionRef.current.start()
      } catch (err) { 
        console.error("Failed to start mic:", err)
        toast.error('Failed to start microphone. Refresh the page.'); 
        setIsListening(false) 
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { toast.error('Please login first!'); navigate('/') }
    else {
      fetchActiveSession(token)
    }
  }, [navigate])

  const fetchActiveSession = async (token) => {
    try {
      const targetSessionId = location.state?.sessionId;

      let res;
      if (targetSessionId) {
        res = await axios.get(`http://127.0.0.1:5000/api/interview/session/${targetSessionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        res = await axios.get('http://127.0.0.1:5000/api/interview/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }

      if (res.data.active || res.data.session_id) {
        setJobRole(res.data.job_role)
        setCurrentRound(res.data.current_round)
        setTimeLeft(300)
        
        const history = []
        res.data.qa_pairs.forEach(pair => {
          history.push({ role: 'ai', text: pair.question })
          if (pair.answer) {
            history.push({ role: 'user', text: pair.answer })
          }
        })
        
        if (history.length === 0) {
           history.push({ role: 'ai', text: `Hello! Resuming your interview for ${res.data.job_role}. We are in Round ${res.data.current_round}: ${ROUND_NAMES[res.data.current_round]}.` })
        }
        
        setChatHistory(history)
        toast.success('Interview resumed successfully!')
      } else {
        setChatHistory([{ role: 'ai', text: 'Hello! I am your AI Technical Interviewer. We will have 3 rounds: Technical, Coding, and Behavioral. Let\'s start Round 1! What role are you interviewing for today?' }])
      }
    } catch (error) {
      console.error("Failed to fetch session", error)
      setChatHistory([{ role: 'ai', text: 'Hello! I am your AI Technical Interviewer. Let\'s start Round 1!' }])
    }
  }

  useEffect(() => {
    if (isTimerActive && timeLeft > 0) timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    else if (timeLeft === 0 && isTimerActive) { clearInterval(timerRef.current); handleNextRound() }
    return () => clearInterval(timerRef.current)
  }, [isTimerActive, timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleNextRound = () => {
    if (currentRound < 3) {
      const nextRound = currentRound + 1
      setCurrentRound(nextRound)
      setTimeLeft(ROUND_TIME)
      setChatHistory(prev => [...prev, { role: 'ai', text: `️ Round skipped! Moving to Round ${nextRound}: ${ROUND_NAMES[nextRound]}. Let's begin!` }])
      toast.success(`Starting Round ${nextRound}: ${ROUND_NAMES[nextRound]}`)
    } else { 
      setIsTimerActive(false); 
      endInterviewAndGetFeedback() 
    }
  }

  const handleClearResume = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/clear-resume', {}, { headers: { 'Authorization': `Bearer ${token}` } })
      toast.success(response.data.message)
      document.querySelector('input[type="file"]').value = ""
    } catch (error) { toast.error('Error clearing resume.') }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setIsUploading(true)
    const formData = new FormData(); formData.append('file', file)
    const token = localStorage.getItem('token')
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/upload-resume', formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } })
      toast.success(response.data.message)
    } catch (error) { toast.error('Error uploading resume.') }
    finally { setIsUploading(false) }
  }

  const sendMessage = async () => { if (!userInput.trim()) return; handleVoiceSend(userInput) }

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
    } catch (error) { toast.error('Error connecting to AI.') }
    finally { setIsLoading(false) }
  }

  const endInterviewAndGetFeedback = async () => {
    setIsTimerActive(false); setIsEvaluating(true)
    try {
      const sessionsRes = await axios.get('http://127.0.0.1:5000/api/interviews')
      const latestSession = sessionsRes.data.data[0]
      if (!latestSession) { toast.error("No interview data found!"); return; }
      const evalRes = await axios.post(`http://127.0.0.1:5000/api/evaluate/${latestSession.session_id}`)
      localStorage.setItem('latestFeedback', JSON.stringify(evalRes.data.feedback))
      toast.success("Interview evaluated successfully!")
      navigate('/feedback', { state: { feedback: evalRes.data.feedback } })
    } catch (error) { toast.error("Failed to generate feedback.") }
    finally { setIsEvaluating(false) }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#2E5C8A' }}>Live Interview Session</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#ffffff', borderRadius: '10px', border: '1px dashed #2E5C8A' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2E5C8A' }}>Step 1: Manage Your Resume</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={isUploading} style={{ padding: '5px' }} />
          <button onClick={handleClearResume} style={{ padding: '8px 15px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Clear Resume</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', backgroundColor: '#2E5C8A', color: 'white', borderRadius: '10px' }}>
        <div><strong style={{ fontSize: '18px' }}>Round {currentRound}: {ROUND_NAMES[currentRound]}</strong></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 15px', borderRadius: '5px' }}>️ {formatTime(timeLeft)}</div>
          <button onClick={handleNextRound} style={{ padding: '6px 12px', backgroundColor: '#ffc107', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            ⏭️ Skip Round
          </button>
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Role:</label>
          <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)} style={{ padding: '5px', borderRadius: '5px', border: 'none' }} disabled={isTimerActive} />
        </div>
      </div>

      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '10px', padding: '20px', marginBottom: '20px', backgroundColor: '#ffffff' }}>
        {chatHistory.map((msg, index) => (
          <div key={index} style={{ marginBottom: '15px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
            <div style={{ display: 'inline-block', padding: '10px 15px', borderRadius: '15px', backgroundColor: msg.role === 'user' ? '#2E5C8A' : '#e0e0e0', color: msg.role === 'user' ? 'white' : 'black', maxWidth: '80%', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              <strong>{msg.role === 'user' ? 'You: ' : 'AI: '}</strong>{msg.text}
            </div>
          </div>
        ))}
        {isLoading && <p style={{ color: 'gray', fontStyle: 'italic' }}>AI is thinking...</p>}
        {isEvaluating && <p style={{ color: 'green', fontWeight: 'bold', textAlign: 'center', fontSize: '18px' }}>🤖 AI is analyzing your answers...</p>}
      </div>

      {currentRound === 2 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1e1e1e', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ backgroundColor: '#2d2d2d', color: '#fff', padding: '8px 15px', fontSize: '13px', borderBottom: '1px solid #444', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
              <span>💻 Code Editor</span>
              <span style={{ fontSize: '11px', color: '#aaa' }}>JavaScript / Python</span>
            </div>
            <textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Write your code here..."
              disabled={isLoading || isEvaluating}
              style={{ width: '100%', minHeight: '200px', padding: '15px', backgroundColor: '#1e1e1e', color: '#d4d4d4', border: 'none', outline: 'none', fontFamily: '"Fira Code", "Fira Mono", Consolas, monospace', fontSize: '14px', lineHeight: '1.5', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={submitCode} disabled={isLoading || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Submit Code</button>
            <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End Interview'}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
          <input 
            type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type or speak your answer..." 
            style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }} disabled={isLoading || isEvaluating} 
          />
          {isSpeechSupported && (
            <button onClick={toggleListening} disabled={isLoading || isEvaluating} style={{ padding: '10px 15px', backgroundColor: isListening ? '#dc3545' : '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '20px' }}>
              {isListening ? '️' : '🎙️'}
            </button>
          )}
          <button onClick={sendMessage} disabled={isLoading || isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>Send</button>
          <button onClick={endInterviewAndGetFeedback} disabled={isEvaluating} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>{isEvaluating ? 'Evaluating...' : 'End Interview'}</button>
        </div>
      )}
    </div>
  )
}

export default Interview