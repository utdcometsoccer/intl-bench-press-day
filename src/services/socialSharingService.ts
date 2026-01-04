// Social Sharing Service
// Handles sharing progress photos to various platforms

import type { ProgressPhoto } from './progressPhotosStorage';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  hashtags?: string[];
}

class SocialSharingService {
  // Check if Web Share API is supported
  isWebShareSupported(): boolean {
    return navigator.share !== undefined;
  }

  // Share using Web Share API (mobile-first)
  async shareWithWebShare(photo: ProgressPhoto, options: ShareOptions = {}): Promise<boolean> {
    if (!this.isWebShareSupported()) {
      return false;
    }

    try {
      // Convert base64 to blob for sharing
      const blob = await this.base64ToBlob(photo.imageData);
      const file = new File([blob], `progress-photo-${photo.dateTaken.toISOString().split('T')[0]}.jpg`, {
        type: 'image/jpeg',
      });

      const shareData: ShareData = {
        title: options.title || 'My Fitness Progress',
        text: options.text || `Progress photo from ${photo.dateTaken.toLocaleDateString()}`,
        files: [file],
      };

      await navigator.share(shareData);
      return true;
    } catch (err) {
      // User cancelled or share failed
      console.error('Web Share failed:', err);
      return false;
    }
  }

  // Convert base64 image to Blob
  private async base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }

  // Copy image to clipboard
  async copyToClipboard(photo: ProgressPhoto): Promise<boolean> {
    try {
      const blob = await this.base64ToBlob(photo.imageData);
      const item = new ClipboardItem({ 'image/jpeg': blob });
      await navigator.clipboard.write([item]);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  }

  // Share to Twitter
  shareToTwitter(_photo: ProgressPhoto, options: ShareOptions = {}): void {
    const text = options.text || `Check out my fitness progress! #FitnessJourney`;
    const hashtags = options.hashtags?.join(',') || 'fitness,workout,progress';
    const url = options.url || window.location.href;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&hashtags=${hashtags}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }

  // Share to Facebook (photo parameter for consistency, though not used in URL-based sharing)
  shareToFacebook(_photo: ProgressPhoto, options: ShareOptions = {}): void {
    const url = options.url || window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
  }

  // Share to LinkedIn
  shareToLinkedIn(_photo: ProgressPhoto, options: ShareOptions = {}): void {
    const url = options.url || window.location.href;
    const title = options.title || 'My Fitness Progress';
    const summary = options.text || 'Check out my fitness journey!';

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedInUrl, '_blank', 'width=550,height=420');
  }

  // Share to WhatsApp
  shareToWhatsApp(_photo: ProgressPhoto, options: ShareOptions = {}): void {
    const text = options.text || 'Check out my fitness progress!';
    const url = options.url || window.location.href;
    const message = `${text} ${url}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }

  // Share to Reddit
  shareToReddit(_photo: ProgressPhoto, options: ShareOptions = {}): void {
    const url = options.url || window.location.href;
    const title = options.title || 'My Fitness Progress';

    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank', 'width=850,height=600');
  }

  // Download photo
  downloadPhoto(photo: ProgressPhoto): void {
    const link = document.createElement('a');
    link.href = photo.imageData;
    link.download = `progress-photo-${photo.dateTaken.toISOString().split('T')[0]}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Generate shareable image with metadata overlay
  async generateShareableImage(photo: ProgressPhoto): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Set canvas size
        const padding = 40;
        const textHeight = 100;
        canvas.width = img.width + padding * 2;
        canvas.height = img.height + padding * 2 + textHeight;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image
        ctx.drawImage(img, padding, padding, img.width, img.height);

        // Draw semi-transparent background for text area to improve legibility
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, img.height + padding, canvas.width, textHeight + padding);

        // Add text shadow for better legibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        // Draw text overlay with high contrast
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Progress: ${photo.dateTaken.toLocaleDateString()}`,
          canvas.width / 2,
          img.height + padding + 40
        );

        if (photo.bodyWeight) {
          ctx.font = '18px sans-serif';
          ctx.fillText(
            `Weight: ${photo.bodyWeight} lbs`,
            canvas.width / 2,
            img.height + padding + 70
          );
        }

        // Reset shadow for any future drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Convert to data URL
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = photo.imageData;
    });
  }
}

// Export singleton instance
export const socialSharingService = new SocialSharingService();
