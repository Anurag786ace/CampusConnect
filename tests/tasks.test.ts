import { describe, it, expect, beforeEach } from 'vitest'
import {
  events,
  CampusEvent,
  searchEventsByName,
  filterEventsByCategory,
  isPastEvent,
  isFullEvent,
  createEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  validateEventInput,
  TODAY,
} from '@/data/events'
import {
  registrations,
  registerStudentForEvent,
  cancelStudentRegistration,
  isStudentRegisteredForEvent,
  getRegistrationsForStudent,
} from '@/data/registrations'

describe('Task 1 — Event Listing & Filtering', () => {
  it('searches events by name case-insensitively and partially', () => {
    const hackResults = searchEventsByName(events, 'HACK')
    expect(hackResults.length).toBe(1)
    expect(hackResults[0].id).toBe('evt-01')

    const clinicResults = searchEventsByName(events, 'clinic')
    expect(clinicResults.length).toBe(1)
    expect(clinicResults[0].id).toBe('evt-03')

    const emptyQueryResults = searchEventsByName(events, '')
    expect(emptyQueryResults.length).toBe(events.length)
  })

  it('filters events by category and handles "All"', () => {
    const techEvents = filterEventsByCategory(events, 'Tech')
    expect(techEvents.every((e) => e.category === 'Tech')).toBe(true)
    expect(techEvents.length).toBeGreaterThan(0)

    const allEvents = filterEventsByCategory(events, 'All')
    expect(allEvents.length).toBe(events.length)
  })

  it('composes search and category filter together', () => {
    const musicEvents = filterEventsByCategory(events, 'Music')
    const acousticMatch = searchEventsByName(musicEvents, 'acoustic')
    expect(acousticMatch.length).toBe(1)
    expect(acousticMatch[0].id).toBe('evt-02')

    // Searching for a tech event in music category should yield 0 results
    const noMatch = searchEventsByName(musicEvents, 'hack')
    expect(noMatch.length).toBe(0)
  })
})

