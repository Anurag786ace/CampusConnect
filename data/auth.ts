export type UserRole = 'student' | 'organizer'

export interface AppUser {
  id: string
  name: string
  role: UserRole
  email?: string
  branch?: string
  joinedAt?: string
}

export const users: AppUser[] = [
  {
    id: 'stu-1',
    name: 'Aditi Rao',
    role: 'student',
    email: 'aditi@campus.edu',
    branch: 'Computer Science',
    joinedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'org-1',
    name: 'Rohan Verma',
    role: 'organizer',
    email: 'rohan@campus.edu',
    branch: 'Student Council',
    joinedAt: '2026-08-01T09:00:00Z',
  },
]

export function getUserById(id: string): AppUser | undefined {
  return users.find((user) => user.id === id)
}

export type UsersChangeListener = () => void
const usersListeners = new Set<UsersChangeListener>()

export function onUsersChange(listener: UsersChangeListener): () => void {
  usersListeners.add(listener)
  return () => {
    usersListeners.delete(listener)
  }
}

export const REGISTERED_STUDENTS_STORAGE_KEY = 'campus_connect_registered_students'
export const LOGGED_IN_STUDENT_STORAGE_KEY = 'campus_connect_logged_in_user'
export const CURRENT_USER_ID_STORAGE_KEY = 'campus_connect_user_id'

export function loadUsersFromStorage(): AppUser[] {
  if (typeof window === 'undefined') return users
  try {
    const raw = localStorage.getItem(REGISTERED_STUDENTS_STORAGE_KEY)
    if (raw) {
      const stored: AppUser[] = JSON.parse(raw)
      if (Array.isArray(stored)) {
        stored.forEach((storedUser) => {
          if (!users.some((u) => u.id === storedUser.id)) {
            users.push(storedUser)
          }
        })
      }
    }
  } catch (e) {
    console.error('Failed to load registered students from localStorage', e)
  }
  return users
}

export function saveUsersToStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const customUsers = users.filter((u) => u.id !== 'stu-1' && u.id !== 'org-1')
    localStorage.setItem(REGISTERED_STUDENTS_STORAGE_KEY, JSON.stringify(customUsers))
  } catch (e) {
    console.error('Failed to save registered students to localStorage', e)
  }
}

export function saveLoggedInStudent(user: AppUser | null): void {
  if (typeof window === 'undefined') return
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, user.id)
      localStorage.setItem(LOGGED_IN_STUDENT_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(LOGGED_IN_STUDENT_STORAGE_KEY)
      localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, 'stu-1')
    }
  } catch (e) {
    console.error('Failed to save logged-in student to localStorage', e)
  }
}

export function getStoredLoggedInStudent(): AppUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOGGED_IN_STUDENT_STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error('Failed to parse logged-in student from localStorage', e)
  }
  return null
}

export function notifyUsersChanged() {
  saveUsersToStorage()
  usersListeners.forEach((listener) => {
    try {
      listener()
    } catch (e) {
      console.error('Error in users change listener:', e)
    }
  })
}

export interface RegisterStudentInput {
  name: string
  email: string
  branch?: string
  studentId?: string
}

export interface RegisterStudentResult {
  success: boolean
  user?: AppUser
  message: string
  errors?: Record<string, string>
}

export function registerStudent(input: RegisterStudentInput): RegisterStudentResult {
  const errors: Record<string, string> = {}

  const trimmedName = input.name?.trim() || ''
  const trimmedEmail = input.email?.trim().toLowerCase() || ''
  const trimmedBranch = input.branch?.trim() || 'Computer Science'
  const customId = input.studentId?.trim()

  if (!trimmedName) {
    errors.name = 'Full name is required.'
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.'
  }

  if (!trimmedEmail) {
    errors.email = 'Campus email address is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please provide a valid email address (e.g. student@campus.edu).'
  } else if (users.some((u) => u.email?.toLowerCase() === trimmedEmail)) {
    errors.email = 'An account with this email address is already registered.'
  }

  let finalId = customId
  if (finalId) {
    if (users.some((u) => u.id.toLowerCase() === finalId.toLowerCase())) {
      errors.studentId = 'This Student ID is already in use.'
    }
  } else {
    // Generate next student ID, e.g. stu-2, stu-3, etc.
    let nextNum = users.filter((u) => u.id.startsWith('stu-')).length + 1
    while (users.some((u) => u.id === `stu-${nextNum}`)) {
      nextNum++
    }
    finalId = `stu-${nextNum}`
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      message: 'Please resolve the highlighted validation errors.',
      errors,
    }
  }

  const newUser: AppUser = {
    id: finalId,
    name: trimmedName,
    role: 'student',
    email: trimmedEmail,
    branch: trimmedBranch,
    joinedAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsersToStorage()
  saveLoggedInStudent(newUser)
  notifyUsersChanged()

  return {
    success: true,
    user: newUser,
    message: `Account created successfully! Welcome, ${newUser.name}.`,
  }
}

export interface LoginStudentResult {
  success: boolean
  user?: AppUser
  message: string
}

export function loginStudent(identifier: string): LoginStudentResult {
  const cleaned = identifier.trim().toLowerCase()
  if (!cleaned) {
    return {
      success: false,
      message: 'Please enter your Student ID or campus email.',
    }
  }

  const foundUser = users.find(
    (u) =>
      u.id.toLowerCase() === cleaned ||
      (u.email && u.email.toLowerCase() === cleaned) ||
      u.name.toLowerCase() === cleaned,
  )

  if (!foundUser) {
    return {
      success: false,
      message: `No account found for "${identifier}". Please check your Student ID or register as a new student.`,
    }
  }

  saveLoggedInStudent(foundUser)

  return {
    success: true,
    user: foundUser,
    message: `Welcome back, ${foundUser.name}!`,
  }
}
