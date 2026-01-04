import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { progressPhotosStorage } from '../services/progressPhotosStorage';

describe('ProgressPhotosStorage', () => {
  const mockPhotoData = {
    imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    dateTaken: new Date('2025-01-01'),
    notes: 'Progress photo 1',
    bodyWeight: 180,
    measurements: {
      chest: 42,
      waist: 32,
      arms: 15,
    },
  };

  beforeEach(async () => {
    // Clear all photos before each test
    await progressPhotosStorage.clearAllPhotos();
  });

  afterEach(() => {
    progressPhotosStorage.close();
  });

  describe('savePhoto', () => {
    it('should save a progress photo', async () => {
      const photo = await progressPhotosStorage.savePhoto(mockPhotoData);

      expect(photo).toBeDefined();
      expect(photo.id).toBeDefined();
      expect(photo.imageData).toBe(mockPhotoData.imageData);
      expect(photo.dateTaken).toEqual(mockPhotoData.dateTaken);
      expect(photo.notes).toBe(mockPhotoData.notes);
      expect(photo.bodyWeight).toBe(mockPhotoData.bodyWeight);
      expect(photo.measurements).toEqual(mockPhotoData.measurements);
      expect(photo.createdAt).toBeInstanceOf(Date);
      expect(photo.updatedAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs for each photo', async () => {
      const photo1 = await progressPhotosStorage.savePhoto(mockPhotoData);
      const photo2 = await progressPhotosStorage.savePhoto(mockPhotoData);

      expect(photo1.id).not.toBe(photo2.id);
    });

    it('should save photo without optional fields', async () => {
      const minimalPhotoData = {
        imageData: mockPhotoData.imageData,
        dateTaken: new Date('2025-01-02'),
      };

      const photo = await progressPhotosStorage.savePhoto(minimalPhotoData);

      expect(photo).toBeDefined();
      expect(photo.id).toBeDefined();
      expect(photo.notes).toBeUndefined();
      expect(photo.bodyWeight).toBeUndefined();
      expect(photo.measurements).toBeUndefined();
    });
  });

  describe('getAllPhotos', () => {
    it('should return empty array when no photos exist', async () => {
      const photos = await progressPhotosStorage.getAllPhotos();
      expect(photos).toEqual([]);
    });

    it('should return all saved photos', async () => {
      await progressPhotosStorage.savePhoto(mockPhotoData);
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });

      const photos = await progressPhotosStorage.getAllPhotos();

      expect(photos).toHaveLength(2);
      expect(photos[0].dateTaken).toBeInstanceOf(Date);
    });

    it('should return photos sorted by date taken (newest first)', async () => {
      const photo1 = await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      });
      const photo2 = await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-03'),
      });
      const photo3 = await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });

      const photos = await progressPhotosStorage.getAllPhotos();

      expect(photos).toHaveLength(3);
      expect(photos[0].id).toBe(photo2.id); // Newest (Jan 3)
      expect(photos[1].id).toBe(photo3.id); // Middle (Jan 2)
      expect(photos[2].id).toBe(photo1.id); // Oldest (Jan 1)
    });
  });

  describe('getPhoto', () => {
    it('should return a specific photo by ID', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);
      const retrievedPhoto = await progressPhotosStorage.getPhoto(savedPhoto.id);

      expect(retrievedPhoto).toBeDefined();
      expect(retrievedPhoto?.id).toBe(savedPhoto.id);
      expect(retrievedPhoto?.imageData).toBe(mockPhotoData.imageData);
      expect(retrievedPhoto?.dateTaken).toBeInstanceOf(Date);
    });

    it('should return null for non-existent photo', async () => {
      const photo = await progressPhotosStorage.getPhoto('non-existent-id');
      expect(photo).toBeNull();
    });
  });

  describe('updatePhoto', () => {
    it('should update photo notes', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);
      const updatedNotes = 'Updated progress notes';

      const updatedPhoto = await progressPhotosStorage.updatePhoto(savedPhoto.id, {
        notes: updatedNotes,
      });

      expect(updatedPhoto.notes).toBe(updatedNotes);
      expect(updatedPhoto.imageData).toBe(mockPhotoData.imageData);
      expect(updatedPhoto.updatedAt.getTime()).toBeGreaterThan(savedPhoto.updatedAt.getTime());
    });

    it('should update body weight', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);
      const newWeight = 175;

      const updatedPhoto = await progressPhotosStorage.updatePhoto(savedPhoto.id, {
        bodyWeight: newWeight,
      });

      expect(updatedPhoto.bodyWeight).toBe(newWeight);
    });

    it('should update measurements', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);
      const newMeasurements = {
        chest: 44,
        waist: 30,
        arms: 16,
        thighs: 24,
      };

      const updatedPhoto = await progressPhotosStorage.updatePhoto(savedPhoto.id, {
        measurements: newMeasurements,
      });

      expect(updatedPhoto.measurements).toEqual(newMeasurements);
    });

    it('should throw error when updating non-existent photo', async () => {
      await expect(
        progressPhotosStorage.updatePhoto('non-existent-id', { notes: 'test' })
      ).rejects.toThrow('Progress photo not found');
    });

    it('should preserve createdAt when updating', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);
      const originalCreatedAt = savedPhoto.createdAt;

      const updatedPhoto = await progressPhotosStorage.updatePhoto(savedPhoto.id, {
        notes: 'Updated',
      });

      expect(updatedPhoto.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo', async () => {
      const savedPhoto = await progressPhotosStorage.savePhoto(mockPhotoData);

      await progressPhotosStorage.deletePhoto(savedPhoto.id);

      const retrievedPhoto = await progressPhotosStorage.getPhoto(savedPhoto.id);
      expect(retrievedPhoto).toBeNull();
    });

    it('should not affect other photos when deleting one', async () => {
      const photo1 = await progressPhotosStorage.savePhoto(mockPhotoData);
      const photo2 = await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });

      await progressPhotosStorage.deletePhoto(photo1.id);

      const allPhotos = await progressPhotosStorage.getAllPhotos();
      expect(allPhotos).toHaveLength(1);
      expect(allPhotos[0].id).toBe(photo2.id);
    });
  });

  describe('getPhotosByDateRange', () => {
    it('should return photos within date range', async () => {
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      });
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-15'),
      });
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-31'),
      });

      const photos = await progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-01-10'),
        new Date('2025-01-20')
      );

      expect(photos).toHaveLength(1);
      expect(photos[0].dateTaken).toEqual(new Date('2025-01-15'));
    });

    it('should return empty array when no photos in range', async () => {
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      });

      const photos = await progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-02-01'),
        new Date('2025-02-28')
      );

      expect(photos).toEqual([]);
    });

    it('should include photos on boundary dates', async () => {
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      });
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-31'),
      });

      const photos = await progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      expect(photos).toHaveLength(2);
    });
  });

  describe('getPhotoCount', () => {
    it('should return 0 when no photos exist', async () => {
      const count = await progressPhotosStorage.getPhotoCount();
      expect(count).toBe(0);
    });

    it('should return correct count of photos', async () => {
      await progressPhotosStorage.savePhoto(mockPhotoData);
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-03'),
      });

      const count = await progressPhotosStorage.getPhotoCount();
      expect(count).toBe(3);
    });

    it('should decrease count after deletion', async () => {
      const photo = await progressPhotosStorage.savePhoto(mockPhotoData);
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });

      let count = await progressPhotosStorage.getPhotoCount();
      expect(count).toBe(2);

      await progressPhotosStorage.deletePhoto(photo.id);

      count = await progressPhotosStorage.getPhotoCount();
      expect(count).toBe(1);
    });
  });

  describe('clearAllPhotos', () => {
    it('should clear all photos', async () => {
      await progressPhotosStorage.savePhoto(mockPhotoData);
      await progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });

      await progressPhotosStorage.clearAllPhotos();

      const photos = await progressPhotosStorage.getAllPhotos();
      expect(photos).toEqual([]);
    });

    it('should reset photo count to 0', async () => {
      await progressPhotosStorage.savePhoto(mockPhotoData);
      await progressPhotosStorage.clearAllPhotos();

      const count = await progressPhotosStorage.getPhotoCount();
      expect(count).toBe(0);
    });
  });
});
