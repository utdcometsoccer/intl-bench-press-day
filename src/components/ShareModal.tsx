import { useState, useEffect, useRef, useCallback } from 'react';
import { socialSharingService } from '../services/socialSharingService';
import type { ProgressPhoto } from '../services/progressPhotosStorage';
import SuccessMessage from './SuccessMessage';
import ErrorMessage from './ErrorMessage';
import { useFocusTrap } from '../hooks/useFocusTrap';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  photo: ProgressPhoto;
  onClose: () => void;
}

function ShareModal({ photo, onClose }: ShareModalProps) {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Focus trap for modal
  const modalRef = useFocusTrap<HTMLDivElement>(true);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      const timeouts = timeoutRefs.current;
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // Handle escape key to close modal
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const handleWebShare = async () => {
    const shared = await socialSharingService.shareWithWebShare(photo, {
      title: 'My Fitness Progress',
      text: `Progress photo from ${photo.dateTaken.toLocaleDateString()}`,
    });

    if (shared) {
      setSuccess('Photo shared successfully!');
      const timeoutId = setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 2000);
      timeoutRefs.current.push(timeoutId);
    } else {
      setError('Web Share not available on this device.');
      const timeoutId = setTimeout(() => setError(null), 3000);
      timeoutRefs.current.push(timeoutId);
    }
  };

  const handleCopyToClipboard = async () => {
    const copied = await socialSharingService.copyToClipboard(photo);

    if (copied) {
      setSuccess('Photo copied to clipboard!');
      const timeoutId = setTimeout(() => setSuccess(null), 2000);
      timeoutRefs.current.push(timeoutId);
    } else {
      setError('Failed to copy to clipboard. Please try downloading instead.');
      const timeoutId = setTimeout(() => setError(null), 3000);
      timeoutRefs.current.push(timeoutId);
    }
  };

  const handleTwitterShare = () => {
    socialSharingService.shareToTwitter(photo, {
      text: `Check out my fitness progress from ${photo.dateTaken.toLocaleDateString()}!`,
      hashtags: ['fitness', 'progress', 'workout', 'BenchPressDay'],
    });
  };

  const handleFacebookShare = () => {
    socialSharingService.shareToFacebook(photo);
  };

  const handleLinkedInShare = () => {
    socialSharingService.shareToLinkedIn(photo, {
      title: 'Fitness Progress Update',
      text: `Tracking my fitness journey - progress photo from ${photo.dateTaken.toLocaleDateString()}`,
    });
  };

  const handleWhatsAppShare = () => {
    socialSharingService.shareToWhatsApp(photo, {
      text: `Check out my fitness progress from ${photo.dateTaken.toLocaleDateString()}!`,
    });
  };

  const handleRedditShare = () => {
    socialSharingService.shareToReddit(photo, {
      title: `Fitness Progress Update - ${photo.dateTaken.toLocaleDateString()}`,
    });
  };

  const handleDownload = () => {
    socialSharingService.downloadPhoto(photo);
    setSuccess('Photo downloaded!');
    const timeoutId = setTimeout(() => setSuccess(null), 2000);
    timeoutRefs.current.push(timeoutId);
  };

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-labelledby="share-modal-title"
      aria-modal="true"
      onClick={onClose}
    >
      <div 
        className={styles.modal}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="share-modal-title">Share Progress Photo</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close share modal"
          >
            ✕
          </button>
        </header>

        {success && <SuccessMessage message={success} />}
        {error && <ErrorMessage message={error} />}

        <div className={styles.preview}>
          <img
            src={photo.imageData}
            alt={`Progress photo from ${photo.dateTaken.toLocaleDateString()}`}
            className={styles.previewImage}
          />
        </div>

        <div className={styles.shareOptions} role="group" aria-label="Share options">
          {socialSharingService.isWebShareSupported() && (
            <button
              onClick={handleWebShare}
              className={styles.shareButton}
              aria-label="Share using device share menu"
            >
              <span className={styles.shareIcon}>📤</span>
              <span>Share...</span>
            </button>
          )}

          <button
            onClick={handleCopyToClipboard}
            className={styles.shareButton}
            aria-label="Copy photo to clipboard"
          >
            <span className={styles.shareIcon}>📋</span>
            <span>Copy to Clipboard</span>
          </button>

          <button
            onClick={handleTwitterShare}
            className={styles.shareButton}
            aria-label="Share to Twitter"
          >
            <span className={styles.shareIcon}>🐦</span>
            <span>Twitter</span>
          </button>

          <button
            onClick={handleFacebookShare}
            className={styles.shareButton}
            aria-label="Share to Facebook"
          >
            <span className={styles.shareIcon}>👤</span>
            <span>Facebook</span>
          </button>

          <button
            onClick={handleLinkedInShare}
            className={styles.shareButton}
            aria-label="Share to LinkedIn"
          >
            <span className={styles.shareIcon}>💼</span>
            <span>LinkedIn</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className={styles.shareButton}
            aria-label="Share to WhatsApp"
          >
            <span className={styles.shareIcon}>💬</span>
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleRedditShare}
            className={styles.shareButton}
            aria-label="Share to Reddit"
          >
            <span className={styles.shareIcon}>🤖</span>
            <span>Reddit</span>
          </button>

          <button
            onClick={handleDownload}
            className={styles.shareButton}
            aria-label="Download photo"
          >
            <span className={styles.shareIcon}>💾</span>
            <span>Download</span>
          </button>
        </div>

        <div className={styles.footer}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
