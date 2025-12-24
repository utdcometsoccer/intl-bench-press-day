import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import type { ExerciseRecord, ChartDataPoint, ExerciseStats } from '../types';
import { exerciseRecordsStorage } from '../services/exerciseRecordsStorage';
import { getAllExercises, getExerciseCategories } from '../exercises';
import ChartTooltip from './ChartTooltip';
import chartColorsData from '../data/chartColors.json';

const ProgressChart: React.FC = () => {
  const [allRecords, setAllRecords] = useState<ExerciseRecord[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Filter state
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Color palette for different exercises
  const colors = useMemo(() => chartColorsData.progressChartColors, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadAllRecords();
        const cats = await getExerciseCategories();
        setCategories(cats);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize progress chart: ${message}`);
      }
    };
    initialize();
  }, []);

  // Remove the incorrect useEffect dependency and add it after filterAndProcessData is defined

  const loadAllRecords = async () => {
    try {
      setIsLoading(true);
      await exerciseRecordsStorage.initialize();
      const records = await exerciseRecordsStorage.getAllRecords();
      setAllRecords(records);
      
      // Auto-select all exercises initially
      const uniqueExerciseIds = [...new Set(records.map(r => r.exerciseId))];
      setSelectedExercises(uniqueExerciseIds);
      
      // Set default date range to last 6 months if we have data
      if (records.length > 0) {
        const dates = records.map(r => new Date(r.dateRecorded));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        
        setStartDate(format(minDate, 'yyyy-MM-dd'));
        setEndDate(format(maxDate, 'yyyy-MM-dd'));
      }
      
    } catch (err) {
      setError(`Failed to load records: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateExerciseStats = useCallback((records: ExerciseRecord[]) => {
    const exerciseGroups = new Map<string, ExerciseRecord[]>();
    
    // Group records by exercise
    records.forEach(record => {
      if (!exerciseGroups.has(record.exerciseId)) {
        exerciseGroups.set(record.exerciseId, []);
      }
      exerciseGroups.get(record.exerciseId)!.push(record);
    });

    const stats: ExerciseStats[] = [];
    let colorIndex = 0;

    exerciseGroups.forEach((exerciseRecords, exerciseId) => {
      const sortedRecords = exerciseRecords.sort((a, b) => 
        new Date(a.dateRecorded).getTime() - new Date(b.dateRecorded).getTime()
      );
      
      const bestOneRepMax = Math.max(...exerciseRecords.map(r => r.oneRepMax));
      const latestOneRepMax = sortedRecords[sortedRecords.length - 1].oneRepMax;
      const firstOneRepMax = sortedRecords[0].oneRepMax;
      const improvement = latestOneRepMax - firstOneRepMax;

      stats.push({
        exerciseId,
        exerciseName: exerciseRecords[0].exerciseName,
        recordCount: exerciseRecords.length,
        bestOneRepMax,
        latestOneRepMax,
        improvement,
        color: colors[colorIndex % colors.length]
      });

      colorIndex++;
    });

    // Sort by best one rep max descending
    stats.sort((a, b) => b.bestOneRepMax - a.bestOneRepMax);
    setExerciseStats(stats);
  }, [colors]);

  const filterAndProcessData = useCallback(async () => {
    let filteredRecords = allRecords;

    // Filter by selected exercises
    if (selectedExercises.length > 0) {
      filteredRecords = filteredRecords.filter(record => 
        selectedExercises.includes(record.exerciseId)
      );
    }

    // Filter by category
    if (selectedCategory) {
      try {
        const allExercises = await getAllExercises();
        const exercisesInCategory = allExercises
          .filter(ex => ex.category === selectedCategory)
          .map(ex => ex.id);
        filteredRecords = filteredRecords.filter(record => 
          exercisesInCategory.includes(record.exerciseId)
        );
      } catch (err) {
        console.error('Failed to filter by category:', err);
        // Clear chart data to avoid displaying inconsistent results
        setChartData([]);
        setExerciseStats([]);
        return;
      }
    }

    // Filter by date range
    if (startDate) {
      const startDateTime = startOfDay(parseISO(startDate));
      filteredRecords = filteredRecords.filter(record => 
        isAfter(new Date(record.dateRecorded), startDateTime) || 
        record.dateRecorded.getTime() === startDateTime.getTime()
      );
    }

    if (endDate) {
      const endDateTime = endOfDay(parseISO(endDate));
      filteredRecords = filteredRecords.filter(record => 
        isBefore(new Date(record.dateRecorded), endDateTime) || 
        record.dateRecorded.getTime() === endDateTime.getTime()
      );
    }

    // Convert to chart data
    const chartPoints: ChartDataPoint[] = filteredRecords.map(record => ({
      date: format(new Date(record.dateRecorded), 'MMM dd, yyyy'),
      dateValue: new Date(record.dateRecorded),
      oneRepMax: record.oneRepMax,
      exercise: record.exerciseName,
      exerciseId: record.exerciseId,
      weight: record.workoutSet.Weight,
      reps: record.workoutSet.Repetions,
      notes: record.notes,
      formulaUsed: record.formulaUsed
    }));

    // Sort by date
    chartPoints.sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());
    setChartData(chartPoints);

    // Calculate exercise statistics
    calculateExerciseStats(filteredRecords);
  }, [allRecords, selectedExercises, startDate, endDate, selectedCategory, calculateExerciseStats]);

  useEffect(() => {
    filterAndProcessData();
  }, [filterAndProcessData]);

  const handleExerciseToggle = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const selectAllExercises = () => {
    const allExerciseIds = [...new Set(allRecords.map(r => r.exerciseId))];
    setSelectedExercises(allExerciseIds);
  };

  const clearAllExercises = () => {
    setSelectedExercises([]);
  };

  const availableExercises = [...new Set(allRecords.map(r => ({ id: r.exerciseId, name: r.exerciseName })))]
    .sort((a, b) => a.name.localeCompare(b.name));

  if (isLoading) {
    return (
      <div className="progress-chart">
        <h2>Progress Chart</h2>
        <p>Loading your progress data...</p>
      </div>
    );
  }

  if (allRecords.length === 0) {
    return (
      <div className="progress-chart loading">
        <h2>Progress Chart</h2>
        <p>No exercise records found. Start tracking your workouts to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="progress-chart">
      <h2>One Rep Max Progress Chart</h2>

      {/* Filters */}
      <div className="chart-filters">
        <h3 className="filter-title">Filters</h3>
        
        {/* Date Range */}
        <div className="filter-grid">
          <div>
            <label htmlFor="start-date" className="filter-label">
              Start Date:
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div>
            <label htmlFor="end-date" className="filter-label">
              End Date:
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label htmlFor="category-filter" className="filter-label">
              Category Filter:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exercise Selection */}
        <div>
          <div className="exercise-selection-header">
            <label className="exercise-selection-label">Select Exercises to Display:</label>
            <div>
              <button
                onClick={selectAllExercises}
                className="btn-primary small"
              >
                Select All
              </button>
              <button
                onClick={clearAllExercises}
                className="btn-secondary small"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="exercise-grid">
            {availableExercises.map(exercise => (
              <label key={exercise.id} className="exercise-checkbox">
                <input
                  type="checkbox"
                  checked={selectedExercises.includes(exercise.id)}
                  onChange={() => handleExerciseToggle(exercise.id)}
                />
                <span className="exercise-name">{exercise.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                label={{ value: 'One Rep Max (lbs)', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend />
              
              {exerciseStats.map(stat => (
                <Line
                  key={stat.exerciseId}
                  type="monotone"
                  dataKey="oneRepMax"
                  data={chartData.filter(d => d.exerciseId === stat.exerciseId)}
                  stroke={stat.color}
                  strokeWidth={2}
                  dot={{ fill: stat.color, strokeWidth: 2, r: 4 }}
                  name={stat.exerciseName}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="no-data-message">
          <p>No data available for the selected filters. Try adjusting your date range or exercise selection.</p>
        </div>
      )}

      {/* Exercise Statistics */}
      {exerciseStats.length > 0 && (
        <div>
          <h3>Exercise Statistics</h3>
          <div className="stats-grid">
            {exerciseStats.map((stat, index) => (
              <div 
                key={stat.exerciseId} 
                className={`stat-card stat-card-${index % 8}`}
              >
                <h4 className="stat-title">{stat.exerciseName}</h4>
                <div className="stat-details">
                  <p className="stat-item">
                    <strong>Records:</strong> {stat.recordCount}
                  </p>
                  <p className="stat-item">
                    <strong>Best 1RM:</strong> {stat.bestOneRepMax} lbs
                  </p>
                  <p className="stat-item">
                    <strong>Latest 1RM:</strong> {stat.latestOneRepMax} lbs
                  </p>
                  <p className={`stat-item progress ${stat.improvement >= 0 ? 'positive' : 'negative'}`}>
                    <strong>Progress:</strong> {stat.improvement >= 0 ? '+' : ''}{stat.improvement.toFixed(1)} lbs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
