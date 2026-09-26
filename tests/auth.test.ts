import { describe, it, expect } from 'vitest'
import {
  users,
  getUserById,
  registerStudent,
  loginStudent,
  AppUser,
  saveLoggedInStudent,
  getStoredLoggedInStudent,
  saveUsersToStorage,
  loadUsersFromStorage,
  CURRENT_USER_ID_STORAGE_KEY,
  REGISTERED_STUDENTS_STORAGE_KEY,
} from '@/data/auth'
import {
  saveRegistrationsToStorage,
  loadRegistrationsFromStorage,
  REGISTRATIONS_STORAGE_KEY,
} from '@/data/registrations'

describe('Student Authentication & Registration', () => {
  it('has seeded student and organizer accounts intact', () => {
    const student = getUserById('stu-1')
    expect(student).toBeDefined()
    expect(student?.name).toBe('Aditi Rao')
    expect(student?.role).toBe('student')

    const organizer = getUserById('org-1')
    expect(organizer).toBeDefined()
    expect(organizer?.name).toBe('Rohan Verma')
    expect(organizer?.role).toBe('organizer')
  })

  it('validates student registration input correctly', () => {
    // Missing name and email
    const emptyResult = registerStudent({ name: '', email: '' })
    expect(emptyResult.success).toBe(false)
    expect(emptyResult.errors?.name).toBeDefined()
    expect(emptyResult.errors?.email).toBeDefined()

    // Invalid email format
    const invalidEmail = registerStudent({ name: 'Valid Name', email: 'not-an-email' })
    expect(invalidEmail.success).toBe(false)
    expect(invalidEmail.errors?.email).toBeDefined()

    // Duplicate email
    const duplicateEmail = registerStudent({ name: 'Copycat', email: 'aditi@campus.edu' })
    expect(duplicateEmail.success).toBe(false)
    expect(duplicateEmail.errors?.email).toContain('already registered')
  })

  it('registers a new student successfully with auto-generated ID', () => {
    const regResult = registerStudent({
      name: 'Priya Sharma',
      email: 'priya.sharma@campus.edu',
      branch: 'Electronics',
    })

    expect(regResult.success).toBe(true)
    expect(regResult.user).toBeDefined()
    expect(regResult.user?.name).toBe('Priya Sharma')
    expect(regResult.user?.role).toBe('student')
    expect(regResult.user?.id.startsWith('stu-')).toBe(true)
    expect(regResult.user?.branch).toBe('Electronics')

    // Verify user can be fetched
    const fetched = getUserById(regResult.user!.id)
    expect(fetched).toBeDefined()
    expect(fetched?.email).toBe('priya.sharma@campus.edu')
  })

  it('allows registering a student with custom ID and prevents duplicates', () => {
    const customResult = registerStudent({
      name: 'Karan Mehra',
      email: 'karan@campus.edu',
      studentId: 'stu-99',
    })

    expect(customResult.success).toBe(true)
    expect(customResult.user?.id).toBe('stu-99')

    // Duplicate ID attempt
    const duplicateId = registerStudent({
      name: 'Another Karan',
      email: 'karan2@campus.edu',
      studentId: 'stu-99',
    })
    expect(duplicateId.success).toBe(false)
    expect(duplicateId.errors?.studentId).toContain('already in use')
  })

  it('logs in a student by ID or email case-insensitively', () => {
    // By ID
    const loginById = loginStudent('STU-1')
    expect(loginById.success).toBe(true)
    expect(loginById.user?.id).toBe('stu-1')

    // By Email
    const loginByEmail = loginStudent('ADITI@CAMPUS.EDU')
    expect(loginByEmail.success).toBe(true)
    expect(loginByEmail.user?.id).toBe('stu-1')

    // Non-existent
    const notFound = loginStudent('ghost-student')
    expect(notFound.success).toBe(false)
    expect(notFound.message).toContain('No account found')
  })

  it('persists logged in student session and custom users locally', () => {
    const store: Record<string, string> = {}
    const mockLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    }
    ;(global as any).window = {}
    ;(global as any).localStorage = mockLocalStorage

    const testStudent: AppUser = {
      id: 'stu-local-1',
      name: 'Local Student',
      role: 'student',
      email: 'local@campus.edu',
    }

    saveLoggedInStudent(testStudent)
    expect(mockLocalStorage.getItem(CURRENT_USER_ID_STORAGE_KEY)).toBe('stu-local-1')
    expect(getStoredLoggedInStudent()?.id).toBe('stu-local-1')

    saveLoggedInStudent(null)
    expect(getStoredLoggedInStudent()).toBeNull()

    delete (global as any).window
    delete (global as any).localStorage
  })

  it('persists registrations locally when storage is active', () => {
    const store: Record<string, string> = {}
    const mockLocalStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      },
    }
    ;(global as any).window = {}
    ;(global as any).localStorage = mockLocalStorage

    saveRegistrationsToStorage()
    expect(mockLocalStorage.getItem(REGISTRATIONS_STORAGE_KEY)).toBeDefined()

    delete (global as any).window
    delete (global as any).localStorage
  })
})