describe('Task 2 — Student Registration & Task 5 Debugging', () => {
  it('registers a student successfully and decrements available seats', () => {
    const targetEvent = events.find(
      (e) => !isPastEvent(e) && !e.cancelled && e.seatsAvailable > 0 && e.id === 'evt-05',
    )!
    const initialSeats = targetEvent.seatsAvailable

    const result = registerStudentForEvent(targetEvent.id, 'stu-1')
    expect(result.success).toBe(true)
    expect(result.registration).toBeDefined()
    expect(targetEvent.seatsAvailable).toBe(initialSeats - 1)
    expect(isStudentRegisteredForEvent(targetEvent.id, 'stu-1')).toBe(true)
  })

  it('prevents duplicate registration for the same event', () => {
    // stu-1 is already registered for evt-01 in seed data
    const result = registerStudentForEvent('evt-01', 'stu-1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('already registered')
  })

  it('blocks registration for a full event', () => {
    // evt-02 has seatsAvailable = 0
    const fullEvent = events.find((e) => e.id === 'evt-02')!
    expect(fullEvent.seatsAvailable).toBe(0)

    const result = registerStudentForEvent('evt-02', 'stu-1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('full')
  })

  it('blocks registration for a past event', () => {
    // evt-10 is a past event (date before TODAY)
    const pastEvent = events.find((e) => e.id === 'evt-10')!
    expect(isPastEvent(pastEvent)).toBe(true)

    const result = registerStudentForEvent('evt-10', 'stu-1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('passed')
  })

  it('blocks registration for a cancelled event', () => {
    const cancelledEvent = events.find((e) => e.id === 'evt-08')!
    cancelledEvent.cancelled = true

    const result = registerStudentForEvent(cancelledEvent.id, 'stu-1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('cancelled')

    // Reset back
    cancelledEvent.cancelled = false
  })

  it('rejects registration from an organizer account', () => {
    const result = registerStudentForEvent('evt-05', 'org-1')
    expect(result.success).toBe(false)
    expect(result.message).toContain('student')
  })
})

describe('Task 3 — Cancellation & Seat Increase', () => {
  it('cancels registration, marks status as cancelled, and increments seats', () => {
    // reg-01 is for evt-01 by stu-1
    const event = events.find((e) => e.id === 'evt-01')!
    const seatsBefore = event.seatsAvailable

    const cancelResult = cancelStudentRegistration('reg-01', 'stu-1')
    expect(cancelResult.success).toBe(true)

    const reg = registrations.find((r) => r.id === 'reg-01')!
    expect(reg.status).toBe('cancelled')
    expect(event.seatsAvailable).toBe(seatsBefore + 1)
  })

  it('prevents cancelling already cancelled registrations', () => {
    const cancelResult = cancelStudentRegistration('reg-01', 'stu-1')
    expect(cancelResult.success).toBe(false)
    expect(cancelResult.message).toContain('already been cancelled')
  })

  it('prevents cancelling registration belonging to another student', () => {
    const cancelResult = cancelStudentRegistration('reg-03', 'other-student')
    expect(cancelResult.success).toBe(false)
    expect(cancelResult.message).toContain('Unauthorized')
  })

  it('prevents cancelling registration for past events', () => {
    // reg-02 is for evt-04 (dated 2026-09-05, before TODAY)
    const cancelResult = cancelStudentRegistration('reg-02', 'stu-1')
    expect(cancelResult.success).toBe(false)
    expect(cancelResult.message).toContain('already passed')
  })
})

describe('Task 4 — Organizer Event Management', () => {
  it('validates event creation inputs', () => {
    const emptyValidation = validateEventInput({
      name: '',
      venue: '',
      date: '2026-08-01T10:00', // in past
      capacity: -5,
    })
    expect(emptyValidation.isValid).toBe(false)
    expect(emptyValidation.errors.name).toBeDefined()
    expect(emptyValidation.errors.venue).toBeDefined()
    expect(emptyValidation.errors.date).toBeDefined()
    expect(emptyValidation.errors.capacity).toBeDefined()
  })

  it('creates an event with valid data and initializes seatsAvailable', () => {
    const createRes = createEvent({
      name: 'AI Robotics Workshop',
      description: 'Hands on build session',
      date: '2026-11-20T14:00:00',
      venue: 'Robotics Lab 3',
      category: 'Workshop',
      capacity: 40,
      organizerId: 'org-1',
    })

    expect(createRes.success).toBe(true)
    expect(createRes.event).toBeDefined()
    expect(createRes.event?.seatsAvailable).toBe(40)
    expect(createRes.event?.cancelled).toBe(false)

    // Verify it is in events list
    const found = events.find((e) => e.id === createRes.event?.id)
    expect(found).toBeDefined()
    expect(found?.name).toBe('AI Robotics Workshop')
  })

  it('updates an event and properly validates capacity change', () => {
    const created = events.find((e) => e.name === 'AI Robotics Workshop')!
    const updateRes = updateEvent(created.id, {
      venue: 'New Advanced Lab',
      capacity: 50,
    })

    expect(updateRes.success).toBe(true)
    expect(created.venue).toBe('New Advanced Lab')
    expect(created.capacity).toBe(50)
    expect(created.seatsAvailable).toBe(50)
  })

  it('cancels an event successfully', () => {
    const created = events.find((e) => e.name === 'AI Robotics Workshop')!
    const cancelRes = cancelEvent(created.id)

    expect(cancelRes.success).toBe(true)
    expect(created.cancelled).toBe(true)
  })

  it('deletes an event successfully', () => {
    const created = events.find((e) => e.name === 'AI Robotics Workshop')!
    const deleteRes = deleteEvent(created.id)

    expect(deleteRes.success).toBe(true)
    expect(events.find((e) => e.id === created.id)).toBeUndefined()
  })
})
