import React, { useState, useEffect } from 'react';
import type { PlateSet, Plate, LocationInfo } from '../types/plateCalculator';
import { plateCalculatorStorage } from '../services/plateCalculatorStorage';
import { DEFAULT_OLYMPIC_PLATES, DEFAULT_METRIC_PLATES, COMMON_BAR_WEIGHTS } from '../types/plateCalculator';
import styles from './PlateSetManager.module.css';

interface PlateSetManagerProps {
  onClose: () => void;
  onPlateSetChange?: (plateSetId: string) => void;
}

const PlateSetManager: React.FC<PlateSetManagerProps> = ({
  onClose,
  onPlateSetChange
}) => {
  const [plateSets, setPlateSets] = useState<PlateSet[]>([]);
  const [editingPlateSet, setEditingPlateSet] = useState<PlateSet | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadPlateSets();
    loadCurrentLocation();
  }, []);

  const loadPlateSets = async () => {
    try {
      const sets = await plateCalculatorStorage.getAllPlateSets();
      setPlateSets(sets);
    } catch (err) {
      setError(`Failed to load plate sets: ${err}`);
    }
  };

  const loadCurrentLocation = async () => {
    const location = await plateCalculatorStorage.getCurrentLocation();
    setCurrentLocation(location);
  };

  const handleCreateNew = () => {
    const newPlateSet: PlateSet = {
      id: 'new',
      name: 'New Plate Set',
      plates: [...DEFAULT_OLYMPIC_PLATES],
      barWeight: COMMON_BAR_WEIGHTS.olympic,
      isDefault: false,
      createdAt: new Date()
    };

    if (currentLocation) {
      newPlateSet.latitude = currentLocation.latitude;
      newPlateSet.longitude = currentLocation.longitude;
      newPlateSet.locationName = currentLocation.name || 'Current Location';
    }

    setEditingPlateSet(newPlateSet);
    setIsCreatingNew(true);
  };

  const handleEdit = (plateSet: PlateSet) => {
    setEditingPlateSet({ ...plateSet });
    setIsCreatingNew(false);
  };

  const handleSave = async () => {
    if (!editingPlateSet) return;

    try {
      if (isCreatingNew) {
        const { id, ...plateSetData } = editingPlateSet;
        await plateCalculatorStorage.createPlateSet(plateSetData);
        setSuccess('Plate set created successfully!');
      } else {
        await plateCalculatorStorage.updatePlateSet(editingPlateSet.id, editingPlateSet);
        setSuccess('Plate set updated successfully!');
      }

      await loadPlateSets();
      setEditingPlateSet(null);
      setIsCreatingNew(false);

      if (onPlateSetChange && editingPlateSet) {
        onPlateSetChange(editingPlateSet.id);
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to save plate set: ${err}`);
    }
  };

  const handleDelete = async (plateSetId: string) => {
    if (!confirm('Are you sure you want to delete this plate set?')) return;

    try {
      const deleted = await plateCalculatorStorage.deletePlateSet(plateSetId);
      if (deleted) {
        await loadPlateSets();
        setSuccess('Plate set deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Cannot delete the last remaining plate set');
      }
    } catch (err) {
      setError(`Failed to delete plate set: ${err}`);
    }
  };

  const handleSetDefault = async (plateSetId: string) => {
    try {
      // First, remove default from all plate sets
      for (const ps of plateSets) {
        if (ps.isDefault && ps.id !== plateSetId) {
          await plateCalculatorStorage.updatePlateSet(ps.id, { isDefault: false });
        }
      }

      // Then set the new default
      await plateCalculatorStorage.updatePlateSet(plateSetId, { isDefault: true });
      await loadPlateSets();
      setSuccess('Default plate set updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to set default: ${err}`);
    }
  };

  const updatePlateSetField = (field: keyof PlateSet, value: any) => {
    if (!editingPlateSet) return;
    setEditingPlateSet({ ...editingPlateSet, [field]: value });
  };

  const updatePlate = (plateIndex: number, field: keyof Plate, value: any) => {
    if (!editingPlateSet) return;
    
    const updatedPlates = editingPlateSet.plates.map((plate, index) =>
      index === plateIndex ? { ...plate, [field]: value } : plate
    );
    
    setEditingPlateSet({ ...editingPlateSet, plates: updatedPlates });
  };

  const addPlate = () => {
    if (!editingPlateSet) return;

    const newPlate: Plate = {
      id: `plate_${Date.now()}`,
      weight: 45,
      quantity: 2,
      color: 'red',
      material: 'iron',
      isActive: true
    };

    setEditingPlateSet({
      ...editingPlateSet,
      plates: [...editingPlateSet.plates, newPlate]
    });
  };

  const removePlate = (plateIndex: number) => {
    if (!editingPlateSet) return;

    const updatedPlates = editingPlateSet.plates.filter((_, index) => index !== plateIndex);
    setEditingPlateSet({ ...editingPlateSet, plates: updatedPlates });
  };

  const loadPresetPlates = (preset: 'olympic' | 'metric') => {
    if (!editingPlateSet) return;

    const plates = preset === 'olympic' ? DEFAULT_OLYMPIC_PLATES : DEFAULT_METRIC_PLATES;
    const barWeight = preset === 'olympic' ? COMMON_BAR_WEIGHTS.olympic : COMMON_BAR_WEIGHTS.metric;

    setEditingPlateSet({
      ...editingPlateSet,
      plates: [...plates],
      barWeight
    });
  };

  const requestLocation = async () => {
    try {
      const location = await plateCalculatorStorage.requestLocationPermission();
      setCurrentLocation(location);
      
      if (editingPlateSet && location) {
        setEditingPlateSet({
          ...editingPlateSet,
          latitude: location.latitude,
          longitude: location.longitude,
          locationName: location.name || 'Current Location'
        });
      }
    } catch (err) {
      setError(`Location error: ${err}`);
    }
  };

  return (
    <div className={styles.plateSetManager}>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className={styles.success} role="alert">
          {success}
        </div>
      )}

      {!editingPlateSet ? (
        <div className={styles.plateSetList}>
          <div className={styles.listHeader}>
            <h3>Manage Plate Sets</h3>
            <button onClick={handleCreateNew} className={styles.createButton}>
              + New Plate Set
            </button>
          </div>

          {currentLocation && (
            <div className={styles.locationInfo}>
              📍 Current location: {currentLocation.name || 'Unknown'}
            </div>
          )}

          <div className={styles.plateSetGrid}>
            {plateSets.map(plateSet => (
              <div key={plateSet.id} className={styles.plateSetCard}>
                <div className={styles.cardHeader}>
                  <h4>
                    {plateSet.name}
                    {plateSet.isDefault && <span className={styles.defaultBadge}>Default</span>}
                  </h4>
                  {plateSet.locationName && (
                    <div className={styles.locationBadge}>
                      📍 {plateSet.locationName}
                    </div>
                  )}
                </div>

                <div className={styles.cardContent}>
                  <p><strong>Bar:</strong> {plateSet.barWeight} lbs</p>
                  <p><strong>Plates:</strong> {plateSet.plates.filter(p => p.isActive).length} types</p>
                  {plateSet.lastUsed && (
                    <p><strong>Last used:</strong> {new Date(plateSet.lastUsed).toLocaleDateString()}</p>
                  )}
                </div>

                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(plateSet)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  
                  {!plateSet.isDefault && (
                    <button
                      onClick={() => handleSetDefault(plateSet.id)}
                      className={styles.defaultButton}
                    >
                      Set Default
                    </button>
                  )}
                  
                  {plateSets.length > 1 && (
                    <button
                      onClick={() => handleDelete(plateSet.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.plateSetEditor}>
          <div className={styles.editorHeader}>
            <h3>{isCreatingNew ? 'Create New Plate Set' : 'Edit Plate Set'}</h3>
            <div className={styles.headerActions}>
              <button onClick={() => setEditingPlateSet(null)} className={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleSave} className={styles.saveButton}>
                Save
              </button>
            </div>
          </div>

          <div className={styles.editorContent}>
            <div className={styles.basicInfo}>
              <div className={styles.field}>
                <label htmlFor="plate-set-name">Name</label>
                <input
                  id="plate-set-name"
                  type="text"
                  value={editingPlateSet.name}
                  onChange={(e) => updatePlateSetField('name', e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="bar-weight">Bar Weight (lbs)</label>
                <select
                  id="bar-weight"
                  value={editingPlateSet.barWeight}
                  onChange={(e) => updatePlateSetField('barWeight', Number(e.target.value))}
                  className={styles.select}
                >
                  <option value={45}>45 lbs (Olympic)</option>
                  <option value={35}>35 lbs (Women's Olympic)</option>
                  <option value={25}>25 lbs (Training Bar)</option>
                  <option value={20}>20 kg (Metric Olympic)</option>
                  <option value={15}>15 kg (Metric Women's)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Plate Presets</label>
                <div className={styles.presetButtons}>
                  <button
                    type="button"
                    onClick={() => loadPresetPlates('olympic')}
                    className={styles.presetButton}
                  >
                    Load Olympic Plates
                  </button>
                  <button
                    type="button"
                    onClick={() => loadPresetPlates('metric')}
                    className={styles.presetButton}
                  >
                    Load Metric Plates
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.locationSection}>
              <h4>Location</h4>
              <div className={styles.locationControls}>
                <input
                  type="text"
                  value={editingPlateSet.locationName || ''}
                  onChange={(e) => updatePlateSetField('locationName', e.target.value)}
                  placeholder="Location name (e.g., Home Gym, Commercial Gym)"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={requestLocation}
                  className={styles.locationButton}
                >
                  📍 Use Current Location
                </button>
              </div>
            </div>

            <div className={styles.platesSection}>
              <div className={styles.platesSectionHeader}>
                <h4>Plates</h4>
                <button
                  type="button"
                  onClick={addPlate}
                  className={styles.addPlateButton}
                >
                  + Add Plate
                </button>
              </div>

              <div className={styles.platesGrid}>
                {editingPlateSet.plates.map((plate, index) => (
                  <div key={index} className={styles.plateRow}>
                    <input
                      type="number"
                      value={plate.weight}
                      onChange={(e) => updatePlate(index, 'weight', Number(e.target.value) || 0)}
                      placeholder="Weight"
                      className={styles.plateInput}
                      step="0.25"
                      min="0"
                    />
                    <input
                      type="number"
                      value={plate.quantity}
                      onChange={(e) => updatePlate(index, 'quantity', Number(e.target.value) || 0)}
                      placeholder="Quantity"
                      className={styles.plateInput}
                      min="0"
                    />
                    <select
                      value={plate.color || 'red'}
                      onChange={(e) => updatePlate(index, 'color', e.target.value)}
                      className={styles.plateSelect}
                      aria-label="Plate color"
                    >
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="yellow">Yellow</option>
                      <option value="white">White</option>
                      <option value="black">Black</option>
                      <option value="silver">Silver</option>
                    </select>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={plate.isActive}
                        onChange={(e) => updatePlate(index, 'isActive', e.target.checked)}
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => removePlate(index)}
                      className={styles.removeButton}
                      aria-label={`Remove ${plate.weight} lb plate`}
                      title={`Remove ${plate.weight} lb plate`}
                    >
                      <span aria-hidden="true">✕</span>
                      <span className={styles.removeButtonText}>Remove</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.closeSection}>
        <button onClick={onClose} className={styles.closeButton}>
          Close Manager
        </button>
      </div>
    </div>
  );
};

export default PlateSetManager;