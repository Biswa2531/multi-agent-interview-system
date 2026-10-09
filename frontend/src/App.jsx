import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast' // Import Toaster
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Interview from './pages/Interview'
import Feedback from './pages/Feedback'

function App() {
  return (
    <Router>
      {/* This makes the beautiful pop-up notifications appear on every page */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '16px',
          },
          success: {
            iconTheme: { primary: '#28a745', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc3545', secondary: '#fff' },
          },
        }}
      />

      <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f8', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/interview" element={<Interview />} />
            <Route path="/feedback" element={<Feedback />} />
          </Routes>
        </main>
        <footer style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px', borderTop: '1px solid #e0e0e0', backgroundColor: '#ffffff' }}>
          © 2024 Multi-Agent AI Interview System. All rights reserved.
        </footer>
      </div>
    </Router>
  )
}

export default App