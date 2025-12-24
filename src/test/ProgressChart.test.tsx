import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProgressChart from '../components/ProgressChart'
import chartColorsData from '../data/chartColors.json'

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: vi.fn(({ children }) => <div data-testid="line-chart">{children}</div>),
  Line: vi.fn(() => <div data-testid="line" />),
  XAxis: vi.fn(() => <div data-testid="x-axis" />),
  YAxis: vi.fn(() => <div data-testid="y-axis" />),
  CartesianGrid: vi.fn(() => <div data-testid="cartesian-grid" />),
  Tooltip: vi.fn(() => <div data-testid="tooltip" />),
  Legend: vi.fn(() => <div data-testid="legend" />),
  ResponsiveContainer: vi.fn(({ children }) => <div data-testid="responsive-container">{children}</div>),
}))

// Mock storage
vi.mock('../services/exerciseRecordsStorage', () => ({
  exerciseRecordsStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllRecords: vi.fn().mockResolvedValue([]),
    getRecordsByExercise: vi.fn().mockResolvedValue([]),
  }
}))

describe('ProgressChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', async () => {
    render(<ProgressChart />)
    
    await waitFor(() => {
      expect(screen.getByText('Progress Chart')).toBeInTheDocument()
    })
  })

  it('should display basic controls', async () => {
    render(<ProgressChart />)
    
    // Wait for component to finish loading
    await waitFor(() => {
      expect(screen.getByText('Progress Chart')).toBeInTheDocument()
    })
    
    // Wait for the loading to complete and no data message to appear
    await waitFor(() => {
      expect(screen.getByText('📊 Start Tracking Your Progress')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should load color palette from JSON file', () => {
    // Verify that the colors are defined in the JSON file
    expect(chartColorsData.progressChartColors).toBeDefined()
    expect(Array.isArray(chartColorsData.progressChartColors)).toBe(true)
    expect(chartColorsData.progressChartColors.length).toBeGreaterThan(0)
    
    // Verify the expected colors are present
    expect(chartColorsData.progressChartColors).toContain('#8884d8')
    expect(chartColorsData.progressChartColors).toContain('#82ca9d')
    expect(chartColorsData.progressChartColors).toContain('#ffc658')
  })
})
