'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { isPastEvent } from '@/data/events'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useStore } from '@/components/StoreProvider'
import { logToTerminal } from '@/lib/logger'

export default function RegistrationsPage() {
  const { currentUser } = useAuth()
  const { events, registrations, cancelRegistration } = useStore()
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'past' | 'cancelled'>('active')

  if (currentUser.role !== 'student') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for students"
          description="Switch to a student account from the top-right menu to see registered events."
        />
      </section>
    )
  }

  // Get all registrations for this student
  const studentRegistrations = registrations.filter(
    (reg) => reg.studentId === currentUser.id,
  )

  // Map each registration to its event and filter out:
  // 1. Missing events
  // 2. Events that have been cancelled by organizers (Task 4: "Hide cancelled events and their registrations from students")
  const validRegistrations = studentRegistrations
    .map((reg) => {
      const event = events.find((e) => e.id === reg.eventId)
      return { reg, event }
    })
    .filter(
      (item): item is { reg: (typeof studentRegistrations)[0]; event: NonNullable<typeof item.event> } =>
        item.event !== undefined && !item.event.cancelled,
    )

  // Split into upcoming confirmed vs past confirmed
  const upcomingRegistrations = validRegistrations.filter(
    ({ reg, event }) => reg.status === 'confirmed' && !isPastEvent(event),
  )

  const pastRegistrations = validRegistrations.filter(
    ({ reg, event }) => reg.status === 'confirmed' && isPastEvent(event),
  )

  const cancelledRegistrations = validRegistrations.filter(
    ({ reg }) => reg.status === 'cancelled',
  )

  const handleCancel = (registrationId: string, eventName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel your registration for "${eventName}"? Your seat will be made available to other students.`,
      )
    ) {
      return
    }

    const result = cancelRegistration(registrationId, currentUser.id)
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

  const hasAnyActive =
    upcomingRegistrations.length > 0 || pastRegistrations.length > 0

  const renderUpcomingSection = () => (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 20 }}>Upcoming events</h2>
        <span className="eyebrow-tag">
          {upcomingRegistrations.length}
        </span>
      </div>
      {upcomingRegistrations.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          No upcoming events registered. Check out the board to find new events!
        </p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcomingRegistrations.map(({ reg, event }) => (
            <li
              key={reg.id}
              className="card-surface"
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Link
                  href={`/events/${event.id}`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 17,
                    textDecoration: 'none',
                  }}
                >
                  {event.name}
                </Link>
                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--ink-soft)',
                    marginTop: 4,
                  }}
                >
                  {new Date(event.date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {event.venue} ·{' '}
                  <span style={{ color: 'var(--amber-ink)' }}>
                    {event.category}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <StatusBadge status="confirmed" />
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCancel(reg.id, event.name)}
                  style={{ padding: '8px 14px', fontSize: 13.5 }}
                >
                  Cancel registration
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const renderPastSection = () => (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
        }}
      >
        <h2 style={{ fontSize: 20 }}>Past events</h2>
        <span className="eyebrow-tag">
          {pastRegistrations.length}
        </span>
      </div>
      {pastRegistrations.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
          No past events registered.
        </p>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pastRegistrations.map(({ reg, event }) => (
            <li
              key={reg.id}
              className="card-surface"
              style={{
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                opacity: 0.85,
              }}
            >
              <div>
                <Link
                  href={`/events/${event.id}`}
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 17,
                    textDecoration: 'none',
                  }}
                >
                  {event.name}
                </Link>
                <div
                  style={{
                    fontSize: 13.5,
                    color: 'var(--ink-soft)',
                    marginTop: 4,
                  }}
                >
                  {new Date(event.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  · {event.venue} · {event.category}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <StatusBadge status="past" />
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    fontStyle: 'italic',
                  }}
                >
                  Event ended
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const renderCancelledSection = () => (
    <div>
      {cancelledRegistrations.length === 0 ? (
        <EmptyState
          title="No cancelled registrations"
          description="You haven't cancelled any event registrations."
        />
      ) : (
        <div>
          <p style={{ marginBottom: 14, fontSize: 14, color: 'var(--ink-soft)' }}>
            These are events you previously registered for and subsequently cancelled.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cancelledRegistrations.map(({ reg, event }) => (
              <li
                key={reg.id}
                className="card-surface"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  opacity: 0.75,
                }}
              >
                <div>
                  <Link
                    href={`/events/${event.id}`}
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 17,
                      textDecoration: 'none',
                    }}
                  >
                    {event.name}
                  </Link>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink-soft)',
                      marginTop: 4,
                    }}
                  >
                    {new Date(event.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    · {event.venue} · {event.category}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StatusBadge status="cancelled" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">signed up as {currentUser.name}</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>My registrations</h1>
        <p style={{ marginTop: 8 }}>
          Manage your campus event registrations. Upcoming events can be
          cancelled to free up seats for peers.
        </p>
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            marginBottom: 24,
            padding: '12px 18px',
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
          }}
        >
          <span>{feedback.text}</span>
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
      )}

      {/* Tabs to switch between Active (all), Upcoming, Past, and Cancelled */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 24,
          borderBottom: '1.5px solid var(--line)',
          paddingBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('active')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            color: activeTab === 'active' ? 'var(--ink)' : 'var(--ink-soft)',
            borderBottom:
              activeTab === 'active' ? '2.5px solid var(--ink)' : 'none',
          }}
        >
          All Active ({upcomingRegistrations.length + pastRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            color: activeTab === 'upcoming' ? 'var(--ink)' : 'var(--ink-soft)',
            borderBottom:
              activeTab === 'upcoming' ? '2.5px solid var(--ink)' : 'none',
          }}
        >
          Upcoming ({upcomingRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            color: activeTab === 'past' ? 'var(--ink)' : 'var(--ink-soft)',
            borderBottom:
              activeTab === 'past' ? '2.5px solid var(--ink)' : 'none',
          }}
        >
          Past ({pastRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14.5,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            color:
              activeTab === 'cancelled' ? 'var(--ink)' : 'var(--ink-soft)',
            borderBottom:
              activeTab === 'cancelled' ? '2.5px solid var(--ink)' : 'none',
          }}
        >
          Cancelled ({cancelledRegistrations.length})
        </button>
      </div>

      {activeTab === 'active' && (
        !hasAnyActive ? (
          <EmptyState
            title="No active registrations"
            description="You are not currently registered for any upcoming or past campus events."
            action={
              <Link href="/events" className="btn btn-primary">
                Browse events
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
            {renderUpcomingSection()}
            {pastRegistrations.length > 0 && renderPastSection()}
          </div>
        )
      )}

      {activeTab === 'upcoming' && (
        upcomingRegistrations.length === 0 ? (
          <EmptyState
            title="No upcoming registrations"
            description="You are not registered for any upcoming events."
            action={
              <Link href="/events" className="btn btn-primary">
                Browse upcoming events
              </Link>
            }
          />
        ) : (
          renderUpcomingSection()
        )
      )}

      {activeTab === 'past' && (
        pastRegistrations.length === 0 ? (
          <EmptyState
            title="No past registrations"
            description="You have no concluded event registrations on record."
          />
        ) : (
          renderPastSection()
        )
      )}

      {activeTab === 'cancelled' && renderCancelledSection()}
    </section>
  )
}
