import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ProgressPhotos from '../components/ProgressPhotos';
import type { ProgressPhoto } from '../services/progressPhotosStorage';

// Mock photos data
const getMockPhotos = (): ProgressPhoto[] => [
  {
    id: 'photo-1',
    imageData: 'data:image/png;base64,photo1',
    dateTaken: new Date('2025-01-01'),
    notes: 'First photo',
    bodyWeight: 180,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'photo-2',
    imageData: 'data:image/png;base64,photo2',
    dateTaken: new Date('2025-01-15'),
    notes: 'Second photo',
    bodyWeight: 178,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
];

// Mock the progress photos storage
vi.mock('../services/progressPhotosStorage', () => ({
  progressPhotosStorage: {
    getAllPhotos: vi.fn(() => Promise.resolve(getMockPhotos())),
    savePhoto: vi.fn(() => Promise.resolve(getMockPhotos()[0])),
    deletePhoto: vi.fn(() => Promise.resolve(undefined)),
    getPhoto: vi.fn(() => Promise.resolve(getMockPhotos()[0])),
  },
}));

// Mock ShareModal component
vi.mock('../components/ShareModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="share-modal">
      <button onClick={onClose}>Close Share Modal</button>
    </div>
  ),
}));

// Mock useFocusTrap hook
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null })),
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
  writable: true,
});

describe('ProgressPhotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ProgressPhotos />);
    expect(screen.getByText('Loading progress photos...')).toBeInTheDocument();
  });

  it('renders photo gallery after loading', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.queryByText('Loading progress photos...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Progress Photos')).toBeInTheDocument();
    expect(screen.getByText('📤 Upload Photo')).toBeInTheDocument();
    expect(screen.getByText('📷 Take Photo')).toBeInTheDocument();
  });

  it('displays photos in gallery', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images.length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no photos exist', async () => {
    const { progressPhotosStorage } = await import('../services/progressPhotosStorage');
    vi.mocked(progressPhotosStorage.getAllPhotos).mockResolvedValueOnce([]);

    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('No Progress Photos Yet')).toBeInTheDocument();
    });
  });

  it('opens upload modal when upload button clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📤 Upload Photo')).toBeInTheDocument();
    });

    const uploadButton = screen.getByText('📤 Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Progress Photo')).toBeInTheDocument();
    });
  });

  it('closes upload modal when cancel clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📤 Upload Photo')).toBeInTheDocument();
    });

    const uploadButton = screen.getByText('📤 Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Upload Progress Photo')).not.toBeInTheDocument();
    });
  });

  it('opens camera modal when take photo button clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📷 Take Photo')).toBeInTheDocument();
    });

    const cameraButton = screen.getByText('📷 Take Photo');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
  });

  it('handles camera access error', async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error('Camera not available'));

    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📷 Take Photo')).toBeInTheDocument();
    });

    const cameraButton = screen.getByText('📷 Take Photo');
    fireEvent.click(cameraButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to access camera/)).toBeInTheDocument();
    });
  });

  it('opens photo detail modal when photo clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      const photoButtons = screen.getAllByLabelText(/View photo from/);
      expect(photoButtons.length).toBeGreaterThan(0);
    });

    const photoButtons = screen.getAllByLabelText(/View photo from/);
    fireEvent.click(photoButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Photo from/)).toBeInTheDocument();
    });
  });

  it('enables comparison mode when compare button clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      const compareButtons = screen.getAllByLabelText('Compare this photo');
      expect(compareButtons.length).toBeGreaterThan(0);
    });

    const compareButtons = screen.getAllByLabelText('Compare this photo');
    
    // Click first photo for comparison
    fireEvent.click(compareButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Select a second photo to compare.')).toBeInTheDocument();
    });

    // Click second photo for comparison
    if (compareButtons.length > 1) {
      fireEvent.click(compareButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('Photo Comparison')).toBeInTheDocument();
      });
    }
  });

  it('clears comparison mode', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      const compareButtons = screen.getAllByLabelText('Compare this photo');
      expect(compareButtons.length).toBeGreaterThan(0);
    });

    const compareButtons = screen.getAllByLabelText('Compare this photo');
    
    // Enter comparison mode
    fireEvent.click(compareButtons[0]);
    if (compareButtons.length > 1) {
      fireEvent.click(compareButtons[1]);
    }

    await waitFor(() => {
      expect(screen.getByText('Clear Comparison')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear Comparison');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText('Photo Comparison')).not.toBeInTheDocument();
    });
  });

  it('opens share modal when share button clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      const shareButtons = screen.getAllByLabelText('Share this photo');
      expect(shareButtons.length).toBeGreaterThan(0);
    });

    const shareButtons = screen.getAllByLabelText('Share this photo');
    fireEvent.click(shareButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('share-modal')).toBeInTheDocument();
    });
  });

  it('handles photo deletion with confirmation', async () => {
    const { progressPhotosStorage } = await import('../services/progressPhotosStorage');
    
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ProgressPhotos />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete this photo');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByLabelText('Delete this photo');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(progressPhotosStorage.deletePhoto).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('cancels photo deletion when user declines', async () => {
    const { progressPhotosStorage } = await import('../services/progressPhotosStorage');
    
    // Mock window.confirm to return false
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<ProgressPhotos />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText('Delete this photo');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    const deleteButtons = screen.getAllByLabelText('Delete this photo');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
      expect(progressPhotosStorage.deletePhoto).not.toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('handles Escape key to close modals', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📤 Upload Photo')).toBeInTheDocument();
    });

    // Open upload modal
    const uploadButton = screen.getByText('📤 Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Progress Photo')).toBeInTheDocument();
    });

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Upload Progress Photo')).not.toBeInTheDocument();
    });
  });

  it('closes modal when backdrop is clicked', async () => {
    render(<ProgressPhotos />);

    await waitFor(() => {
      expect(screen.getByText('📤 Upload Photo')).toBeInTheDocument();
    });

    // Open upload modal
    const uploadButton = screen.getByText('📤 Upload Photo');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Progress Photo')).toBeInTheDocument();
    });

    // Click backdrop (the modal div itself has the onClick handler)
    const modal = screen.getByRole('dialog');
    fireEvent.click(modal);

    await waitFor(() => {
      expect(screen.queryByText('Upload Progress Photo')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
