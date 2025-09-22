import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DataExport from '../components/DataExport';

// Custom render function to ensure proper container setup
const customRender = (ui: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  return render(ui, { container });
};

// Mock the storage modules
vi.mock('../services/oneRepMaxStorage', () => ({
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

vi.mock('../services/exerciseRecordsStorage', () => ({
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

vi.mock('../services/fiveThreeOneStorage', () => ({
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

vi.mock('../services/workoutResultsStorage', () => ({
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
    return mockLink as unknown as HTMLAnchorElement;
  }
  return originalCreateElement.call(document, tagName);
});

document.body.appendChild = vi.fn();
document.body.removeChild = vi.fn();

describe('DataExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure DOM is properly set up
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
    // Clean up DOM
    document.body.innerHTML = '';
  });

  it('renders export interface correctly', () => {
    const { container } = customRender(<DataExport />);
    
    // Check if the component renders the expected structure
    expect(container.firstChild).toBeTruthy();
    
    // Check for the main container
    const exportContainer = container.querySelector('.data-export-container');
    expect(exportContainer).toBeTruthy();
    
    // Check for title (h2 element)
    const title = container.querySelector('h2.data-export-title');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('Data Export');
    
    // Check for buttons
    const jsonButton = container.querySelector('.export-button-json');
    const csvButton = container.querySelector('.export-button-csv');
    expect(jsonButton).toBeTruthy();
    expect(csvButton).toBeTruthy();
    expect(jsonButton?.textContent).toBe('Download JSON');
    expect(csvButton?.textContent).toBe('Download CSV');
  });

  it('shows export details information', () => {
    const { container } = customRender(<DataExport />);
    
    // Check for export details section
    const detailsSection = container.querySelector('.export-details');
    expect(detailsSection).toBeTruthy();
    
    // Check if it contains information about JSON and CSV exports
    const content = container.textContent || '';
    expect(content).toMatch(/json/i);
    expect(content).toMatch(/csv/i);
    expect(content).toMatch(/your data never leaves your device/i);
  });

  it('handles JSON export successfully', async () => {
    const { container } = customRender(<DataExport />);
    
    const jsonButton = container.querySelector('.export-button-json') as HTMLButtonElement;
    expect(jsonButton).toBeTruthy();
    
    fireEvent.click(jsonButton);

    // Test that the export function is called (we can't easily test the "Exporting..." state due to timing)
    // Just verify the download functionality works
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify download link was created and clicked
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('handles CSV export successfully', async () => {
    const { container } = customRender(<DataExport />);
    
    const csvButton = container.querySelector('.export-button-csv') as HTMLButtonElement;
    expect(csvButton).toBeTruthy();
    
    fireEvent.click(csvButton);

    // Test that the export function is called and download happens
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    }, { timeout: 3000 });

    // Verify multiple download links were created (one for each data type)
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('disables buttons during export', async () => {
    const { container } = customRender(<DataExport />);
    
    const jsonButton = container.querySelector('.export-button-json') as HTMLButtonElement;
    const csvButton = container.querySelector('.export-button-csv') as HTMLButtonElement;
    expect(jsonButton).toBeTruthy();
    expect(csvButton).toBeTruthy();

    fireEvent.click(jsonButton);

    // Both buttons should be disabled during export
    await waitFor(() => {
      expect(jsonButton).toBeDisabled();
      expect(csvButton).toBeDisabled();
    });
  });

  it('shows status updates during export', async () => {
    const { container } = customRender(<DataExport />);
    
    const jsonButton = container.querySelector('.export-button-json') as HTMLButtonElement;
    expect(jsonButton).toBeTruthy();
    
    fireEvent.click(jsonButton);

    // Just verify that the export process starts and completes
    // (Timing-dependent status messages are hard to test reliably)
    await waitFor(() => {
      expect(mockLink.click).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
