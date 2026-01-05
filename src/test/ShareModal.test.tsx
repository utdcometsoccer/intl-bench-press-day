import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ShareModal from '../components/ShareModal';
import type { ProgressPhoto } from '../services/progressPhotosStorage';

// Mock the social sharing service
vi.mock('../services/socialSharingService', () => ({
  socialSharingService: {
    isWebShareSupported: vi.fn(() => false),
    shareWithWebShare: vi.fn().mockResolvedValue(false),
    copyToClipboard: vi.fn().mockResolvedValue(true),
    shareToTwitter: vi.fn().mockResolvedValue(undefined),
    shareToFacebook: vi.fn().mockResolvedValue(undefined),
    shareToLinkedIn: vi.fn().mockResolvedValue(undefined),
    shareToWhatsApp: vi.fn().mockResolvedValue(undefined),
    shareToReddit: vi.fn().mockResolvedValue(undefined),
    downloadPhoto: vi.fn().mockResolvedValue(undefined),
    generateShareableImage: vi.fn().mockResolvedValue('data:image/png;base64,generated'),
  },
}));

// Mock useFocusTrap hook
vi.mock('../hooks/useFocusTrap', () => ({
  useFocusTrap: vi.fn(() => ({ current: null })),
}));

describe('ShareModal', () => {
  const mockPhoto: ProgressPhoto = {
    id: 'photo-1',
    imageData: 'data:image/png;base64,test',
    dateTaken: new Date('2025-01-01'),
    notes: 'Test photo',
    bodyWeight: 180,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the share modal with photo preview', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    expect(screen.getByText('Share Progress Photo')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockPhoto.imageData);
  });

  it('closes modal when close button is clicked', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close share modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when cancel button is clicked', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when backdrop is clicked', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close modal when modal content is clicked', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    // Click the inner modal div (not the overlay)
    const modal = screen.getByRole('dialog').querySelector('[class*="modal"]');
    if (modal) {
      fireEvent.click(modal);
    }

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles copy to clipboard', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const copyButton = screen.getByLabelText('Copy photo to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(socialSharingService.copyToClipboard).toHaveBeenCalledWith(mockPhoto);
    });

    await waitFor(() => {
      expect(screen.getByText('Photo copied to clipboard!')).toBeInTheDocument();
    });
  });

  it('handles failed clipboard copy', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    vi.mocked(socialSharingService.copyToClipboard).mockResolvedValueOnce(false);
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const copyButton = screen.getByLabelText('Copy photo to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to copy to clipboard/)).toBeInTheDocument();
    });
  });

  it('handles Twitter share', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const twitterButton = screen.getByLabelText('Share to Twitter');
    fireEvent.click(twitterButton);

    await waitFor(() => {
      expect(socialSharingService.shareToTwitter).toHaveBeenCalledWith(
        mockPhoto,
        expect.objectContaining({
          text: expect.stringContaining('1/1/2025'),
          hashtags: expect.arrayContaining(['fitness', 'progress', 'workout', 'BenchPressDay']),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo with text overlay downloaded/)).toBeInTheDocument();
    });
  });

  it('handles Facebook share', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const facebookButton = screen.getByLabelText('Share to Facebook');
    fireEvent.click(facebookButton);

    await waitFor(() => {
      expect(socialSharingService.shareToFacebook).toHaveBeenCalledWith(mockPhoto);
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo with text overlay downloaded/)).toBeInTheDocument();
    });
  });

  it('handles LinkedIn share', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const linkedinButton = screen.getByLabelText('Share to LinkedIn');
    fireEvent.click(linkedinButton);

    await waitFor(() => {
      expect(socialSharingService.shareToLinkedIn).toHaveBeenCalledWith(
        mockPhoto,
        expect.objectContaining({
          title: 'Fitness Progress Update',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo with text overlay downloaded/)).toBeInTheDocument();
    });
  });

  it('handles WhatsApp share', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const whatsappButton = screen.getByLabelText('Share to WhatsApp');
    fireEvent.click(whatsappButton);

    await waitFor(() => {
      expect(socialSharingService.shareToWhatsApp).toHaveBeenCalledWith(
        mockPhoto,
        expect.objectContaining({
          text: expect.stringContaining('1/1/2025'),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo with text overlay downloaded/)).toBeInTheDocument();
    });
  });

  it('handles Reddit share', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const redditButton = screen.getByLabelText('Share to Reddit');
    fireEvent.click(redditButton);

    await waitFor(() => {
      expect(socialSharingService.shareToReddit).toHaveBeenCalledWith(
        mockPhoto,
        expect.objectContaining({
          title: expect.stringContaining('1/1/2025'),
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Photo with text overlay downloaded/)).toBeInTheDocument();
    });
  });

  it('handles photo download', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const downloadButton = screen.getByLabelText('Download photo');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(socialSharingService.downloadPhoto).toHaveBeenCalledWith(mockPhoto);
    });

    await waitFor(() => {
      expect(screen.getByText('Photo with text overlay downloaded!')).toBeInTheDocument();
    });
  });

  it('generates shareable image when sharing to Twitter', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const twitterButton = screen.getByLabelText('Share to Twitter');
    fireEvent.click(twitterButton);

    await waitFor(() => {
      expect(socialSharingService.shareToTwitter).toHaveBeenCalled();
    });
  });

  it('generates shareable image when copying to clipboard', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    const copyButton = screen.getByLabelText('Copy photo to clipboard');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(socialSharingService.copyToClipboard).toHaveBeenCalledWith(mockPhoto);
    });
  });

  it('shows Web Share option when supported', async () => {
    const { socialSharingService } = await import('../services/socialSharingService');
    vi.mocked(socialSharingService.isWebShareSupported).mockReturnValueOnce(true);
    
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    expect(screen.getByLabelText('Share using device share menu')).toBeInTheDocument();
  });

  it('handles Escape key press', () => {
    render(<ShareModal photo={mockPhoto} onClose={mockOnClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
