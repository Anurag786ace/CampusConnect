// Seed data for registrations, so the "My Registrations" and Organizer
// pages have something real to display before participants build the
// actual registration flow (Task 2 and Task 3).

export type RegistrationStatus = 'confirmed' | 'cancelled'

export interface Registration {
  id: string
  eventId: string
  studentId: string
  status: RegistrationStatus
  registeredAt: string // ISO date string
}

// NOTE FOR PARTICIPANTS: this array is the "database" of registrations.
// Task 2 (Registration) means pushing new items into this array when a
// student registers. Task 3 (Cancellation) means updating an item's
// status here. Keep using this same array — don't create a second store.
export const registrations: Registration[] = [
  {
    id: 'reg-01',
    eventId: 'evt-01',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-10T10:15:00',
  },
  {
    id: 'reg-02',
    eventId: 'evt-04',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-08-20T09:00:00',
  },
  {
    id: 'reg-03',
    eventId: 'evt-09',
    studentId: 'stu-1',
    status: 'confirmed',
    registeredAt: '2026-09-12T18:40:00',
  },
]

/** Simple lookup used by the placeholder "My Registrations" page. */
export function getRegistrationsForStudent(studentId: string): Registration[] {
  return registrations.filter((reg) => reg.studentId === studentId)
}

export type RegistrationChangeListener = () => void
const registrationListeners = new Set<RegistrationChangeListener>()

export function onRegistrationsChange(
  listener: RegistrationChangeListener,
): () => void {
  registrationListeners.add(listener)
  return () => {
    registrationListeners.delete(listener)
  }
}

export function notifyRegistrationsChanged() {
  registrationListeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error in registration listener', e)
    }
  })
}

import { getEventById, isPastEvent, isFullEvent, notifyEventsChanged } from './events'
import { getUserById } from './auth'

export interface RegistrationResult {
  success: boolean
  message: string
  registration?: Registration
}

/** Check if student has an active confirmed registration for this event */
export function isStudentRegisteredForEvent(
  eventId: string,
  studentId: string,
): boolean {
  return registrations.some(
    (reg) =>
      reg.eventId === eventId &&
      reg.studentId === studentId &&
      reg.status === 'confirmed',
  )
}

/**
 * PARTICIPANT TASK (Task 2 — Registration):
 * Registers a student for an event with validation:
 * - Requires student login
 * - Prevents duplicate registrations
 * - Blocks full events
 * - Blocks past or cancelled events
 * - Decrements available seats
 */
export function registerStudentForEvent(
  eventId: string,
  studentId: string,
): RegistrationResult {
  const user = getUserById(studentId)
  if (!user || user.role !== 'student') {
    return {
      success: false,
      message: 'You must be logged in as a student to register for events.',
    }
  }

  const event = getEventById(eventId)
  if (!event) {
    return {
      success: false,
      message: 'Event not found.',
    }
  }

  if (event.cancelled) {
    return {
      success: false,
      message: 'Registration closed. This event has been cancelled.',
    }
  }

  if (isPastEvent(event)) {
    return {
      success: false,
      message: 'Registration closed. This event has already passed.',
    }
  }

  if (isFullEvent(event) || event.seatsAvailable <= 0) {
    return {
      success: false,
      message: 'This event is full. No seats are available.',
    }
  }

  if (isStudentRegisteredForEvent(eventId, studentId)) {
    return {
      success: false,
      message: 'You are already registered for this event.',
    }
  }

  // Decrease available seats
  event.seatsAvailable = Math.max(0, event.seatsAvailable - 1)

  const newRegistration: Registration = {
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    eventId,
    studentId,
    status: 'confirmed',
    registeredAt: new Date().toISOString(),
  }

  registrations.push(newRegistration)

  notifyEventsChanged()
  notifyRegistrationsChanged()

  return {
    success: true,
    message: `Successfully registered for ${event.name}!`,
    registration: newRegistration,
  }
}

/**
 * PARTICIPANT TASK (Task 3 — Cancellation):
 * Cancels a student registration:
 * - Increases available seats on the event
 * - Updates registration status to 'cancelled'
 * - Prevents cancelling past events or already cancelled registrations
 */
export function cancelStudentRegistration(
  registrationId: string,
  studentId: string,
): { success: boolean; message: string } {
  const reg = registrations.find((r) => r.id === registrationId)
  if (!reg) {
    return {
      success: false,
      message: 'Registration not found.',
    }
  }

  if (reg.studentId !== studentId) {
    return {
      success: false,
      message: 'Unauthorized: You can only cancel your own registrations.',
    }
  }

  if (reg.status === 'cancelled') {
    return {
      success: false,
      message: 'This registration has already been cancelled.',
    }
  }

  const event = getEventById(reg.eventId)
  if (event) {
    if (isPastEvent(event)) {
      return {
        success: false,
        message: 'Cannot cancel a registration for an event that has already passed.',
      }
    }
    // Increase available seats
    event.seatsAvailable = Math.min(event.capacity, event.seatsAvailable + 1)
  }

  reg.status = 'cancelled'

  notifyEventsChanged()
  notifyRegistrationsChanged()

  return {
    success: true,
    message: event
      ? `Registration for "${event.name}" has been cancelled.`
      : 'Registration has been cancelled.',
  }
}
