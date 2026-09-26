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

  return (
    <StoreContext.Provider
      value={{
        events: eventsList,
        registrations: registrationsList,
        registerForEvent: dataRegister,
        cancelRegistration: dataCancelRegistration,
        createEvent: dataCreateEvent,
        updateEvent: dataUpdateEvent,
        cancelEvent: dataCancelEvent,
        deleteEvent: dataDeleteEvent,
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
