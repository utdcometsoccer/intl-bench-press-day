import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { progressPhotosStorage } from '../services/progressPhotosStorage';
import { simulateIDBSuccess, simulateIDBUpgradeNeeded } from './setup';

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
    vi.clearAllMocks();
    // Clear all photos before each test (this also initializes the DB)
    const clearPromise = progressPhotosStorage.clearAllPhotos();
    // First simulate DB initialization
    simulateIDBUpgradeNeeded();
    // Then simulate the clear operation
    setTimeout(() => simulateIDBSuccess(), 10);
    await clearPromise;
  });

  afterEach(() => {
    progressPhotosStorage.close();
  });

  describe('savePhoto', () => {
    it('should save a progress photo', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const photo = await savePromise;

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
      const promise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const photo1 = await promise1;
      
      const promise2 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const photo2 = await promise2;

      expect(photo1.id).not.toBe(photo2.id);
    });

    it('should save photo without optional fields', async () => {
      const minimalPhotoData = {
        imageData: mockPhotoData.imageData,
        dateTaken: new Date('2025-01-02'),
      };

      const savePromise = progressPhotosStorage.savePhoto(minimalPhotoData);
      simulateIDBSuccess();
      const photo = await savePromise;

      expect(photo).toBeDefined();
      expect(photo.id).toBeDefined();
      expect(photo.notes).toBeUndefined();
      expect(photo.bodyWeight).toBeUndefined();
      expect(photo.measurements).toBeUndefined();
    });
  });

  describe('getAllPhotos', () => {
    it('should return empty array when no photos exist', async () => {
      const promise = progressPhotosStorage.getAllPhotos();
      simulateIDBSuccess([]);
      const photos = await promise;
      expect(photos).toEqual([]);
    });

    it('should return all saved photos', async () => {
      const savePromise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      simulateIDBSuccess();
      await savePromise2;

      const getAllPromise = progressPhotosStorage.getAllPhotos();
      simulateIDBSuccess([
        { ...mockPhotoData, id: '1', createdAt: new Date(), updatedAt: new Date() },
        { ...mockPhotoData, dateTaken: new Date('2025-01-02'), id: '2', createdAt: new Date(), updatedAt: new Date() }
      ]);
      const photos = await getAllPromise;

      expect(photos).toHaveLength(2);
      expect(photos[0].dateTaken).toBeInstanceOf(Date);
    });

    it('should return photos sorted by date taken (newest first)', async () => {
      const photo1Data = {
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      };
      const photo2Data = {
        ...mockPhotoData,
        dateTaken: new Date('2025-01-03'),
      };
      const photo3Data = {
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      };
      
      const savePromise1 = progressPhotosStorage.savePhoto(photo1Data);
      simulateIDBSuccess();
      const photo1 = await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto(photo2Data);
      simulateIDBSuccess();
      const photo2 = await savePromise2;
      
      const savePromise3 = progressPhotosStorage.savePhoto(photo3Data);
      simulateIDBSuccess();
      const photo3 = await savePromise3;

      const getAllPromise = progressPhotosStorage.getAllPhotos();
      simulateIDBSuccess([
        { ...photo1Data, id: photo1.id, createdAt: photo1.createdAt, updatedAt: photo1.updatedAt },
        { ...photo2Data, id: photo2.id, createdAt: photo2.createdAt, updatedAt: photo2.updatedAt },
        { ...photo3Data, id: photo3.id, createdAt: photo3.createdAt, updatedAt: photo3.updatedAt }
      ]);
      const photos = await getAllPromise;

      expect(photos).toHaveLength(3);
      expect(photos[0].id).toBe(photo2.id); // Newest (Jan 3)
      expect(photos[1].id).toBe(photo3.id); // Middle (Jan 2)
      expect(photos[2].id).toBe(photo1.id); // Oldest (Jan 1)
    });
  });

  describe('getPhoto', () => {
    it('should return a specific photo by ID', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;
      
      const getPromise = progressPhotosStorage.getPhoto(savedPhoto.id);
      simulateIDBSuccess({ ...mockPhotoData, id: savedPhoto.id, createdAt: savedPhoto.createdAt, updatedAt: savedPhoto.updatedAt });
      const retrievedPhoto = await getPromise;

      expect(retrievedPhoto).toBeDefined();
      expect(retrievedPhoto?.id).toBe(savedPhoto.id);
      expect(retrievedPhoto?.imageData).toBe(mockPhotoData.imageData);
      expect(retrievedPhoto?.dateTaken).toBeInstanceOf(Date);
    });

    it('should return null for non-existent photo', async () => {
      const promise = progressPhotosStorage.getPhoto('non-existent-id');
      simulateIDBSuccess(undefined);
      const photo = await promise;
      expect(photo).toBeNull();
    });
  });

  describe('updatePhoto', () => {
    it('should update photo notes', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;
      const updatedNotes = 'Updated progress notes';

      const updatePromise = progressPhotosStorage.updatePhoto(savedPhoto.id, {
        notes: updatedNotes,
      });
      
      // First simulate getting the existing photo
      setTimeout(() => simulateIDBSuccess({ ...mockPhotoData, id: savedPhoto.id, createdAt: savedPhoto.createdAt, updatedAt: savedPhoto.updatedAt }), 0);
      // Then simulate successful update
      setTimeout(() => simulateIDBSuccess(), 10);
      
      const updatedPhoto = await updatePromise;

      expect(updatedPhoto.notes).toBe(updatedNotes);
      expect(updatedPhoto.imageData).toBe(mockPhotoData.imageData);
      expect(updatedPhoto.updatedAt.getTime()).toBeGreaterThan(savedPhoto.updatedAt.getTime());
    });

    it('should update body weight', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;
      const newWeight = 175;

      const updatePromise = progressPhotosStorage.updatePhoto(savedPhoto.id, {
        bodyWeight: newWeight,
      });
      
      // First simulate getting the existing photo
      setTimeout(() => simulateIDBSuccess({ ...mockPhotoData, id: savedPhoto.id, createdAt: savedPhoto.createdAt, updatedAt: savedPhoto.updatedAt }), 0);
      // Then simulate successful update
      setTimeout(() => simulateIDBSuccess(), 10);
      
      const updatedPhoto = await updatePromise;

      expect(updatedPhoto.bodyWeight).toBe(newWeight);
    });

    it('should update measurements', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;
      const newMeasurements = {
        chest: 44,
        waist: 30,
        arms: 16,
        thighs: 24,
      };

      const updatePromise = progressPhotosStorage.updatePhoto(savedPhoto.id, {
        measurements: newMeasurements,
      });
      
      // First simulate getting the existing photo
      setTimeout(() => simulateIDBSuccess({ ...mockPhotoData, id: savedPhoto.id, createdAt: savedPhoto.createdAt, updatedAt: savedPhoto.updatedAt }), 0);
      // Then simulate successful update
      setTimeout(() => simulateIDBSuccess(), 10);
      
      const updatedPhoto = await updatePromise;

      expect(updatedPhoto.measurements).toEqual(newMeasurements);
    });

    it('should throw error when updating non-existent photo', async () => {
      const updatePromise = progressPhotosStorage.updatePhoto('non-existent-id', { notes: 'test' });
      simulateIDBSuccess(undefined);
      
      await expect(updatePromise).rejects.toThrow('Progress photo not found');
    });

    it('should preserve createdAt when updating', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;
      const originalCreatedAt = savedPhoto.createdAt;

      const updatePromise = progressPhotosStorage.updatePhoto(savedPhoto.id, {
        notes: 'Updated',
      });
      
      // First simulate getting the existing photo
      setTimeout(() => simulateIDBSuccess({ ...mockPhotoData, id: savedPhoto.id, createdAt: savedPhoto.createdAt, updatedAt: savedPhoto.updatedAt }), 0);
      // Then simulate successful update
      setTimeout(() => simulateIDBSuccess(), 10);
      
      const updatedPhoto = await updatePromise;

      expect(updatedPhoto.createdAt).toEqual(originalCreatedAt);
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const savedPhoto = await savePromise;

      const deletePromise = progressPhotosStorage.deletePhoto(savedPhoto.id);
      simulateIDBSuccess();
      await deletePromise;

      const getPromise = progressPhotosStorage.getPhoto(savedPhoto.id);
      simulateIDBSuccess(undefined);
      const retrievedPhoto = await getPromise;
      expect(retrievedPhoto).toBeNull();
    });

    it('should not affect other photos when deleting one', async () => {
      const savePromise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const photo1 = await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      simulateIDBSuccess();
      const photo2 = await savePromise2;

      const deletePromise = progressPhotosStorage.deletePhoto(photo1.id);
      simulateIDBSuccess();
      await deletePromise;

      const getAllPromise = progressPhotosStorage.getAllPhotos();
      simulateIDBSuccess([{ ...mockPhotoData, dateTaken: new Date('2025-01-02'), id: photo2.id, createdAt: photo2.createdAt, updatedAt: photo2.updatedAt }]);
      const allPhotos = await getAllPromise;
      
      expect(allPhotos).toHaveLength(1);
      expect(allPhotos[0].id).toBe(photo2.id);
    });
  });

  describe('getPhotosByDateRange', () => {
    it('should return photos within date range', async () => {
      const photo1Data = { ...mockPhotoData, dateTaken: new Date('2025-01-01') };
      const photo2Data = { ...mockPhotoData, dateTaken: new Date('2025-01-15') };
      const photo3Data = { ...mockPhotoData, dateTaken: new Date('2025-01-31') };
      
      const savePromise1 = progressPhotosStorage.savePhoto(photo1Data);
      simulateIDBSuccess();
      await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto(photo2Data);
      simulateIDBSuccess();
      const photo2 = await savePromise2;
      
      const savePromise3 = progressPhotosStorage.savePhoto(photo3Data);
      simulateIDBSuccess();
      await savePromise3;

      const getAllPromise = progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-01-10'),
        new Date('2025-01-20')
      );
      // getAllPhotos is called internally
      setTimeout(() => simulateIDBSuccess([
        { ...photo1Data, id: '1', createdAt: new Date(), updatedAt: new Date() },
        { ...photo2Data, id: photo2.id, createdAt: photo2.createdAt, updatedAt: photo2.updatedAt },
        { ...photo3Data, id: '3', createdAt: new Date(), updatedAt: new Date() }
      ]), 0);
      const photos = await getAllPromise;

      expect(photos).toHaveLength(1);
      expect(photos[0].dateTaken).toEqual(new Date('2025-01-15'));
    });

    it('should return empty array when no photos in range', async () => {
      const savePromise = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-01'),
      });
      simulateIDBSuccess();
      await savePromise;

      const getByRangePromise = progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-02-01'),
        new Date('2025-02-28')
      );
      // getAllPhotos is called internally
      setTimeout(() => simulateIDBSuccess([{ ...mockPhotoData, dateTaken: new Date('2025-01-01'), id: '1', createdAt: new Date(), updatedAt: new Date() }]), 0);
      const photos = await getByRangePromise;

      expect(photos).toEqual([]);
    });

    it('should include photos on boundary dates', async () => {
      const photo1Data = { ...mockPhotoData, dateTaken: new Date('2025-01-01') };
      const photo2Data = { ...mockPhotoData, dateTaken: new Date('2025-01-31') };
      
      const savePromise1 = progressPhotosStorage.savePhoto(photo1Data);
      simulateIDBSuccess();
      await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto(photo2Data);
      simulateIDBSuccess();
      await savePromise2;

      const getByRangePromise = progressPhotosStorage.getPhotosByDateRange(
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );
      // getAllPhotos is called internally
      setTimeout(() => simulateIDBSuccess([
        { ...photo1Data, id: '1', createdAt: new Date(), updatedAt: new Date() },
        { ...photo2Data, id: '2', createdAt: new Date(), updatedAt: new Date() }
      ]), 0);
      const photos = await getByRangePromise;

      expect(photos).toHaveLength(2);
    });
  });

  describe('getPhotoCount', () => {
    it('should return 0 when no photos exist', async () => {
      const promise = progressPhotosStorage.getPhotoCount();
      simulateIDBSuccess(0);
      const count = await promise;
      expect(count).toBe(0);
    });

    it('should return correct count of photos', async () => {
      const savePromise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      simulateIDBSuccess();
      await savePromise2;
      
      const savePromise3 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-03'),
      });
      simulateIDBSuccess();
      await savePromise3;

      const countPromise = progressPhotosStorage.getPhotoCount();
      simulateIDBSuccess(3);
      const count = await countPromise;
      expect(count).toBe(3);
    });

    it('should decrease count after deletion', async () => {
      const savePromise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      const photo = await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      simulateIDBSuccess();
      await savePromise2;

      const countPromise1 = progressPhotosStorage.getPhotoCount();
      simulateIDBSuccess(2);
      let count = await countPromise1;
      expect(count).toBe(2);

      const deletePromise = progressPhotosStorage.deletePhoto(photo.id);
      simulateIDBSuccess();
      await deletePromise;

      const countPromise2 = progressPhotosStorage.getPhotoCount();
      simulateIDBSuccess(1);
      count = await countPromise2;
      expect(count).toBe(1);
    });
  });

  describe('clearAllPhotos', () => {
    it('should clear all photos', async () => {
      const savePromise1 = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      await savePromise1;
      
      const savePromise2 = progressPhotosStorage.savePhoto({
        ...mockPhotoData,
        dateTaken: new Date('2025-01-02'),
      });
      simulateIDBSuccess();
      await savePromise2;

      const clearPromise = progressPhotosStorage.clearAllPhotos();
      simulateIDBSuccess();
      await clearPromise;

      const getAllPromise = progressPhotosStorage.getAllPhotos();
      simulateIDBSuccess([]);
      const photos = await getAllPromise;
      expect(photos).toEqual([]);
    });

    it('should reset photo count to 0', async () => {
      const savePromise = progressPhotosStorage.savePhoto(mockPhotoData);
      simulateIDBSuccess();
      await savePromise;
      
      const clearPromise = progressPhotosStorage.clearAllPhotos();
      simulateIDBSuccess();
      await clearPromise;

      const countPromise = progressPhotosStorage.getPhotoCount();
      simulateIDBSuccess(0);
      const count = await countPromise;
      expect(count).toBe(0);
    });
  });
});
