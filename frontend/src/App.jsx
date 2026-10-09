import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Import the new Navbar component
import Navbar from './components/Navbar'

// Import all your page components
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Feedback from './pages/Feedback'

function App() {
  return (
    <Router>
      {/* Main wrapper with a clean, professional light background */}
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f4f6f8', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        
        {/* The Navbar will show on EVERY page automatically */}
        <Navbar />
        
        {/* Main content area that changes based on the route */}
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </main>

        {/* Optional: Simple Footer */}
        <footer style={{ 
          textAlign: 'center', 
          padding: '20px', 
          color: '#666', 
          fontSize: '14px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#ffffff'
        }}>
          © 2026 Multi-Agent AI Interview System. All rights reserved.
        </footer>

      </div>
    </Router>
  )
}

export default App