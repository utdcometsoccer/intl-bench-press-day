import { useState, useEffect, useRef, useCallback } from 'react';
import { progressPhotosStorage, type ProgressPhoto } from '../services/progressPhotosStorage';
import ErrorMessage from './ErrorMessage';
import SuccessMessage from './SuccessMessage';
import LoadingState from './LoadingState';
import ShareModal from './ShareModal';
import { useFocusTrap } from '../hooks/useFocusTrap';
import styles from './ProgressPhotos.module.css';

export function ProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [photoToShare, setPhotoToShare] = useState<ProgressPhoto | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPhotos, setComparisonPhotos] = useState<[ProgressPhoto | null, ProgressPhoto | null]>([null, null]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Focus trap refs for modals
  const uploadModalRef = useFocusTrap<HTMLDivElement>(showUploadModal);
  const cameraModalRef = useFocusTrap<HTMLDivElement>(showCameraModal);
  const detailModalRef = useFocusTrap<HTMLDivElement>(selectedPhoto !== null);

  useEffect(() => {
    loadPhotos();
    const timeoutsSnapshot = timeoutRefs.current;

    // Cleanup camera stream and timeouts on unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      timeoutsSnapshot.forEach(clearTimeout);
    };
  }, []);

  // Handle escape key to close modals
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      if (showCameraModal) {
        stopCamera();
      } else if (showUploadModal) {
        setShowUploadModal(false);
      } else if (selectedPhoto) {
        setSelectedPhoto(null);
      }
    }
  }, [showCameraModal, showUploadModal, selectedPhoto]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedPhotos = await progressPhotosStorage.getAllPhotos();
      setPhotos(loadedPhotos);
    } catch (err) {
      setError('Failed to load progress photos. Please try again.');
      console.error('Error loading photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        await saveNewPhoto(imageData);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload photo. Please try again.');
      console.error('Error uploading photo:', err);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setShowCameraModal(true);
    } catch (err) {
      setError('Failed to access camera. Please check permissions.');
      console.error('Error accessing camera:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    saveNewPhoto(imageData);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const saveNewPhoto = async (imageData: string) => {
    try {
      setError(null);
      await progressPhotosStorage.savePhoto({
        imageData,
        dateTaken: new Date(),
      });
      setSuccess('Progress photo saved successfully!');
      setShowUploadModal(false);
      await loadPhotos();

      // Clear success message after 3 seconds
      const timeoutId = setTimeout(() => setSuccess(null), 3000);
      timeoutRefs.current.push(timeoutId);
    } catch (err) {
      setError('Failed to save photo. Please try again.');
      console.error('Error saving photo:', err);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      await progressPhotosStorage.deletePhoto(photoId);
      setSuccess('Photo deleted successfully!');
      setSelectedPhoto(null);
      await loadPhotos();

      const timeoutId = setTimeout(() => setSuccess(null), 3000);
      timeoutRefs.current.push(timeoutId);
    } catch (err) {
      setError('Failed to delete photo. Please try again.');
      console.error('Error deleting photo:', err);
    }
  };

  const handleShare = (photo: ProgressPhoto) => {
    setPhotoToShare(photo);
  };

  const selectForComparison = (photo: ProgressPhoto) => {
    if (!comparisonPhotos[0]) {
      setComparisonPhotos([photo, null]);
      setSuccess('Select a second photo to compare.');
      const timeoutId = setTimeout(() => setSuccess(null), 3000);
      timeoutRefs.current.push(timeoutId);
    } else if (!comparisonPhotos[1]) {
      setComparisonPhotos([comparisonPhotos[0], photo]);
      setComparisonMode(true);
      setSuccess(null);
    }
  };

  const clearComparison = () => {
    setComparisonPhotos([null, null]);
    setComparisonMode(false);
  };

  if (loading) {
    return <LoadingState title="Progress Photos" message="Loading progress photos..." />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 id="progress-photos-heading">Progress Photos</h2>
        <div className={styles.actions} role="group" aria-label="Photo actions">
          <button
            onClick={() => setShowUploadModal(true)}
            className={styles.primaryButton}
            aria-label="Upload progress photo"
          >
            📤 Upload Photo
          </button>
          <button
            onClick={startCamera}
            className={styles.primaryButton}
            aria-label="Take photo with camera"
          >
            📷 Take Photo
          </button>
          {comparisonPhotos[0] && (
            <button
              onClick={clearComparison}
              className={styles.secondaryButton}
              aria-label="Clear photo comparison"
            >
              Clear Comparison
            </button>
          )}
        </div>
      </header>

      {error && <ErrorMessage message={error} />}
      {success && <SuccessMessage message={success} />}

      {comparisonMode && comparisonPhotos[0] && comparisonPhotos[1] && (
        <div className={styles.comparisonView} role="region" aria-label="Photo comparison">
          <h3>Photo Comparison</h3>
          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonPhoto}>
              <img
                src={comparisonPhotos[0].imageData}
                alt={`Progress photo from ${comparisonPhotos[0].dateTaken.toLocaleDateString()}`}
              />
              <p>{comparisonPhotos[0].dateTaken.toLocaleDateString()}</p>
            </div>
            <div className={styles.comparisonPhoto}>
              <img
                src={comparisonPhotos[1].imageData}
                alt={`Progress photo from ${comparisonPhotos[1].dateTaken.toLocaleDateString()}`}
              />
              <p>{comparisonPhotos[1].dateTaken.toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {photos.length === 0 ? (
        <div className={styles.emptyState} role="status">
          <p className={styles.emptyStateIcon}>📸</p>
          <h3>No Progress Photos Yet</h3>
          <p>Start tracking your fitness journey by adding your first progress photo.</p>
          <p className={styles.emptyStateHint}>
            You can upload an existing photo or take a new one with your camera.
          </p>
        </div>
      ) : (
        <div
          className={styles.photoGrid}
          role="list"
          aria-label="Progress photo gallery"
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={styles.photoCard}
              role="listitem"
            >
              <button
                onClick={() => setSelectedPhoto(photo)}
                className={styles.photoButton}
                aria-label={`View photo from ${photo.dateTaken.toLocaleDateString()}`}
              >
                <img
                  src={photo.imageData}
                  alt={`Progress photo from ${photo.dateTaken.toLocaleDateString()}`}
                  className={styles.photoThumbnail}
                />
              </button>
              <div className={styles.photoInfo}>
                <p className={styles.photoDate}>
                  {photo.dateTaken.toLocaleDateString()}
                </p>
                {photo.bodyWeight && (
                  <p className={styles.photoMeta}>Weight: {photo.bodyWeight} lbs</p>
                )}
              </div>
              <div className={styles.photoActions}>
                <button
                  onClick={() => selectForComparison(photo)}
                  className={styles.iconButton}
                  aria-label="Compare this photo"
                  title="Compare"
                >
                  🔄
                </button>
                <button
                  onClick={() => handleShare(photo)}
                  className={styles.iconButton}
                  aria-label="Share this photo"
                  title="Share"
                >
                  📤
                </button>
                <button
                  onClick={() => handleDeletePhoto(photo.id)}
                  className={styles.iconButton}
                  aria-label="Delete this photo"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div 
          className={styles.modal} 
          role="dialog" 
          aria-labelledby="upload-modal-title"
          onClick={() => setShowUploadModal(false)}
        >
          <div 
            className={styles.modalContent}
            ref={uploadModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="upload-modal-title">Upload Progress Photo</h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className={styles.fileInput}
              aria-label="Choose image file"
            />
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowUploadModal(false)}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCameraModal && (
        <div 
          className={styles.modal} 
          role="dialog" 
          aria-labelledby="camera-modal-title"
          onClick={stopCamera}
        >
          <div 
            className={styles.modalContent}
            ref={cameraModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="camera-modal-title">Take Progress Photo</h3>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.video}
              aria-label="Camera preview"
            />
            <canvas ref={canvasRef} className={styles.hiddenCanvas} />
            <div className={styles.modalActions}>
              <button
                onClick={capturePhoto}
                className={styles.primaryButton}
                aria-label="Capture photo"
              >
                📷 Capture
              </button>
              <button
                onClick={stopCamera}
                className={styles.secondaryButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div 
          className={styles.modal} 
          role="dialog" 
          aria-labelledby="photo-detail-title"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className={styles.modalContent}
            ref={detailModalRef}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="photo-detail-title">
              Photo from {selectedPhoto.dateTaken.toLocaleDateString()}
            </h3>
            <img
              src={selectedPhoto.imageData}
              alt={`Progress photo from ${selectedPhoto.dateTaken.toLocaleDateString()}`}
              className={styles.photoDetail}
            />
            {selectedPhoto.notes && (
              <p className={styles.photoNotes}>{selectedPhoto.notes}</p>
            )}
            {selectedPhoto.bodyWeight && (
              <p>Body Weight: {selectedPhoto.bodyWeight} lbs</p>
            )}
            {selectedPhoto.measurements && (
              <div className={styles.measurements}>
                <h4>Measurements</h4>
                {selectedPhoto.measurements.chest && (
                  <p>Chest: {selectedPhoto.measurements.chest}"</p>
                )}
                {selectedPhoto.measurements.waist && (
                  <p>Waist: {selectedPhoto.measurements.waist}"</p>
                )}
                {selectedPhoto.measurements.arms && (
                  <p>Arms: {selectedPhoto.measurements.arms}"</p>
                )}
                {selectedPhoto.measurements.thighs && (
                  <p>Thighs: {selectedPhoto.measurements.thighs}"</p>
                )}
              </div>
            )}
            <div className={styles.modalActions}>
              <button
                onClick={() => handleShare(selectedPhoto)}
                className={styles.primaryButton}
              >
                📤 Share
              </button>
              <button
                onClick={() => setSelectedPhoto(null)}
                className={styles.secondaryButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {photoToShare && (
        <ShareModal
          photo={photoToShare}
          onClose={() => setPhotoToShare(null)}
        />
      )}
    </div>
  );
}

export default ProgressPhotos;
