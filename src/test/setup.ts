import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB with simplified approach to avoid TypeScript issues
const mockIDBRequest = {
  onsuccess: null as ((this: IDBRequest, ev: Event) => void) | null,
  onerror: null as ((this: IDBRequest, ev: Event) => void) | null,
  result: null as unknown,
  error: null as DOMException | null,
  readyState: 'pending',
  source: null,
  transaction: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  getAll: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  index: vi.fn(() => ({
    getAll: vi.fn(() => mockIDBRequest)
  }))
}

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  onsuccess: null as ((this: IDBTransaction, ev: Event) => void) | null,
  onerror: null as ((this: IDBTransaction, ev: Event) => void) | null
}

const mockIDBDatabase = {
  transaction: vi.fn(() => mockIDBTransaction),
  createObjectStore: vi.fn(() => mockIDBObjectStore),
  objectStoreNames: {
    contains: vi.fn(() => false)
  },
  close: vi.fn()
}

const mockIDBOpenRequest = {
  onsuccess: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
  onerror: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
  onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => void) | null,
  onblocked: null as ((this: IDBOpenDBRequest, ev: Event) => void) | null,
  result: mockIDBDatabase,
  error: null as DOMException | null,
  readyState: 'pending',
  source: null,
  transaction: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

// Mock IndexedDB globally
Object.defineProperty(globalThis, 'indexedDB', {
  value: {
    open: vi.fn(() => mockIDBOpenRequest)
  },
  writable: true
})

Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: {
    only: vi.fn((value: unknown) => ({ only: value }))
  },
  writable: true
})

// Helper to simulate successful IDB operations
export const simulateIDBSuccess = (result?: unknown) => {
  setTimeout(() => {
    if (mockIDBRequest.onsuccess) {
      mockIDBRequest.result = result
      const event = { target: mockIDBRequest, type: 'success' } as unknown as Event
      mockIDBRequest.onsuccess.call(mockIDBRequest as unknown as IDBRequest, event)
    }
  }, 0)
}

// Helper to simulate IDB errors
export const simulateIDBError = (error: string) => {
  setTimeout(() => {
    if (mockIDBRequest.onerror) {
      // Create a proper DOMException-like object
      const domException = new Error(error) as Error & { name: string; code: number }
      domException.name = 'DataError'
      domException.code = 0
      mockIDBRequest.error = domException as DOMException
      const event = { target: mockIDBRequest, type: 'error' } as unknown as Event
      mockIDBRequest.onerror.call(mockIDBRequest as unknown as IDBRequest, event)
    }
  }, 0)
}

// Helper to simulate upgrade needed
export const simulateIDBUpgradeNeeded = () => {
  setTimeout(() => {
    if (mockIDBOpenRequest.onupgradeneeded) {
      const event = { target: mockIDBOpenRequest, type: 'upgradeneeded' } as unknown as IDBVersionChangeEvent
      mockIDBOpenRequest.onupgradeneeded.call(mockIDBOpenRequest as unknown as IDBOpenDBRequest, event)
    }
    if (mockIDBOpenRequest.onsuccess) {
      const event = { target: mockIDBOpenRequest, type: 'success' } as unknown as Event
      mockIDBOpenRequest.onsuccess.call(mockIDBOpenRequest as unknown as IDBOpenDBRequest, event)
    }
  }, 0)
}
