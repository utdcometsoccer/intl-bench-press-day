import React, { useState, useEffect, useCallback } from 'react';
import type { PlateSet, PlateCalculation, LocationInfo } from '../types/plateCalculator';
import { plateCalculatorStorage } from '../services/plateCalculatorStorage';
import PlateSetManager from './PlateSetManager';
import { useFocusTrap } from '../hooks/useFocusTrap';
import styles from './PlateCalculator.module.css';

interface PlateCalculatorProps {
  targetWeight?: number;
  onCalculationChange?: (calculation: PlateCalculation | null) => void;
  showInline?: boolean;
}

const PlateCalculator: React.FC<PlateCalculatorProps> = ({
  targetWeight: initialWeight = 135,
  onCalculationChange,
  showInline = false
}) => {
  // State
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [plateSets, setPlateSets] = useState<PlateSet[]>([]);
  const [selectedPlateSetId, setSelectedPlateSetId] = useState<string>('');
  const [currentCalculation, setCurrentCalculation] = useState<PlateCalculation | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);

  // UI state
  const [showPlateSetManager, setShowPlateSetManager] = useState(false);

  // Focus trap for modal
  const modalRef = useFocusTrap<HTMLDivElement>(showPlateSetManager);

  // Handle escape key to close modal
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && showPlateSetManager) {
      setShowPlateSetManager(false);
    }
  }, [showPlateSetManager]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const calculatePlates = useCallback(() => {
    const selectedPlateSet = plateSets.find(ps => ps.id === selectedPlateSetId);
    
    if (!selectedPlateSet || !targetWeight) {
      setCurrentCalculation(null);
      return;
    }

    const calculation = plateCalculatorStorage.calculatePlates(targetWeight, selectedPlateSet);
    setCurrentCalculation(calculation);

    // Mark plate set as used
    plateCalculatorStorage.markPlateSetUsed(selectedPlateSetId);
  }, [plateSets, selectedPlateSetId, targetWeight]);

  useEffect(() => {
    initializePlateCalculator();
  }, []);

  useEffect(() => {
    calculatePlates();
  }, [calculatePlates]);

  useEffect(() => {
    if (onCalculationChange) {
      onCalculationChange(currentCalculation);
    }
  }, [currentCalculation, onCalculationChange]);

  const initializePlateCalculator = async () => {
    try {
      setIsLoading(true);
      await plateCalculatorStorage.initialize();

      const allPlateSets = await plateCalculatorStorage.getAllPlateSets();
      setPlateSets(allPlateSets);

      // Try to get location-based plate set or default
      let selectedId = '';
      const locationPlateSet = await plateCalculatorStorage.getCurrentLocationPlateSet();
      
      if (locationPlateSet) {
        selectedId = locationPlateSet.id;
      } else {
        const defaultPlateSet = await plateCalculatorStorage.getDefaultPlateSet();
        if (defaultPlateSet) {
          selectedId = defaultPlateSet.id;
        } else if (allPlateSets.length > 0) {
          selectedId = allPlateSets[0].id;
        }
      }

      setSelectedPlateSetId(selectedId);

      // Get current location
      const location = await plateCalculatorStorage.getCurrentLocation();
      setCurrentLocation(location);
      setIsLocationEnabled(!!location);

    } catch (err) {
      setError(`Failed to initialize plate calculator: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationToggle = async () => {
    if (isLocationEnabled) {
      // Disable location
      setIsLocationEnabled(false);
      setCurrentLocation(null);
      // Keep current plate set selection
    } else {
      // Enable location
      try {
        const location = await plateCalculatorStorage.requestLocationPermission();
        setCurrentLocation(location);
        setIsLocationEnabled(true);

        // Try to find a plate set for this location
        const locationPlateSet = await plateCalculatorStorage.getCurrentLocationPlateSet();
        if (locationPlateSet) {
          setSelectedPlateSetId(locationPlateSet.id);
        }
      } catch (err) {
        setError(`Location error: ${err}`);
        setIsLocationEnabled(false);
      }
    }
  };

  const handlePlateSetChange = (plateSetId: string) => {
    setSelectedPlateSetId(plateSetId);
  };

  const formatPlateDisplay = (calculation: PlateCalculation): string => {
    if (calculation.platesPerSide.length === 0) {
      return 'No plates needed';
    }

    const plateGroups = calculation.platesPerSide.map(usage => {
      const weight = usage.plate.weight;
      const quantity = usage.quantity;
      return quantity === 1 ? `${weight}` : `${quantity}×${weight}`;
    });

    return plateGroups.join(' + ');
  };

  const renderCalculationResult = () => {
    if (!currentCalculation) return null;

    const selectedPlateSet = plateSets.find(ps => ps.id === selectedPlateSetId);
    if (!selectedPlateSet) return null;

    return (
      <div className={styles.calculationResult}>
        <div className={styles.weightSummary}>
          <div className={styles.targetWeight}>
            <strong>Target: {currentCalculation.targetWeight} lbs</strong>
          </div>
          <div className={styles.actualWeight}>
            Actual: {currentCalculation.totalWeight} lbs
            {!currentCalculation.isExact && (
              <span className={styles.weightDifference}>
                ({currentCalculation.totalWeight > currentCalculation.targetWeight ? '+' : ''}
                {(currentCalculation.totalWeight - currentCalculation.targetWeight).toFixed(1)} lbs)
              </span>
            )}
          </div>
        </div>

        <div className={styles.plateBreakdown}>
          <div className={styles.barInfo}>
            <span className={styles.barLabel}>Bar:</span>
            <span className={styles.barWeight}>{selectedPlateSet.barWeight} lbs</span>
          </div>
          
          <div className={styles.platesInfo}>
            <span className={styles.platesLabel}>Each side:</span>
            <span className={styles.platesDisplay}>
              {formatPlateDisplay(currentCalculation)}
            </span>
          </div>
        </div>

        {currentCalculation.platesPerSide.length > 0 && (
          <div className={styles.plateVisualization}>
            {currentCalculation.platesPerSide.map((usage, index) => (
              <div key={index} className={styles.plateGroup}>
                <div 
                  className={`${styles.plateIcon} plate-color-${usage.plate.color?.toLowerCase()?.replace(/\s+/g, '-') || 'default'}`}
                  data-weight={usage.plate.weight}
                >
                  {usage.quantity > 1 && (
                    <span className={styles.plateQuantity}>×{usage.quantity}</span>
                  )}
                </div>
                <span className={styles.plateWeight}>{usage.plate.weight}</span>
              </div>
            ))}
          </div>
        )}

        {currentCalculation.remainingWeight > 0.01 && (
          <div className={styles.remainingWeight}>
            <span className={styles.warningIcon}>⚠️</span>
            Cannot load remaining {currentCalculation.remainingWeight.toFixed(1)} lbs per side
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.plateCalculator}>
        <div className={styles.loading}>Loading plate calculator...</div>
      </div>
    );
  }

  if (showInline) {
    return (
      <div className={styles.inlineCalculator}>
        <div className={styles.inlineControls}>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
            className={styles.weightInput}
            min="0"
            step="2.5"
            aria-label="Target weight"
          />
          <select
            value={selectedPlateSetId}
            onChange={(e) => handlePlateSetChange(e.target.value)}
            className={styles.plateSetSelect}
            aria-label="Select plate set"
          >
            {plateSets.map(ps => (
              <option key={ps.id} value={ps.id}>
                {ps.name} {ps.locationName ? `(${ps.locationName})` : ''}
              </option>
            ))}
          </select>
        </div>
        {renderCalculationResult()}
      </div>
    );
  }

  return (
    <div className={styles.plateCalculator}>
      <header className={styles.header}>
        <h2>Plate Calculator</h2>
        
        <div className={styles.headerControls}>
          <button
            onClick={handleLocationToggle}
            className={`${styles.locationButton} ${isLocationEnabled ? styles.active : ''}`}
            aria-label={isLocationEnabled ? 'Disable location' : 'Enable location'}
          >
            📍 {isLocationEnabled ? 'Location On' : 'Location Off'}
          </button>
          
          <button
            onClick={() => setShowPlateSetManager(true)}
            className={styles.manageButton}
            aria-label="Manage plate sets"
          >
            ⚙️ Manage
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {currentLocation && (
        <div className={styles.locationInfo}>
          📍 Current location: {currentLocation.name || 'Unknown location'}
        </div>
      )}

      <div className={styles.calculatorControls}>
        <div className={styles.weightInput}>
          <label htmlFor="target-weight">Target Weight (lbs)</label>
          <input
            id="target-weight"
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(Number(e.target.value) || 0)}
            min="0"
            step="2.5"
          />
        </div>

        <div className={styles.plateSetSelector}>
          <label htmlFor="plate-set">Plate Set</label>
          <select
            id="plate-set"
            value={selectedPlateSetId}
            onChange={(e) => handlePlateSetChange(e.target.value)}
          >
            {plateSets.map(ps => (
              <option key={ps.id} value={ps.id}>
                {ps.name} {ps.locationName ? `(${ps.locationName})` : ''}
                {ps.isDefault ? ' (Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {renderCalculationResult()}

      {showPlateSetManager && (
        <div 
          className={styles.modal} 
          onClick={() => setShowPlateSetManager(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Plate Set Manager"
        >
          <div 
            ref={modalRef}
            className={styles.modalContent} 
            onClick={e => e.stopPropagation()}
          >
            <PlateSetManager
              onClose={() => setShowPlateSetManager(false)}
              onPlateSetChange={(plateSetId) => {
                setSelectedPlateSetId(plateSetId);
                initializePlateCalculator(); // Refresh the plate sets
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlateCalculator;