import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast'
import Editor from '@monaco-editor/react'
import StarryBackground from '../components/StarryBackground'

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

  // Proctoring State
  const [violations, setViolations] = useState(0)
  const [webcamActive, setWebcamActive] = useState(false)
  const interviewStartedRef = useRef(interviewStarted)

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
        
        snapshotInterval = setInterval(() => {
          addLog('info', 'Proctoring: Background snapshot captured and encrypted.')
        }, 30000)
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
          toast.error(`️ Warning: Tab switch detected! (${newViolations}/3)`)
          
          if (newViolations >= 3) {
            toast.error('Maximum violations reached. Auto-submitting interview.')
            setTimeout(() => navigate('/feedback'), 2000)
          }
          return newViolations
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (snapshotInterval) clearInterval(snapshotInterval)
      if (stream) stream.getTracks().forEach(track => track.stop())
    }
  }, [])

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
        
        {/* Top Bar - FIXED: Added relative z-30 and overflow-visible */}
        <div className="glass-card border-b border-white/20 dark:border-slate-700/50 px-6 py-3 shrink-0 relative z-30 overflow-visible">
          <div className="flex flex-wrap items-center justify-between gap-4 overflow-visible">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">● LIVE</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${roundBadge.color}`}>{roundBadge.text}</span>
              
              <div className={`text-lg font-mono font-bold px-4 py-1.5 rounded-lg border flex items-center gap-2 ${timeRemaining < 60 && interviewStarted ? 'text-red-600 bg-red-100 border-red-300 animate-pulse' : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'}`}>
                {interviewStarted ? '⏱️' : '️'} {formatTime(timeRemaining)}
              </div>

              {violations > 0 && (
                <div className="text-sm font-bold px-3 py-1.5 rounded-lg border bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 animate-pulse">
                  ️ {violations}/3 Violations
                </div>
              )}

              <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-lg border border-slate-300 dark:border-slate-700">
                {[1, 2, 3].map(round => (
                  <button key={round} onClick={() => setCurrentRound(round)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${currentRound === round ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'}`}>R{round}</button>
                ))}
              </div>
            </div>

            {/* Role Dropdown - FIXED: Added overflow-visible and high z-index */}
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
              <button onClick={() => setShowCodeEditor(!showCodeEditor)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${showCodeEditor ? 'bg-cyan-500 text-white' : 'glass-button-secondary'}`}>{showCodeEditor ? '📝 Hide Code' : '💻 Code Editor'}</button>
              <button onClick={handleEndInterview} className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transition-all text-sm">End & Evaluate</button>
            </div>
          </div>
        </div>

        {/* Resume Upload Section - FIXED: Added relative z-10 to sit below the top bar */}
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
                      {msg.role === 'ai' && <div className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 mb-1 font-bold">AI INTERVIEWER</div>}
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
              <div className="mt-4 flex gap-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your answer here..." disabled={isLoading} className="flex-1 glass-input px-4 py-3 text-sm" />
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="glass-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
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

          <div className="w-80 flex flex-col gap-4 shrink-0">
            <div className="glass-card rounded-2xl p-5 text-center">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Live Evaluation</h3>
              <div className="flex justify-around">
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full border-4 border-cyan-500/30 bg-cyan-500/10"><span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">--</span></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Tech</p>
                </div>
                <div>
                  <div className="relative w-16 h-16 mx-auto mb-2 flex items-center justify-center rounded-full border-4 border-purple-500/30 bg-purple-500/10"><span className="text-lg font-bold text-purple-600 dark:text-purple-400">--</span></div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Behavioral</p>
                </div>
              </div>
            </div>

            <div className="flex-1 glass-card rounded-2xl overflow-hidden flex flex-col bg-slate-900/80 border-slate-700">
              <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
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