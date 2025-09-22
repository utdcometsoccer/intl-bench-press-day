import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import type { ExerciseRecord } from './exerciseRecordsStorage';
import { exerciseRecordsStorage } from './exerciseRecordsStorage';
import { BARBELL_EXERCISES, getExerciseCategories } from './exercises';

interface ChartDataPoint {
  date: string;
  dateValue: Date;
  oneRepMax: number;
  exercise: string;
  exerciseId: string;
  weight: number;
  reps: number;
  notes?: string;
  formulaUsed: string;
}

interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  recordCount: number;
  bestOneRepMax: number;
  latestOneRepMax: number;
  improvement: number;
  color: string;
}

const ProgressChart: React.FC = () => {
  const [allRecords, setAllRecords] = useState<ExerciseRecord[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  
  // Filter state
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Color palette for different exercises
  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
    '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
  ];

  useEffect(() => {
    loadAllRecords();
  }, []);

  useEffect(() => {
    filterAndProcessData();
  }, [allRecords, selectedExercises, startDate, endDate, selectedCategory]);

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

  const filterAndProcessData = () => {
    let filteredRecords = allRecords;

    // Filter by selected exercises
    if (selectedExercises.length > 0) {
      filteredRecords = filteredRecords.filter(record => 
        selectedExercises.includes(record.exerciseId)
      );
    }

    // Filter by category
    if (selectedCategory) {
      const exercisesInCategory = BARBELL_EXERCISES
        .filter(ex => ex.category === selectedCategory)
        .map(ex => ex.id);
      filteredRecords = filteredRecords.filter(record => 
        exercisesInCategory.includes(record.exerciseId)
      );
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
  };

  const calculateExerciseStats = (records: ExerciseRecord[]) => {
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
  };

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

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{data.exercise}</p>
          <p style={{ margin: '0 0 5px 0' }}>Date: {data.date}</p>
          <p style={{ margin: '0 0 5px 0' }}>1RM: {data.oneRepMax} lbs</p>
          <p style={{ margin: '0 0 5px 0' }}>Set: {data.reps} reps @ {data.weight} lbs</p>
          <p style={{ margin: '0 0 5px 0' }}>Formula: {data.formulaUsed}</p>
          {data.notes && <p style={{ margin: '0', fontSize: '12px', fontStyle: 'italic' }}>"{data.notes}"</p>}
        </div>
      );
    }
    return null;
  };

  const categories = getExerciseCategories();
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
      <div className="progress-chart" style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Progress Chart</h2>
        <p>No exercise records found. Start tracking your workouts to see your progress!</p>
      </div>
    );
  }

  return (
    <div className="progress-chart" style={{ 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '8px', 
      maxWidth: '1200px',
      margin: '20px auto'
    }}>
      <h2>One Rep Max Progress Chart</h2>

      {/* Filters */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px' 
      }}>
        <h3 style={{ marginTop: 0 }}>Filters</h3>
        
        {/* Date Range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label htmlFor="start-date" style={{ display: 'block', marginBottom: '5px' }}>
              Start Date:
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>
          
          <div>
            <label htmlFor="end-date" style={{ display: 'block', marginBottom: '5px' }}>
              End Date:
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div>
            <label htmlFor="category-filter" style={{ display: 'block', marginBottom: '5px' }}>
              Category Filter:
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontWeight: 'bold' }}>Select Exercises to Display:</label>
            <div>
              <button
                onClick={selectAllExercises}
                style={{
                  padding: '5px 10px',
                  marginRight: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Select All
              </button>
              <button
                onClick={clearAllExercises}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '10px',
            maxHeight: '120px',
            overflowY: 'auto',
            padding: '10px',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            backgroundColor: 'white'
          }}>
            {availableExercises.map(exercise => (
              <label key={exercise.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedExercises.includes(exercise.id)}
                  onChange={() => handleExerciseToggle(exercise.id)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>{exercise.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div style={{ marginBottom: '20px' }}>
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
              <Tooltip content={customTooltip} />
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
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <p>No data available for the selected filters. Try adjusting your date range or exercise selection.</p>
        </div>
      )}

      {/* Exercise Statistics */}
      {exerciseStats.length > 0 && (
        <div>
          <h3>Exercise Statistics</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '15px' 
          }}>
            {exerciseStats.map(stat => (
              <div key={stat.exerciseId} style={{
                padding: '15px',
                border: `2px solid ${stat.color}`,
                borderRadius: '6px',
                backgroundColor: 'white'
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: stat.color }}>{stat.exerciseName}</h4>
                <div style={{ fontSize: '14px' }}>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Records:</strong> {stat.recordCount}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Best 1RM:</strong> {stat.bestOneRepMax} lbs
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>Latest 1RM:</strong> {stat.latestOneRepMax} lbs
                  </p>
                  <p style={{ 
                    margin: '5px 0', 
                    color: stat.improvement >= 0 ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                  }}>
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
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          color: '#721c24',
          marginTop: '20px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default ProgressChart;
