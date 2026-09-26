'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { registerNewStudent } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    branch: 'Computer Science',
    studentId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFeedback(null)

    const res = registerNewStudent({
      name: formData.name,
      email: formData.email,
      branch: formData.branch,
      studentId: formData.studentId || undefined,
    })

    if (res.success) {
      setFeedback({ type: 'success', text: res.message })
      setTimeout(() => {
        router.push('/events')
      }, 900)
    } else {
      if (res.errors) setErrors(res.errors)
      setFeedback({ type: 'error', text: res.message })
    }
  }

  return (
    <section className="shell" style={{ padding: '50px 0 80px', maxWidth: 540, margin: '0 auto' }}>
      <div className="card-surface" style={{ padding: '36px 32px' }}>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <span className="eyebrow-tag">student registration</span>
          <h1 style={{ fontSize: 28, marginTop: 8 }}>Register New Student</h1>
          <p style={{ marginTop: 8, fontSize: 14.5, color: 'var(--ink-soft)' }}>
            Join Campus Connect to book seats for workshops, hackathons, and tournaments.
          </p>
        </div>

        {feedback && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius)',
              background: feedback.type === 'success' ? 'var(--green-bg)' : 'var(--rust-bg)',
              color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
              border: `1.5px solid ${feedback.type === 'success' ? 'var(--green)' : 'var(--rust)'}`,
              marginBottom: 20,
              fontSize: 14,
            }}
          >
            {feedback.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="reg-name"
              style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}
            >
              Full Name *
            </label>
            <input
              id="reg-name"
              type="text"
              placeholder="e.g. Priya Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${errors.name ? 'var(--rust)' : 'var(--line)'}`,
                borderRadius: 'var(--radius)',
                fontSize: 15,
                background: 'var(--paper-raised)',
              }}
              autoFocus
            />
            {errors.name && (
              <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 5 }}>
                {errors.name}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="reg-email"
              style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}
            >
              Campus Email Address *
            </label>
            <input
              id="reg-email"
              type="email"
              placeholder="e.g. priya.sharma@campus.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${errors.email ? 'var(--rust)' : 'var(--line)'}`,
                borderRadius: 'var(--radius)',
                fontSize: 15,
                background: 'var(--paper-raised)',
              }}
            />
            {errors.email && (
              <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 5 }}>
                {errors.email}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="reg-branch"
              style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}
            >
              Department / Branch
            </label>
            <select
              id="reg-branch"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: '1.5px solid var(--line)',
                borderRadius: 'var(--radius)',
                fontSize: 15,
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

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="reg-id"
              style={{ display: 'block', fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}
            >
              Custom Student ID <span style={{ fontWeight: 400, color: 'var(--ink-soft)' }}>(Optional)</span>
            </label>
            <input
              id="reg-id"
              type="text"
              placeholder="Leave blank to auto-generate (e.g. stu-2)"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              style={{
                width: '100%',
                padding: '11px 14px',
                border: `1.5px solid ${errors.studentId ? 'var(--rust)' : 'var(--line)'}`,
                borderRadius: 'var(--radius)',
                fontSize: 15,
                background: 'var(--paper-raised)',
              }}
            />
            {errors.studentId && (
              <p style={{ color: 'var(--rust)', fontSize: 12.5, marginTop: 5 }}>
                {errors.studentId}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 20px', fontSize: 15 }}
          >
            Create Student Account
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
          Already have an account?{' '}
          <Link
            href="/login"
            style={{ color: 'var(--amber-ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign in to existing account →
          </Link>
        </div>
      </div>
    </section>
  )
}
