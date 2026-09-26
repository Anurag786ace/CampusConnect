'use client'

import { useState } from 'react'
import Link from 'next/link'
import { isPastEvent, isFullEvent } from '@/data/events'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuth } from '@/components/AuthProvider'
import { useStore } from '@/components/StoreProvider'

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
  const { currentUser } = useAuth()
  const { events, registrations, registerForEvent } = useStore()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const event = events.find((e) => e.id === params.id)

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

  // Check if current user is already registered for this event
  const isRegistered = registrations.some(
    (reg) =>
      reg.eventId === event.id &&
      reg.studentId === currentUser.id &&
      reg.status === 'confirmed',
  )

  const isStudent = currentUser.role === 'student'
  const canRegister =
    isStudent && !isRegistered && !past && !full && !event.cancelled

  const handleRegister = () => {
    if (!isStudent) {
      setFeedback({
        type: 'error',
        text: 'Only student accounts can register. Switch to a student account from the menu above.',
      })
      return
    }

    setIsSubmitting(true)
    const result = registerForEvent(event.id, currentUser.id)
    setIsSubmitting(false)

    if (result.success) {
      setFeedback({
        type: 'success',
        text: result.message,
      })
    } else {
      setFeedback({
        type: 'error',
        text: result.message,
      })
    }
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
        <div>
          <span className="eyebrow-tag">{event.category}</span>
          <h1 style={{ fontSize: 32, marginTop: 12 }}>{event.name}</h1>
          <p style={{ marginTop: 16, fontSize: 15.5 }}>{event.description}</p>
        </div>

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
            label="Seats"
            value={`${event.seatsAvailable} of ${event.capacity} available`}
          />

          {!isStudent ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-soft)',
                background: 'var(--slate-bg)',
                padding: '10px 12px',
                borderRadius: 'var(--radius)',
              }}
            >
              Logged in as organizer (<strong>{currentUser.name}</strong>).
              Switch to a student account in the top-right to register.
            </div>
          ) : isRegistered ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--green)',
                  background: 'var(--green-bg)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                }}
              >
                ✓ You are registered for this event
              </div>
              <Link
                href="/registrations"
                className="btn btn-secondary"
                style={{ textAlign: 'center', width: '100%' }}
              >
                Go to My Registrations
              </Link>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              disabled={!canRegister || isSubmitting}
              onClick={handleRegister}
              style={{ marginTop: 4 }}
            >
              {isSubmitting
                ? 'Registering…'
                : canRegister
                  ? 'Register for this event'
                  : event.cancelled
                    ? 'Registration closed (Cancelled)'
                    : past
                      ? 'Registration closed (Past event)'
                      : full
                        ? 'Event full (No seats left)'
                        : 'Registration closed'}
            </button>
          )}
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

