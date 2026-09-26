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

export default function EventsPage() {
  const { events } = useStore()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<EventCategory | 'All'>('All')
  const [sortBy, setSortBy] = useState<SortOption>('date-asc')

  // Only upcoming, non-cancelled events are displayed
  const upcomingEvents = events.filter((e) => !isPastEvent(e) && !e.cancelled)

  // Compose category filter and search
  const categoryFiltered = filterEventsByCategory(upcomingEvents, category)
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

  return (
    <section className="shell" style={{ padding: '40px 0 64px' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow-tag">the board</span>
        <h1 style={{ fontSize: 30, marginTop: 10 }}>All events</h1>
        <p style={{ marginTop: 8 }}>
          Everything posted by clubs and departments this semester.
        </p>
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
          onChange={(e) => setCategory(e.target.value as EventCategory | 'All')}
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

        {(query || category !== 'All') && (
          <button
            onClick={() => {
              setQuery('')
              setCategory('All')
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
        {displayedEvents.length === 1 ? 'event' : 'events'}
      </div>

      {displayedEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description={
            query || category !== 'All'
              ? 'No upcoming events match your current filter and search criteria.'
              : 'There are currently no upcoming events posted.'
          }
          action={
            query || category !== 'All' ? (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setQuery('')
                  setCategory('All')
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

