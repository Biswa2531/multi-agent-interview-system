import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    
    try {
      if (isSignup) {
        const response = await axios.post('http://127.0.0.1:5000/api/signup', formData)
        setMessage(response.data.message)
        setMessageType('success')
        setIsSignup(false) 
      } else {
        const response = await axios.post('http://127.0.0.1:5000/api/login', formData)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setMessage('Login successful! Redirecting...')
        setMessageType('success')
        setTimeout(() => navigate('/interview'), 1000)
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'An error occurred')
      setMessageType('error')
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#2E5C8A', marginBottom: '20px' }}>
        {isSignup ? 'Create Account' : 'Login to Your Account'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2E5C8A', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
          {isSignup ? 'Sign Up' : 'Login'}
        </button>
      </form>
      
      {message && (
        <p style={{ textAlign: 'center', marginTop: '15px', color: messageType === 'success' ? 'green' : 'red', fontWeight: 'bold' }}>
          {message}
        </p>
      )}
      
      <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <button onClick={() => setIsSignup(!isSignup)} style={{ background: 'none', border: 'none', color: '#2E5C8A', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>
          {isSignup ? 'Login here' : 'Sign Up here'}
        </button>
      </p>
    </div>
  )
}

export default Login