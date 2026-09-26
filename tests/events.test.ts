import { describe, it, expect } from 'vitest'
import { events, isPastEvent } from '@/data/events'

describe('isPastEvent', () => {
  it('marks an event with a date before TODAY as past', () => {
    // evt-10 is dated 2026-09-01; TODAY (seeded) is 2026-09-16
    const pastEvent = events.find((e) => e.id === 'evt-10')!
    expect(isPastEvent(pastEvent)).toBe(true)
  })

  it('correctly filters to hide past events (upcoming only)', () => {
    const upcomingEvents = events.filter((e) => !isPastEvent(e))
    expect(upcomingEvents.length).toBeGreaterThan(0)
    expect(upcomingEvents.every((e) => !isPastEvent(e))).toBe(true)
    // evt-10, evt-04, evt-07, evt-12, evt-13 are past and must be excluded
    expect(upcomingEvents.some((e) => e.id === 'evt-10')).toBe(false)
  })

  it('correctly filters to display only past events', () => {
    const pastEvents = events.filter((e) => isPastEvent(e))
    expect(pastEvents.length).toBeGreaterThan(0)
    expect(pastEvents.every((e) => isPastEvent(e))).toBe(true)
    // evt-10 is a past event and must be included
    expect(pastEvents.some((e) => e.id === 'evt-10')).toBe(true)
    // evt-01 is an upcoming event and must NOT be included
    expect(pastEvents.some((e) => e.id === 'evt-01')).toBe(false)
  })

  it('groups 22 Sept 2026 and 25 Sept 2026 events in past events', () => {
    // evt-03 is 2026-09-22
    const sept22Event = events.find((e) => e.id === 'evt-03')!
    expect(isPastEvent(sept22Event)).toBe(true)

    // evt-02 is 2026-09-25
    const sept25Event = events.find((e) => e.id === 'evt-02')!
    expect(isPastEvent(sept25Event)).toBe(true)

    const pastEvents = events.filter((e) => isPastEvent(e))
    expect(pastEvents.some((e) => e.id === 'evt-03')).toBe(true)
    expect(pastEvents.some((e) => e.id === 'evt-02')).toBe(true)

    const upcomingEvents = events.filter((e) => !isPastEvent(e))
    expect(upcomingEvents.some((e) => e.id === 'evt-03')).toBe(false)
    expect(upcomingEvents.some((e) => e.id === 'evt-02')).toBe(false)
  })
})

