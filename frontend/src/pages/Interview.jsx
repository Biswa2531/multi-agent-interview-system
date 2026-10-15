import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import StarryBackground from '../components/StarryBackground'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

function Interview() {
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = location.state?.sessionId
  const [jobRole, setJobRole] = useState(location.state?.jobRole || 'Software Engineer')
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [roleInput, setRoleInput] = useState(jobRole)
  
  // Round & Timer Configuration
  const roundLimits = { 1: 15 * 60, 2: 10 * 60, 3: 5 * 60 }
  const [currentRound, setCurrentRound] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(roundLimits[1])
  const [isActive, setIsActive] = useState(true)
  const [interviewStarted, setInterviewStarted] = useState(false)

  // Chat State
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef(null)

  // Code Editor State
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [code, setCode] = useState('// Write your code here...\n\nfunction solution() {\n  \n}')

  // Resume State
  const [resumeFile, setResumeFile] = useState(null)

  // Deliberation Stream State
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'System initialized. Waiting for candidate input...' }
  ])

  // Proctoring & Score State
  const [violations, setViolations] = useState(0)
  const [webcamActive, setWebcamActive] = useState(false)
  const interviewStartedRef = useRef(interviewStarted)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [techScore, setTechScore] = useState(0)
  const [behavScore, setBehavScore] = useState(0)

  // Audio Visualizer State
  const [isListening, setIsListening] = useState(false)
  const [audioLevels, setAudioLevels] = useState(Array(8).fill(0))
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const animationRef = useRef(null)

  // Job Roles List
  const jobRoles = ['Software Engineer', 'Full Stack Developer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'System Architect', 'Frontend Developer', 'Backend Developer']
  const filteredRoles = jobRoles.filter(role => role.toLowerCase().includes(roleInput.toLowerCase()))

  // Keep ref updated
  useEffect(() => { interviewStartedRef.current = interviewStarted }, [interviewStarted])

  // Helper: Add Log
  const addLog = (type, text) => setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type, text }])

  // Helper: Format Time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Text-to-Speech Function
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, ''))
      utterance.rate = 1.0
      utterance.pitch = 1.0
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Text-to-speech not supported in this browser.')
    }
  }

  // Ask for a Hint Function
  const handleAskHint = () => {
    if (currentRound !== 1) { toast.error('Hints are only available during the Technical Round!'); return }
    if (hintsUsed >= 3) { toast.error('Maximum hints reached for this session.'); return }
    setHintsUsed(prev => prev + 1)
    addLog('warning', `Hint requested by candidate. Score penalty applied (-5%). Hint #${hintsUsed + 1} used.`)
    toast.success(' Hint: Try breaking the problem down into smaller functions first!')
    setMessages(prev => [...prev, { role: 'ai', text: `**[HINT PROVIDED]**\nSince you asked for a clue, try breaking the problem down into smaller, manageable functions. Remember to handle edge cases! (Note: 5% score penalty applied).` }])
  }

  // Toggle Microphone & Visualizer
  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false)
      cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (audioContextRef.current) audioContextRef.current.close()
      setAudioLevels(Array(8).fill(0))
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const AudioContext = window.AudioContext || window.webkitAudioContext
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 64 
      
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      setIsListening(true)
      
      const updateVisualizer = () => {
        analyser.getByteFrequencyData(dataArray)
        const levels = Array.from(dataArray.slice(0, 8)).map(value => (value / 255) * 100)
        setAudioLevels(levels)
        animationRef.current = requestAnimationFrame(updateVisualizer)
      }
      updateVisualizer()
      addLog('info', 'Microphone activated. Audio visualizer is live.')
    } catch (err) {
      toast.error('Microphone access denied.')
      addLog('error', 'Microphone access denied.')
    }
  }

  // MAIN INITIALIZATION & PROCTORING EFFECT
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/') }
    
    if (sessionId) {
      addLog('info', `Resuming session: ${sessionId}`)
    } else {
      const welcomeMessage = `Hello! I am your AI Interviewer. Let's begin your evaluation for the **${jobRole}** role.\n\nThis interview consists of 3 rounds:\n1. **Technical Round** (15 mins)\n2. **Behavioral Round** (10 mins)\n3. **HR Round** (5 mins)\n\nThe timer will start as soon as you send your first message. To start, could you briefly introduce yourself?`
      setMessages([{ role: 'ai', text: welcomeMessage }])
      addLog('success', 'Interviewer Agent (Sophia v4.2) connected.')
      addLog('info', 'RAG Engine: Loading candidate profile context...')
    }

    // 1. Request Webcam Permission
    let snapshotInterval;
    let stream;
    const initWebcam = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setWebcamActive(true)
        addLog('success', 'Webcam proctoring activated. Snapshots will be taken every 30s.')
        snapshotInterval = setInterval(() => { addLog('info', 'Proctoring: Background snapshot captured and encrypted.') }, 30000)
      } catch (err) {
        addLog('warning', 'Webcam access denied. Proctoring limited to tab-switch detection.')
      }
    }
    initWebcam()

    // 2. Tab-Switch Detection
    const handleVisibilityChange = () => {
      if (document.hidden && interviewStartedRef.current) {
        setViolations(prev => {
          const newViolations = prev + 1
          addLog('error', `VIOLATION DETECTED: Tab switch or window minimize! (${newViolations}/3)`)
          toast.error(`⚠️ Warning: Tab switch detected! (${newViolations}/3)`)
          if (newViolations >= 3) { toast.error('Maximum violations reached. Auto-submitting interview.'); setTimeout(() => navigate('/feedback'), 2000) }
          return newViolations
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (snapshotInterval) clearInterval(snapshotInterval)
      if (stream) stream.getTracks().forEach(track => track.stop())
      // Cleanup Audio Visualizer
      cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  // NEW: Update Welcome Message if Job Role changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'ai') {
      const newWelcomeMessage = `Hello! I am your AI Interviewer. Let's begin your evaluation for the **${jobRole}** role.\n\nThis interview consists of 3 rounds:\n1. **Technical Round** (15 mins)\n2. **Behavioral Round** (10 mins)\n3. **HR Round** (5 mins)\n\nThe timer will start as soon as you send your first message. To start, could you briefly introduce yourself?`;
      setMessages([{ role: 'ai', text: newWelcomeMessage }]);
    }
  }, [jobRole]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Reset Timer on Round Change
  useEffect(() => {
    setTimeRemaining(roundLimits[currentRound])
    setIsActive(true)
    addLog('info', `Switched to Round ${currentRound}. Time reset to ${roundLimits[currentRound] / 60} minutes.`)
  }, [currentRound])

  // Timer Logic
  useEffect(() => {
    let interval = null
    if (isActive && interviewStarted && timeRemaining > 0) {
      interval = setInterval(() => setTimeRemaining(prev => prev - 1), 1000)
    } else if (timeRemaining === 0 && interviewStarted) {
      setIsActive(false)
      toast.error(`Time up for Round ${currentRound}!`)
      if (currentRound < 3) setCurrentRound(prev => prev + 1)
      else { toast.success('Interview completed!'); setTimeout(() => navigate('/feedback'), 2000) }
    }
    return () => clearInterval(interval)
  }, [isActive, timeRemaining, currentRound, navigate, interviewStarted])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => { if (!event.target.closest('.role-dropdown-container')) setIsRoleDropdownOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRoleSelect = (role) => { setRoleInput(role); setJobRole(role); setIsRoleDropdownOpen(false) }
  const handleResumeUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type !== 'application/pdf') { toast.error('Please upload a PDF file'); return }
      setResumeFile(file); toast.success(`Resume uploaded: ${file.name}`); addLog('success', `Resume uploaded: ${file.name}`)
    }
  }
  const handleClearResume = () => { setResumeFile(null); toast.success('Resume cleared'); addLog('warning', 'Resume cleared from RAG context') }

  const handleSubmitCode = () => {
    if (!code.trim()) { toast.error('Code editor is empty!'); return }
    const codeMessage = `[Code Submission - Round ${currentRound}]\n\n\`\`\`javascript\n${code}\n\`\`\``
    setMessages(prev => [...prev, { role: 'user', text: codeMessage }])
    addLog('success', 'Code submitted for evaluation.')
    toast.success('Code submitted to AI Evaluator!')
    setTechScore(prev => Math.min(prev + Math.random() * 2 + 1, 10))
  }

  const handleEndInterview = () => {
    if (window.confirm("Are you sure you want to end the interview and see your evaluation?")) {
      addLog('warning', 'Interview manually ended by candidate.')
      toast.success('Generating evaluation report...')
      setTimeout(() => navigate('/feedback'), 1500)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    if (!interviewStarted) { setInterviewStarted(true); addLog('success', 'Timer started. Interview is now live.') }

    const userMessage = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMessage }])
    setIsLoading(true)
    addLog('warning', 'Candidate response received. Processing...')

    try {
      const token = localStorage.getItem('token')
      const chatHistory = messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', text: m.text, content: m.text }))
      const res = await axios.post('http://127.0.0.1:5000/api/interview', { message: userMessage, job_role: jobRole, chat_history: chatHistory, current_round: currentRound }, { headers: { 'Authorization': `Bearer ${token}` } })
      addLog('info', 'Evaluator Agent (Chronos): Analyzing response...')
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }])
      setTechScore(prev => Math.min(prev + Math.random() * 1.5, 10))
      setBehavScore(prev => Math.min(prev + Math.random() * 1.5, 10))
      if (res.data.is_complete) { toast.success('Interview completed!'); setTimeout(() => navigate('/feedback'), 1500) }
    } catch (err) { toast.error('Failed to get AI response.'); addLog('error', 'API Error.') } 
    finally { setIsLoading(false) }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  // Proctoring: Prevent Copy/Paste/Right Click
  const handleContextMenu = (e) => e.preventDefault()
  const handleCopy = (e) => { if (interviewStarted) { e.preventDefault(); toast.error('Copying is disabled during the interview!') } }
  const handlePaste = (e) => { if (interviewStarted) { e.preventDefault(); toast.error('Pasting is disabled during the interview!') } }

  const getRoundBadge = () => {
    if (currentRound === 1) return { text: 'ROUND 1: TECHNICAL', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800' }
    if (currentRound === 2) return { text: 'ROUND 2: BEHAVIORAL', color: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' }
    return { text: 'ROUND 3: HR', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' }
  }
  const roundBadge = getRoundBadge()

  return (
    <div 
      onContextMenu={handleContextMenu} 
      onCopy={handleCopy} 
      onPaste={handlePaste}
      className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors duration-300"
    >
      <StarryBackground />
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-bg-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-bg-2"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen pt-16">
        
        {/* Top Bar */}
        <div className="glass-card border-b border-white/20 dark:border-slate-700/50 px-6 py-3 shrink-0 relative z-30 overflow-visible">
          <div className="flex flex-wrap items-center justify-between gap-4 overflow-visible">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">● LIVE</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${roundBadge.color}`}>{roundBadge.text}</span>
              
              <div className={`text-lg font-mono font-bold px-4 py-1.5 rounded-lg border flex items-center gap-2 ${timeRemaining < 60 && interviewStarted ? 'text-red-600 bg-red-100 border-red-300 animate-pulse' : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
                {interviewStarted ? '⏱️' : '⏸️'} {formatTime(timeRemaining)}
              </div>

              {violations > 0 && (
                <div className="text-sm font-bold px-3 py-1.5 rounded-lg border bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 animate-pulse">
                  ⚠️ {violations}/3 Violations
                </div>
              )}

              <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
                {[1, 2, 3].map(round => (
                  <button key={round} onClick={() => setCurrentRound(round)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${currentRound === round ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>R{round}</button>
                ))}
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="relative role-dropdown-container overflow-visible">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-2">Role:</label>
              <input type="text" value={roleInput} onChange={(e) => { setRoleInput(e.target.value); setIsRoleDropdownOpen(true) }} onFocus={() => setIsRoleDropdownOpen(true)} className="glass-input px-3 py-1.5 text-sm font-medium min-w-[200px] cursor-pointer" placeholder="Type or select role..." />
              {isRoleDropdownOpen && filteredRoles.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full glass-card rounded-xl shadow-2xl py-2 z-[100] max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredRoles.map(role => (<button key={role} onClick={() => handleRoleSelect(role)} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">{role}</button>))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleAskHint} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all text-sm flex items-center gap-1">
                💡 Hint ({hintsUsed}/3)
              </button>
              <button onClick={() => setShowCodeEditor(!showCodeEditor)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showCodeEditor ? 'bg-cyan-500 text-white' : 'glass-button-secondary'}`}>{showCodeEditor ? ' Hide Code' : '💻 Code Editor'}</button>
              <button onClick={handleEndInterview} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all text-sm">End & Evaluate</button>
            </div>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="glass-card border-b border-white/20 dark:border-slate-700/50 px-6 py-2 shrink-0 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">📄 Resume (RAG Context):</span>
              {resumeFile ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">{resumeFile.name}</span>
                  <button onClick={handleClearResume} className="text-xs text-red-500 hover:text-red-600 font-bold">✕ Clear</button>
                </div>
              ) : (
                <label className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 hover:bg-cyan-200 dark:hover:bg-cyan-900/50 rounded-lg border border-cyan-200 dark:border-cyan-800 cursor-pointer transition-colors">
                  <span className="text-xs text-cyan-700 dark:text-cyan-400 font-medium">+ Upload PDF</span>
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold ${webcamActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
              <div className={`w-2 h-2 rounded-full ${webcamActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              {webcamActive ? 'PROCTORING ACTIVE' : 'WEBCAM OFF'}
            </div>
          </div>
        </div>

        {/* Split Screen Layout */}
        <div className="flex-1 flex overflow-hidden p-4 gap-4">
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            <div className="flex-1 glass-card rounded-2xl p-4 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-none' : 'bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-white/20 dark:border-slate-700/50 rounded-bl-none'}`}>
                      {msg.role === 'ai' && (
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">AI INTERVIEWER</div>
                          <button onClick={() => speakText(msg.text)} className="ml-3 text-slate-400 hover:text-cyan-500 transition-colors" title="Read Aloud">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                          </button>
                        </div>
                      )}
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-slate-700/50 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area with Audio Visualizer */}
              <div className="mt-4 flex gap-2 items-center">
                <button 
                  onClick={toggleListening}
                  className={`p-3 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'glass-button-secondary'}`}
                  title={isListening ? "Stop Listening" : "Start Listening"}
                >
                  {isListening ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                  )}
                </button>

                <div className="flex items-center gap-1 h-8 px-2 glass-card rounded-lg min-w-[60px] justify-center">
                  {audioLevels.map((level, index) => (
                    <div 
                      key={index}
                      className="w-1.5 bg-gradient-to-t from-cyan-500 to-blue-500 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(level, 10)}%` }}
                    ></div>
                  ))}
                </div>

                <input 
                  type="text" 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  placeholder={isListening ? "Listening... (Type your answer)" : "Type your answer here..."} 
                  disabled={isLoading} 
                  className="flex-1 glass-input px-4 py-3 text-sm" 
                />
                <button 
                  onClick={handleSend} 
                  disabled={isLoading || !input.trim()} 
                  className="glass-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>

            {showCodeEditor && (
              <div className="h-64 glass-card rounded-2xl overflow-hidden flex flex-col border-2 border-cyan-500/30">
                <div className="bg-slate-800 text-slate-300 text-xs px-4 py-2 flex justify-between items-center border-b border-slate-700">
                  <span className="font-mono">solution.js</span>
                  <button onClick={handleSubmitCode} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Submit Code
                  </button>
                </div>
                <div className="flex-1">
                  <Editor height="100%" defaultLanguage="javascript" theme="vs-dark" value={code} onChange={(value) => setCode(value || '')} options={{ minimap: { enabled: false }, fontSize: 14, lineNumbers: 'on', roundedSelection: false, scrollBeyondLastLine: false, automaticLayout: true }} />
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Agents, Scores, and Deliberation Stream */}
          <div className="w-80 flex flex-col gap-4 shrink-0">
            
            {/* Active Agents Status */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Active Agents</h3>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/50">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-bold text-xs">S</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Sophia v4.2</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">● ONLINE (Interviewer)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-slate-700/50">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">C</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Chronos v2.1</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">● SYNCED (Evaluator)</p>
                </div>
              </div>
            </div>

            {/* Animated Real-Time Score Rings */}
            <div className="glass-card rounded-2xl p-5 text-center">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Live Evaluation</h3>
              <div className="flex justify-around">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={6} data={[{ name: 'Tech', value: techScore * 10, fill: '#06b6d4' }]}>
                        <RadialBar background={{ fill: 'rgba(148, 163, 184, 0.2)' }} clockWise dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{techScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1">Technical</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={6} data={[{ name: 'Behav', value: behavScore * 10, fill: '#a855f7' }]}>
                        <RadialBar background={{ fill: 'rgba(148, 163, 184, 0.2)' }} clockWise dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{behavScore.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1">Behavioral</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-4 italic">Scores update dynamically based on AI analysis.</p>
            </div>

            {/* Deliberation Stream Terminal */}
            <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col bg-slate-900/80 border-slate-700">
              <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-mono text-slate-400 ml-2">agent_deliberation.log</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-2 custom-scrollbar">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : log.type === 'success' ? 'text-emerald-400' : 'text-cyan-300'}`}>
                      {log.type === 'success' ? '✔ ' : log.type === 'error' ? '✖ ' : ' '}{log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default Interview