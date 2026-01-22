import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PlateCalculator from '../components/PlateCalculator';
import { plateCalculatorStorage } from '../services/plateCalculatorStorage';
import type { PlateSet } from '../types/plateCalculator';

// Mock the storage service
vi.mock('../services/plateCalculatorStorage', () => ({
  plateCalculatorStorage: {
    initialize: vi.fn(),
    getAllPlateSets: vi.fn(),
    getDefaultPlateSet: vi.fn(),
    getCurrentLocationPlateSet: vi.fn(),
    getCurrentLocation: vi.fn(),
    calculatePlates: vi.fn(),
    markPlateSetUsed: vi.fn(),
    requestLocationPermission: vi.fn(),
  },
}));

const mockPlateSet: PlateSet = {
  id: 'test-plate-set',
  name: 'Test Plates',
  barWeight: 45,
  plates: [
    { id: 'plate-45', weight: 45, quantity: 4, color: 'red', material: 'iron', isActive: true },
    { id: 'plate-25', weight: 25, quantity: 2, color: 'green', material: 'iron', isActive: true },
  ],
  isDefault: true,
  createdAt: new Date(),
};

describe('PlateCalculator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    vi.mocked(plateCalculatorStorage.initialize).mockResolvedValue(undefined);
    vi.mocked(plateCalculatorStorage.getAllPlateSets).mockResolvedValue([mockPlateSet]);
    vi.mocked(plateCalculatorStorage.getDefaultPlateSet).mockResolvedValue(mockPlateSet);
    vi.mocked(plateCalculatorStorage.getCurrentLocationPlateSet).mockResolvedValue(null);
    vi.mocked(plateCalculatorStorage.getCurrentLocation).mockResolvedValue(null);
    vi.mocked(plateCalculatorStorage.calculatePlates).mockReturnValue({
      targetWeight: 135,
      barWeight: 45,
      totalWeight: 135,
      platesPerSide: [
        {
          plate: mockPlateSet.plates[0],
          quantity: 1,
        },
      ],
      remainingWeight: 0,
      isExact: true,
    });
  });

  it('should render the plate calculator', async () => {
    render(<PlateCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText('Plate Calculator')).toBeInTheDocument();
    });
  });

  it('should allow updating the target weight input', async () => {
    const user = userEvent.setup();
    render(<PlateCalculator />);

    await waitFor(() => {
      expect(screen.getByLabelText('Target Weight (lbs)')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Target Weight (lbs)') as HTMLInputElement;
    
    // Initial value should be 135 (default)
    expect(input.value).toBe('135');

    // Clear the input and type a new value
    await user.clear(input);
    await user.type(input, '225');

    // Verify the input value has changed
    expect(input.value).toBe('225');
  });

  it('should update target weight when user changes the input', async () => {
    const user = userEvent.setup();
    render(<PlateCalculator />);

    await waitFor(() => {
      expect(screen.getByLabelText('Target Weight (lbs)')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Target Weight (lbs)') as HTMLInputElement;
    
    // Change the value
    await user.clear(input);
    await user.type(input, '315');

    // The input should retain the new value
    expect(input.value).toBe('315');

    // Verify calculatePlates was called with the new weight
    await waitFor(() => {
      expect(plateCalculatorStorage.calculatePlates).toHaveBeenCalledWith(
        315,
        mockPlateSet
      );
    });
  });

  it('should allow multiple sequential updates to target weight', async () => {
    const user = userEvent.setup();
    render(<PlateCalculator />);

    await waitFor(() => {
      expect(screen.getByLabelText('Target Weight (lbs)')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Target Weight (lbs)') as HTMLInputElement;

    // First update
    await user.clear(input);
    await user.type(input, '185');
    expect(input.value).toBe('185');

    // Second update
    await user.clear(input);
    await user.type(input, '225');
    expect(input.value).toBe('225');

    // Third update
    await user.clear(input);
    await user.type(input, '275');
    expect(input.value).toBe('275');
  });

  it('should handle inline mode input correctly', async () => {
    const user = userEvent.setup();
    render(<PlateCalculator showInline={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Target weight')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Target weight') as HTMLInputElement;
    
    // Change the value in inline mode
    await user.clear(input);
    await user.type(input, '405');

    // The input should retain the new value
    expect(input.value).toBe('405');
  });

  it('should respect custom initialWeight prop', async () => {
    render(<PlateCalculator targetWeight={225} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Target Weight (lbs)')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Target Weight (lbs)') as HTMLInputElement;
    
    // Should start with the custom initial weight
    expect(input.value).toBe('225');
  });
});
