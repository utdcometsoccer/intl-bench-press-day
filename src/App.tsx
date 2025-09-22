import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
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
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>International Bench Press Day</h1>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        borderBottom: '1px solid #dee2e6'
      }}>
        <button
          onClick={() => setActiveTab('tracker')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'tracker' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'tracker' ? 'bold' : 'normal',
            color: activeTab === 'tracker' ? '#007bff' : '#6c757d'
          }}
        >
          Exercise Tracker
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'progress' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'progress' ? 'bold' : 'normal',
            color: activeTab === 'progress' ? '#007bff' : '#6c757d'
          }}
        >
          Progress Chart
        </button>
        <button
          onClick={() => setActiveTab('planner')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'planner' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'planner' ? 'bold' : 'normal',
            color: activeTab === 'planner' ? '#007bff' : '#6c757d'
          }}
        >
          5-3-1 Planner
        </button>
        <button
          onClick={() => setActiveTab('logger')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'logger' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'logger' ? 'bold' : 'normal',
            color: activeTab === 'logger' ? '#007bff' : '#6c757d'
          }}
        >
          Workout Logger
        </button>
        <button
          onClick={() => setActiveTab('export')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderBottom: activeTab === 'export' ? '3px solid #007bff' : '3px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'export' ? 'bold' : 'normal',
            color: activeTab === 'export' ? '#007bff' : '#6c757d'
          }}
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
