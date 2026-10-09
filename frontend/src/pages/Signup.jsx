import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Signup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignupRequest = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/signup', { name, email, password })
      toast.success(res.data.message)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed')
    } finally { setIsLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/verify-signup-otp', { email, otp })
      toast.success('Account created successfully!')
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
    } finally { setIsLoading(false) }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#2E5C8A', marginTop: 0 }}>{step === 1 ? 'Create Account' : 'Verify Email'}</h2>
      
      {step === 1 ? (
        <form onSubmit={handleSignupRequest}>
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
            {isLoading ? 'Sending OTP...' : 'Send OTP'}
          </button>
          <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
            Already have an account? <a href="/" style={{ color: '#2E5C8A', textDecoration: 'none', fontWeight: 'bold' }}>Login here</a>
          </p>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>We sent a 6-digit code to <strong>{email}</strong></p>
          <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }} />
          <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
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