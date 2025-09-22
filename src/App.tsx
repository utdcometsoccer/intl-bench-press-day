import { useState } from 'react'
import logo from './assets/IBPD-FINAL.png'
import './App.css'
import ExerciseOneRepMaxTracker from './ExerciseOneRepMaxTracker'
import ProgressChart from './ProgressChart'
import FiveThreeOnePlanner from './FiveThreeOnePlanner'
import WorkoutLogger from './WorkoutLogger'
import DataExport from './DataExport'

function App() {
  const [activeTab, setActiveTab] = useState<'tracker' | 'progress' | 'planner' | 'logger' | 'export'>('tracker')

  return (
    <>
      <div>
        <img src={logo} alt="International Bench Press Day Logo" className="app-logo" />
      </div>
      <h1>International Bench Press Day</h1>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`tab-button ${activeTab === 'tracker' ? 'active' : ''}`}
        >
          Exercise Tracker
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
        >
          Progress Chart
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
        >
          5-3-1 Planner
        </button>
        <button
          onClick={() => setActiveTab('logger')}
          className={`tab-button ${activeTab === 'logger' ? 'active' : ''}`}
        >
          Workout Logger
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
        >
          Data Export
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'tracker' && <ExerciseOneRepMaxTracker />}
      {activeTab === 'progress' && <ProgressChart />}
      {activeTab === 'planner' && <FiveThreeOnePlanner />}
      {activeTab === 'logger' && <WorkoutLogger />}
      {activeTab === 'export' && <DataExport />}
      

    </>
  )
}

export default App
