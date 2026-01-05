import { describe, it, expect, vi, beforeEach, afterEach, type SpyInstance } from 'vitest';
import { socialSharingService } from '../services/socialSharingService';
import type { ProgressPhoto } from '../services/progressPhotosStorage';

describe('socialSharingService', () => {
  const mockPhoto: ProgressPhoto = {
    id: 'photo-1',
    imageData: 'data:image/png;base64,test',
    dateTaken: new Date('2025-01-01'),
    notes: 'Test photo',
    bodyWeight: 180,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  let generateShareableImageSpy: SpyInstance<[ProgressPhoto], Promise<string>>;
  let windowOpenSpy: SpyInstance<[url?: string | URL | undefined, target?: string | undefined, features?: string | undefined], Window | null>;
  let createElementSpy: SpyInstance<[tagName: string, options?: ElementCreationOptions | undefined], HTMLElement>;

  beforeEach(() => {
    // Spy on generateShareableImage method
    generateShareableImageSpy = vi.spyOn(socialSharingService, 'generateShareableImage');
    generateShareableImageSpy.mockResolvedValue('data:image/png;base64,generated');

    // Mock window.open
    windowOpenSpy = vi.spyOn(window, 'open');
    windowOpenSpy.mockImplementation(() => null);

    // Mock document.createElement for download tests
    createElementSpy = vi.spyOn(document, 'createElement');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shareToTwitter', () => {
    it('calls generateShareableImage with the photo', async () => {
      await socialSharingService.shareToTwitter(mockPhoto, {
        text: 'Test tweet',
        hashtags: ['test'],
      });

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.shareToTwitter(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('shareToFacebook', () => {
    it('calls generateShareableImage with the photo', async () => {
      await socialSharingService.shareToFacebook(mockPhoto);

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.shareToFacebook(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('shareToLinkedIn', () => {
    it('calls generateShareableImage with the photo', async () => {
      await socialSharingService.shareToLinkedIn(mockPhoto, {
        title: 'Test title',
        text: 'Test text',
      });

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.shareToLinkedIn(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('shareToWhatsApp', () => {
    it('calls generateShareableImage with the photo', async () => {
      await socialSharingService.shareToWhatsApp(mockPhoto, {
        text: 'Test message',
      });

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.shareToWhatsApp(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('shareToReddit', () => {
    it('calls generateShareableImage with the photo', async () => {
      await socialSharingService.shareToReddit(mockPhoto, {
        title: 'Test title',
      });

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(windowOpenSpy).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.shareToReddit(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('downloadPhoto', () => {
    it('calls generateShareableImage with the photo', async () => {
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockLink as unknown as HTMLElement);
      
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      appendChildSpy.mockImplementation(() => mockLink as unknown as Node);
      
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');
      removeChildSpy.mockImplementation(() => mockLink as unknown as Node);

      await socialSharingService.downloadPhoto(mockPhoto);

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('throws error when generateShareableImage fails', async () => {
      const error = new Error('Image generation failed');
      generateShareableImageSpy.mockRejectedValueOnce(error);

      await expect(socialSharingService.downloadPhoto(mockPhoto)).rejects.toThrow(error);
    });
  });

  describe('copyToClipboard', () => {
    it('calls generateShareableImage with the photo', async () => {
      // Mock ClipboardItem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).ClipboardItem = vi.fn().mockImplementation((data: Record<string, Blob>) => data);

      // Mock fetch for base64ToBlob
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
      } as unknown as Response);

      // Mock clipboard API
      const mockClipboard: Pick<Clipboard, 'write'> = {
        write: vi.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        writable: true,
        configurable: true,
      });

      await socialSharingService.copyToClipboard(mockPhoto);

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(mockClipboard.write).toHaveBeenCalled();
    });
  });

  describe('shareWithWebShare', () => {
    it('calls generateShareableImage when Web Share is supported', async () => {
      // Mock Web Share API
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        writable: true,
        configurable: true,
      });

      // Mock fetch for base64ToBlob
      global.fetch = vi.fn().mockResolvedValue({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
      });

      await socialSharingService.shareWithWebShare(mockPhoto, {
        title: 'Test title',
        text: 'Test text',
      });

      expect(generateShareableImageSpy).toHaveBeenCalledWith(mockPhoto);
      expect(mockShare).toHaveBeenCalled();
    });
  });
});
