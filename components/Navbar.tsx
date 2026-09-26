'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from './AuthProvider'
import AuthModal from './AuthModal'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/registrations', label: 'My Registrations' },
  { href: '/organizer', label: 'Organizer' },
]

export default function Navbar() {
  const pathname = usePathname()
  const { currentUser, setCurrentUserId, allUsers } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('register')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const openAuth = (mode: 'login' | 'register') => {
    setAuthInitialMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <>
      <header className="navbar-header">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link href="/" className="navbar-brand">
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: 'var(--amber)',
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span className="navbar-brand-title">
                Campus Connect
              </span>
            </Link>

            <nav aria-label="Primary">
              <ul className="navbar-nav">
                {LINKS.filter(
                  (link) =>
                    link.href !== '/organizer' || (mounted && currentUser.role === 'organizer'),
                ).map((link) => {
                  const active =
                    link.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(link.href)
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="navbar-link"
                        style={{
                          color: active ? 'var(--ink)' : 'var(--ink-soft)',
                          background: active ? 'var(--slate-bg)' : 'transparent',
                        }}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>

          <div className="navbar-right">
            <label className="navbar-user-box">
              <span className="eyebrow-tag" style={{ whiteSpace: 'nowrap' }}>
                {mounted ? currentUser.role : 'student'}
              </span>
              <select
                aria-label="Switch current user"
                value={mounted ? currentUser.id : 'stu-1'}
                onChange={(e) => setCurrentUserId(e.target.value)}
                suppressHydrationWarning
                className="navbar-user-select"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.id})
                  </option>
                ))}
              </select>
            </label>

            {/* Student Register & Login Options */}
            <div className="navbar-btn-group">
              <button
                id="nav-student-register-btn"
                onClick={() => openAuth('register')}
                className="btn btn-primary navbar-btn"
              >
                <span>+</span>
                <span>New Student</span>
              </button>
              <button
                id="nav-student-login-btn"
                onClick={() => openAuth('login')}
                className="btn btn-secondary navbar-btn"
              >
                Student Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Student Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
      />
    </>
  )
}
