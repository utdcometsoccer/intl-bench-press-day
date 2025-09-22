import React, { useState } from 'react';
import { oneRepMaxStorage } from './oneRepMaxStorage';
import { exerciseRecordsStorage } from './exerciseRecordsStorage';
import { fiveThreeOneStorage } from './fiveThreeOneStorage';
import { workoutResultsStorage } from './workoutResultsStorage';

interface ExportData {
  oneRepMaxFormulas: any[];
  exerciseRecords: any[];
  fiveThreeOnePrograms: any[];
  workoutResults: any[];
  exportDate: string;
  appVersion: string;
}

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

  const convertToCSV = (data: any[], headers: string[]): string => {
    const escapeCSV = (value: any): string => {
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

  const flattenExerciseRecords = (records: any[]) => {
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

  const flattenWorkoutResults = (results: any[]) => {
    const flattened: any[] = [];
    
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
        workout.mainSetResults.forEach((set: any, index: number) => {
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
        workout.warmupResults.forEach((set: any, index: number) => {
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
            currentCycle: program.currentCycle || '',
            currentWeek: program.currentWeek || '',
            trainingMaxes: JSON.stringify(program.trainingMaxes || {}),
            isActive: program.isActive || false,
            notes: program.notes || ''
          })),
          ['id', 'name', 'startDate', 'currentCycle', 'currentWeek', 'trainingMaxes', 'isActive', 'notes']
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
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      maxWidth: '600px', 
      margin: '20px auto',
      backgroundColor: '#f9f9f9'
    }}>
      <h2 style={{ marginTop: 0 }}>Data Export</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Export all your fitness data for backup, analysis, or migration purposes. 
        This includes exercise records, one-rep-max formulas, 5/3/1 programs, and workout results.
      </p>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={downloadJSON}
          disabled={isExporting}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: isExporting ? 0.6 : 1
          }}
        >
          {isExporting ? 'Exporting...' : 'Download JSON'}
        </button>

        <button
          onClick={downloadCSV}
          disabled={isExporting}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isExporting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: isExporting ? 0.6 : 1
          }}
        >
          {isExporting ? 'Exporting...' : 'Download CSV'}
        </button>
      </div>

      {exportStatus && (
        <div style={{
          padding: '12px',
          borderRadius: '4px',
          backgroundColor: exportStatus.includes('failed') ? '#f8d7da' : '#d4edda',
          color: exportStatus.includes('failed') ? '#721c24' : '#155724',
          border: `1px solid ${exportStatus.includes('failed') ? '#f5c6cb' : '#c3e6cb'}`
        }}>
          {exportStatus}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h4>Export Details:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
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
