import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSendOTP = async () => {
    if (!email) return toast.error('Please enter your email')
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/forgot-password-request', { email })
      toast.success(res.data.message)
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndReset = async () => {
    if (otp.length !== 6) return toast.error('Please enter a valid 6-digit OTP')
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match')
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    
    setIsLoading(true)
    try {
      const res = await axios.post('http://127.0.0.1:5000/api/forgot-password-verify', { email, otp, new_password: newPassword })
      toast.success(res.data.message)
      setStep(4)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1); setEmail(''); setOtp(''); setNewPassword(''); setConfirmPassword('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md relative shadow-2xl border border-white/20 dark:border-slate-700">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl">✕</button>
        
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-white">
          {step === 1 && 'Reset Password'} {step === 2 && 'Verify OTP'} {step === 3 && 'Set New Password'} {step === 4 && 'Success!'}
        </h2>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Enter your registered email to receive a reset OTP.</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="glass-input w-full px-4 py-3 rounded-lg text-sm" />
            <button onClick={handleSendOTP} disabled={isLoading} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg disabled:opacity-50">{isLoading ? 'Sending...' : 'Send OTP'}</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Enter the 6-digit OTP sent to <span className="font-bold text-cyan-500">{email}</span></p>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength="6" className="glass-input w-full px-4 py-3 rounded-lg text-sm text-center tracking-widest font-mono" />
            <button onClick={() => setStep(3)} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg">Next</button>
            <button onClick={() => setStep(1)} className="w-full text-sm text-slate-500 hover:text-cyan-500">Change Email</button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">Create a new strong password.</p>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" className="glass-input w-full px-4 py-3 rounded-lg text-sm" />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="glass-input w-full px-4 py-3 rounded-lg text-sm" />
            <button onClick={handleVerifyAndReset} disabled={isLoading} className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3 rounded-lg disabled:opacity-50">{isLoading ? 'Resetting...' : 'Reset Password'}</button>
            <button onClick={() => setStep(2)} className="w-full text-sm text-slate-500 hover:text-cyan-500">Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-3xl">✔</div>
            <p className="text-slate-600 dark:text-slate-400">Your password has been successfully reset!</p>
            <button onClick={handleClose} className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-3 rounded-lg">Back to Login</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordModal