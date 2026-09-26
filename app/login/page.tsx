'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { loginStudent, allUsers, currentUser } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const res = loginStudent(identifier)
    if (res.success) {
      setSuccess(res.message)
      setTimeout(() => {
        router.push('/events')
      }, 700)
    } else {
      setError(res.message)
    }
  }

  const studentsList = allUsers.filter((u) => u.role === 'student')

  return (
    <section className="shell" style={{ padding: '60px 0 80px', maxWidth: 520, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: '36px 32px' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <span className="eyebrow-tag">account access</span>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Student Login</h1>
          <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--ink-soft)' }}>
            Sign in with your Student ID or registered campus email.
          </p>
        </div>

        {success && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--green-bg)',
              color: 'var(--green)',
              border: '1.5px solid var(--green)',
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {success}
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: 'var(--rust-bg)',
              color: 'var(--rust)',
              border: '1.5px solid var(--rust)',
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              htmlFor="login-ident"
              style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}
            >
              Student ID or Email Address
            </label>
            <input
              id="login-ident"
              type="text"
              placeholder="e.g. stu-1 or aditi@campus.edu"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontSize: 15,
                background: 'var(--paper-raised)',
              }}
              autoFocus
            />
          </div>

          {studentsList.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', display: 'block', marginBottom: 8 }}>
                Or select an active student:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {studentsList.map((stu) => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => setIdentifier(stu.id)}
                    className={`btn ${currentUser.id === stu.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '5px 12px', fontSize: 12.5 }}
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
            style={{ width: '100%', padding: '12px 20px', fontSize: 15 }}
          >
            Sign In
          </button>
        </form>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1.5px solid var(--line)',
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--ink-soft)',
          }}
        >
          New student?{' '}
          <Link
            href="/register"
            style={{ color: 'var(--amber-ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            Register your student account →
          </Link>
        </div>
      </div>
    </section>
  )
}
