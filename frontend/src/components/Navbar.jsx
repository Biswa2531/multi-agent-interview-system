import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    
    if (token && user) {
      setIsLoggedIn(true)
      try {
        const userData = JSON.parse(user)
        setUserName(userData.name || 'User')
      } catch (e) {
        setUserName('User')
      }
    } else {
      setIsLoggedIn(false)
    }
  }, [location]) // Re-run when page changes

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <nav style={{ 
      backgroundColor: '#2E5C8A', 
      padding: '15px 0', 
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
      marginBottom: '30px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 20px'
      }}>
        {/* Logo / Brand */}
        <Link to="/" style={{ 
          color: 'white', 
          fontSize: '24px', 
          fontWeight: 'bold', 
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '28px' }}>🎓</span>
          AI Interview System
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {!isLoggedIn ? (
            // Show Login and Sign Up when NOT logged in
            <>
              <Link to="/" style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 15px',
                borderRadius: '5px',
                backgroundColor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.3s',
                fontWeight: location.pathname === '/' ? 'bold' : 'normal'
              }}>
                🔐 Login
              </Link>
              <Link to="/signup" style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 15px',
                borderRadius: '5px',
                backgroundColor: location.pathname === '/signup' ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.3s',
                fontWeight: location.pathname === '/signup' ? 'bold' : 'normal'
              }}>
                📝 Sign Up
              </Link>
            </>
          ) : (
            // Show Dashboard, Take Interview, and Logout when logged in
            <>
              <Link to="/dashboard" style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 15px',
                borderRadius: '5px',
                backgroundColor: location.pathname === '/dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.3s',
                fontWeight: location.pathname === '/dashboard' ? 'bold' : 'normal'
              }}>
                 Dashboard
              </Link>
              <Link to="/interview" style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '8px 15px',
                borderRadius: '5px',
                backgroundColor: location.pathname === '/interview' ? 'rgba(255,255,255,0.2)' : 'transparent',
                transition: 'all 0.3s',
                fontWeight: location.pathname === '/interview' ? 'bold' : 'normal'
              }}>
                💼 Take Interview
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.8)', marginRight: '10px' }}>
                👋 Hi, {userName}
              </span>
              <button 
                onClick={handleLogout}
                style={{ 
                  padding: '8px 15px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
              >
                🚪 Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar