import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB
const mockIDBRequest = {
  onsuccess: null as ((this: IDBRequest, ev: Event) => unknown) | null,
  onerror: null as ((this: IDBRequest, ev: Event) => unknown) | null,
  result: null as unknown,
  error: null as DOMException | null
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
  onsuccess: null as ((this: IDBTransaction, ev: Event) => unknown) | null,
  onerror: null as ((this: IDBTransaction, ev: Event) => unknown) | null
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
  ...mockIDBRequest,
  onupgradeneeded: null as ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null,
  result: mockIDBDatabase
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
export const simulateIDBSuccess = (result?: any) => {
  setTimeout(() => {
    if (mockIDBRequest.onsuccess) {
      mockIDBRequest.result = result
      mockIDBRequest.onsuccess({ target: mockIDBRequest })
    }
  }, 0)
}

// Helper to simulate IDB errors
export const simulateIDBError = (error: string) => {
  setTimeout(() => {
    if (mockIDBRequest.onerror) {
      mockIDBRequest.error = new Error(error)
      mockIDBRequest.onerror({ target: mockIDBRequest })
    }
  }, 0)
}

// Helper to simulate upgrade needed
export const simulateIDBUpgradeNeeded = () => {
  setTimeout(() => {
    if (mockIDBOpenRequest.onupgradeneeded) {
      mockIDBOpenRequest.onupgradeneeded({ target: mockIDBOpenRequest })
    }
    if (mockIDBOpenRequest.onsuccess) {
      mockIDBOpenRequest.onsuccess({ target: mockIDBOpenRequest })
    }
  }, 0)
}
