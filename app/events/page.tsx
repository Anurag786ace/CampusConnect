'use client'

import { useState } from 'react'
import {
  EventCategory,
  isPastEvent,
  searchEventsByName,
  filterEventsByCategory,
} from '@/data/events'
import EventCard from '@/components/EventCard'
import EmptyState from '@/components/EmptyState'
import { useStore } from '@/components/StoreProvider'
import { logToTerminal } from '@/lib/logger'

const CATEGORIES: (EventCategory | 'All')[] = [
  'All',
  'Tech',
  'Cultural',
  'Sports',
  'Workshop',
  'Career',
  'Music',
]

type SortOption = 'date-asc' | 'date-desc' | 'popularity' | 'name-asc'
type TimeframeOption = 'upcoming' | 'past'

export default function EventsPage() {
  const { events } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>('All')
  const [sortBy, setSortBy] = useState<SortOption>('date-asc')
  const [timeframe, setTimeframe] = useState<TimeframeOption>('upcoming')

  // Hide past events by default ('upcoming'); show only past events when 'past' option is selected
  const activeEvents = events.filter((e) => !e.cancelled)
  const baseEvents = activeEvents.filter((e) =>
    timeframe === 'upcoming' ? !isPastEvent(e) : isPastEvent(e),
  )

  const upcomingCount = activeEvents.filter((e) => !isPastEvent(e)).length
  const pastCount = activeEvents.filter((e) => isPastEvent(e)).length

  // Compose category filter and search
  const categoryFiltered = filterEventsByCategory(baseEvents, category)
  const searchFiltered = searchEventsByName(categoryFiltered, query)

  // Sort events
  const displayedEvents = [...searchFiltered].sort((a, b) => {
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    if (sortBy === 'popularity') {
      // Fewest seats available relative to capacity represents highest popularity
      return a.seatsAvailable - b.seatsAvailable
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  const handleTimeframeChange = (newTimeframe: TimeframeOption) => {
    setTimeframe(newTimeframe)
    logToTerminal({
      type: 'FILTER',
      message: `Events timeframe switched to "${newTimeframe}"`,
      details: { timeframe: newTimeframe },
    })
  }

  const handleCategoryChange = (newCat: EventCategory | 'All') => {
    setCategory(newCat)
    logToTerminal({
      type: 'FILTER',
      message: `Category filter switched to "${newCat}"`,
      details: { category: newCat },
    })
  }

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">the board</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>
          {timeframe === 'past' ? 'Past events' : 'All events'}
        </h1>
        <p style={{ marginTop: 8 }}>
          {timeframe === 'past'
            ? 'Archive of campus events that have already concluded.'
            : 'Everything posted by clubs and departments this semester.'}
        </p>
      </div>

      {/* Timeframe Filter Options: Past events hidden by default, option to display only past events */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          id="tab-upcoming-events"
          onClick={() => handleTimeframeChange('upcoming')}
          className={`btn ${timeframe === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: 13.5 }}
        >
          Upcoming events ({upcomingCount})
        </button>
        <button
          id="tab-past-events"
          onClick={() => handleTimeframeChange('past')}
          className={`btn ${timeframe === 'past' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: 13.5 }}
        >
          Past events only ({pastCount})
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24,
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          placeholder="Search events by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search events by name"
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        />
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value as EventCategory | 'All')}
          aria-label="Filter by category"
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All categories' : c}
            </option>
          ))}
        </select>
        <select
          id="timeframe-select"
          value={timeframe}
          onChange={(e) => handleTimeframeChange(e.target.value as TimeframeOption)}
          aria-label="Filter events by timeframe"
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        >
          <option value="upcoming">Upcoming events</option>
          <option value="past">Past events only</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Sort events"
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14.5,
            background: 'var(--paper-raised)',
          }}
        >
          <option value="date-asc">Date: Soonest first</option>
          <option value="date-desc">Date: Latest first</option>
          <option value="popularity">Popularity: Filling fast</option>
          <option value="name-asc">Name: A to Z</option>
        </select>

        {(query || category !== 'All' || timeframe !== 'upcoming') && (
          <button
            onClick={() => {
              setQuery('')
              setCategory('All')
              setTimeframe('upcoming')
            }}
            className="btn btn-secondary"
            style={{ padding: '8px 14px', fontSize: 13 }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div
        style={{
          marginBottom: 16,
          fontSize: 13.5,
          color: 'var(--ink-soft)',
        }}
      >
        Showing {displayedEvents.length}{' '}
        {timeframe === 'past' ? 'past ' : ''}
        {displayedEvents.length === 1 ? 'event' : 'events'}
      </div>

      {displayedEvents.length === 0 ? (
        <EmptyState
          title={timeframe === 'past' ? 'No past events found' : 'No events found'}
          description={
            query || category !== 'All'
              ? `No ${timeframe === 'past' ? 'past' : 'upcoming'} events match your current filter and search criteria.`
              : timeframe === 'past'
                ? 'There are currently no past events on record.'
                : 'There are currently no upcoming events posted.'
          }
          action={
            query || category !== 'All' || timeframe !== 'upcoming' ? (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
                  setTimeframe('upcoming')
                }}
              >
                Reset filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {displayedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  )
}

