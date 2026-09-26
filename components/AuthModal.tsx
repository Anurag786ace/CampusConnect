'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = 'login',
}: AuthModalProps) {
  const { registerNewStudent, loginStudent, allUsers } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    branch: 'Computer Science',
    studentId: '',
  })
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  if (!isOpen) return null

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)

    const res = loginStudent(loginIdentifier)
    if (res.success) {
      setFeedback({ type: 'success', text: res.message })
      setTimeout(() => {
        onClose()
        setFeedback(null)
        setLoginIdentifier('')
      }, 700)
    } else {
      setLoginError(res.message)
    }
  }

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRegisterErrors({})
    setFeedback(null)

    const res = registerNewStudent({
      name: registerForm.name,
      email: registerForm.email,
      branch: registerForm.branch,
      studentId: registerForm.studentId || undefined,
    })

    if (res.success) {
      setFeedback({ type: 'success', text: res.message })
      setTimeout(() => {
        onClose()
        setFeedback(null)
        setRegisterForm({
          name: '',
          email: '',
          branch: 'Computer Science',
          studentId: '',
        })
      }, 800)
    } else {
      if (res.errors) {
        setRegisterErrors(res.errors)
      }
      setFeedback({ type: 'error', text: res.message })
    }
  }

  const studentsList = allUsers.filter((u) => u.role === 'student')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="card-surface"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          padding: '28px 24px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: 'var(--ink-soft)',
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1.5px solid var(--line)',
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => {
              setMode('login')
              setFeedback(null)
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              color: mode === 'login' ? 'var(--ink)' : 'var(--ink-soft)',
              borderBottom: mode === 'login' ? '2.5px solid var(--amber)' : 'none',
            }}
          >
            Student Login
          </button>
          <button
            onClick={() => {
              setMode('register')
              setFeedback(null)
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              color: mode === 'register' ? 'var(--ink)' : 'var(--ink-soft)',
              borderBottom: mode === 'register' ? '2.5px solid var(--amber)' : 'none',
            }}
          >
            Register New Student
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: 14,
              border: `1.5px solid ${feedback.type === 'success' ? 'var(--green)' : 'var(--rust)'}`,
              background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--rust-bg)',
              color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
            }}
          >
            {feedback.text}
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === 'login' ? (
          <div>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 18 }}>
              Sign in with your campus Student ID or registered email address.
            </p>

            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label
                  htmlFor="login-id"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
                >
                  Student ID or Campus Email
                </label>
                <input
                  id="login-id"
                  type="text"
                  placeholder="e.g. stu-1 or aditi@campus.edu"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                  autoFocus
                />
                {loginError && (
                  <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 6 }}>
                    {loginError}
                  </p>
                )}
              </div>

              {/* Quick Select for existing students */}
              {studentsList.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>
                    Or select an existing student:
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {studentsList.map((stu) => (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => setLoginIdentifier(stu.id)}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                      >
                        {stu.name} ({stu.id})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: 15 }}
              >
                Sign In as Student
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              New to Campus Connect?{' '}
              <button
                onClick={() => {
                  setMode('register')
                  setLoginError(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--amber-ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Register a new student account →
              </button>
            </div>
          </div>
        ) : (
          /* REGISTER MODE */
          <div>
            <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 18 }}>
              Create a new student profile to register for campus hackathons, sports, and cultural events.
            </p>

            <form onSubmit={handleRegisterSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="reg-name"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}
                >
                  Full Name *
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1.5px solid ${registerErrors.name ? 'var(--rust)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                  autoFocus
                />
                {registerErrors.name && (
                  <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 4 }}>
                    {registerErrors.name}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="reg-email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}
                >
                  Campus Email *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. priya@campus.edu"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1.5px solid ${registerErrors.email ? 'var(--rust)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                />
                {registerErrors.email && (
                  <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 4 }}>
                    {registerErrors.email}
                  </p>
                )}
              </div>

              <div style={{ marginBottom: 14 }}>
                <label
                  htmlFor="reg-branch"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}
                >
                  Branch / Department
                </label>
                <select
                  id="reg-branch"
                  value={registerForm.branch}
                  onChange={(e) => setRegisterForm({ ...registerForm, branch: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                >
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Information Tech">Information Technology</option>
                  <option value="Electronics">Electronics & Communication</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Design">Design & Architecture</option>
                  <option value="Management">Business & Management</option>
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label
                  htmlFor="reg-id"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}
                >
                  Custom Student ID <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(Optional)</span>
                </label>
                <input
                  id="reg-id"
                  type="text"
                  placeholder="Auto-generated (e.g. stu-2) if left blank"
                  value={registerForm.studentId}
                  onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1.5px solid ${registerErrors.studentId ? 'var(--rust)' : 'var(--line)'}`,
                    borderRadius: 'var(--radius)',
                    fontSize: 14.5,
                    background: 'var(--paper-raised)',
                  }}
                />
                {registerErrors.studentId && (
                  <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 4 }}>
                    {registerErrors.studentId}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px 16px', fontSize: 15 }}
              >
                Create Student Account
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Already registered?{' '}
              <button
                onClick={() => {
                  setMode('login')
                  setFeedback(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--amber-ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign in to your account →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
