import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignupRequest = async (e) => {
    e.preventDefault()
    setIsLoading(true); setError(''); setMessage('')
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/signup', { name, email, password })
      setMessage(res.data.message)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed')
    } finally { setIsLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true); setError('')
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/verify-signup-otp', { email, otp })
      setMessage(res.data.message)
      setTimeout(() => navigate('/'), 2000) // Redirect to login after success
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP')
    } finally { setIsLoading(false) }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#2E5C8A' }}>{step === 1 ? 'Create Account' : 'Enter OTP'}</h2>
      
      {error && <p style={{ color: 'red', textAlign: 'center', backgroundColor: '#ffe6e6', padding: '10px', borderRadius: '5px' }}>{error}</p>}
      {message && <p style={{ color: 'green', textAlign: 'center', backgroundColor: '#e6ffe6', padding: '10px', borderRadius: '5px' }}>{message}</p>}

      {step === 1 ? (
        <form onSubmit={handleSignupRequest}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <p style={{ textAlign: 'center', color: '#666' }}>We sent a 6-digit code to {email}</p>
          <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', textAlign: 'center', fontSize: '18px', letterSpacing: '5px' }} />
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            {isLoading ? 'Verifying...' : 'Verify & Signup'}
          </button>
          <button type="button" onClick={() => setStep(1)} style={{ width: '100%', padding: '10px', marginTop: '10px', backgroundColor: 'transparent', color: '#2E5C8A', border: 'none', cursor: 'pointer' }}>
            Back to Signup
          </button>
        </form>
      )}
    </div>
  )
}

export default Signup