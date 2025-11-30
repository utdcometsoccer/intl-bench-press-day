import { type FC, useEffect, useState, useCallback } from 'react';
import { fiveThreeOneStorage } from '../services/fiveThreeOneStorage';
import { workoutResultsStorage } from '../services/workoutResultsStorage';
import type { FiveThreeOneCycle } from '../types';
import type { WorkoutResult } from '../types';
import { getNextWorkout, getCycleProgress, type WorkoutSuggestion, type CycleProgress } from '../services/workoutSuggestionService';
import TodaysWorkout from './TodaysWorkout';
import QuickLog from './QuickLog';
import ProgressSummary from './ProgressSummary';
import CalendarView from './CalendarView';
import './Dashboard.css';

interface DashboardProps {
  onNavigateToPlanner: () => void;
  onNavigateToLogger: () => void;
  onNavigateToProgress: () => void;
}

const Dashboard: FC<DashboardProps> = ({
  onNavigateToPlanner,
  onNavigateToLogger,
  onNavigateToProgress,
}) => {
  const [activeCycle, setActiveCycle] = useState<FiveThreeOneCycle | null>(null);
  const [workoutResults, setWorkoutResults] = useState<WorkoutResult[]>([]);
  const [nextWorkout, setNextWorkout] = useState<WorkoutSuggestion | null>(null);
  const [cycleProgress, setCycleProgress] = useState<CycleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await fiveThreeOneStorage.initialize();
      await workoutResultsStorage.initialize();

      const cycle = await fiveThreeOneStorage.getActiveCycle();
      setActiveCycle(cycle);

      if (cycle) {
        const results = await workoutResultsStorage.getWorkoutResultsByCycle(cycle.id);
        setWorkoutResults(results);
        
        const suggestion = getNextWorkout(cycle, results);
        setNextWorkout(suggestion);
        
        const progress = getCycleProgress(cycle, results);
        setCycleProgress(progress);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickLogComplete = async () => {
    setShowQuickLog(false);
    await loadData();
  };

  if (isLoading) {
    return (
      <div className="dashboard loading">
        <h2>Dashboard</h2>
        <p className="loading-text">Loading your workout data...</p>
      </div>
    );
  }

  if (!activeCycle) {
    return (
      <div className="dashboard no-cycle">
        <h2>Welcome Back!</h2>
        <div className="no-cycle-card">
          <div className="no-cycle-icon" aria-hidden="true">🏋️</div>
          <h3>No Active Training Cycle</h3>
          <p>Create a new 5/3/1 cycle to start tracking your workouts</p>
          <button className="create-cycle-button" onClick={onNavigateToPlanner}>
            Create Training Cycle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p className="cycle-name">Active: <strong>{activeCycle.name}</strong></p>
      </div>

      {/* Today's Workout Section */}
      {nextWorkout && (
        <TodaysWorkout
          suggestion={nextWorkout}
          onStartWorkout={() => setShowQuickLog(true)}
          onViewFullLogger={onNavigateToLogger}
        />
      )}

      {/* Quick Log Modal */}
      {showQuickLog && nextWorkout && nextWorkout.workout && (
        <QuickLog
          cycle={activeCycle}
          workout={nextWorkout.workout}
          onComplete={handleQuickLogComplete}
          onCancel={() => setShowQuickLog(false)}
        />
      )}

      {/* Progress Summary */}
      {cycleProgress && (
        <ProgressSummary
          progress={cycleProgress}
          onViewFullProgress={onNavigateToProgress}
        />
      )}

      {/* Calendar Toggle */}
      <div className="calendar-toggle-section">
        <button
          className="calendar-toggle-button"
          onClick={() => setShowCalendar(!showCalendar)}
          aria-expanded={showCalendar}
        >
          {showCalendar ? '📅 Hide Calendar' : '📅 View Calendar'}
        </button>
      </div>

      {/* Calendar View */}
      {showCalendar && (
        <CalendarView
          cycle={activeCycle}
          results={workoutResults}
        />
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-button" onClick={onNavigateToLogger}>
            <span className="action-icon" aria-hidden="true">📝</span>
            <span className="action-label">Log Workout</span>
          </button>
          <button className="action-button" onClick={onNavigateToProgress}>
            <span className="action-icon" aria-hidden="true">📊</span>
            <span className="action-label">View Progress</span>
          </button>
          <button className="action-button" onClick={onNavigateToPlanner}>
            <span className="action-icon" aria-hidden="true">📋</span>
            <span className="action-label">Manage Cycles</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
