import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DataExport from '../DataExport';

// Mock the storage modules
vi.mock('../oneRepMaxStorage', () => ({
  oneRepMaxStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    listFunctions: vi.fn().mockResolvedValue([
      {
        id: 'epley',
        name: 'Epley Formula',
        description: 'Standard one-rep-max formula',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }
    ])
  }
}));

vi.mock('../exerciseRecordsStorage', () => ({
  exerciseRecordsStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllRecords: vi.fn().mockResolvedValue([
      {
        id: 'record1',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        workoutSet: { Weight: 225, Repetions: 5 },
        oneRepMax: 265,
        formulaUsed: 'Epley Formula',
        formulaId: 'epley',
        dateRecorded: '2024-01-15T10:30:00.000Z',
        notes: 'Good form'
      }
    ])
  }
}));

vi.mock('../fiveThreeOneStorage', () => ({
  fiveThreeOneStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllCycles: vi.fn().mockResolvedValue([
      {
        id: 'cycle1',
        name: 'Winter 2024',
        startDate: '2024-01-01T00:00:00.000Z',
        currentCycle: 1,
        currentWeek: 2,
        trainingMaxes: { 'bench-press': 275 },
        isActive: true,
        notes: 'First cycle'
      }
    ])
  }
}));

vi.mock('../workoutResultsStorage', () => ({
  workoutResultsStorage: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllWorkoutResults: vi.fn().mockResolvedValue([
      {
        id: 'workout1',
        cycleId: 'cycle1',
        cycleName: 'Winter 2024',
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        week: 1,
        day: 1,
        datePerformed: '2024-01-15T18:00:00.000Z',
        overallRpe: 8,
        workoutNotes: 'Felt strong',
        mainSetResults: [
          {
            plannedReps: 5,
            plannedWeight: 225,
            actualReps: 5,
            actualWeight: 225,
            percentage: 85,
            isAmrap: false,
            rpe: 8
          }
        ],
        warmupResults: []
      }
    ])
  }
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
Object.defineProperty(window.URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-blob-url'),
  writable: true
});
Object.defineProperty(window.URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true
});

// Mock document.createElement and appendChild/removeChild for download links
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  style: {}
};

const originalCreateElement = document.createElement;
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink as any;
  }
  return originalCreateElement.call(document, tagName);
});

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('DataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export interface correctly', () => {
    render(<DataExport />);
    
    expect(screen.getByText('Data Export')).toBeInTheDocument();
    expect(screen.getByText('Download JSON')).toBeInTheDocument();
    expect(screen.getByText('Download CSV')).toBeInTheDocument();
    expect(screen.getByText(/Export all your fitness data/)).toBeInTheDocument();
  });

  it('shows export details information', () => {
    render(<DataExport />);
    
    expect(screen.getByText('Export Details:')).toBeInTheDocument();
    expect(screen.getByText(/JSON:/)).toBeInTheDocument();
    expect(screen.getByText(/CSV:/)).toBeInTheDocument();
    expect(screen.getByText(/Your data never leaves your device/)).toBeInTheDocument();
  });

  it('handles JSON export successfully', async () => {
    render(<DataExport />);
    
    const jsonButton = screen.getByText('Download JSON');
    fireEvent.click(jsonButton);

    // Button should show "Exporting..." state
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText('JSON export completed successfully!')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify download link was created and clicked
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles CSV export successfully', async () => {
    render(<DataExport />);
    
    const csvButton = screen.getByText('Download CSV');
    fireEvent.click(csvButton);

    // Button should show "Exporting..." state
    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });

    // Wait for export to complete
    await waitFor(() => {
      expect(screen.getByText(/CSV export completed! Downloaded \d+ files\./)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify multiple download links were created (one for each data type)
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('disables buttons during export', async () => {
    render(<DataExport />);
    
    const jsonButton = screen.getByText('Download JSON');
    const csvButton = screen.getByText('Download CSV');

    fireEvent.click(jsonButton);

    // Both buttons should be disabled during export
    await waitFor(() => {
      expect(jsonButton).toBeDisabled();
      expect(csvButton).toBeDisabled();
    });
  });

  it('shows status updates during export', async () => {
    render(<DataExport />);
    
    const jsonButton = screen.getByText('Download JSON');
    fireEvent.click(jsonButton);

    // Should show data collection status
    await waitFor(() => {
      expect(screen.getByText(/Collecting data from storage/)).toBeInTheDocument();
    });

    // Should show preparation status
    await waitFor(() => {
      expect(screen.getByText(/Preparing JSON export/)).toBeInTheDocument();
    });
  });
});
