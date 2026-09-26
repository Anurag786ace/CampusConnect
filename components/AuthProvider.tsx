'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  users,
  AppUser,
  registerStudent,
  loginStudent as dataLoginStudent,
  onUsersChange,
  RegisterStudentInput,
  RegisterStudentResult,
  LoginStudentResult,
  loadUsersFromStorage,
  saveUsersToStorage,
  saveLoggedInStudent,
  getStoredLoggedInStudent,
} from '@/data/auth'
import { logToTerminal } from '@/lib/logger'

interface AuthContextValue {
  currentUser: AppUser
  setCurrentUserId: (id: string) => void
  allUsers: AppUser[]
  registerNewStudent: (input: RegisterStudentInput) => RegisterStudentResult
  loginStudent: (identifier: string) => LoginStudentResult
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usersList, setUsersList] = useState<AppUser[]>([...users])
  const [currentUserId, setCurrentUserId] = useState<string>(users[0].id)

  // Restore saved registered students and active user session from localStorage after initial hydration
  useEffect(() => {
    try {
      // 1. Restore registered students from local storage into users list
      loadUsersFromStorage()
      setUsersList([...users])

      // 2. Restore active user / logged in student session
      const savedUser = getStoredLoggedInStudent()
      const savedId = localStorage.getItem('campus_connect_user_id')
      const targetId = savedUser?.id || savedId

      if (targetId && users.some((u) => u.id === targetId)) {
        setCurrentUserId(targetId)
        logToTerminal({
          type: 'ACTION',
          message: `Restored local student session for "${users.find((u) => u.id === targetId)?.name}" (${targetId})`,
        })
      }
    } catch {
      // Ignore
    }
  }, [])

  // Sync users list with data layer changes
  useEffect(() => {
    const unsub = onUsersChange(() => {
      setUsersList([...users])
    })
    return () => unsub()
  }, [])

  // Persist current user id to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campus_connect_user_id', currentUserId)
    }
  }, [currentUserId])

  const currentUser = usersList.find((u) => u.id === currentUserId) ?? usersList[0]

  const handleSetCurrentUserId = (id: string) => {
    const target = usersList.find((u) => u.id === id)
    setCurrentUserId(id)
    if (target) {
      if (typeof window !== 'undefined') {
        saveLoggedInStudent(target)
      }
      logToTerminal({
        type: 'ACTION',
        message: `Switched active user to "${target.name}" (${target.role}) and stored session locally`,
        details: { userId: target.id, role: target.role, name: target.name },
      })
    }
  }

  const handleRegisterNewStudent = (input: RegisterStudentInput): RegisterStudentResult => {
    const result = registerStudent(input)

    logToTerminal({
      type: 'API_CALL',
      message: `registerNewStudent | Name: "${input.name}" | Email: "${input.email}"`,
      details: {
        name: input.name,
        email: input.email,
        branch: input.branch,
        studentId: result.user?.id,
        status: result.success ? 'SUCCESS' : 'FAILED',
        message: result.message,
        errors: result.errors,
      },
      level: result.success ? 'info' : 'error',
    })

    if (result.success && result.user) {
      setCurrentUserId(result.user.id)
      saveLoggedInStudent(result.user)
      saveUsersToStorage()
      logToTerminal({
        type: 'ACTION',
        message: `Saved student "${result.user.name}" (${result.user.id}) data locally in browser storage.`,
        level: 'info',
      })
      logToTerminal({
        type: 'MESSAGE',
        message: `Welcome, ${result.user.name}! You are now logged in as ${result.user.id}.`,
        level: 'info',
      })
    }

    return result
  }

  const handleLoginStudent = (identifier: string): LoginStudentResult => {
    const result = dataLoginStudent(identifier)

    logToTerminal({
      type: 'API_CALL',
      message: `loginStudent | Identifier: "${identifier}"`,
      details: {
        identifier,
        status: result.success ? 'SUCCESS' : 'FAILED',
        userId: result.user?.id,
        name: result.user?.name,
        message: result.message,
      },
      level: result.success ? 'info' : 'error',
    })

    if (result.success && result.user) {
      setCurrentUserId(result.user.id)
      saveLoggedInStudent(result.user)
      logToTerminal({
        type: 'ACTION',
        message: `Saved logged-in student "${result.user.name}" (${result.user.id}) session locally in browser storage.`,
        level: 'info',
      })
      logToTerminal({
        type: 'MESSAGE',
        message: `Welcome back, ${result.user.name}!`,
        level: 'info',
      })
    }

    return result
  }

  const handleLogout = () => {
    const prev = currentUser
    saveLoggedInStudent(null)
    // Default back to primary student
    setCurrentUserId('stu-1')
    logToTerminal({
      type: 'ACTION',
      message: `User "${prev.name}" logged out. Switched to default guest view.`,
    })
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUserId: handleSetCurrentUserId,
        allUsers: usersList,
        registerNewStudent: handleRegisterNewStudent,
        loginStudent: handleLoginStudent,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return context
}
