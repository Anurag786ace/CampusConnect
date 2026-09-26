'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { CampusEvent, EventCategory, EventValidationErrors, isPastEvent } from '@/data/events'
import EmptyState from '@/components/EmptyState'
import StatusBadge from '@/components/StatusBadge'
import { useStore } from '@/components/StoreProvider'
import { logToTerminal } from '@/lib/logger'

const CATEGORIES: EventCategory[] = [
  'Tech',
  'Cultural',
  'Sports',
  'Workshop',
  'Career',
  'Music',
]

interface EventFormData {
  name: string
  description: string
  date: string
  venue: string
  category: EventCategory
  capacity: number
}

const INITIAL_FORM: EventFormData = {
  name: '',
  description: '',
  date: '2026-10-15T10:00',
  venue: '',
  category: 'Tech',
  capacity: 50,
}

export default function OrganizerPage() {
  const { currentUser } = useAuth()
  const { events, createEvent, updateEvent, cancelEvent, deleteEvent } =
    useStore()

  const [filterView, setFilterView] = useState<'my' | 'all'>('my')
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [formData, setFormData] = useState<EventFormData>(INITIAL_FORM)
  const [formErrors, setFormErrors] = useState<EventValidationErrors>({})
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  if (currentUser.role !== 'organizer') {
    return (
      <section className="shell" style={{ padding: '56px 0' }}>
        <EmptyState
          title="This page is for organizers"
          description="Switch to an organizer account from the top-right menu to manage events."
        />
      </section>
    )
  }

  // Scope events to my events vs all events
  const scopedEvents =
    filterView === 'my'
      ? events.filter((e) => e.organizerId === currentUser.id)
      : events

  // Hide past events by default ('upcoming'); show only past events when 'past' option is selected
  const displayedEvents = scopedEvents.filter((e) => {
    if (timeFilter === 'upcoming') return !isPastEvent(e)
    if (timeFilter === 'past') return isPastEvent(e)
    return true
  })

  const openCreateModal = () => {
    setFormData(INITIAL_FORM)
    setFormErrors({})
    setEditingEventId(null)
    setModalMode('create')
  }

  const openEditModal = (event: CampusEvent) => {
    setFormData({
      name: event.name,
      description: event.description || '',
      date: event.date.slice(0, 16),
      venue: event.venue,
      category: event.category,
      capacity: event.capacity,
    })
    setFormErrors({})
    setEditingEventId(event.id)
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingEventId(null)
    setFormErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formattedDate =
      formData.date.length === 16 ? `${formData.date}:00` : formData.date

    if (modalMode === 'create') {
      const res = createEvent({
        name: formData.name,
        description: formData.description,
        date: formattedDate,
        venue: formData.venue,
        category: formData.category,
        capacity: Number(formData.capacity),
        organizerId: currentUser.id,
      })

      setFeedback({ type: res.success ? 'success' : 'error', text: res.message })
      logToTerminal({ type: 'MESSAGE', message: res.message, level: res.success ? 'info' : 'error' })
      if (!res.success) {
        if (res.errors) setFormErrors(res.errors)
      } else {
        closeModal()
      }
    } else if (modalMode === 'edit' && editingEventId) {
      const res = updateEvent(editingEventId, {
        name: formData.name,
        description: formData.description,
        date: formattedDate,
        venue: formData.venue,
        category: formData.category,
        capacity: Number(formData.capacity),
      })

      setFeedback({ type: res.success ? 'success' : 'error', text: res.message })
      logToTerminal({ type: 'MESSAGE', message: res.message, level: res.success ? 'info' : 'error' })
      if (!res.success) {
        if (res.errors) setFormErrors(res.errors)
      } else {
        closeModal()
      }
    }
  }

  const handleCancelEvent = (event: CampusEvent) => {
    if (
      !window.confirm(
        `Are you sure you want to cancel "${event.name}"? It will be hidden from students on the board.`,
      )
    ) {
      return
    }

    const res = cancelEvent(event.id)
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message })
    logToTerminal({ type: 'MESSAGE', message: res.message, level: res.success ? 'info' : 'error' })
  }

  const handleDeleteEvent = (event: CampusEvent) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete "${event.name}"? This cannot be undone.`,
      )
    ) {
      return
    }

    const res = deleteEvent(event.id)
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message })
    logToTerminal({ type: 'MESSAGE', message: res.message, level: res.success ? 'info' : 'error' })
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div
        style={{
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <span className="eyebrow-tag">organizer console</span>
          <h1 style={{ fontSize: 30, marginTop: 10 }}>Manage your events</h1>
          <p style={{ marginTop: 8 }}>
            Post new events, update venue/capacity details, or cancel events as
            organizer <strong>{currentUser.name}</strong>.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openCreateModal}
          style={{ whiteSpace: 'nowrap' }}
        >
          + New event
        </button>
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

      {/* Filter Scope & Timeframe Selectors */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Scope:</span>
          <button
            onClick={() => setFilterView('my')}
            className={`btn ${filterView === 'my' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            My Events ({events.filter((e) => e.organizerId === currentUser.id).length})
          </button>
          <button
            onClick={() => setFilterView('all')}
            className={`btn ${filterView === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            All Campus Events ({events.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Timeline:</span>
          <button
            id="organizer-upcoming-filter"
            onClick={() => setTimeFilter('upcoming')}
            className={`btn ${timeFilter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            Upcoming ({scopedEvents.filter((e) => !isPastEvent(e)).length})
          </button>
          <button
            id="organizer-past-filter"
            onClick={() => setTimeFilter('past')}
            className={`btn ${timeFilter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            Past events only ({scopedEvents.filter((e) => isPastEvent(e)).length})
          </button>
          <button
            id="organizer-all-filter"
            onClick={() => setTimeFilter('all')}
            className={`btn ${timeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: 13 }}
          >
            All ({scopedEvents.length})
          </button>
        </div>
      </div>

      {displayedEvents.length === 0 ? (
        <EmptyState
          title={
            timeFilter === 'past'
              ? 'No past events found'
              : timeFilter === 'upcoming'
                ? 'No upcoming events found'
                : 'No events found'
          }
          description={
            timeFilter === 'past'
              ? filterView === 'my'
                ? "You don't have any past events on record."
                : 'There are no past events in the system.'
              : filterView === 'my'
                ? "You haven't posted any upcoming events yet. Click '+ New event' above to create one."
                : 'There are no upcoming events in the system.'
          }
          action={
            filterView === 'my' && timeFilter !== 'past' ? (
              <button className="btn btn-primary" onClick={openCreateModal}>
                + Create event
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {displayedEvents.map((event) => {
            const isPast = isPastEvent(event)
            const status = event.cancelled
              ? 'cancelled'
              : isPast
                ? 'past'
                : event.seatsAvailable <= 0
                  ? 'full'
                  : 'open'
            const isOwner = event.organizerId === currentUser.id

            return (
              <li
                key={event.id}
                className="card-surface"
                style={{
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                  opacity: event.cancelled ? 0.7 : 1,
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: 17,
                        textDecoration: event.cancelled
                          ? 'line-through'
                          : 'none',
                      }}
                    >
                      {event.name}
                    </Link>
                    <span className="eyebrow-tag" style={{ fontSize: 11 }}>
                      {event.category}
                    </span>
                    {!isOwner && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-soft)',
                          background: 'var(--slate-bg)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius)',
                        }}
                      >
                        Org: {event.organizerId}
                      </span>
                    )}
                  </div>
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
                    · {event.venue} ·{' '}
                    <strong>
                      {event.seatsAvailable}/{event.capacity} seats available
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <StatusBadge status={status} />

                  <button
                    className="btn btn-secondary"
                    onClick={() => openEditModal(event)}
                    style={{ padding: '7px 12px', fontSize: 13 }}
                  >
                    Edit
                  </button>

                  {!event.cancelled ? (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleCancelEvent(event)}
                      style={{
                        padding: '7px 12px',
                        fontSize: 13,
                        color: 'var(--rust)',
                        borderColor: 'var(--rust)',
                      }}
                    >
                      Cancel
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--rust)',
                        fontWeight: 600,
                      }}
                    >
                      Cancelled
                    </span>
                  )}

                  <button
                    className="btn btn-secondary"
                    onClick={() => handleDeleteEvent(event)}
                    style={{
                      padding: '7px 12px',
                      fontSize: 13,
                      color: 'var(--ink-soft)',
                    }}
                    title="Permanently remove event"
                  >
                    Delete
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalMode && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 22 }}>
                {modalMode === 'create' ? 'Create New Event' : 'Edit Event'}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--ink)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="event-name">
                  Event Name *
                </label>
                <input
                  id="event-name"
                  type="text"
                  required
                  placeholder="e.g. Annual Robotics Showcase"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                {formErrors.name && (
                  <span className="form-error">{formErrors.name}</span>
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14,
                }}
              >
                <div className="form-group">
                  <label className="form-label" htmlFor="event-category">
                    Category *
                  </label>
                  <select
                    id="event-category"
                    className="form-select"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as EventCategory,
                      })
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {formErrors.category && (
                    <span className="form-error">{formErrors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="event-capacity">
                    Total Capacity *
                  </label>
                  <input
                    id="event-capacity"
                    type="number"
                    min={1}
                    required
                    className="form-input"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                  />
                  {formErrors.capacity && (
                    <span className="form-error">{formErrors.capacity}</span>
                  )}
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
                  <label className="form-label" htmlFor="event-date">
                    Date & Time * (Must be in future)
                  </label>
                  <input
                    id="event-date"
                    type="datetime-local"
                    required
                    className="form-input"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                  {formErrors.date && (
                    <span className="form-error">{formErrors.date}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="event-venue">
                    Venue *
                  </label>
                  <input
                    id="event-venue"
                    type="text"
                    required
                    placeholder="e.g. Auditorium Hall A"
                    className="form-input"
                    value={formData.venue}
                    onChange={(e) =>
                      setFormData({ ...formData, venue: e.target.value })
                    }
                  />
                  {formErrors.venue && (
                    <span className="form-error">{formErrors.venue}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="event-desc">
                  Description
                </label>
                <textarea
                  id="event-desc"
                  rows={3}
                  placeholder="Provide schedule details, what participants should bring, etc."
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'create' ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}

