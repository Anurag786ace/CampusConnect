'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isPastEvent, isFullEvent } from '@/data/events'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/components/AuthProvider'
import { useStore } from '@/components/StoreProvider'
import { logToTerminal } from '@/lib/logger'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { currentUser, setCurrentUserId } = useAuth()
  const { events, registrations, registerForEvent } = useStore()

  const [email, setEmail] = useState('aditi.rao@campus.edu')
  const [department, setDepartment] = useState('Computer Science')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const event = events.find((e) => e.id === params.id)

  // Hide cancelled events from students on the detail page as well
  if (!event || (event.cancelled && currentUser.role === 'student')) {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This event isn't on the board"
          description="It may have been removed or cancelled by the organizer. Head back to the full listing to find what you're looking for."
          action={
            <Link href="/events" className="btn btn-primary">
              Back to events
            </Link>
          }
        />
      </section>
    )
  }

  const past = isPastEvent(event)
  const full = isFullEvent(event)
  const status = event.cancelled
    ? 'cancelled'
    : past
      ? 'past'
      : full
        ? 'full'
        : 'open'

  // Check if current user is already registered
  const existingRegistration = registrations.find(
    (reg) =>
      reg.eventId === event.id &&
      reg.studentId === currentUser.id &&
      reg.status === 'confirmed',
  )
  const isRegistered = Boolean(existingRegistration)

  const isStudent = currentUser.role === 'student'
  const canRegister =
    isStudent && !isRegistered && !past && !full && !event.cancelled

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isStudent) {
      const msg = 'Only student accounts can register. Switch to a student account from the menu above.'
      setFeedback({ type: 'error', text: msg })
      logToTerminal({ type: 'MESSAGE', message: msg, level: 'error' })
      return
    }

    if (isRegistered) {
      const msg = 'You are already registered for this event.'
      setFeedback({ type: 'error', text: msg })
      logToTerminal({ type: 'MESSAGE', message: msg, level: 'error' })
      return
    }

    if (full || event.seatsAvailable <= 0) {
      const msg = 'This event is full. No seats are available.'
      setFeedback({ type: 'error', text: msg })
      logToTerminal({ type: 'MESSAGE', message: msg, level: 'error' })
      return
    }

    if (past) {
      const msg = 'Cannot register for a past event.'
      setFeedback({ type: 'error', text: msg })
      logToTerminal({ type: 'MESSAGE', message: msg, level: 'error' })
      return
    }

    if (event.cancelled) {
      const msg = 'Cannot register for a cancelled event.'
      setFeedback({ type: 'error', text: msg })
      logToTerminal({ type: 'MESSAGE', message: msg, level: 'error' })
      return
    }

    setIsSubmitting(true)
    const result = registerForEvent(event.id, currentUser.id)
    setIsSubmitting(false)

    setFeedback({
      type: result.success ? 'success' : 'error',
      text: result.message,
    })
    logToTerminal({
      type: 'MESSAGE',
      message: result.message,
      level: result.success ? 'info' : 'error',
    })
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <Link
        href="/events"
        style={{ fontSize: 13.5, fontWeight: 600, textDecoration: 'none' }}
      >
        ← All events
      </Link>

      {feedback && (
        <div
          role="alert"
          style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 'var(--radius)',
            border: `1.5px solid ${
              feedback.type === 'success' ? 'var(--green)' : 'var(--rust)'
            }`,
            background:
              feedback.type === 'success'
                ? 'var(--green-bg)'
                : 'var(--rust-bg)',
            color: feedback.type === 'success' ? 'var(--green)' : 'var(--rust)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>{feedback.text}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {feedback.type === 'success' && (
              <Link
                href="/registrations"
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                }}
              >
                View in My Registrations →
              </Link>
            )}
            <button
              onClick={() => setFeedback(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {event.cancelled && (
        <div
          role="alert"
          style={{
            marginTop: 20,
            padding: '14px 18px',
            borderRadius: 'var(--radius)',
            border: '1.5px solid var(--rust)',
            background: 'var(--rust-bg)',
            color: 'var(--rust)',
          }}
        >
          ⚠️ This event has been cancelled by the organizer.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: 32,
          marginTop: 20,
        }}
        className="hero-grid"
      >
        {/* Left Column: Event Overview & Registration Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <span className="eyebrow-tag">{event.category}</span>
            <h1 style={{ fontSize: 32, marginTop: 12 }}>{event.name}</h1>
            <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6 }}>
              {event.description}
            </p>
          </div>

          {/* Student Registration Form Card */}
          <div className="card-surface" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <h2 style={{ fontSize: 21 }}>Student Registration</h2>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    color:
                      event.seatsAvailable <= 5
                        ? 'var(--rust)'
                        : 'var(--green)',
                    fontWeight: 600,
                  }}
                >
                  {event.seatsAvailable > 0
                    ? `${event.seatsAvailable} seats remaining`
                    : 'Sold out'}
                </span>
              </div>
              <p style={{ marginTop: 6, fontSize: 14 }}>
                Fill out the registration details below to reserve your ticket.
              </p>
            </div>

            {!isStudent ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--slate-bg)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 14, color: 'var(--ink)' }}>
                  You are currently logged in as an organizer (
                  <strong>{currentUser.name}</strong>). Registration is
                  reserved for student accounts.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCurrentUserId('stu-1')}
                  style={{ width: 'fit-content', fontSize: 13 }}
                >
                  Switch to Student Account (Aditi Rao)
                </button>
              </div>
            ) : isRegistered ? (
              <div
                style={{
                  padding: 20,
                  borderRadius: 'var(--radius)',
                  background: 'var(--green-bg)',
                  border: '1.5px solid var(--green)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontWeight: 700,
                    color: 'var(--green)',
                    fontSize: 16,
                  }}
                >
                  <span>✓</span> You have confirmed registration for this event
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>
                  Registration ID:{' '}
                  <code>{existingRegistration?.id || 'reg-confirmed'}</code> ·
                  Booked for <strong>{currentUser.name}</strong> ({currentUser.id})
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <Link href="/registrations" className="btn btn-primary">
                    Manage in My Registrations
                  </Link>
                </div>
              </div>
            ) : past ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--slate-bg)',
                  color: 'var(--ink-soft)',
                  fontSize: 14,
                }}
              >
                This event took place on {formatDate(event.date)}. Registrations
                have concluded.
              </div>
            ) : event.cancelled ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--rust-bg)',
                  color: 'var(--rust)',
                  fontSize: 14,
                }}
              >
                This event has been cancelled by campus organizers.
              </div>
            ) : full ? (
              <div
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius)',
                  background: 'var(--rust-bg)',
                  color: 'var(--rust)',
                  fontSize: 14,
                }}
              >
                This event has reached full capacity ({event.capacity}/
                {event.capacity} seats booked). Please check back later if a seat
                is cancelled.
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label">Student Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={currentUser.name}
                      readOnly
                      style={{ background: 'var(--slate-bg)', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student ID</label>
                    <input
                      type="text"
                      className="form-input"
                      value={currentUser.id}
                      readOnly
                      style={{ background: 'var(--slate-bg)', cursor: 'not-allowed' }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 14,
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">
                      Campus Email *
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-dept">
                      Department / Major *
                    </label>
                    <input
                      id="reg-dept"
                      type="text"
                      required
                      className="form-input"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-notes">
                    Notes / Requirements (Optional)
                  </label>
                  <textarea
                    id="reg-notes"
                    rows={2}
                    className="form-textarea"
                    placeholder="Dietary preferences, accessibility needs, or team members..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div style={{ marginTop: 20 }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!canRegister || isSubmitting}
                    style={{ width: '100%', padding: '12px' }}
                  >
                    {isSubmitting
                      ? 'Registering your seat…'
                      : `Complete Registration for ${event.name}`}
                  </button>
                  <p
                    style={{
                      fontSize: 12.5,
                      color: 'var(--ink-soft)',
                      textAlign: 'center',
                      marginTop: 8,
                    }}
                  >
                    Available seats will update immediately. You can cancel your
                    seat at any time from My Registrations.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Event Details Summary */}
        <aside
          className="card-surface"
          style={{
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            height: 'fit-content',
          }}
        >
          <StatusBadge status={status} />
          <Detail label="Date" value={formatDate(event.date)} />
          <Detail label="Time" value={formatTime(event.date)} />
          <Detail label="Venue" value={event.venue} />
          <Detail
            label="Available Seats"
            value={`${event.seatsAvailable} of ${event.capacity} total`}
          />
          <Detail label="Organized by" value={event.organizerId} />

          <hr
            style={{
              border: 'none',
              borderTop: '1px solid var(--line)',
              margin: '6px 0',
            }}
          />

          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
            <strong>Registration Policy:</strong> Seats are confirmed on a
            first-come, first-served basis. No duplicate registrations are
            permitted per student.
          </div>
        </aside>
      </div>
    </section>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 500 }}>{value}</div>
    </div>
  )
}


