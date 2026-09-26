'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  events as seedEvents,
  CampusEvent,
  createEvent as dataCreateEvent,
  updateEvent as dataUpdateEvent,
  cancelEvent as dataCancelEvent,
  deleteEvent as dataDeleteEvent,
  onEventsChange,
  CreateEventInput,
  UpdateEventInput,
  EventValidationErrors,
} from '@/data/events'
import {
  registrations as seedRegistrations,
  Registration,
  registerStudentForEvent as dataRegister,
  cancelStudentRegistration as dataCancelRegistration,
  onRegistrationsChange,
} from '@/data/registrations'

import { logToTerminal } from '@/lib/logger'

interface StoreContextValue {
  events: CampusEvent[]
  registrations: Registration[]
  registerForEvent: (
    eventId: string,
    studentId: string,
  ) => { success: boolean; message: string; registration?: Registration }
  cancelRegistration: (
    registrationId: string,
    studentId: string,
  ) => { success: boolean; message: string }
  createEvent: (input: CreateEventInput) => {
    success: boolean
    message: string
    event?: CampusEvent
    errors?: EventValidationErrors
  }
  updateEvent: (
    id: string,
    updates: UpdateEventInput,
  ) => {
    success: boolean
    message: string
    event?: CampusEvent
    errors?: EventValidationErrors
  }
  cancelEvent: (id: string) => {
    success: boolean
    message: string
    event?: CampusEvent
  }
  deleteEvent: (id: string) => {
    success: boolean
    message: string
  }
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [eventsList, setEventsList] = useState<CampusEvent[]>([...seedEvents])
  const [registrationsList, setRegistrationsList] = useState<Registration[]>([
    ...seedRegistrations,
  ])

  useEffect(() => {
    const unsubEvents = onEventsChange(() => {
      setEventsList([...seedEvents])
    })
    const unsubRegs = onRegistrationsChange(() => {
      setRegistrationsList([...seedRegistrations])
    })
    return () => {
      unsubEvents()
      unsubRegs()
    }
  }, [])

  const handleRegisterForEvent = (eventId: string, studentId: string) => {
    const eventBefore = seedEvents.find((e) => e.id === eventId)
    const result = dataRegister(eventId, studentId)
    const eventAfter = seedEvents.find((e) => e.id === eventId)

    logToTerminal({
      type: 'API_CALL',
      message: `registerForEvent | Event: "${eventBefore?.name || eventId}" | Student: ${studentId}`,
      details: {
        eventId,
        eventName: eventBefore?.name,
        studentId,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
        seatsRemaining: eventAfter?.seatsAvailable,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  const handleCancelRegistration = (registrationId: string, studentId: string) => {
    const reg = seedRegistrations.find((r) => r.id === registrationId)
    const event = reg ? seedEvents.find((e) => e.id === reg.eventId) : undefined
    const result = dataCancelRegistration(registrationId, studentId)

    logToTerminal({
      type: 'API_CALL',
      message: `cancelRegistration | Registration: ${registrationId} | Event: "${event?.name || 'Unknown'}"`,
      details: {
        registrationId,
        eventName: event?.name,
        studentId,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  const handleCreateEvent = (input: CreateEventInput) => {
    const result = dataCreateEvent(input)

    logToTerminal({
      type: 'API_CALL',
      message: `createEvent | Name: "${input.name}"`,
      details: {
        name: input.name,
        venue: input.venue,
        date: input.date,
        capacity: input.capacity,
        category: input.category,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
        createdEventId: result.event?.id,
        errors: result.errors,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  const handleUpdateEvent = (id: string, updates: UpdateEventInput) => {
    const result = dataUpdateEvent(id, updates)

    logToTerminal({
      type: 'API_CALL',
      message: `updateEvent | ID: ${id}`,
      details: {
        eventId: id,
        updates,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
        errors: result.errors,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  const handleCancelEvent = (id: string) => {
    const event = seedEvents.find((e) => e.id === id)
    const result = dataCancelEvent(id)

    logToTerminal({
      type: 'API_CALL',
      message: `cancelEvent | "${event?.name || id}"`,
      details: {
        eventId: id,
        eventName: event?.name,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  const handleDeleteEvent = (id: string) => {
    const event = seedEvents.find((e) => e.id === id)
    const result = dataDeleteEvent(id)

    logToTerminal({
      type: 'API_CALL',
      message: `deleteEvent | "${event?.name || id}"`,
      details: {
        eventId: id,
        eventName: event?.name,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
      },
      level: result.success ? 'info' : 'error',
    })

    return result
  }

  return (
    <StoreContext.Provider
      value={{
        events: eventsList,
        registrations: registrationsList,
        registerForEvent: handleRegisterForEvent,
        cancelRegistration: handleCancelRegistration,
        createEvent: handleCreateEvent,
        updateEvent: handleUpdateEvent,
        cancelEvent: handleCancelEvent,
        deleteEvent: handleDeleteEvent,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used inside a StoreProvider')
  }
  return context
}
