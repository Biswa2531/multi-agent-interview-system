import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Interview from './pages/Interview'
import Dashboard from './pages/Dashboard'
import Feedback from './pages/Feedback'

function App() {
  return (
    <Router>
      {/* Navigation Bar */}
      <nav style={{ backgroundColor: '#2E5C8A', padding: '15px', display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>🏠 Home / Login</Link>
        <Link to="/interview" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>️ Take Interview</Link>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>📊 Dashboard</Link>
      </nav>

      {/* Route Definitions */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Router>
  )
}

export default App