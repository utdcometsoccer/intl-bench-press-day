import React, { useState } from 'react';
import { oneRepMaxStorage } from '../services/oneRepMaxStorage';
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage';
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import type { 
  ExerciseRecord, 
  WorkoutResult,
  WorkoutSetResult,
  ExportData 
} from '../types';

const DataExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  const collectAllData = async (): Promise<ExportData> => {
    setExportStatus('Collecting data from storage...');
    
    try {
      // Initialize all storage systems
      await oneRepMaxStorage.initialize?.();
      await exerciseRecordsStorage.initialize();
      await fiveThreeOneStorage.initialize();
      await workoutResultsStorage.initialize();

      // Collect data from all storage systems
      const [oneRepMaxFormulas, exerciseRecords, fiveThreeOnePrograms, workoutResults] = await Promise.all([
        oneRepMaxStorage.listFunctions(),
        exerciseRecordsStorage.getAllRecords(),
        fiveThreeOneStorage.getAllCycles(),
        workoutResultsStorage.getAllWorkoutResults(),
      ]);

      return {
        oneRepMaxFormulas,
        exerciseRecords,
        fiveThreeOnePrograms,
        workoutResults,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0'
      };
    } catch (error) {
      console.error('Error collecting data:', error);
      throw new Error(`Failed to collect data: ${error}`);
    }
  };

  const downloadJSON = async () => {
    setIsExporting(true);
    setExportStatus('Preparing JSON export...');

    try {
      const data = await collectAllData();
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitness-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      setExportStatus('JSON export completed successfully!');
    } catch (error) {
      setExportStatus(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: Record<string, unknown>[], headers: string[]): string => {
    const escapeCSV = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvHeader = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => escapeCSV(row[header])).join(',')
    );
    
    return [csvHeader, ...csvRows].join('\n');
  };

  const flattenExerciseRecords = (records: ExerciseRecord[]) => {
    return records.map(record => ({
      id: record.id,
      exerciseId: record.exerciseId,
      exerciseName: record.exerciseName,
      weight: record.workoutSet?.Weight || '',
      reps: record.workoutSet?.Repetions || '',
      oneRepMax: record.oneRepMax,
      formulaUsed: record.formulaUsed,
      formulaId: record.formulaId,
      dateRecorded: record.dateRecorded ? new Date(record.dateRecorded).toISOString() : '',
      notes: record.notes || ''
    }));
  };

  const flattenWorkoutResults = (results: WorkoutResult[]) => {
    const flattened: Record<string, unknown>[] = [];
    
    results.forEach(workout => {
      // Main workout info
      const baseWorkout = {
        workoutId: workout.id,
        cycleId: workout.cycleId,
        cycleName: workout.cycleName,
        exerciseId: workout.exerciseId,
        exerciseName: workout.exerciseName,
        week: workout.week,
        day: workout.day,
        datePerformed: workout.datePerformed ? new Date(workout.datePerformed).toISOString() : '',
        overallRpe: workout.overallRpe || '',
        workoutNotes: workout.workoutNotes || '',
        duration: workout.duration || '',
        bodyWeight: workout.bodyWeight || ''
      };

      // Add main sets
      if (workout.mainSetResults && workout.mainSetResults.length > 0) {
        workout.mainSetResults.forEach((set: WorkoutSetResult, index: number) => {
          flattened.push({
            ...baseWorkout,
            setType: 'main',
            setNumber: index + 1,
            plannedReps: set.plannedReps,
            plannedWeight: set.plannedWeight,
            actualReps: set.actualReps,
            actualWeight: set.actualWeight,
            percentage: set.percentage,
            isAmrap: set.isAmrap,
            rpe: set.rpe || '',
            setNotes: set.notes || ''
          });
        });
      }

      // Add warmup sets
      if (workout.warmupResults && workout.warmupResults.length > 0) {
        workout.warmupResults.forEach((set: WorkoutSetResult, index: number) => {
          flattened.push({
            ...baseWorkout,
            setType: 'warmup',
            setNumber: index + 1,
            plannedReps: set.plannedReps,
            plannedWeight: set.plannedWeight,
            actualReps: set.actualReps,
            actualWeight: set.actualWeight,
            percentage: set.percentage,
            isAmrap: set.isAmrap,
            rpe: set.rpe || '',
            setNotes: set.notes || ''
          });
        });
      }

      // If no sets, add the workout entry anyway
      if ((!workout.mainSetResults || workout.mainSetResults.length === 0) && 
          (!workout.warmupResults || workout.warmupResults.length === 0)) {
        flattened.push({
          ...baseWorkout,
          setType: '',
          setNumber: '',
          plannedReps: '',
          plannedWeight: '',
          actualReps: '',
          actualWeight: '',
          percentage: '',
          isAmrap: '',
          rpe: '',
          setNotes: ''
        });
      }
    });

    return flattened;
  };

  const downloadCSV = async () => {
    setIsExporting(true);
    setExportStatus('Preparing CSV export...');

    try {
      const data = await collectAllData();
      
      // Create multiple CSV files in a zip-like structure
      const csvFiles: { name: string; content: string }[] = [];

      // One Rep Max Formulas CSV
      if (data.oneRepMaxFormulas.length > 0) {
        const formulasCSV = convertToCSV(
          data.oneRepMaxFormulas.map(formula => ({
            id: formula.id,
            name: formula.name,
            description: formula.description || '',
            createdAt: formula.createdAt ? new Date(formula.createdAt).toISOString() : '',
            updatedAt: formula.updatedAt ? new Date(formula.updatedAt).toISOString() : ''
          })),
          ['id', 'name', 'description', 'createdAt', 'updatedAt']
        );
        csvFiles.push({ name: 'one-rep-max-formulas', content: formulasCSV });
      }

      // Exercise Records CSV
      if (data.exerciseRecords.length > 0) {
        const recordsCSV = convertToCSV(
          flattenExerciseRecords(data.exerciseRecords),
          ['id', 'exerciseId', 'exerciseName', 'weight', 'reps', 'oneRepMax', 'formulaUsed', 'formulaId', 'dateRecorded', 'notes']
        );
        csvFiles.push({ name: 'exercise-records', content: recordsCSV });
      }

      // 5/3/1 Programs CSV
      if (data.fiveThreeOnePrograms.length > 0) {
        const programsCSV = convertToCSV(
          data.fiveThreeOnePrograms.map(program => ({
            id: program.id,
            name: program.name,
            startDate: program.startDate ? new Date(program.startDate).toISOString() : '',
            createdDate: program.createdDate ? new Date(program.createdDate).toISOString() : '',
            maxes: JSON.stringify(program.maxes || []),
            workouts: JSON.stringify(program.workouts || []),
            isActive: program.isActive || false,
            notes: program.notes || ''
          })),
          ['id', 'name', 'startDate', 'createdDate', 'maxes', 'workouts', 'isActive', 'notes']
        );
        csvFiles.push({ name: 'five-three-one-programs', content: programsCSV });
      }

      // Workout Results CSV
      if (data.workoutResults.length > 0) {
        const workoutsCSV = convertToCSV(
          flattenWorkoutResults(data.workoutResults),
          ['workoutId', 'cycleId', 'cycleName', 'exerciseId', 'exerciseName', 'week', 'day', 'datePerformed', 
           'setType', 'setNumber', 'plannedReps', 'plannedWeight', 'actualReps', 'actualWeight', 'percentage', 
           'isAmrap', 'rpe', 'overallRpe', 'setNotes', 'workoutNotes', 'duration', 'bodyWeight']
        );
        csvFiles.push({ name: 'workout-results', content: workoutsCSV });
      }

      // Download each CSV file
      for (const file of csvFiles) {
        const blob = new Blob([file.content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setExportStatus(`CSV export completed! Downloaded ${csvFiles.length} files.`);
    } catch (error) {
      setExportStatus(`Export failed: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="data-export-container">
      <h2 className="data-export-title">Data Export</h2>
      <p className="data-export-description">
        Export all your fitness data for backup, analysis, or migration purposes. 
        This includes exercise records, one-rep-max formulas, 5/3/1 programs, and workout results.
      </p>

      <div className="export-buttons-container">
        <button
          onClick={downloadJSON}
          disabled={isExporting}
          className="export-button-json"
        >
          {isExporting ? 'Exporting...' : 'Download JSON'}
        </button>

        <button
          onClick={downloadCSV}
          disabled={isExporting}
          className="export-button-csv"
        >
          {isExporting ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      {exportStatus && (
        <div className={exportStatus.includes('failed') ? 'export-status-error' : 'export-status-success'}>
          {exportStatus}
        </div>
      )}

      <div className="export-details">
        <h4>Export Details:</h4>
        <ul className="export-details-list">
          <li><strong>JSON:</strong> Single file with all data in structured format</li>
          <li><strong>CSV:</strong> Multiple files - one for each data type (exercise records, formulas, etc.)</li>
          <li>All exports include timestamps and can be used for data backup</li>
          <li>Your data never leaves your device - exports are generated locally</li>
        </ul>
      </div>
    </div>
  );
};

export default DataExport;
